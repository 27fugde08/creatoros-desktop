#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - SQLite State Manager & Checkpointing Engine
Quản lý trạng thái phân tán, lưu vết Checkpoint cho từng giai đoạn của Pipeline:
1. Download Video Nguồn (yt-dlp / Direct Stream)
2. Demucs Stem Isolation (Tách Vocal & BGM)
3. AI Highlight & Local Vector RAG (Phân tích ngữ nghĩa kịch bản)
4. Render FFmpeg NVENC (Mã hóa GPU 1080p/4:5/9:16 đổi MD5)
5. Multi-Platform Social Dispatch (Lập lịch phân phối ma trận)

Cung cấp cơ chế Auto-Resume tự động khôi phục đúng bước dở dang khi khởi động lại ứng dụng.
"""

import os
import sys
import json
import time
import sqlite3
import hashlib
from typing import Dict, List, Any, Optional, Tuple, TypedDict

from creatoros_constants import (
    DB_STATE_PATH,
    CACHE_DIR,
    STANDARD_PIPELINE_STAGES
)
from creatoros_errors import (
    ErrorCode,
    CreatorOSError,
    get_structured_logger,
    get_healing_plan
)

logger = get_structured_logger("StateManager")


class PipelineRecord(TypedDict, total=False):
    pipeline_id: str
    title: str
    priority: str
    status: str
    current_stage_index: int
    total_stages: int
    progress_percent: int
    config: Dict[str, Any]
    error_message: Optional[str]
    created_at: int
    updated_at: int
    completed_at: Optional[int]
    stages: List[Dict[str, Any]]
    resumable: bool
    resume_stage: Optional[str]


class StateManager:
    """
    Quản lý trạng thái và Checkpoint giao dịch qua SQLite với độ bền dữ liệu ACID.
    """
    _instance: Optional["StateManager"] = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "StateManager":
        if cls._instance is None:
            cls._instance = super(StateManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, db_path: str = DB_STATE_PATH) -> None:
        if getattr(self, "_initialized", False):
            return
        self.db_path: str = db_path
        self._init_tables()
        self._initialized = True
        logger.info("StateManager initialized with DB at: %s", self.db_path)

    def _get_connection(self) -> sqlite3.Connection:
        """Tạo kết nối SQLite với timeout và WAL mode để tránh DB Lock."""
        retries = 3
        last_error = None
        for attempt in range(retries):
            try:
                conn = sqlite3.connect(self.db_path, timeout=15.0)
                conn.row_factory = sqlite3.Row
                conn.execute("PRAGMA journal_mode=WAL;")
                conn.execute("PRAGMA synchronous=NORMAL;")
                return conn
            except sqlite3.OperationalError as e:
                last_error = e
                logger.warning(
                    "SQLite busy (attempt %s/%s). Initiating retry: %s",
                    attempt + 1, retries, get_healing_plan(ErrorCode.ERR_DB_LOCKED)
                )
                time.sleep(0.3 * (attempt + 1))
        
        raise CreatorOSError(
            ErrorCode.ERR_DB_LOCKED,
            f"Không thể kết nối cơ sở dữ liệu sau {retries} lần thử",
            {"db_path": self.db_path, "error": str(last_error)}
        )

    def _init_tables(self) -> None:
        """Tạo cấu trúc bảng SQLite cần thiết nếu chưa có."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                # 1. Bảng Pipelines
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS pipelines (
                        pipeline_id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        priority TEXT DEFAULT 'HIGH',
                        status TEXT DEFAULT 'QUEUED',
                        current_stage_index INTEGER DEFAULT 0,
                        total_stages INTEGER DEFAULT 6,
                        progress_percent INTEGER DEFAULT 0,
                        config_json TEXT DEFAULT '{}',
                        error_message TEXT,
                        created_at INTEGER,
                        updated_at INTEGER,
                        completed_at INTEGER
                    )
                """)

                # 2. Bảng Stages Checkpoints
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS pipeline_stages (
                        stage_id TEXT PRIMARY KEY,
                        pipeline_id TEXT NOT NULL,
                        stage_name TEXT NOT NULL,
                        stage_index INTEGER NOT NULL,
                        status TEXT DEFAULT 'PENDING',
                        input_artifacts_json TEXT DEFAULT '{}',
                        output_artifacts_json TEXT DEFAULT '{}',
                        execution_time_ms INTEGER DEFAULT 0,
                        checkpoint_hash TEXT,
                        error_log TEXT,
                        started_at INTEGER,
                        completed_at INTEGER,
                        FOREIGN KEY(pipeline_id) REFERENCES pipelines(pipeline_id)
                    )
                """)

                # 3. Bảng Artifacts Cache trên NVMe
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS artifacts_cache (
                        artifact_id TEXT PRIMARY KEY,
                        pipeline_id TEXT NOT NULL,
                        stage_name TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        file_size_bytes INTEGER DEFAULT 0,
                        file_type TEXT,
                        sha256_hash TEXT,
                        is_temporary INTEGER DEFAULT 1,
                        created_at INTEGER,
                        FOREIGN KEY(pipeline_id) REFERENCES pipelines(pipeline_id)
                    )
                """)

                # 4. Bảng User Presets & Blueprints
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_presets (
                        preset_id TEXT PRIMARY KEY,
                        preset_name TEXT NOT NULL,
                        category TEXT NOT NULL,
                        description TEXT,
                        config_json TEXT NOT NULL,
                        tags TEXT DEFAULT '[]',
                        is_favorite INTEGER DEFAULT 0,
                        created_at INTEGER,
                        updated_at INTEGER
                    )
                """)

                # 5. Bảng DRM License & Offline Activation
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS drm_licenses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        license_key TEXT UNIQUE NOT NULL,
                        tier TEXT NOT NULL,
                        owner_name TEXT,
                        fingerprint_bound TEXT NOT NULL,
                        issued_at INTEGER,
                        expires_at INTEGER,
                        is_active INTEGER DEFAULT 1,
                        features_json TEXT,
                        activated_at INTEGER
                    )
                """)

                # Tạo chỉ mục tìm kiếm nhanh
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_stages_pipe ON pipeline_stages(pipeline_id);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_pipe_status ON pipelines(status);")
                conn.commit()
                logger.info("Database schemas and indexes initialized successfully.")
        except Exception as e:
            logger.error("Failed to initialize database tables: %s", str(e))
            raise

    # =========================================================================
    # PIPELINE LIFECYCLE & STATE MANAGEMENT
    # =========================================================================

    def create_or_get_pipeline(
        self,
        pipeline_id: str,
        title: str,
        priority: str = "HIGH",
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Đăng ký mới hoặc lấy thông tin Pipeline vào SQLite."""
        now = int(time.time())
        config_str = json.dumps(config or {})
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pipelines WHERE pipeline_id = ?", (pipeline_id,))
            row = cursor.fetchone()
            if not row:
                cursor.execute("""
                    INSERT INTO pipelines (
                        pipeline_id, title, priority, status, current_stage_index, 
                        total_stages, progress_percent, config_json, created_at, updated_at
                    ) VALUES (?, ?, ?, 'QUEUED', 0, ?, 0, ?, ?, ?)
                """, (pipeline_id, title, priority, len(STANDARD_PIPELINE_STAGES), config_str, now, now))

                # Khởi tạo các giai đoạn mặc định
                for idx, stage_name in enumerate(STANDARD_PIPELINE_STAGES):
                    stage_id = f"{pipeline_id}_{stage_name}"
                    cursor.execute("""
                        INSERT INTO pipeline_stages (
                            stage_id, pipeline_id, stage_name, stage_index, status
                        ) VALUES (?, ?, ?, ?, 'PENDING')
                    """, (stage_id, pipeline_id, stage_name, idx))

                conn.commit()
                logger.info("Created new pipeline: %s (%s)", pipeline_id, title)
            return self.get_pipeline_state(pipeline_id) or {}

    def get_pipeline_state(self, pipeline_id: str) -> Optional[Dict[str, Any]]:
        """Lấy toàn bộ thông tin chi tiết kèm các stage của pipeline."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pipelines WHERE pipeline_id = ?", (pipeline_id,))
            row = cursor.fetchone()
            if not row:
                return None

            pipe_dict = dict(row)
            try:
                pipe_dict["config"] = json.loads(pipe_dict.get("config_json") or "{}")
            except Exception:
                pipe_dict["config"] = {}

            cursor.execute(
                "SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_index ASC",
                (pipeline_id,)
            )
            stages = []
            for s_row in cursor.fetchall():
                st = dict(s_row)
                st["input_artifacts"] = json.loads(st.get("input_artifacts_json") or "{}")
                st["output_artifacts"] = json.loads(st.get("output_artifacts_json") or "{}")
                stages.append(st)

            pipe_dict["stages"] = stages
            pipe_dict["resumable"] = pipe_dict["status"] in ["RUNNING", "FAILED", "PAUSED", "QUEUED"]
            
            # Tìm bước dở dang đầu tiên để tự động khôi phục
            resume_stage = None
            for s in stages:
                if s["status"] != "COMPLETED":
                    resume_stage = s["stage_name"]
                    break
            pipe_dict["resume_stage"] = resume_stage or STANDARD_PIPELINE_STAGES[0]

            return pipe_dict

    def start_stage(
        self,
        pipeline_id: str,
        stage_name: str,
        input_artifacts: Optional[Dict[str, Any]] = None
    ) -> None:
        """Đánh dấu bắt đầu thực thi một Stage."""
        now = int(time.time())
        stage_id = f"{pipeline_id}_{stage_name}"
        input_json = json.dumps(input_artifacts or {})

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE pipeline_stages 
                SET status = 'RUNNING', started_at = ?, input_artifacts_json = ?
                WHERE stage_id = ?
            """, (now, input_json, stage_id))

            cursor.execute("""
                UPDATE pipelines 
                SET status = 'RUNNING', updated_at = ?
                WHERE pipeline_id = ?
            """, (now, pipeline_id))
            conn.commit()
            logger.info("Started stage: %s for pipeline: %s", stage_name, pipeline_id)

    def complete_stage(
        self,
        pipeline_id: str,
        stage_name: str,
        stage_index: int,
        total_stages: int,
        output_artifacts: Dict[str, Any],
        exec_time_ms: int = 0
    ) -> Dict[str, Any]:
        """Đánh dấu hoàn thành Stage và tạo Checkpoint Hash an toàn."""
        now = int(time.time())
        stage_id = f"{pipeline_id}_{stage_name}"
        output_json = json.dumps(output_artifacts)

        # Tính toán SHA256 Checkpoint Hash
        hash_payload = f"{stage_id}_{output_json}_{now}".encode("utf-8")
        checkpoint_hash = hashlib.sha256(hash_payload).hexdigest()

        # Tính progress
        progress = min(100, int(((stage_index + 1) / total_stages) * 100))
        is_last = (stage_index + 1) >= total_stages

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE pipeline_stages 
                SET status = 'COMPLETED', completed_at = ?, output_artifacts_json = ?,
                    execution_time_ms = ?, checkpoint_hash = ?
                WHERE stage_id = ?
            """, (now, output_json, exec_time_ms, checkpoint_hash, stage_id))

            # Cập nhật pipeline
            new_status = "COMPLETED" if is_last else "RUNNING"
            cursor.execute("""
                UPDATE pipelines 
                SET current_stage_index = ?, progress_percent = ?, 
                    status = ?, updated_at = ?, completed_at = ?
                WHERE pipeline_id = ?
            """, (
                stage_index + 1, progress, new_status, now,
                (now if is_last else None), pipeline_id
            ))

            # Lưu artifacts vào bảng cache
            for key, val in output_artifacts.items():
                if isinstance(val, str) and (val.endswith(".mp4") or val.endswith(".wav") or val.endswith(".json")):
                    art_id = f"{stage_id}_{key}"
                    file_size = os.path.getsize(val) if os.path.exists(val) else 0
                    cursor.execute("""
                        INSERT OR REPLACE INTO artifacts_cache (
                            artifact_id, pipeline_id, stage_name, file_path, file_size_bytes, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (art_id, pipeline_id, stage_name, val, file_size, now))

            conn.commit()
            logger.info("Completed stage: %s (%s%%) for pipeline: %s", stage_name, progress, pipeline_id)
            return {
                "status": "COMPLETED",
                "pipeline_status": new_status,
                "progress_percent": progress,
                "checkpoint_hash": checkpoint_hash
            }

    def fail_stage(self, pipeline_id: str, stage_name: str, error_log: str) -> None:
        """Đánh dấu stage thất bại để chuẩn bị cho quy trình Auto-Resume."""
        now = int(time.time())
        stage_id = f"{pipeline_id}_{stage_name}"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE pipeline_stages 
                SET status = 'FAILED', error_log = ?, completed_at = ?
                WHERE stage_id = ?
            """, (error_log, now, stage_id))

            cursor.execute("""
                UPDATE pipelines 
                SET status = 'FAILED', error_message = ?, updated_at = ?
                WHERE pipeline_id = ?
            """, (error_log, now, pipeline_id))
            conn.commit()
            logger.warning("Stage %s failed on pipeline %s: %s", stage_name, pipeline_id, error_log)

    def get_resumable_pipelines(self) -> List[Dict[str, Any]]:
        """Tìm các pipeline bị ngắt quãng để tự động Auto-Resume khi khởi động."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT pipeline_id FROM pipelines 
                WHERE status IN ('RUNNING', 'FAILED', 'QUEUED')
                ORDER BY updated_at DESC
            """)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                p = self.get_pipeline_state(r["pipeline_id"])
                if p:
                    results.append(p)
            return results

    # =========================================================================
    # USER PRESETS & BLUEPRINTS PERSISTENCE
    # =========================================================================

    def save_preset(
        self,
        preset_name: str,
        category: str,
        config: Dict[str, Any],
        description: str = "",
        tags: Optional[List[str]] = None,
        preset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lưu trữ preset cấu hình của người dùng."""
        now = int(time.time())
        p_id = preset_id or f"preset_{int(time.time() * 1000)}"
        config_str = json.dumps(config)
        tags_str = json.dumps(tags or [])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO user_presets (
                    preset_id, preset_name, category, description, config_json, tags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (p_id, preset_name, category, description, config_str, tags_str, now, now))
            conn.commit()
            logger.info("Saved user preset: %s (%s)", preset_name, p_id)
            return self.get_preset(p_id) or {}

    def get_presets(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách các preset."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if category and category != "all":
                cursor.execute("SELECT * FROM user_presets WHERE category = ? ORDER BY updated_at DESC", (category,))
            else:
                cursor.execute("SELECT * FROM user_presets ORDER BY is_favorite DESC, updated_at DESC")
            rows = cursor.fetchall()
            presets = []
            for row in rows:
                p = dict(row)
                p["id"] = p["preset_id"]
                p["name"] = p["preset_name"]
                p["config"] = json.loads(p.get("config_json") or "{}")
                p["tags"] = json.loads(p.get("tags") or "[]")
                p["is_favorite"] = bool(p.get("is_favorite", 0))
                presets.append(p)
            return presets

    def get_preset(self, preset_id: str) -> Optional[Dict[str, Any]]:
        """Lấy chi tiết một preset."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM user_presets WHERE preset_id = ?", (preset_id,))
            row = cursor.fetchone()
            if not row:
                return None
            p = dict(row)
            p["id"] = p["preset_id"]
            p["name"] = p["preset_name"]
            p["config"] = json.loads(p.get("config_json") or "{}")
            p["tags"] = json.loads(p.get("tags") or "[]")
            p["is_favorite"] = bool(p.get("is_favorite", 0))
            return p

    def delete_preset(self, preset_id: str) -> bool:
        """Xóa preset."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_presets WHERE preset_id = ?", (preset_id,))
            conn.commit()
            logger.info("Deleted preset: %s", preset_id)
            return cursor.rowcount > 0

    # =========================================================================
    # DRM LICENSE PERSISTENCE
    # =========================================================================

    def save_license_activation(self, license_data: Dict[str, Any]) -> Dict[str, Any]:
        """Lưu trữ thông tin kích hoạt bản quyền vào SQLite."""
        now = int(time.time())
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Hủy kích hoạt các key cũ
            cursor.execute("UPDATE drm_licenses SET is_active = 0 WHERE is_active = 1")
            
            cursor.execute("""
                INSERT OR REPLACE INTO drm_licenses (
                    license_key, tier, owner_name, fingerprint_bound, issued_at, expires_at, is_active, features_json, activated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            """, (
                license_data["license_key"],
                license_data["tier"],
                license_data.get("owner", "Licensed Creator"),
                license_data["fingerprint_bound"],
                license_data.get("issued_at", now),
                license_data.get("expires_at", 0),
                json.dumps(license_data.get("features", {})),
                now
            ))
            conn.commit()
            logger.info("Activated license: %s (Tier: %s)", license_data["license_key"], license_data["tier"])
        return license_data

    def get_active_license(self) -> Optional[Dict[str, Any]]:
        """Lấy trạng thái bản quyền đang kích hoạt hiện tại."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM drm_licenses WHERE is_active = 1 ORDER BY activated_at DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                return None
            lic = dict(row)
            try:
                lic["features"] = json.loads(lic.get("features_json") or "{}")
            except Exception:
                lic["features"] = {}
            return lic

    def deactivate_license(self) -> bool:
        """Hủy kích hoạt bản quyền hiện tại."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE drm_licenses SET is_active = 0")
            conn.commit()
            logger.info("Deactivated DRM license.")
            return True


# Singleton instance
state_manager: StateManager = StateManager()

if __name__ == "__main__":
    print("=== KIỂM TRA CREATOROS STATE MANAGER ===")
    test_id = f"test_pipe_{int(time.time())}"
    state_manager.create_or_get_pipeline(test_id, "Test Automation Pipeline")
    state_manager.start_stage(test_id, "1_DOWNLOAD_INGEST", {"url": "https://example.com/video.mp4"})
    state_manager.complete_stage(test_id, "1_DOWNLOAD_INGEST", 0, 6, {"video_path": "temp/video.mp4"}, 1200)
    
    st = state_manager.get_pipeline_state(test_id)
    if st:
        print(f"Pipeline: {st['title']} | Status: {st['status']} | Progress: {st['progress_percent']}%")
    print(f"Resumable: {len(state_manager.get_resumable_pipelines())} pipelines found.")
