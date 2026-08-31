"""
Test Suite: Error Codes Registry, Structured Logging & Self-Healing Action Coverage
Đảm bảo 100% mã lỗi định danh chuẩn, bắt lỗi và ánh xạ phương án tự phục hồi (Self-Healing).
"""

import pytest
import time
from creatoros_errors import (
    ErrorCode,
    CreatorOSError,
    SELF_HEALING_ACTIONS,
    get_healing_plan,
    get_structured_logger
)
from agentic_self_healing import AgenticSelfHealingEngine, HEALING_PATTERNS


def test_error_codes_completeness():
    """Kiểm tra tính đầy đủ của các mã lỗi chuẩn ErrorCode"""
    assert ErrorCode.ERR_CUDA_OOM == "ERR_CUDA_OOM"
    assert ErrorCode.ERR_RAM_EXHAUSTED == "ERR_RAM_EXHAUSTED"
    assert ErrorCode.ERR_NVENC_OVERLOAD == "ERR_NVENC_OVERLOAD"
    assert ErrorCode.ERR_NVME_DISK_FULL == "ERR_NVME_DISK_FULL"
    assert ErrorCode.ERR_DB_LOCKED == "ERR_DB_LOCKED"
    assert ErrorCode.ERR_DB_CORRUPTED == "ERR_DB_CORRUPTED"
    assert ErrorCode.ERR_CHECKPOINT_NOT_FOUND == "ERR_CHECKPOINT_NOT_FOUND"
    assert ErrorCode.ERR_WS_CONN == "ERR_WS_CONN"
    assert ErrorCode.ERR_RPC_INVALID_METHOD == "ERR_RPC_INVALID_METHOD"
    assert ErrorCode.ERR_RPC_INVALID_PARAMS == "ERR_RPC_INVALID_PARAMS"
    assert ErrorCode.ERR_DOWNLOAD_FAILED == "ERR_DOWNLOAD_FAILED"
    assert ErrorCode.ERR_DEMUCS_FAILED == "ERR_DEMUCS_FAILED"
    assert ErrorCode.ERR_RENDER_FAILED == "ERR_RENDER_FAILED"
    assert ErrorCode.ERR_QC_REJECTED == "ERR_QC_REJECTED"


def test_creatoros_error_exception():
    """Kiểm tra đối tượng Exception CreatorOSError và khả năng serialize to_dict"""
    err = CreatorOSError(
        code=ErrorCode.ERR_CUDA_OOM,
        message="VRAM allocation failed at 5800MB",
        details={"vram_used": 5800, "vram_max": 6144},
        recoverable=True
    )
    
    assert "[ERR_CUDA_OOM]" in str(err)
    d = err.to_dict()
    assert d["error_code"] == "ERR_CUDA_OOM"
    assert d["recoverable"] is True
    assert d["details"]["vram_used"] == 5800
    assert "timestamp" in d


def test_self_healing_plan_resolution():
    """Kiểm tra hàm get_healing_plan cung cấp chính xác giải pháp tự phục hồi"""
    cuda_plan = get_healing_plan(ErrorCode.ERR_CUDA_OOM)
    assert "CUDA Cache" in cuda_plan or "torch.cuda.empty_cache" in cuda_plan
    
    nvenc_plan = get_healing_plan(ErrorCode.ERR_NVENC_OVERLOAD)
    assert "render" in nvenc_plan or "session" in nvenc_plan
    
    unknown_plan = get_healing_plan(ErrorCode.ERR_UNKNOWN)
    assert isinstance(unknown_plan, str) and len(unknown_plan) > 0


def test_agentic_self_healing_diagnosis():
    """Kiểm thử Engine tự phục hồi phân tích lỗi FFmpeg/CUDA mẫu và sinh phương án fallback"""
    engine = AgenticSelfHealingEngine()
    
    # 1. Test CUDA OOM diagnosis
    oom_incident = engine.diagnose_and_resolve(
        pipeline_id="pipe_test_oom",
        task_type="demucs",
        raw_error="CUDA out of memory. Tried to allocate 1024.00 MiB (GPU 0; 6.00 GiB total capacity)"
    )
    assert oom_incident["error_category"] == "CUDA_VRAM_OOM"
    assert oom_incident["resolved"] == 1
    assert "fallback_parameters" in oom_incident
    
    # 2. Test Audio Sample Rate Mismatch diagnosis
    audio_incident = engine.diagnose_and_resolve(
        pipeline_id="pipe_test_audio",
        task_type="render",
        raw_error="Application provided invalid audio: Sample rate mismatch 48000Hz vs 44100Hz"
    )
    assert audio_incident["error_category"] == "AUDIO_DESYNC_OR_CODEC_MISMATCH"
    assert audio_incident["resolved"] == 1
    assert audio_incident["fallback_parameters"].get("acodec") == "aac"


def test_structured_logger():
    """Kiểm tra khởi tạo structured logger"""
    log = get_structured_logger("TestLogger")
    assert log is not None
    log.info("Testing structured log output")
