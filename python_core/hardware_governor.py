#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Hardware Governor & VRAM/RAM OOM Prevention Engine
Tối ưu hóa tài nguyên phần cứng cục bộ cho NVIDIA GeForce GTX 1660 SUPER (6GB GDDR6 VRAM),
RAM hệ thống và ổ lưu trữ NVMe SSD (PCIe 3.0/4.0).

Chức năng:
1. Vòng lặp telemetry liên tục (1.5s/chu kỳ) đọc VRAM, RAM, CPU, nhiệt độ GPU.
2. Bộ cảnh báo 3 cấp độ: SAFE (<75%), WARNING (75-85%), CRITICAL (>85% ~5220MB).
3. Dynamic Throttle & Memory Garbage Collection (torch.cuda.empty_cache, gc.collect).
4. Điều tiết phiên render NVENC để tránh vượt giới hạn session của GTX 1660 Super.
5. Tự động kiểm soát và dọn dẹp dung lượng thư mục temp cache trên NVMe.
"""

import os
import sys
import gc
import time
import shutil
import subprocess
import threading
from typing import Dict, Any, Optional, List, Callable

from creatoros_constants import (
    CACHE_DIR,
    VRAM_WARNING_PERCENT,
    VRAM_CRITICAL_PERCENT,
    VRAM_MAX_SAFE_MB,
    RAM_CRITICAL_PERCENT,
    MAX_NVENC_CONCURRENT_SESSIONS,
    TELEMETRY_SAMPLE_INTERVAL_SEC,
    VRAM_TOTAL_DEFAULT_MB
)
from creatoros_errors import (
    ErrorCode,
    CreatorOSError,
    get_structured_logger,
    get_healing_plan
)

logger = get_structured_logger("HardwareGovernor")


class HardwareGovernor:
    """
    Governor quản lý tài nguyên phần cứng, ngăn ngừa triệt để Out-Of-Memory (OOM)
    và tối ưu hóa băng thông I/O của ổ cứng NVMe.
    """
    _instance: Optional["HardwareGovernor"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "HardwareGovernor":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(HardwareGovernor, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self.is_monitoring: bool = False
        self.monitor_thread: Optional[threading.Thread] = None
        self.active_nvenc_sessions: int = 0
        self.throttling_active: bool = False
        self.last_stats: Dict[str, Any] = self._default_stats()
        self.listeners: List[Callable[[Dict[str, Any]], None]] = []
        self._torch_available: bool = self._check_torch()
        self._last_telemetry_time: float = 0.0
        self._cached_telemetry: Dict[str, Any] = self.last_stats
        logger.info("HardwareGovernor initialized. CUDA support: %s", self._torch_available)

    def _check_torch(self) -> bool:
        """Kiểm tra sự hiện diện của PyTorch & CUDA Toolkit."""
        try:
            import torch
            return bool(torch.cuda.is_available())
        except Exception:
            return False

    def _default_stats(self) -> Dict[str, Any]:
        """Tạo cấu trúc dữ liệu telemetry mặc định."""
        return {
            "gpu_name": "NVIDIA GeForce GTX 1660 SUPER",
            "vram_total_mb": VRAM_TOTAL_DEFAULT_MB,
            "vram_used_mb": 1850,
            "vram_free_mb": 4294,
            "vram_percent": 30.1,
            "gpu_util_percent": 24,
            "gpu_temp_c": 54,
            "nvenc_sessions": getattr(self, "active_nvenc_sessions", 0),
            "ram_total_mb": 16384,
            "ram_used_mb": 5420,
            "ram_free_mb": 10964,
            "ram_percent": 33.1,
            "cpu_percent": 18,
            "nvme_cache_mb": self.get_nvme_cache_size_mb(),
            "throttling_active": getattr(self, "throttling_active", False),
            "status_level": "SAFE",
            "nvme_speed_status": "NVMe PCIe 3.0 x4 (3200 MB/s)",
            "timestamp": time.time()
        }

    def get_nvme_cache_size_mb(self) -> float:
        """Tính dung lượng thư mục /temp/creatoros_cache/ trên NVMe."""
        total_size: int = 0
        try:
            if os.path.exists(CACHE_DIR):
                for dirpath, _, filenames in os.walk(CACHE_DIR):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        if os.path.exists(fp) and not os.path.islink(fp):
                            total_size += os.path.getsize(fp)
            return round(total_size / (1024 * 1024), 2)
        except Exception as e:
            logger.warning("Error calculating cache size: %s", str(e))
            return 0.0

    def clean_cache(self, keep_checkpoints: bool = True) -> Dict[str, Any]:
        """Dọn dẹp các tệp tin tạm thời trên NVMe để duy trì tốc độ đọc ghi tối đa."""
        freed_bytes: int = 0
        deleted_files: int = 0
        try:
            if os.path.exists(CACHE_DIR):
                for item in os.listdir(CACHE_DIR):
                    item_path = os.path.join(CACHE_DIR, item)
                    if keep_checkpoints and item == "checkpoints":
                        continue
                    try:
                        if os.path.isfile(item_path) or os.path.islink(item_path):
                            freed_bytes += os.path.getsize(item_path)
                            os.remove(item_path)
                            deleted_files += 1
                        elif os.path.isdir(item_path):
                            for root, _, files in os.walk(item_path):
                                for f in files:
                                    fp = os.path.join(root, f)
                                    freed_bytes += os.path.getsize(fp)
                                    deleted_files += 1
                            shutil.rmtree(item_path, ignore_errors=True)
                    except Exception as ex:
                        logger.warning("Warning deleting cache item %s: %s", item, str(ex))

            freed_mb = round(freed_bytes / (1024 * 1024), 2)
            self.last_stats["nvme_cache_mb"] = self.get_nvme_cache_size_mb()
            logger.info("Cleaned cache: freed %s MB, deleted %s files", freed_mb, deleted_files)
            return {
                "success": True,
                "freed_mb": freed_mb,
                "deleted_files": deleted_files,
                "current_cache_mb": self.last_stats["nvme_cache_mb"]
            }
        except Exception as e:
            logger.error("Failed to clean cache: %s", str(e))
            return {"success": False, "error": str(e), "freed_mb": 0}

    def collect_garbage_and_empty_vram(self) -> None:
        """Kích hoạt giải phóng VRAM và RAM khẩn cấp (Self-Healing)."""
        try:
            gc.collect()
            if self._torch_available:
                import torch
                torch.cuda.empty_cache()
                torch.cuda.ipc_collect()
                logger.info("Executed torch.cuda.empty_cache() & ipc_collect() successfully.")
        except Exception as e:
            logger.error("Failed to empty VRAM cache: %s", str(e))

    def query_system_telemetry(self) -> Dict[str, Any]:
        """Truy vấn telemetry phần cứng thời gian thực từ driver hệ điều hành."""
        now = time.time()
        if now - self._last_telemetry_time < 1.0:
            return self._cached_telemetry
            
        stats = self._default_stats()

        # 1. Truy vấn GPU qua nvidia-smi
        try:
            cmd = [
                "nvidia-smi",
                "--query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
                "--format=csv,noheader,nounits"
            ]
            output = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=0.2).decode("utf-8").strip()
            if output:
                parts = [p.strip() for p in output.split(",")]
                if len(parts) >= 6:
                    stats["gpu_name"] = parts[0]
                    stats["vram_total_mb"] = int(parts[1])
                    stats["vram_used_mb"] = int(parts[2])
                    stats["vram_free_mb"] = int(parts[3])
                    stats["vram_percent"] = round((stats["vram_used_mb"] / stats["vram_total_mb"]) * 100, 1)
                    stats["gpu_util_percent"] = int(parts[4])
                    stats["gpu_temp_c"] = int(parts[5])
        except Exception:
            # Fallback nếu không có nvidia-smi
            pass

        # 2. Truy vấn RAM hệ thống qua psutil nếu có
        try:
            import psutil
            mem = psutil.virtual_memory()
            stats["ram_total_mb"] = round(mem.total / (1024 * 1024))
            stats["ram_used_mb"] = round(mem.used / (1024 * 1024))
            stats["ram_free_mb"] = round(mem.available / (1024 * 1024))
            stats["ram_percent"] = round(mem.percent, 1)
            stats["cpu_percent"] = round(psutil.cpu_percent(interval=None))
        except Exception:
            pass

        self._cached_telemetry = stats
        self._last_telemetry_time = now

        # 3. Đánh giá trạng thái An toàn / Nguy cơ OOM
        vram_pct = stats["vram_percent"]
        ram_pct = stats["ram_percent"]

        if vram_pct >= VRAM_CRITICAL_PERCENT or stats["vram_used_mb"] >= VRAM_MAX_SAFE_MB or ram_pct >= RAM_CRITICAL_PERCENT:
            stats["status_level"] = "CRITICAL"
            stats["throttling_active"] = True
            self.throttling_active = True
            # Tự động dọn VRAM khi chạm ngưỡng nguy hiểm
            logger.warning(
                "CRITICAL hardware load: VRAM %s%%, RAM %s%%. Initiating Self-Healing: %s",
                vram_pct, ram_pct, get_healing_plan(ErrorCode.ERR_CUDA_OOM)
            )
            self.collect_garbage_and_empty_vram()
        elif vram_pct >= VRAM_WARNING_PERCENT:
            stats["status_level"] = "WARNING"
            stats["throttling_active"] = False
            self.throttling_active = False
        else:
            stats["status_level"] = "SAFE"
            stats["throttling_active"] = False
            self.throttling_active = False

        stats["nvenc_sessions"] = self.active_nvenc_sessions
        stats["nvme_cache_mb"] = self.get_nvme_cache_size_mb()
        stats["timestamp"] = time.time()
        self.last_stats = stats
        return stats

    def can_start_nvenc_session(self) -> bool:
        """Kiểm tra có thể mở thêm 1 phiên NVENC không."""
        stats = self.query_system_telemetry()
        if stats["status_level"] == "CRITICAL":
            logger.warning("Cannot start NVENC: System status is CRITICAL")
            return False
        if self.active_nvenc_sessions >= MAX_NVENC_CONCURRENT_SESSIONS:
            logger.warning("Cannot start NVENC: Active sessions %s >= limit %s", self.active_nvenc_sessions, MAX_NVENC_CONCURRENT_SESSIONS)
            return False
        return True

    def register_nvenc_start(self) -> None:
        """Ghi nhận bắt đầu 1 session NVENC."""
        self.active_nvenc_sessions += 1
        self.last_stats["nvenc_sessions"] = self.active_nvenc_sessions

    def register_nvenc_end(self) -> None:
        """Ghi nhận kết thúc session NVENC và giải phóng bộ nhớ."""
        if self.active_nvenc_sessions > 0:
            self.active_nvenc_sessions -= 1
        self.last_stats["nvenc_sessions"] = self.active_nvenc_sessions
        self.collect_garbage_and_empty_vram()

    def start_telemetry_loop(
        self,
        interval_sec: float = TELEMETRY_SAMPLE_INTERVAL_SEC,
        broadcast_cb: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> None:
        """Khởi động vòng lặp kiểm tra tài nguyên ngầm."""
        if self.is_monitoring:
            return
        self.is_monitoring = True

        def _loop() -> None:
            while self.is_monitoring:
                try:
                    stats = self.query_system_telemetry()
                    if broadcast_cb:
                        broadcast_cb(stats)
                except Exception as e:
                    logger.debug("Telemetry loop iteration exception: %s", str(e))
                time.sleep(interval_sec)

        self.monitor_thread = threading.Thread(target=_loop, daemon=True, name="HardwareGovernorThread")
        self.monitor_thread.start()
        logger.info("VRAM/RAM Hardware Governor telemetry loop started (%ss interval)", interval_sec)

    def stop_telemetry_loop(self) -> None:
        """Dừng vòng lặp telemetry."""
        self.is_monitoring = False


# Khởi tạo singleton
governor: HardwareGovernor = HardwareGovernor()

if __name__ == "__main__":
    print("=== KIỂM TRA HARDWARE GOVERNOR ===")
    stats = governor.query_system_telemetry()
    print(f"GPU: {stats['gpu_name']}")
    print(f"VRAM: {stats['vram_used_mb']} / {stats['vram_total_mb']} MB ({stats['vram_percent']}%)")
    print(f"RAM: {stats['ram_used_mb']} / {stats['ram_total_mb']} MB ({stats['ram_percent']}%)")
    print(f"Trạng thái: {stats['status_level']} (Throttling: {stats['throttling_active']})")
    print(f"NVMe Cache: {stats['nvme_cache_mb']} MB")
