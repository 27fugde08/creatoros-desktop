#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Structured Errors, Logging & Self-Healing Registry
Định nghĩa hệ thống mã lỗi chuẩn hóa, bộ logger có cấu trúc (JSON / Structured Format),
và cơ chế tự phục hồi (Self-Healing) tương ứng với từng mã lỗi.
"""

import os
import sys
import json
import time
import logging
from enum import Enum
from typing import Dict, Any, Optional, Callable


class ErrorCode(str, Enum):
    """
    Hệ thống mã lỗi chuẩn hóa toàn bộ dự án CREATOROS.
    """
    # Hardware & Memory
    ERR_CUDA_OOM = "ERR_CUDA_OOM"                       # VRAM quá tải / OOM
    ERR_RAM_EXHAUSTED = "ERR_RAM_EXHAUSTED"             # RAM hệ thống vượt ngưỡng an toàn
    ERR_NVENC_OVERLOAD = "ERR_NVENC_OVERLOAD"           # Vượt quá giới hạn session GPU NVENC
    ERR_NVME_DISK_FULL = "ERR_NVME_DISK_FULL"           # Ổ cứng NVMe không đủ dung lượng cache
    
    # Database & Storage
    ERR_DB_LOCKED = "ERR_DB_LOCKED"                     # SQLite DB bị khoá đồng thời
    ERR_DB_CORRUPTED = "ERR_DB_CORRUPTED"               # Hỏng file cơ sở dữ liệu
    ERR_CHECKPOINT_NOT_FOUND = "ERR_CHECKPOINT_NOT_FOUND" # Không tìm thấy DAG checkpoint
    
    # Network & IPC
    ERR_WS_CONN = "ERR_WS_CONN"                         # Lỗi kết nối WebSocket IPC
    ERR_RPC_INVALID_METHOD = "ERR_RPC_INVALID_METHOD"   # Method JSON-RPC không tồn tại
    ERR_RPC_INVALID_PARAMS = "ERR_RPC_INVALID_PARAMS"   # Tham số JSON-RPC không hợp lệ
    
    # Media & Pipeline Operations
    ERR_DOWNLOAD_FAILED = "ERR_DOWNLOAD_FAILED"         # yt-dlp / Direct stream download lỗi
    ERR_DEMUCS_FAILED = "ERR_DEMUCS_FAILED"             # Lỗi tách nhạc/giọng Demucs AI
    ERR_RENDER_FAILED = "ERR_RENDER_FAILED"             # FFmpeg GPU NVENC render thất bại
    ERR_QC_REJECTED = "ERR_QC_REJECTED"                 # QC Agent từ chối video
    ERR_TIMEOUT = "ERR_TIMEOUT"                         # Subprocess timeout
    ERR_UNKNOWN = "ERR_UNKNOWN"                         # Lỗi chưa phân loại


class CreatorOSError(Exception):
    """
    Base Exception cho các lỗi nghiệp vụ trong CREATOROS.
    """
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        recoverable: bool = True
    ):
        super().__init__(f"[{code.value}] {message}")
        self.code = code
        self.message = message
        self.details = details or {}
        self.recoverable = recoverable
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.code.value,
            "message": self.message,
            "details": self.details,
            "recoverable": self.recoverable,
            "timestamp": self.timestamp
        }


# ==============================================================================
# STRUCTURED LOGGER SETUP
# ==============================================================================
class StructuredJsonFormatter(logging.Formatter):
    """
    Formatter xuất log theo định dạng JSON có cấu trúc cho Production & Telemetry.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno
        }
        if hasattr(record, "error_code"):
            log_obj["error_code"] = record.error_code
        if hasattr(record, "details"):
            log_obj["details"] = record.details
        return json.dumps(log_obj, ensure_ascii=False)


def get_structured_logger(name: str) -> logging.Logger:
    """
    Tạo hoặc lấy một Structured Logger tiêu chuẩn.
    """
    logger = logging.getLogger(f"CREATOROS.{name}")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    return logger


# Global standard logger
logger = get_structured_logger("Core")


# ==============================================================================
# SELF-HEALING REGISTRY
# ==============================================================================
SELF_HEALING_ACTIONS: Dict[ErrorCode, str] = {
    ErrorCode.ERR_CUDA_OOM: "Xả sạch CUDA Cache (torch.cuda.empty_cache), giảm batch size và kích hoạt CPU Fallback.",
    ErrorCode.ERR_RAM_EXHAUSTED: "Kích hoạt Python Garbage Collector (gc.collect) và dọn bớt frame buffer.",
    ErrorCode.ERR_NVENC_OVERLOAD: "Tạm hoãn tiến trình render chờ session GPU khả dụng (Throttle Queue).",
    ErrorCode.ERR_NVME_DISK_FULL: "Tự động xóa các file video tạm (.tmp / .part) quá 60 phút trong thư mục cache.",
    ErrorCode.ERR_DB_LOCKED: "Kích hoạt cơ chế WAL mode và retry với Exponential Backoff (3 lần).",
    ErrorCode.ERR_DOWNLOAD_FAILED: "Tự động đổi User-Agent, hạ độ phân giải về 1080p hoặc chuyển sang chế độ tải phân đoạn.",
    ErrorCode.ERR_RENDER_FAILED: "Tự động chuyển từ NVENC phần cứng sang libx264 phần mềm nếu GPU bị quá nhiệt hoặc lỗi driver."
}


def get_healing_plan(code: ErrorCode) -> str:
    """
    Trả về phương án tự phục hồi (Self-Healing Plan) dựa trên mã lỗi.
    """
    return SELF_HEALING_ACTIONS.get(code, "Ghi nhận nhật ký lỗi và thông báo người dùng kiểm tra cấu hình.")
