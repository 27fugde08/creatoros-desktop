"""
Test Suite: VRAM Governor & Resource Stress Testing
Kiểm thử bộ giám sát tài nguyên phần cứng (GTX 1660 Super 6GB VRAM) và chống tràn OOM.
"""

import pytest
import os
import time
from hardware_governor import governor, HardwareGovernor

def test_hardware_metrics_structure():
    """Kiểm tra cấu trúc dữ liệu Telemetry trả về từ Hardware Governor"""
    metrics = governor.query_system_telemetry()
    
    assert "vram_total_mb" in metrics, "Phải có chỉ số VRAM tổng"
    assert "vram_used_mb" in metrics, "Phải có chỉ số VRAM đã dùng"
    assert "ram_total_mb" in metrics, "Phải có chỉ số RAM hệ thống"
    assert "status_level" in metrics, "Phải có trạng thái Throttling (SAFE/WARNING/CRITICAL)"
    
    assert metrics["vram_total_mb"] > 0, "Tổng VRAM phải lớn hơn 0"
    assert metrics["ram_total_mb"] > 0, "Tổng RAM hệ thống phải lớn hơn 0"


def test_vram_empty_cache_execution():
    """Kiểm tra hàm giải phóng VRAM khẩn cấp không gây sập ứng dụng"""
    # Không gây ngoại lệ
    governor.collect_garbage_and_empty_vram()
    assert True


def test_nvenc_concurrency_governor():
    """Kiểm tra giới hạn số phiên NVENC đồng thời trên GTX 1660 Super"""
    governor.active_nvenc_sessions = 0
    assert governor.can_start_nvenc_session() is True
    
    governor.register_nvenc_start()
    assert governor.active_nvenc_sessions == 1
    
    governor.register_nvenc_start()
    assert governor.active_nvenc_sessions == 2
    
    # Đã đạt trần MAX_NVENC_CONCURRENT = 2 -> Không cho mở phiên thứ 3
    assert governor.can_start_nvenc_session() is False
    
    governor.register_nvenc_end()
    assert governor.active_nvenc_sessions == 1
    assert governor.can_start_nvenc_session() is True
    
    governor.register_nvenc_end()
    assert governor.active_nvenc_sessions == 0


def test_nvme_cache_cleaning():
    """Kiểm tra dọn dẹp bộ nhớ đệm tạm trên ổ đĩa SSD NVMe"""
    res = governor.clean_cache(keep_checkpoints=True)
    assert res["success"] is True, "Dọn dẹp cache phải thành công"
    assert "freed_mb" in res, "Phải báo cáo dung lượng giải phóng (MB)"
