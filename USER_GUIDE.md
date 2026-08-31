# 📖 SỔ TAY HƯỚNG DẪN VẬN HÀNH & SỬ DỤNG HỆ ĐIỀU HÀNH SÁNG TẠO NỘI DUNG CREATOROS PRO v5.0
### Hướng Dẫn Chi Tiết Vận Hành, Cấu Hình & Chạy Dự Án Cho Nhà Sáng Tạo & Studio

> **Bản quyền**: CREATOROS PRO v5.0 Next-Gen Enterprise  
> **Kiến trúc**: Offline-First • GPU Local AI • Master-Worker LAN Rendering • Zero Cloud Dependency  
> **Hệ điều hành hỗ trợ**: Windows 10/11 (64-bit), Ubuntu 22.04 LTS, macOS (Apple Silicon M-Series)  

---

## 📑 MỤC LỤC
1. [Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án Toàn Diện](#1-hướng-dẫn-cài-đặt--khởi-chạy-dự-án-toàn-diện)
2. [Tổng Quan Giao Diện & Tìm Kiếm Nhanh (Ctrl+K / ⌘K)](#2-tổng-quan-giao-diện--tìm-kiếm-nhanh-ctrlk--k)
3. [Kích Hoạt Bản Quyền Offline (DRM & Hardware Fingerprint)](#3-kích-hoạt-bản-quyền-offline-drm--hardware-fingerprint)
4. [Hướng Dẫn Chi Tiết 17+ Module Công Cụ Cốt Lõi](#4-hướng-dẫn-chi-tiết-17-module-công-cụ-cốt-lõi)
   - [4.1. Visual Workflow Builder & Local LLM Copilot (DAG Topological)](#41-visual-workflow-builder--local-llm-copilot-dag-topological)
   - [4.2. Cụm Render Phân Tán LAN Cluster (Master-Worker Engine)](#42-cụm-render-phân-tán-lan-cluster-master-worker-engine)
   - [4.3. Local AI Lip-Sync Studio (ONNX / TensorRT / Wav2Lip)](#43-local-ai-lip-sync-studio-onnx--tensorrt--wav2lip)
   - [4.4. Quản Lý Blueprint & Presets (SQLite WAL .creatoros)](#44-quản-lý-blueprint--presets-sqlite-wal-creatoros)
   - [4.5. Database Explorer & DAG Scheduler State Inspector](#45-database-explorer--dag-scheduler-state-inspector)
   - [4.6. Unified Pipeline Orchestrator & State Machine Checkpoints](#46-unified-pipeline-orchestrator--state-machine-checkpoints)
   - [4.7. AI Highlight & Script (Cắt Video Viral 9:16)](#47-ai-highlight--script-cắt-video-viral-916)
   - [4.8. AI Review & Recap Phim (Tóm Tắt 3 Hồi Đa Ngôn Ngữ)](#48-ai-review--recap-phim-tóm-tắt-3-hồi-đa-ngôn-ngữ)
   - [4.9. Dịch Thuật Video 1-Click (Demucs + Whisper SRT + Dubbing)](#49-dịch-thuật-video-1-click-demucs--whisper-srt--dubbing)
   - [4.10. Edit Bán Content YouTube & Khử Bản Quyền No-Strike](#410-edit-bán-content-youtube--khử-bản-quyền-no-strike)
   - [4.11. Voice Local Miễn Phí 0đ (TTS & Voice Clone Cục Bộ)](#411-voice-local-miễn-phí-0đ-tts--voice-clone-cục-bộ)
   - [4.12. Truyện AI Đồng Bộ 100% (Manga / Manhwa Consistent)](#412-truyện-ai-đồng-bộ-100-manga--manhwa-consistent)
   - [4.13. SEO Suite & Thumbnail Creator (CTR 18%)](#413-seo-suite--thumbnail-creator-ctr-18)
   - [4.14. Download Hàng Loạt Đa Nền Tảng (No-Watermark)](#414-download-hàng-loạt-đa-nền-tảng-no-watermark)
   - [4.15. Điều Khiển Phone Farm ADB Nuôi Nick](#415-điều-khiển-phone-farm-adb-nuôi-nick)
   - [4.16. Facebook Reels Publisher Suite](#416-facebook-reels-publisher-suite)
   - [4.17. Dashboard Quản Trị & REST API / Webhooks](#417-dashboard-quản-trị--rest-api--webhooks)
5. [Cơ Chế Cập Nhật Bảo Mật OTA (SHA-256 Checksum)](#5-cơ-chế-cập-nhật-bảo-mật-ota-sha-256-checksum)
6. [Xử Lý Sự Cố Thường Gặp (Troubleshooting & FAQs)](#6-xử-lý-sự-cố-thường-gặp-troubleshooting--faqs)

---

## 1. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY DỰ ÁN TOÀN DIỆN

### 1.1. Yêu Cầu Phần Cứng & Phần Mềm
- **Hệ Điều Hành:** Windows 10/11 64-bit (hoặc Ubuntu 22.04 LTS).
- **Node.js:** Phiên bản $\ge 18.0.0$ kèm `npm` / `npx`.
- **Python:** Phiên bản $3.10 \le \text{Python} \le 3.12$ kèm `pip`.
- **FFmpeg:** Cần cài đặt bản FFmpeg có hỗ trợ NVIDIA NVENC và thêm vào biến môi trường `PATH`.
- **Card Đồ Họa (GPU):** NVIDIA GTX 1660 Super (6GB VRAM) hoặc dòng RTX 30/40 Series hỗ trợ CUDA.

### 1.2. Các Bước Cài Đặt Chi Tiết
```powershell
# Bước 1: Mở PowerShell tại thư mục dự án
cd D:\creator-studio-ai-suite

# Bước 2: Cài đặt thư viện Node.js
npm install

# Bước 3: Tạo và kích hoạt môi trường ảo Python .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Bước 4: Cài đặt các gói Python phụ thuộc
pip install -r requirements.txt
```

### 1.3. Lệnh Khởi Chạy Dự Án

#### Cách 1: Khởi chạy toàn bộ hệ thống bằng 1 lệnh duy nhất (Khuyên dùng)
```powershell
npm run electron:dev
```
*Lệnh này sẽ kích hoạt đồng thời:*
1. **Node.js Express Server + Vite Dev Server** tại `http://127.0.0.1:3000`.
2. **Python WebSocket JSON-RPC 2.0 Bridge** tại `ws://127.0.0.1:8765`.
3. **Cửa sổ giao diện Electron Desktop App**.

#### Cách 2: Khởi chạy từng thành phần độc lập trong các Terminal riêng
```powershell
# Terminal 1: Backend Express Server
npx tsx server.ts

# Terminal 2: Python WebSocket Bridge
python py_ws_bridge.py --port 8765

# Terminal 3: Electron Window
npx electron .
```

#### Cách 3: Chạy Kiểm Thử Toàn Bộ Hệ Thống (Pytest)
```powershell
.\.venv\Scripts\pytest -v
```
*(Toàn bộ 26 unit tests kiểm tra ACID SQLite, DRM, DAG, OTA, VRAM Governor, Self-Healing đều phải đạt trạng thái PASSED).*

#### Cách 4: Đóng Gói File Cài Đặt .exe Cho Windows
```powershell
npm run electron:build
```
*Tệp cài đặt đầu ra sẽ nằm tại thư mục [release/](release/).*

---

## 2. TỔNG QUAN GIAO DIỆN & TÌM KIẾM NHANH (CTRL+K / ⌘K)

- Nhấn tổ hợp phím **`Ctrl + K`** (trên Windows) hoặc **`Cmd + K`** (trên macOS) để mở **Global Search Palette**.
- Gõ từ khóa tìm kiếm (*workflow*, *lipsync*, *lan cluster*, *voice*, *preset*, *db explorer*, *license*).
- Dùng phím mũi tên **`↑` / `↓`** để chọn và nhấn **`Enter` (`↵`)** để chuyển ngay tới công cụ.
- Nhấn **`Escape`** để đóng thanh tìm kiếm.

---

## 3. KÍCH HOẠT BẢN QUYỀN OFFLINE (DRM & HARDWARE FINGERPRINT)

CREATOROS áp dụng cơ chế xác thực bản quyền phần cứng không cần kết nối Internet:

1. Mở menu **Bản Quyền & License** tại góc phải Navbar (hoặc nhấn `Ctrl+K` và gõ `license`).
2. Hệ thống tự động quét và tạo chuỗi mã định danh phần cứng duy nhất:
   - **CPU**: Model, số nhân/luồng vật lý.
   - **Mainboard**: UUID / Serial Number từ BIOS.
   - **MAC Address**: Địa chỉ vật lý của card mạng chính.
   - **GPU**: NVIDIA Device ID & VRAM Bus Width.
3. Nhập **License Key** được cấp theo định dạng `CR-PRO_V48-XXXX-LIFETIME-YYYY`.
4. Nhấn **Xác Thực & Kích Hoạt Offline**. License sẽ được mã hóa và lưu trữ an toàn trong cơ sở dữ liệu SQLite WAL cục bộ (`creatoros_state.db`).

---

## 4. HƯỚNG DẪN CHI TIẾT 17+ MODULE CÔNG CỤ CỐT LÕI

### 4.1. Visual Workflow Builder & Local LLM Copilot (DAG Topological)
- **Mục đích**: Tự do thiết kế, kéo thả các bước xử lý video dạng sơ đồ khối có định hướng (Directed Acyclic Graph).
- **Cách sử dụng**:
  1. Vào tab **Visual Workflow Builder**.
  2. Kéo các Node chức năng (như *Input Video*, *Voiceover TTS*, *Wav2Lip ONNX*, *Split Screen*, *No-Strike Filter*, *Export MP4*) vào bảng vẽ.
  3. Kết nối các chân Output của Node trước sang Input của Node sau.
  4. Nhấn **Biên Dịch & Kiểm Tra DAG**: Hệ thống chạy thuật toán *Kahn's Topological Sort* để phát hiện chu trình lặp vô tận và xác định thứ tự thực thi chuẩn xác.
  5. **Tính Năng AI Prompt Copilot**: Nhập câu lệnh tự nhiên (ví dụ: *"Tạo video lồng tiếng kèm đồng bộ khẩu hình lipsync ONNX và render no-strike 9:16"*), Local LLM Agent sẽ tự động sinh toàn bộ sơ đồ Node hoàn chỉnh chỉ sau 1 giây!

---

### 4.2. Cụm Render Phân Tán LAN Cluster (Master-Worker Engine)
- **Mục đích**: Tận dụng toàn bộ máy trạm rảnh rỗi trong phòng làm việc / văn phòng để tăng tốc xuất video gấp 3 - 5 lần.
- **Cách sử dụng**:
  1. Vào tab **Cụm Render LAN Cluster**.
  2. Hệ thống tự động phát hiện danh sách các máy trạm Worker Nodes trong dải IP nội bộ kèm thông số GPU (VRAM, CUDA Cores, Speed Factor).
  3. Chọn video nguồn và cấu hình độ dài mỗi phân đoạn (**Chunk Duration**, mặc định 30 giây/chunk).
  4. Nhấn **Lập Kế Hoạch Phân Bổ (Plan Job)**: Thuật toán thông minh sẽ chia video thành $N$ segments và dispatch sang các Worker theo tỷ lệ sức mạnh phần cứng.
  5. Khi tất cả các Worker hoàn thành render, máy Master tự động dùng tập lệnh `ffmpeg -f concat -safe 0 -c copy` để nối các file lại thành video hoàn chỉnh trong chưa đầy 2 giây mà **không hề làm giảm chất lượng hình ảnh** (lossless).

---

### 4.3. Local AI Lip-Sync Studio (ONNX / TensorRT / Wav2Lip)
- **Mục đích**: Đồng bộ chuyển động môi của nhân vật / MC ảo theo file âm thanh lồng tiếng mà không bị giật lag, biến dạng khuôn mặt.
- **Cách sử dụng**:
  1. Vào tab **Local AI Lip-Sync Studio**.
  2. Chọn file video chứa khuôn mặt chính diện (Avatar / MC) và file audio lồng tiếng (`.wav` hoặc `.mp3`).
  3. Lựa chọn Backend tăng tốc:
     - **TensorRT Execution Provider**: Tối ưu tốc độ cao nhất trên GPU RTX 30/40 Series (đạt tới 60-80 FPS).
     - **CUDA Execution Provider**: Chuẩn mực ổn định cho các dòng GTX/RTX.
     - **CPU / DirectML**: Dành cho máy không có card đồ họa rời NVIDIA.
  4. Tinh chỉnh các thông số:
     - *Mức độ làm mịn biên (Face Mask Feathering)*: Giúp viền môi hòa trộn tự nhiên với màu da xung quanh.
     - *Độ phân giải khung hình nhận diện (ROI Target)*: 256x256 hoặc 512x512.
  5. Nhấn **Bắt Đầu Đồng Bộ Khẩu Hình**: Trực quan hóa tiến trình qua biểu đồ quang phổ âm thanh Mel Spectrogram và khung định vị khuôn mặt 68 Facial Landmarks.

---

### 4.4. Quản Lý Blueprint & Presets (SQLite WAL .creatoros)
- **Mục đích**: Lưu trữ, đóng gói và chia sẻ các cấu hình render hoặc mẫu workflow hoàn chỉnh để tái sử dụng chỉ với 1 cú click.
- **Cách sử dụng**:
  1. Vào tab **Quản Lý Blueprint & Presets**.
  2. Nhấn **Tạo Blueprint Mới** từ cấu hình hiện tại của bạn.
  3. Đặt tên, chọn danh mục (TikTok 9:16, YouTube 16:9, Phim Recap, v.v.) và gán thẻ tag.
  4. Hỗ trợ **Export File `.creatoros`** để gửi cho đồng nghiệp hoặc **Import** preset từ người khác vào kho lưu trữ cục bộ.

---

### 4.5. Database Explorer & DAG Scheduler State Inspector
- **Mục đích**: Tra cứu, quản lý trạng thái cơ sở dữ liệu SQLite (`creatoros_state.db` và `database.sqlite`), kiểm tra checkpoint và chạy lệnh SQL tùy biến.
- **Cách sử dụng**:
  1. Vào tab **Database Explorer**.
  2. Chọn cơ sở dữ liệu và bảng cần kiểm tra (`pipelines`, `pipeline_stages`, `user_presets`, `healing_incidents`, `rag_documents`).
  3. Tìm kiếm, lọc theo cột, xóa bản ghi lỗi hoặc tiêm Checkpoint mẫu (*Mock DAG Checkpoint*) để thử nghiệm cơ chế Auto-Resume.
  4. Nhấn **Chạy VACUUM & Optimize** để tối ưu hóa không gian lưu trữ và chỉ mục.

---

### 4.6. Unified Pipeline Orchestrator & State Machine Checkpoints
- **Mục đích**: Điều phối chuỗi sản xuất video 7 bước tự động với cơ chế lưu checkpoint vào SQLite và tự động phục hồi khi bị gián đoạn.
- **Cách sử dụng**:
  1. Vào tab **Orchestrator**.
  2. Nhấn **Khởi Chạy Chuỗi DAG 7 Bước**: Hệ thống lần lượt thực hiện Ingest $\to$ Demucs $\to$ Whisper $\to$ RAG $\to$ QC $\to$ NVENC Render $\to$ Matrix Dispatch.
  3. Nếu gặp sự cố mất điện hoặc lỗi giữa chừng, nhấn **Phục Hồi Từ Checkpoint (Auto-Resume)** để tiếp tục ngay tại bước dở dang mà không mất thời gian render lại từ đầu.

---

### 4.7. AI Highlight & Script (Cắt Video Viral 9:16)
- **Mục đích**: Phân tích âm lượng, phát hiện đoạn cao trào (Laughter/Shock Spike) và tự động cắt thành các clip dọc 9:16 kèm Hook 3 giây.
- **Cách sử dụng**:
  1. Dán đường link video YouTube / Podcast dài.
  2. Chọn chủ đề và độ dài mong muốn (30s - 60s).
  3. Nhấn **Phân Tích & Viết Kịch Bản**: Hệ thống xuất danh sách các điểm đắt giá kèm phụ đề Karaoke động.

---

### 4.8. AI Review & Recap Phim (Tóm Tắt 3 Hồi Đa Ngôn Ngữ)
- **Mục đích**: Tóm tắt phim, anime, truyện tranh theo cấu trúc kịch bản 3 hồi kịch tính, lôi cuốn người xem.
- **Cách sử dụng**:
  1. Nhập tên tác phẩm, thể loại và văn phong biên kịch (Hài hước, Kịch tính, Bí ẩn).
  2. Nhấn **Tạo Kịch Bản Review**: Hệ thống sinh đầy đủ Hook mở đầu, 3 Hồi diễn biến, lời kêu gọi hành động (Call To Action) và đọc mẫu qua giọng đọc AI.

---

### 4.9. Dịch Thuật Video 1-Click (Demucs + Whisper SRT + Dubbing)
- **Mục đích**: Tự động dịch video từ tiếng Trung (Douyin), Anh sang tiếng Việt chuẩn ngữ điệu, tách nhạc nền và lồng tiếng tự động.
- **Cách sử dụng**:
  1. Tải video nguồn lên hoặc dán liên kết.
  2. Chọn ngôn ngữ gốc và ngôn ngữ đích.
  3. Nhấn **Bắt Đầu Dịch & Lồng Tiếng**: Hệ thống tự động tách vocal bằng Demucs, trích xuất phụ đề SRT bằng Whisper, dịch thuật và tổng hợp giọng lồng tiếng mới.

---

### 4.10. Edit Bán Content YouTube & Khử Bản Quyền No-Strike
- **Mục đích**: Khử bản quyền Content-ID tự động qua nhiều lớp biến đổi điểm ảnh.
- **Cách sử dụng**:
  1. Nạp video cần lách bản quyền.
  2. Chọn các bộ lọc: *Lật gương*, *Tăng tốc 1.03x*, *Đổi mã hash MD5*, *Thêm viền mờ padding*, *Chèn micro-noise*.
  3. Nhấn **Xử Lý No-Strike NVENC**: Render video siêu tốc bằng GPU NVIDIA.

---

### 4.11. Voice Local Miễn Phí 0đ (TTS & Voice Clone Cục Bộ)
- **Mục đích**: Chuyển văn bản thành giọng đọc tự nhiên offline 100% không tốn chi phí API.
- **Cách sử dụng**:
  1. Nhập văn bản kịch bản.
  2. Chọn giọng đọc (Nam Miền Bắc, Nữ Miền Nam, Nam Trầm Ấm).
  3. Điều chỉnh tốc độ (Speed) và cao độ (Pitch).
  4. Nhấn **Tổng Hợp Giọng Đọc**: Tải về tệp `.mp3` chất lượng 320kbps.

---

### 4.12. Truyện AI Đồng Bộ 100% (Manga / Manhwa Consistent)
- **Mục đích**: Giữ nguyên khuôn mặt, trang phục và phong cách nhân vật xuyên suốt các khung truyện Webtoon/Manga qua Seed DNA.
- **Cách sử dụng**:
  1. Nhập ý tưởng cốt truyện và tên nhân vật chính.
  2. Chọn thể loại truyện và phong cách mỹ thuật (Webtoon Hàn Quốc, Manga Nhật Bản).
  3. Nhấn **Sinh Phân Cảnh Truyện**: Hệ thống tạo kịch bản 4 khung truyện kèm prompt chi tiết và Seed DNA cố định.

---

### 4.13. SEO Suite & Thumbnail Creator (CTR 18%)
- **Mục đích**: Tối ưu hóa tiêu đề giật gân, bộ thẻ tag xu hướng và prompt tạo ảnh Thumbnail cho Midjourney / Flux.
- **Cách sử dụng**:
  1. Nhập từ khóa hoặc chủ đề video.
  2. Nhấn **Tạo Bộ SEO Toàn Diện**: Nhận 5 tiêu đề kích thích tò mò (Curiosity Gap), mô tả chuẩn SEO và prompt ảnh 8K.

---

### 4.14. Download Hàng Loạt Đa Nền Tảng (No-Watermark)
- **Mục đích**: Tải hàng trăm video sạch không logo mờ từ Douyin, TikTok, Facebook Reels, YouTube.
- **Cách sử dụng**:
  1. Dán danh sách liên kết video (mỗi dòng một link).
  2. Nhấn **Bắt Đầu Tải Hàng Loạt**: Tiến trình đa luồng tải về trực tiếp thư mục `downloads/`.

---

### 4.15. Điều Khiển Phone Farm ADB Nuôi Nick
- **Mục đích**: Quản lý và điều khiển dàn điện thoại Android thật qua cổng USB/WiFi ADB để thực hiện tác vụ nuôi tài khoản, auto-scroll và đăng video tự động.
- **Cách sử dụng**:
  1. Cắm các thiết bị Android đã bật chế độ *USB Debugging*.
  2. Bảng điều khiển hiển thị pin, nhiệt độ, IP Proxy của từng máy.
  3. Chọn hành động (*Lướt TikTok tương tác*, *Xem Shorts 60fps*, *Đăng Reel kèm Caption*) và gửi lệnh đa luồng.

---

### 4.16. Facebook Reels Publisher Suite
- **Mục đích**: Đăng bài tự động lên hàng loạt Fanpage Facebook theo khung giờ vàng (11:45 trưa, 19:30 tối, 22:15 đêm).
- **Cách sử dụng**:
  1. Nhập danh sách Fanpage mục tiêu và tiêu đề video.
  2. Hệ thống tự động tạo bài viết có Hook 3 giây, icon emoji, hashtag và bình luận First Comment điều hướng tương tác.

---

### 4.17. Dashboard Quản Trị & REST API / Webhooks
- **Mục đích**: Theo dõi thông số telemetry tài nguyên phần cứng (VRAM, RAM, CPU) thời gian thực và cung cấp danh mục REST API cho các hệ thống tự động hóa bên ngoài (n8n, Make, Telegram Bot).
- **Cách sử dụng**:
  1. Xem đồ thị tải phần cứng thời gian thực.
  2. Gửi request REST HTTP tới địa chỉ `http://localhost:3000/api/*`.

---

## 5. CƠ CHẾ CẬP NHẬT BẢO MẬT OTA (SHA-256 CHECKSUM)

CREATOROS được trang bị cơ chế tự động kiểm tra bản vá bảo mật và tính năng mới qua **Over-The-Air (OTA) Updater**:
1. Nhấp vào nút **OTA Update** trên thanh Navbar (hoặc nhấn `Ctrl+K` và gõ `ota`).
2. Hệ thống tải về bản manifest chính thức từ server phân phối.
3. Tự động tính toán mã băm mật mã học **SHA-256 Checksum** của các file cập nhật để đối chiếu, đảm bảo không bị can thiệp mã độc (Tamper-proof).
4. Áp dụng bản vá trực tiếp mà không cần gỡ cài đặt hay làm mất dữ liệu SQLite Presets hiện có của bạn.

---

## 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING & FAQS)

| Hiện Tượng | Nguyên Nhân | Cách Khắc Phục |
| :--- | :--- | :--- |
| **Báo lỗi CUDA Out of Memory (OOM)** | Độ phân giải video quá lớn so với dung lượng VRAM card đồ họa. | Hardware Governor sẽ tự động xả cache; hoặc giảm Chunk Duration xuống 15s trong LAN Cluster. |
| **Không tìm thấy máy trạm LAN** | Tường lửa (Windows Defender Firewall) đang chặn cổng kết nối nội bộ. | Mở port 3000 TCP/UDP trong cài đặt Firewall hoặc đặt mạng về chế độ *Private Network*. |
| **Khẩu hình Lip-Sync chưa khớp** | File âm thanh giọng đọc có khoảng lặng (silence) quá dài ở đầu. | Dùng công cụ cắt gọt âm thanh để xóa 0.5s khoảng lặng trước khi đưa vào LipSync Studio. |
| **DAG báo lỗi Circular Dependency** | Có 2 node nối vòng lặp vào nhau tạo thành chu trình kín. | Mở Visual Workflow Builder, kiểm tra và ngắt kết nối đường mũi tên lặp ngược. |
| **Bị mất License khi đổi ổ cứng** | Hardware ID thay đổi do thay thế linh kiện phần cứng chính. | Liên hệ bộ phận hỗ trợ kỹ thuật để reset mã máy trên hệ thống cấp phép. |
| **Mất kết nối Backend (Cổng 3000 hoặc 8765)** | Tiến trình nền bị treo cổng do tắt đột ngột trước đó. | Chạy `npm run dev` hoặc tắt các tiến trình `node.exe` / `python.exe` chạy ngầm trong Task Manager. |

---

> **Hỗ Trợ Kỹ Thuật**: Đội ngũ kỹ thuật CREATOROS luôn túc trực hỗ trợ 24/7 qua cộng đồng và cổng tài liệu chính thức. Chúc bạn sáng tạo ra hàng triệu video triệu view bứt phá doanh thu!


### 4.5. Unified Pipeline Orchestrator & State Machine
- **Mục đích**: Giám sát luồng thực thi toàn diện của phần mềm theo máy trạng thái hữu hạn (State Machine: `IDLE -> ANALYZING -> AUDIO_SPLIT -> TTS -> VIDEO_PROCESSING -> POST_FILTER -> EXPORTED`).
- **Cách sử dụng**:
  1. Vào tab **Unified Pipeline DAG**.
  2. Quan sát trực tiếp mức độ tiêu thụ RAM, NVMe I/O throughput và xung nhịp GPU.
  3. Có thể tạm dừng (Pause), hủy bỏ (Abort) hoặc kích hoạt chế độ tăng tốc Turbo Mode.

---

### 4.6. AI Highlight & Script (Cắt Video Viral 9:16)
- **Mục đích**: Tự động phát hiện các đoạn cao trào, giật gân, thú vị nhất trong video dài để cắt thành hàng chục video ngắn Shorts/TikTok có tỷ lệ giữ chân người xem (Retention Rate) trên 80%.
- **Cách sử dụng**:
  1. Tải lên video dài (Podcasts, Livestream, Phỏng vấn, Thể thao, Game).
  2. Thiết lập độ dài mong muốn cho mỗi clip ngắn (15s, 30s, 60s).
  3. AI sẽ tự động sinh Hook Title giật tít, kịch bản lồng tiếng (Voice Script), phụ đề Auto-Caption và đề xuất chèn hình ảnh B-Roll.

---

### 4.7. AI Review & Recap Phim (Tóm Tắt 3 Hồi Đa Ngôn Ngữ)
- **Mục đích**: Tự động viết kịch bản tóm tắt phim chiếu rạp, anime, truyện tranh theo cấu trúc kinh điển 3 hồi (Mở đầu kịch tính -> Cao trào xung đột -> Đoạn kết bất ngờ).
- **Cách sử dụng**:
  1. Nhập tên phim hoặc tải lên timeline nội dung thô.
  2. Chọn ngôn ngữ và tông giọng thuyết minh (Hài hước, Kịch tính, Trinh thám, Triết lý).
  3. Xuất kịch bản chi tiết kèm gợi ý Prompt hình ảnh trực quan cho từng phân đoạn.

---

### 4.8. Dịch Thuật Video 1-Click (Demucs + Whisper SRT + Dubbing)
- **Mục đích**: Chuyển hóa toàn bộ video tiếng Trung, tiếng Anh, tiếng Hàn sang tiếng Việt mượt mà.
- **Cách sử dụng**:
  1. Chọn video nguồn nước ngoài.
  2. Hệ thống sử dụng mô hình **Demucs** để bóc tách riêng biệt dải âm giọng nói nhân vật (Vocal) và dải nhạc nền hiệu ứng (BGM/SFX).
  3. Chuyển đổi giọng nói thành văn bản chuẩn xác bằng **Whisper AI**, dịch sát ngữ cảnh và tái tạo giọng đọc tiếng Việt bằng AI Voice Engine.
  4. Trộn lại nhạc nền gốc với giọng đọc mới, tạo video lồng tiếng chuyên nghiệp.

---

### 4.9. Edit Bán Content YouTube & Khử Bản Quyền No-Strike
- **Mục đích**: Xử lý các lớp filter kỹ thuật nhằm vượt qua bộ quét nhận diện bản quyền tự động (Content ID, Visual Fingerprinting, Audio Hash).
- **Cách sử dụng**:
  1. Chọn video nguồn và chế độ hiển thị (*Split-screen trên dưới*, *Picture-in-Picture*, hoặc *Background Blur 9:16*).
  2. Bật các bộ lọc khử bản quyền:
     - **Micro-Flip Horizontal**: Lật nhẹ khung hình theo chiều ngang.
     - **Hue & Saturation Shifting**: Thay đổi quang phổ màu từ 2% - 4% mà mắt thường khó nhận biết.
     - **Speed Pitching Dynamic**: Điều chỉnh tốc độ khung hình biến thiên từ 1.01x - 1.04x để phá vỡ Audio Matching.
     - **Overlay Noise Mask**: Phủ lớp hạt mờ siêu mịn vô hình để làm sai lệch mã băm SHA/MD5 của video.

---

### 4.10. Voice Local Miễn Phí 0đ (TTS & Voice Clone Cục Bộ)
- **Mục đích**: Đọc văn bản thành giọng nói chất lượng cao không tốn 1 xu chi phí API, hoạt động hoàn toàn offline.
- **Cách sử dụng**:
  1. Dán văn bản cần đọc vào khung soạn thảo.
  2. Lựa chọn các giọng đọc đặc trưng (Giọng nam trầm ấm, Giọng nữ truyền cảm, Giọng review phim giật gân, Giọng kể chuyện cổ tích).
  3. Điều chỉnh tốc độ nói (Speed), cao độ (Pitch) và độ vang phòng thu (Reverb Studio).
  4. Nhấn **Tổng Hợp Âm Thanh** và tải file `.wav` về máy.

---

### 4.11. Truyện AI Đồng Bộ 100% (Manga / Manhwa Consistent)
- **Mục đích**: Giữ nguyên vẹn tỷ lệ khuôn mặt, kiểu tóc, màu mắt và trang phục của nhân vật xuyên suốt toàn bộ các chap truyện tranh.
- **Cách sử dụng**:
  1. Tải lên 1 ảnh chân dung nhân vật mẫu (Seed Character).
  2. Nhập kịch bản cốt truyện cho từng khung hình (Frames).
  3. AI sẽ tự động sinh hình ảnh nhất quán nhân vật và tạo hiệu ứng camera 2.5D (Pan & Zoom, Parallax) để biến truyện tĩnh thành video sống động.

---

### 4.12. SEO Suite & Thumbnail Creator (CTR 18%)
- **Mục đích**: Tối ưu hóa tiêu đề giật tít, bộ thẻ tag chuẩn thuật toán đề xuất YouTube/TikTok và tạo ảnh bìa Thumbnail thu hút tỷ lệ click chuột cực cao.
- **Cách sử dụng**:
  1. Nhập chủ đề video của bạn.
  2. AI phân tích các kênh triệu view đối thủ và đưa ra bảng gợi ý từ khóa có lượng tìm kiếm cao (High Search Volume, Low Competition).
  3. Chọn mẫu bố cục Thumbnail với độ tương phản cao, viền sáng nhân vật và biểu cảm giật gân chuẩn phong cách MrBeast.

---

### 4.13. Download Hàng Loạt Đa Nền Tảng (No-Watermark)
- **Mục đích**: Tải cùng lúc hàng trăm video chất lượng gốc không có logo mờ từ Douyin, TikTok, Facebook Reels, Kuaishou, YouTube.
- **Cách sử dụng**:
  1. Dán danh sách link video (mỗi dòng một link) hoặc link trang cá nhân/kênh tác giả.
  2. Chọn thư mục lưu trữ trên ổ cứng.
  3. Nhấn **Bắt Đầu Tải Hàng Loạt**: Phần mềm tự động dùng đa luồng (Multi-threading) để tải về với tốc độ tối đa của đường truyền mạng.

---

### 4.14. Điều Khiển Phone Farm ADB Nuôi Nick
- **Mục đích**: Tự động hóa hàng chục chiếc điện thoại Android cắm qua cổng USB hoặc WiFi ADB để nuôi tài khoản mạng xã hội.
- **Cách sử dụng**:
  1. Kết nối các thiết bị Android và bật chế độ *USB Debugging*.
  2. Bảng điều khiển sẽ hiển thị màn hình trực tiếp của toàn bộ dàn máy.
  3. Chọn kịch bản tự động: *Lướt xem video tương tác ngẫu nhiên*, *Thả tim theo từ khóa*, *Tự động đăng Reels đã render*.

---

### 4.15. Facebook Reels Publisher Suite
- **Mục đích**: Đăng video tự động lên hàng loạt Fanpage Facebook cùng lúc theo lịch hẹn giờ.
- **Cách sử dụng**:
  1. Thêm Page Access Token hoặc đăng nhập qua Cookies an toàn.
  2. Chọn thư mục video đã render sẵn kèm tiêu đề và hashtag.
  3. Thiết lập giãn cách thời gian giữa các lần đăng (ví dụ: 15-30 phút/bài) để tránh bị thuật toán Facebook đánh dấu spam.

---

### 4.16. Dashboard Quản Trị & REST API / Webhooks
- **Mục đích**: Dành cho lập trình viên và các chủ studio muốn tích hợp CREATOROS vào hệ thống tự động hóa riêng (n8n, Make, Python Script, Bot Telegram).
- **Cách sử dụng**:
  1. Xem tài liệu Swagger API tại tab **REST API & Webhooks**.
  2. Gửi request REST HTTP tới địa chỉ `http://localhost:3000/api/*` kèm payload JSON.
  3. Đăng ký Webhook URL để nhận thông báo thời gian thực ngay khi video render xong.

---

## 5. CƠ CHẾ CẬP NHẬT BẢO MẬT OTA (SHA-256 CHECKSUM)

CREATOROS được trang bị cơ chế tự động kiểm tra bản vá bảo mật và tính năng mới qua **Over-The-Air (OTA) Updater**:
1. Nhấp vào nút **OTA v5.0** trên thanh Navbar.
2. Hệ thống tải về bản manifest chính thức từ server phân phối.
3. Tự động tính toán mã băm băm mật mã học **SHA-256 Checksum** của các file cập nhật để đối chiếu, đảm bảo không bị can thiệp mã độc (Tamper-proof).
4. Áp dụng bản vá trực tiếp mà không cần gỡ cài đặt hay làm mất dữ liệu SQLite Presets hiện có của bạn.

---

## 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING & FAQS)

| Hiện Tượng | Nguyên Nhân | Cách Khắc Phục |
| :--- | :--- | :--- |
| **Báo lỗi CUDA Out of Memory (OOM)** | Độ phân giải video quá lớn so với dung lượng VRAM card đồ họa. | Giảm Chunk Duration xuống 15s hoặc chuyển sang dùng cụm LAN Cluster chia tải. |
| **Không tìm thấy máy trạm LAN** | Tường lửa (Windows Defender Firewall) đang chặn cổng kết nối nội bộ. | Mở port 3000 TCP/UDP trong cài đặt Firewall hoặc đặt mạng về chế độ *Private Network*. |
| **Khẩu hình Lip-Sync chưa khớp** | File âm thanh giọng đọc có khoảng lặng (silence) quá dài ở đầu. | Dùng công cụ cắt gọt âm thanh để xóa 0.5s khoảng lặng trước khi đưa vào LipSync Studio. |
| **DAG báo lỗi Circular Dependency** | Có 2 node nối vòng lặp vào nhau tạo thành chu trình kín. | Mở Visual Workflow Builder, kiểm tra và ngắt kết nối đường mũi tên lặp ngược. |
| **Bị mất License khi đổi ổ cứng** | Hardware ID thay đổi do thay thế linh kiện phần cứng chính. | Liên hệ bộ phận hỗ trợ kỹ thuật để reset mã máy trên hệ thống cấp phép. |

---

> **Hỗ Trợ Kỹ Thuật**: Đội ngũ kỹ thuật CREATOROS luôn túc trực hỗ trợ 24/7 qua cộng đồng và cổng tài liệu chính thức. Chúc bạn sáng tạo ra hàng triệu video triệu view bứt phá doanh thu!
