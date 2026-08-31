# 📘 TÀI LIỆU KỸ THUẬT & ĐẶC TẢ KIẾN TRÚC HỆ THỐNG CREATOROS v5.0
### CREATOROS Commercial Enterprise Video Workstation - Comprehensive Architecture & Technical Reference Manual

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc Đa Tầng Tự Trị (4-Tier Autonomous Architecture)](#1-tổng-quan-kiến-trúc-đa-tầng-tự-trị)
2. [Giao Thức WebSocket JSON-RPC 2.0 & Cơ Chế Auto-Reconnect (IPC Bridge)](#2-giao-thức-websocket-json-rpc-20--cơ-chế-auto-reconnect)
3. [Lược Đồ Cơ Sở Dữ Liệu SQLite WAL & Checkpoint ACID](#3-lược-đồ-cơ-sở-dữ-liệu-sqlite-wal--checkpoint-acid)
4. [Bộ Điều Phối Phần Cứng VRAM/RAM & Giám Sát NVMe (Hardware Governor)](#4-bộ-điều-phối-phần-cứng-vramram--giám-sát-nvme)
5. [Visual Workflow Builder, Local LLM Copilot & DAG Topological Sort](#5-visual-workflow-builder-local-llm-copilot--dag-topological-sort)
6. [Hệ Thống Phân Tán Cụm Mạng LAN (Master-Worker Rendering Engine)](#6-hệ-thống-phân-tán-cụm-mạng-lan-master-worker-rendering-engine)
7. [Local AI Lip-Sync Studio (ONNX / TensorRT / Wav2Lip)](#7-local-ai-lip-sync-studio-onnx--tensorrt--wav2lip)
8. [Hệ Thống DRM Bản Quyền Ngoại Tuyến & Hardware Fingerprinting](#8-hệ-thống-drm-bản-quyền-ngoại-tuyến--hardware-fingerprinting)
9. [Cơ Chế Tự Phục Hồi Lỗi (Agentic Self-Healing) & Danh Mục Mã Lỗi Toàn Cục](#9-cơ-chế-tự-phục-hồi-lỗi-agentic-self-healing--danh-mục-mã-lỗi-toàn-cục)
10. [Bảo Mật & Cập Nhật Tự Động An Toàn OTA (Secure Chunked Updater)](#10-bảo-mật--cập-nhật-tự-động-an-toàn-ota)
11. [Danh Mục REST API & WebSocket Realtime Catalog](#11-danh-mục-rest-api--websocket-realtime-catalog)
12. [Quy Trình DevOps, Build & Đóng Gói Windows Standalone](#12-quy-trình-devops-build--đóng-gói-windows-standalone)

---

## 1. TỔNG QUAN KIẾN TRÚC ĐA TẦNG TỰ TRỊ

CREATOROS Desktop v5.0 được xây dựng dựa trên kiến trúc **4 Tầng Tự Trị Phân Tán (4-Tier Autonomous Architecture)**, tối ưu hoá chuyên sâu cho môi trường Windows 10/11 x64 với cấu hình GPU tầm trung (NVIDIA GTX 1660 Super 6GB GDDR6 VRAM, RAM 16GB, ổ NVMe SSD):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TẦNG 1: TRÌNH DIỄN (UI LAYER)                    │
│   • React 18 SPA (Vite, TypeScript, Tailwind CSS, Lucide Icons)             │
│   • Visual Workflow Builder Canvas (Interactive DAG Nodes & SVG Wire Edges) │
│   • License Activation Modal, Database Explorer & Terminal Log Streamer     │
│   • Blueprint & Preset Manager (.creatoros Package System)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ IPC (Context Isolation / Preload Script)
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TẦNG 2: ĐIỀU PHỐI (ELECTRON MAIN / IPC)              │
│   • Node.js Backend Server (Express, Socket.IO, Sequelize / SQLite Pool)    │
│   • Electron Main Process (Quản lý BrowserWindow, UserData động, PATH Bin)  │
│   • Exponential Backoff Auto-Reconnect WS Client & Child Process Lifecycle  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ WebSocket TCP (ws://127.0.0.1:8765)
┌─────────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 3: MÁY CHỦ PYTHON CORE & JSON-RPC BRIDGE             │
│   • JSON-RPC 2.0 Server nội bộ (py_ws_bridge.py / creatoros_core.exe)       │
│   • Hardware Governor (Giám sát VRAM, RAM, CPU, Throttle NVENC)             │
│   • DAG Workflow Compiler (Kahn's Topo Sort & Cycle Rejection)              │
│   • State Manager & SQLite WAL Engine (Pipelines, Stages, Checkpoint Hash)  │
│   • Local LLM Intent Parser, Local Vector RAG & AI QC Agent                 │
│   • Agentic Self-Healing Doctor (Chẩn đoán lỗi FFmpeg / CUDA & Auto-Retry)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Binary Exec / Hardware NVENC / CUDA
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG 4: THỰC THI PHẦN CỨNG & MULTIMEDIA                  │
│   • FFmpeg Turing NVENC (H.264/HEVC Hardware Acceleration)                  │
│   • PyTorch / Demucs (Stem Audio Separation với GPU Memory Isolation)       │
│   • ONNX Runtime / TensorRT (Local Wav2Lip High-Performance Lip-Sync)       │
│   • Edge-TTS & Pydub (Neural Voice Synthesis & Auto-Ducking Sidechain)      │
│   • ADB Subsystem (Phone Farm Matrix Device Controller)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```
│   • Visual Workflow Builder Canvas (Interactive Nodes & Topological Graph)  │
│   • License Activation Center & OTA Update Modal Controller                 │
│   • Blueprint & Preset Explorer (.creatoros Package Manager)                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ IPC (Context Isolation / Preload)
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TẦNG 2: ĐIỀU PHỐI (ELECTRON MAIN / IPC)              │
│   • Node.js Backend Server (Express, Socket.IO, SQLite Pool)                │
│   • Quản lý cửa sổ BrowserWindow, nạp biến môi trường UserData động         │
│   • Quản lý vòng đời tiến trình con và chuyển tiếp WebSocket IPC            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ WebSocket TCP (ws://127.0.0.1:8765)
┌─────────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 3: MÁY CHỦ PYTHON CORE & JSON-RPC BRIDGE             │
│   • JSON-RPC 2.0 Server nội bộ (py_ws_bridge.py / creatoros_core.exe)       │
│   • DRM & Hardware Fingerprint Engine (Offline HMAC-SHA256 Licensing)       │
│   • DAG Workflow Compiler & Topological Execution Engine                    │
│   • State Manager & SQLite WAL Engine (Presets, Tasks, Checkpoints)         │
│   • Secure OTA Updater Engine (Chunked Download & Hash Verification)        │
│   • Hardware Governor & Local Vector RAG + AI QC Agent                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Binary Exec / Hardware NVENC / CUDA
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG 4: THỰC THI PHẦN CỨNG & MULTIMEDIA                  │
│   • FFmpeg NVENC (H.264/HEVC Hardware Acceleration với Turing NVENC)        │
│   • PyTorch / Demucs (Stem Audio Separation với GPU Memory Isolation)       │
│   • Edge-TTS & Pydub (Neural Voice Synthesis & Auto-Ducking)                │
│   • ADB Subsystem (Phone Farm Matrix Device Controller)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. HỆ THỐNG QUẢN LÝ BẢN QUYỀN NGOẠI TUYẾN & HARDWARE FINGERPRINTING

Hệ thống DRM trong CREATOROS (`hardware_fingerprint.py`) được thiết kế để kích hoạt và xác thực bản quyền vĩnh viễn hoặc theo kỳ **100% Offline**, không phụ thuộc vào máy chủ cấp phép từ xa.

### 2.1. Thuật toán tạo mã định danh phần cứng (Machine Fingerprint)
Hệ thống kết hợp 4 tham số phần cứng không thể thay đổi:
1. **CPU Serial / Processor ID**: Định danh vi xử lý.
2. **Primary Disk Serial Number / UUID**: Mã sê-ri ổ đĩa hệ thống.
3. **Primary Network Card MAC Address**: Địa chỉ vật lý card mạng.
4. **Windows Machine GUID**: Mã định danh bản quyền Windows (`HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\MachineGuid`).

Chuỗi sau khi tổng hợp được băm bằng thuật toán **SHA-256**, lấy 16 ký tự phân chia theo cấu trúc:
$$\text{Fingerprint} = \text{"CR-" } + S_{0..3} + \text{"-"} + S_{4..7} + \text{"-"} + S_{8..11} + \text{"-"} + S_{12..15}$$
*Ví dụ*: `CR-A93F-4B21-9CE3-77F1`

### 2.2. Cấu trúc License Key & Xác thực HMAC-SHA256
Mỗi License Key thương mại có định dạng 5 khối:
$$\text{LicenseKey} = \text{CR-\{TIER\}-\{HASH\_FP\}-\{EXPIRY\}-\{SIGNATURE\}}$$
- **TIER**: Phân cấp gói (`COMMUNITY`, `PRO_V48`, `ENTERPRISE`, `LIFETIME_STUDIO`).
- **HASH_FP**: 8 ký tự rút gọn từ Hardware Fingerprint của máy người dùng.
- **EXPIRY**: Ngày hết hạn (`LIFETIME` hoặc định dạng Epoch timestamp).
- **SIGNATURE**: Chữ ký xác thực bí mật tạo bởi HMAC-SHA256 với Secret Salt nội bộ.

### 2.3. Ma trận phân quyền tính năng (Feature Gating Matrix)
| Tính Năng Hệ Thống | Gói COMMUNITY | Gói PRO_V48 | Gói ENTERPRISE |
| :--- | :---: | :---: | :---: |
| **Visual DAG Workflow** | Giới hạn 3 Nodes | **Không giới hạn** | **Không giới hạn** |
| **Luồng NVENC Đồng Thời** | 1 Luồng | **2 Luồng** | **3 Luồng** |
| **Demucs Vocal Split GPU** | ❌ (Chạy CPU) | ✅ (GPU VRAM Isolate) | ✅ (GPU VRAM Isolate) |
| **Offline Voice Cloning** | ❌ | ✅ | ✅ |
| **No-Strike Matrix Video** | Cơ bản (720p) | **Nâng cao (1080p/2K)** | **Nâng cao (4K/60fps)** |
| **Phone Farm Automation** | ❌ | 5 Thiết bị | **Không giới hạn** |
| **OTA Cập Nhật Nhanh** | ❌ | ✅ | ✅ (Ưu tiên kênh Alpha) |

---

## 3. VISUAL WORKFLOW BUILDER & DAG COMPILER ENGINE

Module `workflow_dag_compiler.py` cùng giao diện `WorkflowBuilderTool.tsx` mang đến khả năng thiết kế kịch bản tự động hóa xử lý video bằng kéo thả node tương tác.

### 3.1. Phân loại Nodes hỗ trợ
1. **Input & Ingestion**: `INPUT_VIDEO`, `TIKTOK_SCRAPE`, `YOUTUBE_FETCH`.
2. **Audio Processing**: `DEMUCS_ISOLATION`, `WHISPER_TRANSCRIBE`, `LOCAL_VOICE_CLONE`, `BGM_DUCKING`.
3. **AI Generation & QC**: `GEMINI_RECAP_WRITER`, `LOCAL_RAG_HOOK`, `QC_VALIDATION`.
4. **Rendering & Export**: `RENDER_NOSTRIKE`, `SUBTITLE_BURN_IN`, `THUMBNAIL_GENERATOR`.
5. **Distribution**: `FB_REELS_DISPATCH`, `TIKTOK_DISPATCH`, `EXPORT_LOCAL_MP4`.

### 3.2. Thuật toán Kahn's Topological Sorting & Phát hiện vòng lặp
Bộ biên dịch tiến hành phân tích danh sách Nodes và Edges:
1. **Phát hiện chu trình (*Cycle Rejection*)**: Nếu tồn tại vòng lặp phụ thuộc lẩn quẩn $A \to B \to C \to A$, hệ thống sẽ từ chối biên dịch và trả về mã lỗi `ERR_DAG_CYCLIC_DEPENDENCY`.
2. **Phân tầng thực thi (*Parallel Execution Stages*)**: Các node độc lập được gom vào cùng một Stage để xử lý đồng thời nếu tài nguyên VRAM/RAM cho phép.

```
Stage 1: [Input Video Ingest]
            │
            ├────────────────────────────────────────┐
            ▼                                        ▼
Stage 2: [Demucs Stem Isolation]           [Whisper Subtitle Transcribe]
            │ (Vocal + BGM)                          │ (VTT/SRT Timeline)
            └───────────────────┬────────────────────┘
                                ▼
Stage 3:               [AI Script QC Agent]
                                │ (Đạt chuẩn Fair-Use)
                                ▼
Stage 4:           [No-Strike NVENC 2K Render]
                                │
                                ▼
Stage 5:           [Phone Farm Multi-Publish]
```

---

## 4. HỆ THỐNG QUẢN LÝ BLUEPRINT & PRESET CỤC BỘ

Lưu trữ và đồng bộ toàn bộ công thức làm video, thông số No-Strike, bộ lọc màu, và quy trình Workflow qua module `BlueprintPresetTool.tsx` và `state_manager.py`.

### 4.1. Cấu trúc lưu trữ SQLite WAL
Bảng `user_presets` lưu trữ định dạng có cấu trúc:
- `id`: Định danh duy nhất (chuỗi slug hoặc UUID).
- `name`: Tên hiển thị của Preset/Blueprint.
- `category`: Phân loại (`nostrike`, `voice`, `workflow`, `social`, `qc`, `general`).
- `config`: Chuỗi JSON mã hóa toàn bộ tham số kỹ thuật.
- `tags`: Danh sách từ khóa tìm kiếm nhanh.
- `is_favorite`: Đánh dấu ghim lên đầu thanh công cụ.

### 4.2. Định dạng xuất nhập file `.creatoros`
Khi chia sẻ Preset/Workflow ra ngoài, hệ thống xuất thành tệp JSON mã hóa đóng gói:
```json
{
  "format": "creatoros-blueprint-v1",
  "exported_at": 1772189708,
  "creator_version": "4.8.0-Enterprise",
  "payload": {
    "name": "Facebook Reels 4:5 Master NVENC",
    "category": "nostrike",
    "config": {
      "aspect_ratio": "4:5",
      "bitrate": "12000k",
      "color_grading": "DYNAMIC_WARM",
      "pitch_shift_cents": 15
    }
  },
  "signature": "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"
}
```

---

## 5. CƠ CHẾ CẬP NHẬT TỰ ĐỘNG AN TOÀN OTA

Module `ota_updater.py` và giao diện `OtaUpdateModal.tsx` cung cấp cơ chế cập nhật không làm gián đoạn người dùng:
1. **Kiểm tra phiên bản (*Manifest Query*)**: Đọc tệp cập nhật `latest.yml` để so sánh với `current_version`.
2. **Tải phân đoạn (*Chunked Download*)**: Tải file cài đặt `.exe` theo từng khối 64KB, tính toán chính xác % hoàn thành, tốc độ truyền dẫn MB/s và thời gian ước tính còn lại (ETA).
3. **Kiểm tra tính toàn vẹn SHA-256**: Sau khi tải xong, tệp tạm được đọc nhị phân và băm SHA-256. Nếu mã băm không khớp với chữ ký số từ server, tệp bị hủy ngay lập tức để chống giả mạo hoặc lỗi hỏng tệp.
4. **Khởi động lại an toàn (*Hot Restart*)**: Tự động giải phóng SQLite locks và khởi chạy bản cập nhật.

---

## 6. GIAO THỨC GIAO TIẾP WEBSOCKET JSON-RPC 2.0

### 6.1. Cấu trúc thông điệp (Message Framing)
Mọi tương tác giữa Electron Main Process và Python Core Backend tuân thủ tiêu chuẩn **JSON-RPC 2.0**:

- **Request Payload:**
```json
{
  "jsonrpc": "2.0",
  "method": "state.complete_stage",
  "params": {
    "pipeline_id": "dag_1710000000",
    "stage_name": "1_DOWNLOAD_INGEST",
    "stage_index": 0,
    "total_stages": 6,
    "output_artifacts": {
      "video_path": "temp/source_video.mp4",
      "duration_sec": 120.5
    },
    "execution_time_ms": 1450
  },
  "id": 101
}
```

- **Response Payload:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "pipeline_id": "dag_1710000000",
    "stage_name": "1_DOWNLOAD_INGEST",
    "status": "COMPLETED",
    "progress_percent": 16,
    "checkpoint_hash": "a7b9c4d2e8f1"
  },
  "id": 101
}
```

### 6.2. Danh mục RPC Methods đầy đủ trong phiên bản v4.8
| Namespace | Method Name | Mô Tả Chức Năng |
| :--- | :--- | :--- |
| **`system`** | `system.get_metrics` | Lấy dữ liệu VRAM, RAM, CPU, GPU Temp thời gian thực. |
| **`system`** | `system.ping` | Kiểm tra độ trễ IPC (yêu cầu `< 5ms`). |
| **`drm`** | `drm.get_fingerprint` | Lấy thông tin mã máy và chữ ký phần cứng. |
| **`drm`** | `drm.activate_license` | Kích hoạt License Key ngoại tuyến và mở khóa tính năng. |
| **`workflow`** | `workflow.compile_dag` | Kiểm tra tính hợp lệ và biên dịch đồ thị DAG. |
| **`workflow`** | `workflow.execute_dag` | Chạy quy trình Workflow với streaming tiến trình. |
| **`presets`** | `presets.list_all` | Lấy toàn bộ danh sách Presets từ SQLite. |
| **`presets`** | `presets.save` | Thêm mới hoặc cập nhật cấu hình Preset. |
| **`ota`** | `ota.check_update` | Kiểm tra phiên bản cập nhật mới nhất. |
| **`ota`** | `ota.start_download` | Bắt đầu tải tệp cài đặt mới. |
| **`state`** | `state.get_checkpoint` | Truy vấn điểm phục hồi khi ứng dụng khởi động lại. |

---

## 7. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU SQLITE & CƠ CHẾ CHECKPOINT ACID

CREATOROS sử dụng cơ sở dữ liệu SQLite cấu hình chế độ **Write-Ahead Logging (WAL)** để đảm bảo tốc độ đọc ghi đồng thời cao mà không xảy ra tình trạng khóa tệp:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

### 7.1. Bảng `license_activation` (Bản quyền & DRM)
```sql
CREATE TABLE IF NOT EXISTS license_activation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL,
    owner_name TEXT,
    fingerprint_bound TEXT NOT NULL,
    issued_at INTEGER NOT NULL,
    expires_at INTEGER DEFAULT 0,
    features_json TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);
```

### 7.2. Bảng `user_presets` (Presets & Blueprints)
```sql
CREATE TABLE IF NOT EXISTS user_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    config_json TEXT NOT NULL,
    tags_json TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 7.3. Bảng `pipeline_checkpoints` (Phục hồi tiến trình)
```sql
CREATE TABLE IF NOT EXISTS pipeline_checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_index INTEGER NOT NULL,
    total_stages INTEGER NOT NULL,
    status TEXT NOT NULL,
    artifacts_json TEXT,
    checkpoint_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(pipeline_id, stage_name)
);
```

---

## 8. BỘ ĐIỀU PHỐI VRAM & GIÁM SÁT PHẦN CỨNG

Để đảm bảo card đồ họa **GTX 1660 Super (6GB VRAM)** hoạt động bền bỉ, module `hardware_governor.py` thực hiện phân luồng ngưỡng cảnh báo 3 cấp độ:

```
                  VRAM < 70% (Dưới 4200MB)
                             │
                  [Chế độ NORMAL OPERATION]
                  • Chạy song song 2 luồng NVENC
                  • Demucs GPU batch_size = 4
                             │
                             ▼
                  VRAM >= 70% (4200MB - 5100MB)
                             │
                  [Chế độ THROTTLED ENCODE]
                  • Giảm xuống 1 luồng render NVENC
                  • Gọi torch.cuda.empty_cache()
                             │
                             ▼
                  VRAM >= 85% (Vượt quá 5100MB)
                             │
                  [Chế độ CRITICAL SAFETY SHIFT]
                  • Tạm dừng hàng đợi render
                  • Đẩy Whisper sang RAM hệ thống (CPU)
                  • Dọn dẹp tệp rác NVMe Cache
```

---

## 9. AI QUALITY CONTROL (QC) AGENT & RAG SCRIPT INTELLIGENCE

Module `qc_agent.py` và `local_rag_engine.py` bảo đảm chất lượng nội dung trước khi render:
- **Công thức chấm điểm QC Score:**
$$\text{QC\_Score} = (\text{Narrative\_Score} \times 0.35) + (\text{FairUse\_Score} \times 0.40) + (\text{AudioSync\_Score} \times 0.25)$$
- **Local RAG Vector Engine**: Truy xuất các mẫu Hook mở đầu, cấu trúc kịch bản triệu view từ cơ sở dữ liệu vector cục bộ bằng thuật toán TF-IDF / Cosine Similarity mà không cần gửi dữ liệu ra ngoài Internet.

---

## 10. TỐI ƯU HÓA RENDER FFMPEG NO-STRIKE & MATRIX PIXEL SHIFT

Dòng lệnh FFmpeg được tinh chỉnh chuyên biệt cho bộ mã hóa phần cứng Turing NVENC:

```bash
ffmpeg -y -hwaccel cuda -hwaccel_output_format cuda \
  -ss 00:00:10 -to 00:00:45 -i source.mp4 \
  -filter_complex "[0:v]hflip,eq=contrast=1.05:brightness=0.02:saturation=1.08,noise=alls=2:allf=t+u,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v]" \
  -map "[v]" -c:v h264_nvenc -preset p4 -tune hq -b:v 8M -maxrate 10M -bufsize 16M \
  -c:a aac -b:a 192k -max_muxing_queue_size 9999 \
  output_nostrike.mp4
```

### Các lớp biến đổi chống quét bản quyền:
1. **Biến đổi Ma Trận Điểm Ảnh (Pixel Matrix Shift)**: Lật ngang khung hình (`hflip`), hiệu chỉnh gamma màu động (`dynamic contrast/saturation`), chèn nhiễu hạt vi mô vô hình (`micro-noise`).
2. **Xóa & Tái Tạo Metadata**: Loại bỏ hoàn toàn dấu vết thiết bị quay gốc, thay thế bằng siêu dữ liệu chuẩn hóa của thiết bị di động hiện đại.
3. **Biến Đổi Tần Số Âm Thanh (Audio Pitch Shift)**: Dịch chuyển cao độ âm thanh từ 10-25 cents kết hợp Auto-Ducking nhạc nền để vượt qua bộ lọc âm thanh Content ID.

---

## 11. CẤU HÌNH DEVOPS & ĐÓNG GÓI PHÂN PHỐI

Quy trình đóng gói phần mềm Windows hoàn chỉnh tự động thông qua kịch bản `build-windows.bat`:

1. **Giai đoạn 1 (PyInstaller)**: Biên dịch toàn bộ mã nguồn Python Core thành `dist_py/creatoros_core.exe`.
2. **Giai đoạn 2 (Vite & ESBuild)**: Đóng gói giao diện React thành các tệp tĩnh trong `dist/` và máy chủ Node.js thành `dist/server.cjs`.
3. **Giai đoạn 3 (Electron Builder)**: Đóng gói toàn bộ tài nguyên vào bộ cài đặt NSIS tiêu chuẩn:
   - `release/CreatorOS Desktop Setup 4.8.0.exe` (Bộ cài đặt tự động).
   - `release/CreatorOS-Portable-4.8.0.exe` (Bản chạy ngay không cần cài đặt).

---

## 12. CƠ CHẾ TỰ PHỤC HỒI LỖI & DANH MỤC MÃ LỖI

Module `agentic_self_healing.py` tự động xử lý các tình huống ngoại lệ phần cứng:

| Mã Lỗi | Nguyên Nhân Gốc | Hành Động Tự Phục Hồi (Self-Healing) |
| :--- | :--- | :--- |
| **`ERR_CUDA_OOM`** | Tràn bộ nhớ VRAM khi chạy tác vụ nặng | Gọi `torch.cuda.empty_cache()`, hạ batch size về 1, fallback sang CPU RAM. |
| **`ERR_NVENC_SESSION`** | Vượt quá 2 phiên mã hóa NVENC đồng thời | Tự động đưa tác vụ mới vào hàng đợi chờ, giải phóng session cũ sau 2 giây. |
| **`ERR_DAG_CYCLIC`** | Đồ thị Workflow bị lặp vòng vô tận | Chặn biên dịch, gửi thông báo chỉ rõ Node gây xung đột trên giao diện Canvas. |
| **`ERR_LICENSE_INVALID`** | Sai Hardware Fingerprint hoặc hết hạn | Giáng cấp về gói `COMMUNITY` và khóa các tính năng nâng cao. |
| **`ERR_OTA_HASH_MISMATCH`** | Gói cập nhật bị lỗi tải hoặc sai mã SHA256 | Xóa tệp tạm tải hỏng, khởi tạo lại quy trình tải phân đoạn. |
| **`ERR_DB_LOCKED`** | Tranh chấp ghi SQLite đồng thời | Chuyển sang cơ chế `WAL Mode` với thời gian chờ bận `busy_timeout = 5000ms`. |

---

## 13. MODULE CLI TẢI XUỐNG HÀNG LOẠT & TERMINAL RICH ENGINE

Module độc lập `run_downloader.py` cung cấp giải pháp xử lý dòng lệnh (CLI) tải hàng loạt video từ TikTok, Douyin, YouTube, Facebook Reels và Instagram:

- **Kiến Trúc Đa Luồng**: Sử dụng `ThreadPoolExecutor` quản lý hàng đợi song song với mức tùy chỉnh `--workers`.
- **Giao Diện Terminal Trực Quan**: Tích hợp `rich` hiển thị thanh tiến độ phần trăm, tốc độ tải (MB/s), thời gian ước tính (ETA) và bảng báo cáo tổng kết.
- **SQLite Checkpoint**: Ghi nhận trực tiếp dữ liệu vào bảng `pipelines` và `pipeline_stages` trong cơ sở dữ liệu `creatoros_state.db`.
- **Dừng Khẩn Cấp An Toàn (Graceful Shutdown)**: Bắt sự kiện `SIGINT` (`Ctrl + C`) để hủy luồng và dọn sạch các tệp tạm `.part`, `.ytdl` trước khi thoát.

Cú pháp thực thi:
```bash
python3 run_downloader.py "https://www.tiktok.com/@user/video/123" "https://www.youtube.com/shorts/abc" -w 3 -o ./output/downloads
```

---

<div align="center">
  <b>CREATOROS Commercial Architecture Manual</b> — <i>Phiên bản tài liệu kỹ thuật v4.8 Enterprise (Cập nhật 2026).</i>
</div>
