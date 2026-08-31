# 🚀 CREATOROS Desktop Studio v5.0 - Enterprise AI Video Workstation

<div align="center">

![CreatorOS Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

**Hệ điều hành sáng tạo nội dung tự động hóa chuẩn Enterprise dành cho Content Creator, Studio MCN, Re-up Automation, Youtuber & TikToker.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-yellow.svg?style=flat-square&logo=python)](https://www.python.org/)
[![Electron](https://img.shields.io/badge/Electron-28.0%2B-47848F.svg?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-NVENC%20CUDA-green.svg?style=flat-square&logo=ffmpeg)](https://ffmpeg.org/)
[![SQLite](https://img.shields.io/badge/SQLite3-ACID%20WAL%20Checkpoints-003B57.svg?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Pytest](https://img.shields.io/badge/Pytest-26%2F26%20Passed-brightgreen.svg?style=flat-square)](https://pytest.org/)
[![License](https://img.shields.io/badge/DRM-Offline%20Hardware%20Bound-purple.svg?style=flat-square)]()

</div>

---

## 📖 Mục Lục
1. [Tổng Quan Dự Án & Bản Phát Hành v5.0](#-tổng-quan-dự-án--bản-phát-hành-v50)
2. [Các Tính Năng Trọng Tâm (Core Features)](#-các-tính-năng-trọng-tâm-core-features)
3. [Kiến Trúc Hệ Thống 4 Tầng Tự Trị](#-kiến-trúc-hệ-thống-4-tầng-tự-trị)
4. [Bộ Công Cụ Sáng Tạo & Tự Động Hóa (17 Modules)](#-bộ-công-cụ-sáng-tạo--tự-động-hóa-17-modules)
5. [Cấu Hình Phần Cứng Khuyến Nghị](#-cấu-hình-phần-cứng-khuyến-nghị)
6. [Hướng Dẫn Cài Đặt & Khởi Chạy Môi Trường Phát Triển](#-hướng-dẫn-cài-đặt--khởi-chạy-môi-trường-phát-triển)
7. [Quy Trình Build & Đóng Gói Ứng Dụng Windows Standalone (.exe)](#-quy-trình-build--đóng-gói-ứng-dụng-windows-standalone-exe)
8. [Kiểm Thử & Đảm Bảo Chất Lượng (Test Suite)](#-kiểm-thử--đảm-bảo-chất-lượng-test-suite)
9. [Tài Liệu Hướng Dẫn Liên Quan](#-tài-liệu-hướng-dẫn-liên-quan)

---

## 🌟 Tổng Quan Dự Án & Bản Phát Hành v5.0

**CREATOROS Desktop Studio v5.0** là nền tảng Desktop Workstation chuyên nghiệp tích hợp trí tuệ nhân tạo (AI) toàn diện, kết hợp giữa giao diện người dùng thời gian thực bằng **React 18 + Vite + Tailwind CSS + Electron** với lõi backend phân tán **Node.js Express (Cổng 3000)** và máy chủ **Python JSON-RPC 2.0 WebSocket IPC Bridge (Cổng 8765)**.

Dự án được tối ưu hóa đặc biệt cho phần cứng máy trạm tiêu chuẩn (CPU 6-8 nhân, RAM 16GB, GPU NVIDIA GTX 1660 Super 6GB VRAM hoặc RTX 30/40 series) với tiêu chí **100% Offline-First / Hybrid Cloud**, vận hành trơn tru, không rò rỉ bộ nhớ, chống tràn VRAM (OOM) và tự động phục hồi sự cố thông minh (*Agentic Self-Healing*).

---

## ⚡ Các Tính Năng Trọng Tâm (Core Features)

1. **🎨 Visual Workflow Builder & Local LLM Agent**:
   - Trực quan hóa toàn bộ chuỗi sản xuất video qua Canvas kéo thả node có định hướng (DAG).
   - Tích hợp thuật toán sắp xếp tô-pô **Kahn's Topological Sort** và từ chối chu trình lặp vô tận (*Cycle Rejection*).
   - Tích hợp Local LLM Prompt Parser chuyển đổi câu lệnh tự nhiên sang cấu trúc DAG chỉ trong 1 giây.
2. **🛡️ VRAM Hardware Governor & Giám Sát Phần Cứng**:
   - Vòng lặp telemetry thời gian thực (1.5s/chu kỳ) theo dõi VRAM, RAM, CPU, nhiệt độ GPU.
   - Cơ chế 3 cấp độ cảnh báo (`SAFE`, `WARNING`, `CRITICAL`), tự động kích hoạt `torch.cuda.empty_cache()` và `gc.collect()` khi VRAM chạm ngưỡng $\ge 85\%$ (5200MB).
   - Điều tiết hàng đợi NVENC tối đa 2 phiên đồng thời nhằm bảo vệ GPU NVIDIA.
3. **♻️ Safe Checkpointing & Auto-Resume**:
   - Lưu vết trạng thái từng bước của Pipeline vào SQLite với chế độ Write-Ahead Logging (WAL).
   - Tạo mã SHA-256 Checkpoint Hash độc bản cho mỗi bước, hỗ trợ phục hồi ngay tại bước dở dang (`--resume`) mà không cần render lại từ đầu.
4. **👄 Local AI Lip-Sync Studio (ONNX / TensorRT / Wav2Lip)**:
   - Đồng bộ khẩu hình môi nhân vật theo tệp giọng nói offline qua TensorRT/CUDA ONNX Inference với tốc độ 45 - 70 FPS.
5. **🌐 Master-Worker LAN Cluster Render**:
   - Chia nhỏ video dài thành các phân đoạn 30s và phân phối song song sang các máy trạm trong mạng nội bộ (LAN).
   - Nối video không mất dữ liệu bằng `ffmpeg -f concat -c copy` với tốc độ tức thì.
6. **🔐 DRM License Offline & Hardware Fingerprinting**:
   - Khóa bản quyền cố định theo mã định danh phần cứng máy tính (CPU ID, Disk UUID, MAC Address, Machine GUID).
   - Xác thực License Key ngoại tuyến 100% bằng chữ ký mật mã HMAC-SHA256.

---

## 🏛️ Kiến Trúc Hệ Thống 4 Tầng Tự Trị

```
┌────────────────────────────────────────────────────────────────────────┐
│               TẦNG 1: ELECTRON DESKTOP UI (React 18 + Vite)           │
│   [Visual Workflow]  [Blueprint Presets]  [Master DAG]  [LipSync ONNX] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ WebSocket IPC (ws://127.0.0.1:8765)
                                    ▼ (JSON-RPC 2.0 / <2ms Latency)
┌────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 2 & 3: BACKEND & PYTHON IPC BRIDGE              │
│    • Node.js Express / Socket.IO Server (http://127.0.0.1:3000)        │
│    • Python JSON-RPC 2.0 WebSocket Bridge (ws://127.0.0.1:8765)        │
│    • Exponential Backoff Auto-Reconnect & Port Unlocking Engine        │
└──────┬────────────────────┬────────────────────┬───────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ DAG WORKFLOW │    │  HARDWARE    │     │ QUALITY CTRL │     │ DRM LICENSE  │
│ COMPILER     │    │   GOVERNOR   │     │ (QC) AGENT   │     │ & FINGERPRINT│
├──────────────┤    ├──────────────┤     ├──────────────┤     ├──────────────┤
│ Kahn's Topo  │    │ 6GB VRAM OOM │     │ Pre-Render   │     │ Offline HMAC │
│ Cycle Reject │    │ Throttling   │     │ Fair-Use 85%+│     │ Machine Bound│
│ Parallel Run │    │ empty_cache  │     │ Audio Sync   │     │ Tier Gating  │
└──────────────┘    └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🛠️ Bộ Công Cụ Sáng Tạo & Tự Động Hóa (17 Modules)

| STT | Module & Giao Diện | File Nguồn | Chức Năng Chính |
| :---: | :--- | :--- | :--- |
| **01** | **Visual Workflow Builder** | [src/components/WorkflowBuilderTool.tsx](src/components/WorkflowBuilderTool.tsx) / [workflow_dag_compiler.py](workflow_dag_compiler.py) | Thiết kế quy trình DAG kéo thả, phân tầng thực thi song song, Local LLM Copilot. |
| **02** | **LAN Cluster Render** | [src/components/LanClusterTool.tsx](src/components/LanClusterTool.tsx) / [lan_distributed_render.py](lan_distributed_render.py) | Phân tán tải render video sang các máy trạm trong cùng mạng LAN nội bộ. |
| **03** | **Lip-Sync Studio ONNX** | [src/components/LipSyncStudioTool.tsx](src/components/LipSyncStudioTool.tsx) / [local_lipsync_engine.py](local_lipsync_engine.py) | Đồng bộ khẩu hình nhân vật theo âm thanh với mô hình ONNX / TensorRT. |
| **04** | **Blueprint & Presets** | [src/components/BlueprintPresetTool.tsx](src/components/BlueprintPresetTool.tsx) / [state_manager.py](state_manager.py) | Quản lý kho mẫu cấu hình render, xuất/nhập gói `.creatoros` có chữ ký bảo mật. |
| **05** | **DRM License Manager** | [src/components/ActivationModal.tsx](src/components/ActivationModal.tsx) / [hardware_fingerprint.py](hardware_fingerprint.py) | Quét Hardware Fingerprint, kích hoạt bản quyền ngoại tuyến vĩnh viễn. |
| **06** | **Database Explorer** | [src/components/DatabaseExplorerTab.tsx](src/components/DatabaseExplorerTab.tsx) / [db_explorer_service.ts](db_explorer_service.ts) | Tra cứu dữ liệu SQLite, xem checkpoint DAG và thực thi lệnh SQL trực tiếp. |
| **07** | **Secure OTA Updater** | [src/components/OtaUpdateModal.tsx](src/components/OtaUpdateModal.tsx) / [ota_updater.py](ota_updater.py) | Tải bản cập nhật phân đoạn và kiểm tra mã băm SHA-256 trước khi áp dụng. |
| **08** | **Master Orchestrator** | [src/components/OrchestratorTool.tsx](src/components/OrchestratorTool.tsx) / [orchestrator_engine.py](orchestrator_engine.py) | Điều phối chuỗi DAG 7 bước tự trị, hỗ trợ Auto-Resume từ checkpoint. |
| **09** | **No-Strike Video Render** | [src/components/SemiContentTool.tsx](src/components/SemiContentTool.tsx) / [nostrike_engine.py](nostrike_engine.py) | Khử bản quyền Content-ID: Lật gương, Color Shift, Micro-Noise, đổi MD5. |
| **10** | **AI Highlight & RAG** | [src/components/HighlightTool.tsx](src/components/HighlightTool.tsx) / [ai_highlight_writer.py](ai_highlight_writer.py) | Local Vector RAG phân tích transcript và trích xuất điểm cao trào kịch tính. |
| **11** | **Local Neural Voice** | [src/components/LocalVoiceTool.tsx](src/components/LocalVoiceTool.tsx) / [local_voice_engine.py](local_voice_engine.py) | Edge-TTS giọng đọc tự nhiên đa vùng miền, tự động căn chỉnh nhạc nền BGM. |
| **12** | **Comic Story AI** | [src/components/AiComicTool.tsx](src/components/AiComicTool.tsx) / [comic_engine.py](comic_engine.py) | Đồng bộ nhân vật 100% qua Seed DNA và phân cảnh Webtoon/Manga. |
| **13** | **Facebook 4:5 Reels Suite** | [src/components/FbSuiteTool.tsx](src/components/FbSuiteTool.tsx) / [fb_automation_engine.py](fb_automation_engine.py) | Tỉ lệ chuẩn 4:5 Facebook, chèn Header/Footer banner và lên lịch đăng chùm Page. |
| **14** | **Batch Downloader** | [src/components/BatchDownloaderTool.tsx](src/components/BatchDownloaderTool.tsx) / [bulk_downloader_engine.py](bulk_downloader_engine.py) | Tải video hàng loạt không logo từ TikTok, Douyin, YouTube, Facebook, IG. |
| **15** | **AI Review & Recap** | [src/components/ReviewTool.tsx](src/components/ReviewTool.tsx) / [ai_review_recap.py](ai_review_recap.py) | Biên kịch tóm tắt phim/anime/truyện 3 hồi với Hook 3 giây giữ chân người xem. |
| **16** | **SEO & Thumbnail Suite** | [src/components/SeoSuiteTool.tsx](src/components/SeoSuiteTool.tsx) | Sinh tiêu đề giật gân, bộ thẻ tag ranking và prompt ảnh Midjourney/Flux. |
| **17** | **Phone Farm ADB Control** | [src/components/PhoneFarmTool.tsx](src/components/PhoneFarmTool.tsx) | Điều khiển cluster điện thoại Android thực thi tác vụ nuôi nick, auto-scroll. |

---

## 💻 Cấu Hình Phần Cứng Khuyến Nghị

- **Hệ Điều Hành:** Windows 10/11 x64 (Khuyên dùng) hoặc Ubuntu 22.04 LTS.
- **Vi Xử Lý (CPU):** Intel Core i5/i7 thế hệ 10+ hoặc AMD Ryzen 5 3600+ (6 Cores / 12 Threads trở lên).
- **Bộ Nhớ RAM:** 16GB DDR4/DDR5 (Khuyến nghị 32GB nếu render cụm LAN lớn).
- **Card Đồ Họa (GPU):** NVIDIA GTX 1660 Super (6GB VRAM) hoặc RTX 3060/4060 trở lên hỗ trợ **CUDA 11.8+ & NVENC**.
- **Ổ Cứng:** SSD NVMe 500GB+ (Tốc độ đọc/ghi $\ge 2000\text{ MB/s}$ cho bộ đệm video và cache SQLite).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Môi Trường Phát Triển

### 1. Chuẩn Bị Môi Trường
- Cài đặt **Node.js $\ge 18.0.0$** và **npm**.
- Cài đặt **Python $\ge 3.10$** (khuyên dùng Python 3.11 hoặc 3.12).
- Cài đặt **FFmpeg** có hỗ trợ NVENC và thêm vào biến môi trường `PATH`.

### 2. Cài Đặt Dependencies

```powershell
# 1. Cài đặt các thư viện Node.js
npm install

# 2. Tạo và kích hoạt môi trường ảo Python
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Cài đặt các gói Python cần thiết
pip install -r requirements.txt
```

### 3. Khởi Chạy Ứng Dụng Ở Chế Độ Phát Triển (Dev Mode)

```powershell
# Khởi chạy đồng thời Node.js Server + Python WS Bridge + Electron UI
npm run electron:dev
```

Hoặc có thể chạy riêng lẻ từng dịch vụ để gỡ lỗi:
```powershell
# Terminal 1: Node.js Express & Vite Server (Cổng 3000)
npx tsx server.ts

# Terminal 2: Python JSON-RPC WebSocket Bridge (Cổng 8765)
python py_ws_bridge.py --port 8765

# Terminal 3: Electron Desktop Client
npx electron .
```

---

## 📦 Quy Trình Build & Đóng Gói Ứng Dụng Windows Standalone (.exe)

```powershell
# 1. Kiểm tra lỗi kiểu dữ liệu TypeScript
npm run lint

# 2. Build giao diện Vite & Bundle Node Server CJS
npm run build

# 3. Đóng gói bộ cài đặt Windows NSIS / Portable (.exe)
npm run electron:build
```
File đóng gói đầu ra sẽ nằm tại thư mục `release/`.

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Test Suite)

Dự án tích hợp bộ kiểm thử tự động toàn diện bằng `pytest`:

```powershell
# Kích hoạt venv và chạy toàn bộ 26 unit tests
.\.venv\Scripts\pytest -v
```

### Danh Mục Test Suites:
- `tests/test_checkpoint_resume.py`: Kiểm thử vòng đời Pipeline, ACID SQLite và cơ chế Auto-Resume.
- `tests/test_commercial_suite.py`: Kiểm thử Hardware Fingerprint, License Verification, DAG Topological Sort, OTA Checksum, LAN Chunking, LipSync ONNX.
- `tests/test_ipc_bridge.py`: Kiểm thử độ trễ phản hồi JSON-RPC 2.0 ($< 5\text{ms}$) và kiểm tra tải cao (Burst 1000 RPC requests).
- `tests/test_self_healing_errors.py`: Kiểm thử danh mục mã lỗi toàn cục và giải thuật chẩn đoán phục hồi tự động.
- `tests/test_vram_governor.py`: Kiểm thử giới hạn VRAM, giải phóng bộ nhớ và điều tiết luồng NVENC.
- `tests/test_offline_integrity.py`: Kiểm thử tính toàn vẹn 100% ngoại tuyến của Local RAG, QC Agent và No-Strike Engine.

---

## 📚 Tài Liệu Hướng Dẫn Liên Quan

- 📘 [DOCUMENTATION.md](DOCUMENTATION.md): Tài liệu đặc tả kỹ thuật, thiết kế cấu trúc dữ liệu và API Catalog chi tiết.
- 📖 [USER_GUIDE.md](USER_GUIDE.md): Sổ tay hướng dẫn sử dụng từng tính năng dành cho người dùng cuối và quản trị viên.
- 📥 [CLI_DOWNLOADER_DOC.md](CLI_DOWNLOADER_DOC.md): Hướng dẫn sử dụng công cụ dòng lệnh tải video hàng loạt.
- 📋 [TEST_PLAN.md](TEST_PLAN.md): Kế hoạch kiểm thử và tiêu chuẩn nghiệm thu chất lượng hệ thống.

---

<div align="center">
  <b>CREATOROS Desktop Studio</b> — <i>Phát triển & Tối ưu hóa bởi Đội ngũ Kỹ sư Hệ thống CreatorOS (2026).</i>
</div>

