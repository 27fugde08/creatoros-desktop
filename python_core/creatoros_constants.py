#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Centralized Configuration & System Constants
Lưu trữ toàn bộ hằng số cấu hình, tham số mặc định và cổng IPC cho hệ thống.
Tuân thủ Clean Code & KISS (Keep It Simple, Stupid), loại bỏ triệt để Magic Numbers.
"""

import os
from typing import List

# ==============================================================================
# CẤU HÌNH MÔI TRƯỜNG & ĐƯỜNG DẪN HỆ THỐNG
# ==============================================================================
APP_NAME: str = "CREATOROS"
APP_VERSION: str = "1.0.0"

USER_DATA_DIR: str = os.environ.get(
    "CREATOROS_USER_DATA", 
    os.path.dirname(os.path.abspath(__file__))
)
CACHE_DIR: str = os.environ.get(
    "CREATOROS_CACHE_DIR", 
    os.path.join(USER_DATA_DIR, "temp", "creatoros_cache")
)
OUTPUT_DIR: str = os.environ.get(
    "CREATOROS_OUTPUT_DIR", 
    os.path.join(USER_DATA_DIR, "output")
)
TEMP_DIR: str = os.environ.get(
    "CREATOROS_TEMP_DIR", 
    os.path.join(USER_DATA_DIR, "temp")
)

# Đảm bảo các thư mục bắt buộc luôn tồn tại
for d in (CACHE_DIR, OUTPUT_DIR, TEMP_DIR):
    os.makedirs(d, exist_ok=True)

# Database Paths
DB_STATE_PATH: str = os.environ.get(
    "CREATOROS_DB_PATH", 
    os.path.join(USER_DATA_DIR, "creatoros_state.db")
)
DB_SQLITE_PATH: str = os.environ.get(
    "CREATOROS_SQLITE_PATH", 
    os.path.join(USER_DATA_DIR, "database.sqlite")
)

# ==============================================================================
# MẠNG & WEBSOCKET JSON-RPC IPC
# ==============================================================================
DEFAULT_WS_HOST: str = os.environ.get("CREATOROS_WS_HOST", "127.0.0.1")
DEFAULT_WS_PORT: int = int(os.environ.get("CREATOROS_WS_PORT", "8765"))
DEFAULT_HTTP_PORT: int = int(os.environ.get("PORT", "3000"))

# Timeouts & Intervals (Seconds / Milliseconds)
WS_PING_INTERVAL_SEC: float = 5.0
WS_PING_TIMEOUT_SEC: float = 3.5
WS_RECONNECT_INITIAL_BACKOFF_MS: int = 1500
WS_RECONNECT_MAX_BACKOFF_MS: int = 25000
SUBPROCESS_TIMEOUT_SEC: int = 600

# ==============================================================================
# NGƯỠNG AN TOÀN PHẦN CỨNG (NVIDIA GTX 1660 SUPER 6GB & NVMe I/O)
# ==============================================================================
VRAM_TOTAL_DEFAULT_MB: int = 6144
VRAM_WARNING_PERCENT: float = 75.0
VRAM_CRITICAL_PERCENT: float = 85.0    # ~5220 MB trên 6GB VRAM
VRAM_MAX_SAFE_MB: int = 5200
RAM_CRITICAL_PERCENT: float = 85.0
CPU_WARNING_PERCENT: float = 90.0

MAX_NVENC_CONCURRENT_SESSIONS: int = 2
TELEMETRY_SAMPLE_INTERVAL_SEC: float = 1.5
CLEANUP_DISK_THRESHOLD_PERCENT: float = 90.0

# ==============================================================================
# PIPELINE STAGES & CHECKPOINT STANDARDS
# ==============================================================================
STANDARD_PIPELINE_STAGES: List[str] = [
    "1_DOWNLOAD_INGEST",
    "2_DEMUCS_STEM_ISOLATION",
    "3_AI_HIGHLIGHT_RAG",
    "4_QC_PRE_VALIDATION",
    "5_RENDER_FFMPEG_NVENC",
    "6_MULTI_PLATFORM_DISPATCH"
]

# Supported Video Codecs & Formats
DEFAULT_VIDEO_CODEC: str = "h264_nvenc"
FALLBACK_VIDEO_CODEC: str = "libx264"
DEFAULT_AUDIO_CODEC: str = "aac"
DEFAULT_PIXEL_FORMAT: str = "yuv420p"
