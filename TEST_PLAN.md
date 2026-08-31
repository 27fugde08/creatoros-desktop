# 🧪 KẾ HOẠCH KIỂM THỬ TOÀN DIỆN (CREATOROS QA TEST PLAN)
### Enterprise Local Desktop Workstation (Electron + WebSocket JSON-RPC + Python Standalone Core)

---

## 🎯 1. TỔNG QUAN CHIẾN LƯỢC KIỂM THỬ (TEST STRATEGY)

Kế hoạch kiểm thử này được thiết kế theo tiêu chuẩn **Zero-Trust Local Workstation Testing**, bảo đảm ứng dụng hoạt động ổn định trên máy tính độc lập (Air-Gapped), tự phục hồi sau sự cố nguồn điện/ép tắt ứng dụng (Crash Resilience), và bảo vệ tài nguyên phần cứng GPU 6GB VRAM không bao giờ rơi vào trạng thái Out-Of-Memory (OOM).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CREATOROS ENTERPRISE TEST PYRAMID                    │
├─────────────────────────────────────────────────────────────────────────┤
│ [1] AIR-GAPPED OFFLINE INTEGRITY  : 100% Local Inference & Rendering    │
│ [2] CRASH RESILIENCE & CHECKPOINT : SQLite ACID Auto-Resume mid-pipeline│
│ [3] HARDWARE GOVERNOR & OOM STRESS: VRAM Throttling at 80-85% threshold │
│ [4] JSON-RPC 2.0 IPC PERFORMANCE  : High-throughput log stress (<2ms)   │
│ [5] MASTER DAG WORKFLOW TOPOLOGY  : Cyclic dependency check & Validation│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 2. MA TRẬN TEST CASES CHI TIẾT (COMPREHENSIVE TEST MATRIX)

### 2.1. Nhóm 1: Air-Gapped & Offline Integrity Testing (Kiểm Thử Ngoại Tuyến)

| ID | Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-OFF-01** | Khởi động trong môi trường Air-Gapped | Tắt Wi-Fi / Ngắt Ethernet Adapter | 1. Khởi chạy Electron App.<br>2. Kiểm tra log khởi tạo backend. | Ứng dụng khởi động trong < 2.5s, không có lỗi `ECONNREFUSED` hay cố gắng kết nối telemetry từ xa. | **CRITICAL** |
| **TC-OFF-02** | Local Neural Voice Studio (Edge/Local TTS) | Offline Mode | 1. Nhập kịch bản tiếng Việt.<br>2. Chọn giọng Nam Minh.<br>3. Bấm Generate Audio. | Sử dụng voice cache hoặc local synthesis, xuất tệp `.wav` kèm BGM không phụ thuộc cloud. | **HIGH** |
| **TC-OFF-03** | Local Vector RAG Semantic Search | Offline Mode | 1. Nạp transcript 5000 từ.<br>2. Gõ truy vấn tìm kiếm Hook. | Trả về Top-K phân đoạn bằng thuật toán TF-IDF / Cosine Similarity cục bộ 100%. | **HIGH** |
| **TC-OFF-04** | No-Strike GPU NVENC Video Render | Offline Mode | 1. Chọn video nguồn cục bộ.<br>2. Bật đổi MD5 + Color Shift.<br>3. Render 1080x1920. | FFmpeg NVENC render thành công với tốc độ >80fps, mã hash SHA256 thay đổi hoàn toàn. | **CRITICAL** |

---

### 2.2. Nhóm 2: Resiliency & SQLite Checkpoint Auto-Resume (Khôi Phục Sự Cố)

| ID | Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RES-01** | Force Kill giữa chặng Demucs Stem Isolation | Pipeline đang chạy Stage 2 (Demucs) | 1. Bật Task Manager / gửi `SIGKILL`.<br>2. Ép tắt `creatoros_core.exe`.<br>3. Khởi động lại ứng dụng. | Stage 1 (Download) vẫn giữ nguyên trạng thái `COMPLETED` trong SQLite; Pipeline hiển thị nút "Auto-Resume". | **CRITICAL** |
| **TC-RES-02** | Auto-Resume tiếp tục từ Stage 2 không làm lại Stage 1 | Sau khi thực hiện TC-RES-01 | 1. Bấm nút "Tiếp Tục Chạy (Resume)".<br>2. Quan sát log WebSocket. | Ứng dụng đọc `output_artifacts_json` của Stage 1, bắt đầu chạy ngay Stage 2, không tải lại video. | **CRITICAL** |
| **TC-RES-03** | Rollback an toàn khi tệp Artifact bị xóa thủ công | Xóa tệp video temp trong ổ cứng | 1. Xóa tệp `temp/source.mp4`.<br>2. Bấm Auto-Resume. | State Manager phát hiện missing artifact, kích hoạt Self-Healing tự động chạy lại Stage 1 an toàn. | **HIGH** |
| **TC-RES-04** | SQLite WAL Concurrency & Lock Stress | 10 luồng ghi đồng thời | Gửi 500 requests cập nhật trạng thái song song qua JSON-RPC. | Không xuất hiện lỗi `sqlite3.OperationalError: database is locked`, 100% giao dịch ACID thành công. | **HIGH** |

