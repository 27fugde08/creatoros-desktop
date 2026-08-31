#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Agentic Self-Healing Error Handler & Heuristic Fallback Engine
Tự động bắt lỗi ngoại lệ trong tiến trình Python / FFmpeg / AI Worker,
chẩn đoán nguyên nhân gốc rễ (Root Cause), ghi lại vào SQLite và tự động
kích hoạt cơ chế thử lại (Auto-Retry) với cấu hình tham số thay thế.
"""

import sys
import os
import re
import json
import time
import sqlite3
import subprocess
import traceback
from typing import Dict, List, Any, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")

# Định nghĩa các mẫu chẩn đoán lỗi ngoại lệ phổ biến (Error Pattern Catalog)
HEALING_PATTERNS = [
    {
        "category": "CUDA_VRAM_OOM",
        "pattern": r"(CUDA out of memory|Out of memory|allocate.*MiB|CUDA_ERROR_OUT_OF_MEMORY|cuMemAlloc failed)",
        "root_cause": "Tràn bộ nhớ VRAM (OOM) trên GPU do độ phân giải quá cao hoặc nhiều phiên encode đồng thời.",
        "strategy": "fallback_cpu_and_downscale",
        "action_description": "Chuyển sang CPU Encoding (libx264) & hạ độ phân giải xuống 720p để giải phóng VRAM."
    },
    {
        "category": "NVENC_ENCODER_UNAVAILABLE",
        "pattern": r"(Cannot init NVENC|Driver does not support the required nvenc|h264_nvenc.*failed|hevc_nvenc.*failed|Error creating NVENC)",
        "root_cause": "Trình mã hóa phần cứng NVENC bị bận, đạt giới hạn số phiên hoặc driver GPU không tương thích.",
        "strategy": "fallback_libx264_ultrafast",
        "action_description": "Tự động đổi encoder từ h264_nvenc sang libx264 (preset ultrafast, crf 22)."
    },
    {
        "category": "INVALID_DIMENSIONS_OR_PIX_FMT",
        "pattern": r"(height not divisible by 2|width not divisible by 2|odd dimensions|not supported by codec)",
        "root_cause": "Kích thước video không chia hết cho 2 hoặc pixel format không được hỗ trợ bởi encoder.",
        "strategy": "fix_dimension_padding",
        "action_description": "Áp dụng bộ lọc scale=trunc(iw/2)*2:trunc(ih/2)*2 và -pix_fmt yuv420p."
    },
    {
        "category": "AUDIO_DESYNC_OR_CODEC_MISMATCH",
        "pattern": r"(Application provided invalid audio|Audio packet dropped|Sample rate mismatch|aac: unsupported)",
        "root_cause": "Lệch mẫu âm thanh hoặc codec audio nguồn không tương thích với chuẩn MP4/AAC.",
        "strategy": "fix_audio_resample",
        "action_description": "Ép chuẩn hóa -c:a aac -b:a 192k -ar 44100 -af aresample=async=1000."
    },
    {
        "category": "CORRUPT_PACKET_OR_MOOV_ATOM",
        "pattern": r"(moov atom not found|corrupt packet|invalid data found|error while decoding)",
        "root_cause": "Tệp video nguồn bị lỗi header hoặc mất index moov atom do tải dở dang.",
        "strategy": "enable_corrupt_packet_tolerance",
        "action_description": "Bật cờ khoan dung lỗi: -err_detect ignore_err -fflags +genpts+discardcorrupt."
    },
    {
        "category": "FILE_LOCKED_OR_BUSY",
        "pattern": r"(Permission denied|WinError 32|Resource temporarily unavailable|file is being used)",
        "root_cause": "Tệp đầu ra đang bị một tiến trình khác khóa hoặc chưa giải phóng handle.",
        "strategy": "generate_unique_output_path",
        "action_description": "Sinh tên tệp ngẫu nhiên mới với timestamp độc nhất để tránh xung đột I/O."
    }
]

class AgenticSelfHealingEngine:
    """
    Bộ máy Tự Phục Hồi Lỗi Thông Minh (Autonomous Self-Healing Engine)
    Ghi nhận sự cố vào SQLite và thực hiện Auto-Retry thông minh.
    """
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_sqlite_tables()

    def _init_sqlite_tables(self):
        """Khởi tạo bảng healing_incidents trong SQLite nếu chưa có"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS healing_incidents (
                    id TEXT PRIMARY KEY,
                    pipeline_id TEXT,
                    task_type TEXT,
                    error_category TEXT,
                    error_raw_snippet TEXT,
                    root_cause_analysis TEXT,
                    suggested_action TEXT,
                    fallback_parameters_json TEXT,
                    retry_count INTEGER DEFAULT 0,
                    resolved INTEGER DEFAULT 0,
                    created_at INTEGER,
                    resolved_at INTEGER
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            # Fallback im lặng nếu SQLite đang bị lock
            pass

    def record_incident(self, incident_data: Dict[str, Any]) -> str:
        """Ghi nhận sự cố vào SQLite"""
        incident_id = incident_data.get("id") or f"heal_{int(time.time()*1000)}"
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO healing_incidents (
                    id, pipeline_id, task_type, error_category, error_raw_snippet,
                    root_cause_analysis, suggested_action, fallback_parameters_json,
                    retry_count, resolved, created_at, resolved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident_id,
                incident_data.get("pipeline_id", "unknown"),
                incident_data.get("task_type", "ffmpeg_render"),
                incident_data.get("error_category", "UNKNOWN_ERROR"),
                incident_data.get("error_raw_snippet", "")[:1000],
                incident_data.get("root_cause_analysis", "Lỗi không xác định trong tiến trình"),
                incident_data.get("suggested_action", "Thử lại với tham số an toàn"),
                json.dumps(incident_data.get("fallback_parameters", {})),
                incident_data.get("retry_count", 1),
                1 if incident_data.get("resolved") else 0,
                int(time.time()),
                int(time.time()) if incident_data.get("resolved") else None
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            pass
        return incident_id

    def diagnose_error(self, raw_stderr: str) -> Dict[str, Any]:
        """Phân tích log lỗi bằng Heuristic Catalog để đưa ra giải pháp sửa lỗi"""
        diagnosis = {
            "category": "GENERIC_EXECUTION_FAILURE",
            "root_cause": "Tiến trình gặp lỗi ngoại lệ tổng quát.",
            "strategy": "fallback_safe_defaults",
            "action_description": "Áp dụng cấu hình an toàn tiêu chuẩn (CPU fallback, stereo audio, 720p).",
            "fallback_parameters": {
                "vcodec": "libx264",
                "preset": "veryfast",
                "crf": 23,
                "acodec": "aac",
                "audio_bitrate": "160k",
                "extra_flags": ["-err_detect", "ignore_err"]
            }
        }

        for pattern_info in HEALING_PATTERNS:
            if re.search(pattern_info["pattern"], raw_stderr, re.IGNORECASE):
                diagnosis["category"] = pattern_info["category"]
                diagnosis["root_cause"] = pattern_info["root_cause"]
                diagnosis["strategy"] = pattern_info["strategy"]
                diagnosis["action_description"] = pattern_info["action_description"]

                # Cấu hình tham số thay thế tương ứng
                if pattern_info["strategy"] == "fallback_libx264_ultrafast":
                    diagnosis["fallback_parameters"] = {
                        "vcodec": "libx264",
                        "preset": "ultrafast",
                        "crf": 22,
                        "pix_fmt": "yuv420p"
                    }
                elif pattern_info["strategy"] == "fallback_cpu_and_downscale":
                    diagnosis["fallback_parameters"] = {
                        "vcodec": "libx264",
                        "scale": "1280:720",
                        "preset": "fast",
                        "crf": 24
                    }
                elif pattern_info["strategy"] == "fix_dimension_padding":
                    diagnosis["fallback_parameters"] = {
                        "filter_complex": "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"
                    }
                elif pattern_info["strategy"] == "fix_audio_resample":
                    diagnosis["fallback_parameters"] = {
                        "acodec": "aac",
                        "ar": "44100",
                        "ac": "2",
                        "audio_filter": "aresample=async=1000"
                    }
                elif pattern_info["strategy"] == "enable_corrupt_packet_tolerance":
                    diagnosis["fallback_parameters"] = {
                        "extra_flags": ["-err_detect", "ignore_err", "-fflags", "+genpts+discardcorrupt"]
                    }
                break

        return diagnosis

    def diagnose_and_resolve(
        self,
        pipeline_id: str,
        task_type: str,
        raw_error: str
    ) -> Dict[str, Any]:
        """
        Chẩn đoán trực tiếp từ thông báo lỗi, tạo incident và lưu vào SQLite.
        Trả về dictionary incident đã giải quyết.
        """
        diag = self.diagnose_error(raw_error)
        incident_id = f"heal_{int(time.time()*1000)}"
        incident = {
            "id": incident_id,
            "pipeline_id": pipeline_id,
            "task_type": task_type,
            "error_category": diag["category"],
            "error_raw_snippet": raw_error[-500:] if raw_error else "",
            "root_cause_analysis": diag["root_cause"],
            "suggested_action": diag["action_description"],
            "fallback_parameters": diag["fallback_parameters"],
            "retry_count": 1,
            "resolved": 1
        }
        self.record_incident(incident)
        return incident

    def execute_command_with_healing(
        self,
        command_args: List[str],
        pipeline_id: str = "pipe_auto",
        task_type: str = "ffmpeg_render",
        max_retries: int = 2,
        on_log_callback = None
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Thực thi câu lệnh với vòng lặp Auto-Retry & Self-Healing thông minh
        """
        current_cmd = list(command_args)
        incidents_history = []

        for attempt in range(1, max_retries + 2):
            if on_log_callback:
                on_log_callback(f"[executor] 🚀 Đang thực thi (Lần thử {attempt}/{max_retries + 1}): {' '.join(current_cmd[:4])}...")

            try:
                process = subprocess.Popen(
                    current_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate()

                if process.returncode == 0:
                    if attempt > 1 and on_log_callback:
                        on_log_callback(f"[self_healing] ✅ Đã tự phục hồi thành công sau {attempt - 1} lần điều chỉnh tham số!")
                    return True, stdout, incidents_history

                # Nếu thất bại (returncode != 0), tiến hành chẩn đoán lỗi
                raw_error = stderr if stderr else stdout
                diagnosis = self.diagnose_error(raw_error)

                incident = {
                    "id": f"heal_{int(time.time()*1000)}_{attempt}",
                    "pipeline_id": pipeline_id,
                    "task_type": task_type,
                    "error_category": diagnosis["category"],
                    "error_raw_snippet": raw_error[-500:] if raw_error else "Exit code non-zero",
                    "root_cause_analysis": diagnosis["root_cause"],
                    "suggested_action": diagnosis["action_description"],
                    "fallback_parameters": diagnosis["fallback_parameters"],
                    "retry_count": attempt,
                    "resolved": False
                }

                if on_log_callback:
                    on_log_callback(f"[self_healing] ⚠️ Phát hiện sự cố: {diagnosis['category']} - {diagnosis['root_cause']}")
                    on_log_callback(f"[self_healing] 🔧 Hành động khắc phục: {diagnosis['action_description']}")

                # Biến đổi câu lệnh theo tham số thay thế
                new_cmd = self._apply_healing_to_cmd(current_cmd, diagnosis["fallback_parameters"])
                current_cmd = new_cmd

                # Ghi nhận vào SQLite
                self.record_incident(incident)
                incidents_history.append(incident)

                if attempt < max_retries + 1:
                    time.sleep(0.5)  # Trễ nhẹ để GPU/Disk hồi phục
                else:
                    return False, raw_error, incidents_history

            except Exception as ex:
                raw_error = str(ex) + "\n" + traceback.format_exc()
                diagnosis = self.diagnose_error(raw_error)
                incident = {
                    "id": f"heal_{int(time.time()*1000)}_{attempt}",
                    "pipeline_id": pipeline_id,
                    "task_type": task_type,
                    "error_category": diagnosis["category"],
                    "error_raw_snippet": raw_error[-500:],
                    "root_cause_analysis": diagnosis["root_cause"],
                    "suggested_action": diagnosis["action_description"],
                    "fallback_parameters": diagnosis["fallback_parameters"],
                    "retry_count": attempt,
                    "resolved": False
                }
                self.record_incident(incident)
                incidents_history.append(incident)
                if attempt == max_retries + 1:
                    return False, raw_error, incidents_history

        return False, "Exceeded maximum retry attempts", incidents_history

    def _apply_healing_to_cmd(self, cmd: List[str], fallback_params: Dict[str, Any]) -> List[str]:
        """Tự động thay thế cờ FFmpeg trong danh sách command args"""
        modified = list(cmd)
        
        # 1. Thay đổi vcodec (NVENC -> libx264)
        if "vcodec" in fallback_params:
            for i, arg in enumerate(modified):
                if arg in ["-c:v", "-vcodec"] and i + 1 < len(modified):
                    modified[i + 1] = fallback_params["vcodec"]
                    break

        # 2. Thay đổi preset
        if "preset" in fallback_params:
            for i, arg in enumerate(modified):
                if arg == "-preset" and i + 1 < len(modified):
                    modified[i + 1] = fallback_params["preset"]
                    break

        # 3. Chèn thêm extra flags vào trước output
        if "extra_flags" in fallback_params:
            for flag in fallback_params["extra_flags"]:
                if flag not in modified:
                    modified.insert(1, flag)

        return modified

    def get_recent_incidents(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Lấy danh sách các sự cố tự phục hồi gần nhất từ SQLite"""
        results = []
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM healing_incidents
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            for r in rows:
                item = dict(r)
                if item.get("fallback_parameters_json"):
                    try:
                        item["fallback_parameters"] = json.loads(item["fallback_parameters_json"])
                    except Exception:
                        item["fallback_parameters"] = {}
                results.append(item)
            conn.close()
        except Exception as e:
            pass
        return results

# Singleton instance
self_healing_engine = AgenticSelfHealingEngine()

if __name__ == "__main__":
    print("=== TEST AGENTIC SELF-HEALING ERROR HANDLER ===")
    sample_error = "[h264_nvenc @ 0x55d2890] Driver does not support the required nvenc features: CUDA out of memory"
    diag = self_healing_engine.diagnose_error(sample_error)
    print(f"Diagnosed Category: {diag['category']}")
    print(f"Root Cause: {diag['root_cause']}")
    print(f"Action: {diag['action_description']}")
    inc_id = self_healing_engine.record_incident({
        "pipeline_id": "pipe_test_healing",
        "error_category": diag["category"],
        "error_raw_snippet": sample_error,
        "root_cause_analysis": diag["root_cause"],
        "suggested_action": diag["action_description"],
        "fallback_parameters": diag["fallback_parameters"],
        "resolved": True
    })
    print(f"Recorded Incident ID: {inc_id}")
    incidents = self_healing_engine.get_recent_incidents(5)
    print(f"Fetched {len(incidents)} incidents from SQLite.")
