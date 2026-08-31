#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CreatorOS - Ultimate Hardware-Aware DAG Orchestrator & Task Decomposer
Nâng cấp thuật toán:
1. Thuật toán Silent-Edge Alignment Segmentation: Cắt nhỏ video dựa trên khoảng im lặng và ranh giới hội thoại.
2. Lập lịch thích ứng phần cứng (Adaptive Hardware Scheduler) kèm khả năng Hạ cấp Graceful (CPU Fallback khi quá tải GPU/OOM).
3. Hàng đợi ưu tiên động (Dynamic Priority Queue) ngăn ngừa tắc nghẽn I/O ổ đĩa NVMe.
4. Cơ chế lưu vết trạng thái chống lỗi nguyên tử (Atomic Checkpointing).
"""

import os
import sys
import json
import time
import psutil
import tempfile
from typing import List, Dict, Any, Tuple, Set

# --- CHỈ SỐ AN TOÀN PHẦN CỨNG ---
SAFE_RAM_BUFFER_GB = 1.5      # Giữ lại ít nhất 1.5GB RAM hệ thống rảnh
SAFE_VRAM_BUFFER_GB = 1.0     # Giữ lại ít nhất 1GB VRAM đồ họa rảnh
MAX_NVME_WRITE_MBPS = 150.0   # Giới hạn băng thông ghi tối đa để tránh nghẽn I/O

# --- TRẠNG THÁI TASK ---
class TaskState:
    PENDING = "Pending"
    READY = "Ready"
    RUNNING = "Running"
    COMPLETED = "Completed"
    FAILED = "Failed"


class SilentEdgeSegmenter:
    """
    Module 1: Thuật toán Phân rã Tác vụ Hội thoại Thông minh
    Đảm bảo cắt nhỏ dòng video/audio dài ở các điểm lặng (Silence Valley),
    không làm đứt gãy từ hoặc câu nói đang dở dang.
    """
    @staticmethod
    def find_optimal_splits(words: List[Dict[str, Any]], 
                            target_duration_sec: float = 45.0, 
                            min_duration_sec: float = 30.0, 
                            max_duration_sec: float = 60.0) -> List[Tuple[float, float, int, int]]:
        """
        Phân tích chuỗi từ kèm timestamp để tìm điểm ngắt tối ưu.
        Trả về mảng các tuple: (start_time, end_time, start_word_idx, end_word_idx)
        """
        splits = []
        n = len(words)
        if n == 0:
            return splits
            
        start_idx = 0
        
        while start_idx < n:
            current_start_time = words[start_idx]["start"]
            best_end_idx = start_idx
            found_split = False
            
            # Quét tìm điểm cắt trong phạm vi cho phép [min_duration, max_duration]
            for i in range(start_idx, n):
                dur = words[i]["end"] - current_start_time
                
                if dur > max_duration_sec:
                    # Đã vượt quá giới hạn cực đại, buộc phải lấy ứng viên tốt nhất trước đó
                    break
                    
                best_end_idx = i
                
                # Điều kiện cắt lý tưởng: Có khoảng lặng (gap) lớn hơn 350ms giữa từ hiện tại và từ kế tiếp
                if dur >= min_duration_sec:
                    if i + 1 < n:
                        gap = words[i+1]["start"] - words[i]["end"]
                        if gap >= 0.35: # Khoảng lặng tối ưu để ngắt câu
                            best_end_idx = i
                            found_split = True
                            break
            
            # Nếu không tìm thấy khoảng lặng lý tưởng nào, chọn điểm gần target_duration_sec nhất
            if not found_split and best_end_idx > start_idx:
                closest_to_target = best_end_idx
                min_diff = float('inf')
                for i in range(start_idx, n):
                    dur = words[i]["end"] - current_start_time
                    if min_duration_sec <= dur <= max_duration_sec:
                        diff = abs(dur - target_duration_sec)
                        if diff < min_diff:
                            min_diff = diff
                            closest_to_target = i
                best_end_idx = closest_to_target
                
            end_time = words[best_end_idx]["end"]
            splits.append((current_start_time, end_time, start_idx, best_end_idx))
            
            start_idx = best_end_idx + 1
            
        return splits


class Telemetry:
    """Giám sát tài nguyên phần cứng thời gian thực"""
    @staticmethod
    def get_hardware_status() -> Dict[str, float]:
        ram_free = psutil.virtual_memory().available / (1024 ** 3)
        cpu_free = 100.0 - psutil.cpu_percent()
        
        # Đọc thông số VRAM thực tế từ NVIDIA GPU nếu có
        vram_free = 0.0
        try:
            import subprocess
            res = subprocess.run(
                ["nvidia-smi", "--query-gpu=memory.free", "--format=csv,nounits,noheader"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=1.5
            )
            if res.returncode == 0 and res.stdout:
                vram_free = float(res.stdout.strip().split('\n')[0]) / 1024.0
        except Exception:
            vram_free = 0.0 # Fallback CPU
            
        return {
            "cpu_free": cpu_free,
            "ram_free": ram_free,
            "vram_free": vram_free
        }


class AdvancedTaskNode:
    """Đại diện cho một Nút trong biểu đồ điều phối công việc DAG"""
    def __init__(self, node_id: str, stage_name: str, 
                 cost_gpu: Dict[str, float], 
                 cost_cpu: Dict[str, float], 
                 dependencies: List[str], 
                 priority: int = 1):
        self.node_id = node_id
        self.stage_name = stage_name
        self.state = TaskState.PENDING
        self.cost_gpu = cost_gpu     # Chi phí khi chạy GPU: {"cpu": %, "ram": GB, "vram": GB, "io_write": MB/s}
        self.cost_cpu = cost_cpu     # Chi phí khi chạy CPU (mức hạ cấp): {"cpu": %, "ram": GB, "vram": 0.0, "io_write": MB/s}
        self.dependencies = dependencies
        self.priority = priority     # Độ ưu tiên động (cao hơn xử lý trước)
        
        self.in_degree = len(dependencies)
        self.mode = "GPU"            # Chế độ chạy hiện tại (GPU hoặc CPU)
        self.retries = 0             # Số lần thử lại khi lỗi
        self.max_retries = 2
        self.error_log = []

    def get_current_cost(self) -> Dict[str, float]:
        """Trả về chi phí phần cứng tùy theo chế độ chạy hiện tại"""
        return self.cost_gpu if self.mode == "GPU" else self.cost_cpu


class AdaptiveDAGScheduler:
    """
    Module 2 & 4: Công cụ lập lịch thích ứng phần cứng & Phục hồi lỗi
    Hỗ trợ CPU Fallback, Quản lý ưu tiên động, Tránh nghẽn I/O ổ đĩa NVMe.
    """
    def __init__(self, checkpoint_path: str = ".creatoros_atomic_checkpoint.json"):
        self.nodes: Dict[str, AdvancedTaskNode] = {}
        self.ready_queue: List[AdvancedTaskNode] = []
        self.running_tasks: List[AdvancedTaskNode] = []
        self.checkpoint_path = checkpoint_path
        self.io_write_usage = 0.0  # Băng thông ghi I/O hiện dụng (MB/s)

    def register_node(self, node: AdvancedTaskNode):
        self.nodes[node.node_id] = node

    def trigger_atomic_checkpoint(self):
        """Lưu vết trạng thái an toàn chống ghi đè lỗi (Atomic Checkpoint)"""
        temp_file = self.checkpoint_path + ".tmp"
        checkpoint_data = {}
        for nid, node in self.nodes.items():
            if node.state == TaskState.COMPLETED:
                checkpoint_data[nid] = {
                    "state": node.state,
                    "mode": node.mode,
                    "completed_at": time.time()
                }
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(checkpoint_data, f, indent=4)
            # Thay thế nguyên tử tệp cũ bằng tệp mới (Atomic replace)
            os.replace(temp_file, self.checkpoint_path)
        except Exception as e:
            print(f"[Error] Ghi checkpoint thất bại: {e}", file=sys.stderr)

    def auto_resume_from_checkpoint(self) -> int:
        """Tự động đọc lại checkpoint và bỏ qua các bước đã hoàn tất"""
        if not os.path.exists(self.checkpoint_path):
            return 0
        try:
            with open(self.checkpoint_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
            
            recovered_count = 0
            for nid, data in saved.items():
                if nid in self.nodes:
                    node = self.nodes[nid]
                    node.state = TaskState.COMPLETED
                    node.mode = data.get("mode", "GPU")
                    node.in_degree = 0
                    recovered_count += 1
            
            # Cập nhật số bậc phụ thuộc thực tế cho các task còn lại
            for nid, node in self.nodes.items():
                if node.state != TaskState.COMPLETED:
                    active_deps = [dep for dep in node.dependencies if self.nodes[dep].state != TaskState.COMPLETED]
                    node.in_degree = len(active_deps)
                    
            return recovered_count
        except Exception:
            return 0

    def handle_task_failure(self, node: AdvancedTaskNode, error_msg: str):
        """
        Cơ chế tự phục hồi hạ cấp (Graceful Degradation):
        Nếu task GPU bị lỗi (OOM, CUDA error), hạ cấp sang CPU và cho chạy lại.
        """
        node.retries += 1
        node.error_log.append(f"Retry #{node.retries}: {error_msg}")
        
        if node.mode == "GPU" and node.retries <= node.max_retries:
            print(f"⚠️ [GRACEFUL DEGRADATION] Tác vụ '{node.node_id}' lỗi GPU. Tự động hạ cấp xuống chế độ CPU fallback...")
            node.mode = "CPU"
            node.state = TaskState.READY
            self.ready_queue.append(node)
        elif node.retries <= node.max_retries:
            print(f"⚠️ [RETRY] Tác vụ '{node.node_id}' gặp lỗi ở chế độ CPU. Đang thử lại lần {node.retries}...")
            node.state = TaskState.READY
            self.ready_queue.append(node)
        else:
            print(f"❌ [FATAL] Tác vụ '{node.node_id}' thất bại hoàn toàn sau {node.retries} lần thử.")
            node.state = TaskState.FAILED

    def orchestrate(self):
        print("=" * 70)
        print("CREATOROS - ADAPTIVE HARDWARE-AWARE TASK ORCHESTRATOR")
        print("=" * 70)
        
        # Đọc checkpoint khôi phục
        restored = self.auto_resume_from_checkpoint()
        if restored > 0:
            print(f"[*] [AUTO-RESUME] Khôi phục thành công {restored} tác vụ từ phân đoạn dở dang.")
            
        while True:
            # 1. Cập nhật các Node phụ thuộc đã hoàn thành sang Ready
            for node in self.nodes.values():
                if node.in_degree == 0 and node.state == TaskState.PENDING:
                    node.state = TaskState.READY
                    self.ready_queue.append(node)
                    print(f"[*] [STATE] Tác vụ '{node.node_id}' ({node.stage_name}) sẵn sàng xử lý.")

            # Kiểm tra hoàn thành tất cả
            if all(node.state == TaskState.COMPLETED for node in self.nodes.values()):
                print("\n🎉 [PIPELINE SUCCESS] Tất cả các giai đoạn DAG đã hoàn thành tối ưu và an toàn phần cứng!")
                break
                
            if any(node.state == TaskState.FAILED for node in self.nodes.values()):
                print("\n❌ [PIPELINE FAILURE] Một tác vụ cốt lõi bị lỗi và không thể hồi phục. Dừng khẩn cấp!")
                break

            # 2. Sắp xếp hàng đợi ưu tiên Ready Queue (Ưu tiên các task có Priority cao nhất)
            self.ready_queue.sort(key=lambda x: x.priority, reverse=True)

            # 3. Đo đạc thông số viễn thám thực tế
            hw = Telemetry.get_hardware_status()
            print(f"\n⚡ [SYSTEM HARDWARE] CPU Rảnh: {hw['cpu_free']:.1f}% | RAM Rảnh: {hw['ram_free']:.2f}GB | VRAM Rảnh: {hw['vram_free']:.2f}GB | Băng thông ghi I/O: {self.io_write_usage:.1f}/{MAX_NVME_WRITE_MBPS} MB/s")

            # 4. Duyệt phân bổ tài nguyên lập lịch
            deferred = []
            for task in self.ready_queue:
                cost = task.get_current_cost()
                
                # Điều kiện kiểm duyệt an toàn phần cứng
                enough_cpu = hw["cpu_free"] >= cost["cpu"]
                enough_ram = (hw["ram_free"] - cost["ram"]) >= SAFE_RAM_BUFFER_GB
                
                # Kiểm tra VRAM đồ họa nếu chạy chế độ GPU
                enough_vram = True
                if task.mode == "GPU" and cost["vram"] > 0:
                    enough_vram = (hw["vram_free"] - cost["vram"]) >= SAFE_VRAM_BUFFER_GB
                
                # Tránh nghẽn I/O ổ đĩa NVMe
                enough_io = (self.io_write_usage + cost.get("io_write", 0.0)) <= MAX_NVME_WRITE_MBPS

                if enough_cpu and enough_ram and enough_vram and enough_io:
                    # Kích hoạt thực thi
                    task.state = TaskState.RUNNING
                    self.running_tasks.append(task)
                    
                    # Trừ tài nguyên giả định trong vòng lặp này
                    hw["cpu_free"] -= cost["cpu"]
                    hw["ram_free"] -= cost["ram"]
                    if task.mode == "GPU":
                        hw["vram_free"] -= cost["vram"]
                    self.io_write_usage += cost.get("io_write", 0.0)
                    
                    print(f"🚀 [LAUNCH] Thực thi '{task.node_id}' ({task.stage_name}) [{task.mode} Mode]. Tiêu hao: CPU {cost['cpu']}%, RAM {cost['ram']}GB, VRAM {cost['vram']}GB")
                else:
                    deferred.append(task)
                    reasons = []
                    if not enough_cpu: reasons.append("CPU")
                    if not enough_ram: reasons.append("RAM_OOM_Limit")
                    if not enough_vram: reasons.append("VRAM_OOM_Limit")
                    if not enough_io: reasons.append("NVMe_IO_Throttled")
                    print(f"⏳ [HOLD] Tác vụ '{task.node_id}' bị hoãn lại do: {', '.join(reasons)}")

            self.ready_queue = deferred

            # 5. Mô phỏng chạy tiến trình con bất đồng bộ hoàn thành
            time.sleep(1.5)
            
            completed_list = []
            for t in self.running_tasks:
                # Giả lập hoàn thành ngẫu nhiên, hoặc mô phỏng lỗi GPU để kích hoạt Fallback
                is_failed = False
                if t.node_id == "T2" and t.mode == "GPU" and t.retries == 0:
                    is_failed = True # Giả lập lỗi CUDA OOM để kiểm tra khả năng phục hồi tự động
                
                if is_failed:
                    completed_list.append(t)
                    self.io_write_usage -= t.get_current_cost().get("io_write", 0.0)
                    self.handle_task_failure(t, "CUDA out of memory error (Simulated GPU Crash)")
                else:
                    t.state = TaskState.COMPLETED
                    completed_list.append(t)
                    self.io_write_usage -= t.get_current_cost().get("io_write", 0.0)
                    print(f"✅ [SUCCESS] Tác vụ '{t.node_id}' hoàn thành mỹ mãn.")
                    
                    # Cập nhật số bậc vào cho các Node con
                    for child in self.nodes.values():
                        if t.node_id in child.dependencies:
                            child.in_degree -= 1
            
            for t in completed_list:
                if t in self.running_tasks:
                    self.running_tasks.remove(t)
            
            # Ghi vết checkpoint an toàn nguyên tử
            self.trigger_atomic_checkpoint()


# --- CHẠY THỬ NGHIỆM THUẬT TOÁN ---
if __name__ == "__main__":
    # 1. Thử nghiệm Module 1: Phân rã tệp dài theo Silent-Edge Alignment
    mock_speech_words = [
        {"start": 0.0, "end": 10.0, "word": "Chào"},
        {"start": 10.0, "end": 20.0, "word": "mừng"},
        {"start": 20.0, "end": 35.0, "word": "bạn"}, # Gap 1.5s
        {"start": 36.5, "end": 42.0, "word": "đã"},
        {"start": 42.0, "end": 48.0, "word": "quay"},
        {"start": 48.0, "end": 50.0, "word": "lại"}, # Gap 2.5s
        {"start": 52.5, "end": 65.0, "word": "với"},
        {"start": 65.0, "end": 78.0, "word": "CreatorOS"},
        {"start": 78.0, "end": 90.0, "word": "Desktop"}
    ]
    
    print("\n[+] Chạy thử nghiệm phân rã video Silent-Edge (Mục tiêu 45s/phân đoạn):")
    splits = SilentEdgeSegmenter.find_optimal_splits(mock_speech_words, target_duration_sec=45.0, min_duration_sec=30.0, max_duration_sec=60.0)
    for idx, s in enumerate(splits):
        print(f"    -> Phân đoạn #{idx+1}: {s[0]}s đến {s[1]}s (Từ từ chỉ số {s[2]} -> {s[3]})")

    # 2. Thử nghiệm Module 2,3,4: Điều phối DAG, Ưu tiên động & CPU Fallback
    scheduler = AdaptiveDAGScheduler()
    
    # Định nghĩa cấu trúc DAG tác vụ phức tạp
    # ID, Tên Stage, Chi phí GPU, Chi phí CPU Fallback, Nút cha, Độ ưu tiên
    scheduler.register_node(AdvancedTaskNode("T1", "Download_Podcast", {"cpu": 10, "ram": 0.5, "vram": 0.0, "io_write": 45.0}, {"cpu": 10, "ram": 0.5, "vram": 0.0, "io_write": 45.0}, [], priority=3))
    scheduler.register_node(AdvancedTaskNode("T2", "Demucs_Vocal_Sep", {"cpu": 35, "ram": 2.5, "vram": 4.5, "io_write": 80.0}, {"cpu": 60, "ram": 4.0, "vram": 0.0, "io_write": 30.0}, ["T1"], priority=2))
    scheduler.register_node(AdvancedTaskNode("T3", "Whisper_AI_Sub",   {"cpu": 25, "ram": 2.0, "vram": 3.0, "io_write": 10.0}, {"cpu": 50, "ram": 3.0, "vram": 0.0, "io_write": 5.0}, ["T2"], priority=1))
    scheduler.register_node(AdvancedTaskNode("T4", "FFmpeg_GPU_Render", {"cpu": 45, "ram": 1.5, "vram": 3.5, "io_write": 90.0}, {"cpu": 90, "ram": 2.0, "vram": 0.0, "io_write": 25.0}, ["T3"], priority=4))

    # Chạy vòng lặp điều phối mô phỏng
    scheduler.orchestrate()