---

### 2.3. Nhóm 3: VRAM Governor & Resource Stress Testing (Chống Tràn OOM 6GB)

| ID | Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-OOM-01** | Ngưỡng cảnh báo VRAM 80% (Dynamic Throttling) | VRAM tăng đến 4800MB | 1. Bật đồng thời 2 luồng render 4K.<br>2. Quan sát telemetry bar. | Governor chuyển sang trạng thái `WARNING`, tự động delay tác vụ kế tiếp 1500ms và gọi GC. | **HIGH** |
| **TC-OOM-02** | Xả bộ nhớ khẩn cấp tại ngưỡng 85% (5200MB) | VRAM chạm 5200MB / 6000MB | 1. Bơm model PyTorch vào VRAM.<br>2. Theo dõi hàm `empty_vram()`. | Tự động kích hoạt `torch.cuda.empty_cache()` và `torch.cuda.ipc_collect()`, hạ VRAM xuống <70%. | **CRITICAL** |
| **TC-OOM-03** | Giới hạn số phiên NVENC Hardware Sessions | GPU GTX 1660 Super | Gửi liên tiếp 4 yêu cầu render FFmpeg NVENC đồng thời. | Governor chặn trần tối đa 2 sessions song song, đưa 2 task còn lại vào hàng đợi an toàn (Queue). | **CRITICAL** |
| **TC-OOM-04** | Dọn dẹp bộ nhớ đệm tạm thời trên ổ cứng NVMe | Cache NVMe > 5GB | Gọi RPC `governor.clean_cache(keep_checkpoints=True)`. | Giải phóng toàn bộ tệp tạm không sử dụng, giữ lại các tệp checkpoint artifact đang hoạt động. | **MEDIUM** |

---

### 2.4. Nhóm 4: Workflow Builder & JSON-RPC 2.0 IPC Stress Testing

| ID | Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-IPC-01** | Đo lường độ trễ phản hồi JSON-RPC (Ping/Metrics) | WebSocket đã kết nối | Gửi 100 RPC requests `system.ping` liên tục. | Độ trễ trung bình Round-Trip Time (RTT) $\le 2.0\text{ms}$. | **HIGH** |
| **TC-IPC-02** | Bơm tải Log cường độ cao (High-throughput Stream) | Render video dài | Gửi 10,000 dòng log FFmpeg trong 1 giây qua WebSocket. | Giao diện React hiển thị mượt mà 60fps (thông qua RAF batching), không crash bộ nhớ Electron. | **HIGH** |
| **TC-IPC-03** | Tự động tái kết nối WebSocket (Auto-Reconnect) | Ngắt kết nối socket tạm thời | Tắt tiến trình `py_ws_bridge.py` và khởi động lại. | Electron tự động thử lại sau 2.5s và kết nối thành công, đồng bộ lại trạng thái hiện tại. | **CRITICAL** |
| **TC-IPC-04** | Kiểm tra chu trình tuần hoàn DAG (Cyclic Dependency Check) | Workflow Editor | Tạo liên kết node A ➔ Node B ➔ Node A. | Hệ thống phát hiện đồ thị lặp chu trình, báo lỗi trực quan và chặn không cho thực thi. | **MEDIUM** |

---

## 🚀 3. HƯỚNG DẪN THỰC THI TEST SUITE TỰ ĐỘNG

Chạy toàn bộ bộ kiểm thử tự động bằng lệnh:
```bash
# Cài đặt pytest và các thư viện hỗ trợ
pip install pytest pytest-asyncio websockets psutil

# Chạy toàn bộ Test Suite với báo cáo chi tiết
pytest tests/ -v -s
```
