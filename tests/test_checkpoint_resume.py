"""
Test Suite: Resiliency & SQLite Checkpoint Auto-Resume
Xác thực khả năng lưu vết ACID và khôi phục trạng thái sau khi ứng dụng bị tắt ngang.
"""

import pytest
import os
import time
import json
import threading
from state_manager import state_manager, StateManager

def test_pipeline_lifecycle_and_checkpoint_hash():
    """Kiểm tra vòng đời Pipeline và tính toán Checkpoint Hash SHA256 an toàn"""
    pipe_id = f"test_pipe_{int(time.time() * 1000)}"
    
    # 1. Tạo mới Pipeline
    state_manager.create_or_get_pipeline(pipe_id, title="Kiểm Thử DAG Resilience", priority="HIGH")
    details = state_manager.get_pipeline_state(pipe_id)
    assert details["status"] in ["QUEUED", "RUNNING"]
    assert details["current_stage_index"] == 0
    assert len(details["stages"]) == 6

    # 2. Bắt đầu & Hoàn thành Stage 1 (Download Ingest)
    state_manager.start_stage(pipe_id, "1_DOWNLOAD_INGEST", {"url": "https://sample.local/video.mp4"})
    res_s1 = state_manager.complete_stage(
        pipe_id,
        stage_name="1_DOWNLOAD_INGEST",
        stage_index=0,
        total_stages=6,
        output_artifacts={"video_path": "temp/test_source.mp4", "duration": 60.0},
        exec_time_ms=1200
    )
    
    assert res_s1["status"] == "COMPLETED"
    assert res_s1["progress_percent"] == 16
    assert len(res_s1["checkpoint_hash"]) > 0

    # 3. Giả lập Stage 2 (Demucs Stem) bị Force Kill / Crash
    state_manager.fail_stage(
        pipe_id,
        stage_name="2_DEMUCS_STEM_ISOLATION",
        error_log="SIGKILL: Ứng dụng bị ép tắt đột ngột bởi Task Manager"
    )

    # 4. Kiểm tra danh sách Resumable Pipelines sau sự cố
    resumable = state_manager.get_resumable_pipelines()
    matching = [p for p in resumable if p["pipeline_id"] == pipe_id]
    assert len(matching) == 1, "Hệ thống phải nhận diện được pipeline chưa hoàn tất để Resume"
    assert matching[0]["current_stage_index"] == 1, "Phải tiếp tục chạy từ Stage 2 (Index 1)"

    # 5. Tiếp tục hoàn thành các stage còn lại (Auto-Resume)
    stages = [
        ("2_DEMUCS_STEM_ISOLATION", 1),
        ("3_AI_HIGHLIGHT_RAG", 2),
        ("4_QC_PRE_VALIDATION", 3),
        ("5_RENDER_FFMPEG_NVENC", 4),
        ("6_MULTI_PLATFORM_DISPATCH", 5),
    ]
    for stage_name, idx in stages:
        state_manager.complete_stage(
            pipe_id,
            stage_name=stage_name,
            stage_index=idx,
            total_stages=6,
            output_artifacts={"artifact_idx": idx}
        )

    # 6. Kiểm tra trạng thái hoàn tất 100%
    final_details = state_manager.get_pipeline_state(pipe_id)
    assert final_details["status"] == "COMPLETED"
    assert final_details["progress_percent"] == 100


def test_sqlite_concurrent_write_stress():
    """Kiểm thử áp lực ghi đồng thời nhiều luồng không gây khóa database (WAL Mode)"""
    errors = []
    
    def worker(worker_id):
        try:
            for i in range(5):
                pid = f"stress_{worker_id}_{i}_{int(time.time()*1000)}"
                state_manager.create_or_get_pipeline(pid, title=f"Stress Task {worker_id}-{i}")
                state_manager.complete_stage(pid, "1_DOWNLOAD_INGEST", 0, 6, {"worker": worker_id})
        except Exception as e:
            errors.append(str(e))

    threads = [threading.Thread(target=worker, args=(w,)) for w in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0, f"Không được có lỗi lock database, gặp lỗi: {errors}"
