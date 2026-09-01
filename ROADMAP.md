# 🗺️ BẢN ĐỒ PHÁT TRIỂN & LỊCH SỬ DỰ ÁN (CREATOROS ROADMAP & HISTORY LOG)
### Enterprise Local Desktop Workstation — Tự Động Hóa Sản Xuất Video Bán Content

---

## � Tổng quan dự án
- **Tên phần mềm:** CreatorOS Desktop
- **Mục tiêu:** Phần mềm Native Windows chạy độc lập giúp tự động hóa quy trình quét video, quản lý API Key Pool chống lỗi 429, dịch thuật AI và lồng tiếng video hàng loạt sử dụng tăng tốc phần cứng GPU (CUDA).

---

## 📅 LỊCH SỬ PHÁT TRIỂN & CÁC CỘT MỐC QUAN TRỌNG

### Phiên Bản v5.1.0 (Hiện tại - 01/09/2026) — Enterprise Native Desktop Architecture
- [x] **Bước 1:** Khởi tạo cấu trúc project Electron + TypeScript và module quản lý thư mục cấu hình cục bộ (`AppData`).
- [x] **Bước 2:** Xây dựng hệ thống quản lý API Key Pool (Gemini Round-Robin với cơ chế Cooldown chống lỗi 429) tại [src/main/services/keyPool.ts](src/main/services/keyPool.ts).
- [x] **Bước 3:** Hoàn thiện module Quét & Tải video đa nền tảng (Douyin, TikTok) với tùy chọn Cookie/Proxy tại [src/main/services/scraper.ts](src/main/services/scraper.ts) & [src/main/services/downloaderService.ts](src/main/services/downloaderService.ts).
- [x] **Bước 4:** Xây dựng phân hệ Pipeline Dịch thuật & Lồng Tiếng AI (AI Dubbing) tại [src/main/services/dubbingService.ts](src/main/services/dubbingService.ts).
- [x] **Bước 5:** Tích hợp FFmpeg Worker xử lý phần cứng GPU NVIDIA (CUDA acceleration) và ép phụ đề chìm tại [src/main/services/videoWorker.ts](src/main/services/videoWorker.ts).
- [x] **Bước 6:** Thiết lập hệ thống Hàng đợi (Queue Worker) tại [src/main/services/queueManager.ts](src/main/services/queueManager.ts) và truyền trạng thái Realtime qua IPC tại [src/main/ipcHandlers.ts](src/main/ipcHandlers.ts).
- [x] **Bước 7:** Tái cấu trúc Clean Code & dọn dẹp thư mục: chuyển đổi toàn bộ service Main Process sang TypeScript strict, dọn dẹp 31 file trùng lặp/dư thừa tại root và khởi tạo [electron/electron.cjs](electron/electron.cjs).

---

## 🎯 DANH SÁCH CÁC TÁC VỤ & TIẾN ĐỘ THỰC HIỆN

### 1. Electron Main Process & Services Architecture (Node.js Backend)
- [x] Chuyển đổi toàn bộ JavaScript sang TypeScript strict (`keyPool.ts`, `logger.ts`, `downloaderService.ts`, `dubbingService.ts`).
- [x] Bọc an toàn khối bất đồng bộ (`async/await`) với `try/catch` tường minh, loại bỏ silent crash & memory leaks trên IPC handlers.
- [x] Xây dựng WebSocket IPC Bridge hai chiều kết nối Electron Main với Python Core engine hỗ trợ Exponential Backoff Auto-Reconnect.
- [x] Tách biệt hoàn toàn trách nhiệm giữa UI (Renderer), Services/Queue, và System/Hardware layer (Main Process, IPC, FFmpeg).

### 2. Hệ thống Tải hàng loạt (Bulk Downloader Engine)
- [x] Phát triển lõi tải đa luồng `bulk_downloader_engine.py` tích hợp yt-dlp & FFmpeg.
- [x] Tích hợp IPC JSON-RPC và WebSocket với Python Core Engine (`py_ws_bridge.py`) để truyền tiến trình realtime về giao diện Desktop.
- [x] Xây dựng bộ tự phục hồi lỗi (Self-Healing Fallbacks) xoay vòng User-Agent và tự dọn dẹp tệp tạm khi hủy tiến trình.

### 3. Giao diện người dùng React & Electron (Frontend Layer)
- [x] Hoàn thiện giao diện [src/renderer/components/BatchDownloaderTool.tsx](src/renderer/components/BatchDownloaderTool.tsx) hỗ trợ dán hàng loạt URL, lọc theo chỉ số và cấu hình proxy/cookie.
- [x] Tích hợp hộp thoại chọn thư mục lưu trữ cục bộ qua Native Dialog Electron IPC Bridge (`select-directory-dialog`).

---

## 🚀 KẾ HOẠCH PHÁT TRIỂN TIẾP THEO (FUTURE ROADMAP)

- [ ] **Tối ưu UI/UX & Notifications:** Bổ sung hệ thống Toast Notifications thông báo hoàn thành batch render & download real-time.
- [ ] **Đóng gói NSIS (.exe):** Đóng gói hoàn chỉnh file cài đặt NSIS `.exe` kèm nhúng sẵn `ffmpeg.exe` & Python Core qua `electron-builder`.
- [ ] **Tự động cập nhật phần mềm (Auto-Updater):** Tích hợp `electron-updater` qua GitHub Releases / OTA Update Server.
- [ ] **Tối ưu VRAM Governor:** Nâng cấp thuật toán điều tiết hàng đợi render NVENC linh hoạt hơn cho GPU dung lượng VRAM lớn (RTX 4070/4080 12GB+).

---

<div align="center">
  <b>CREATOROS ROADMAP & HISTORY LOG</b> — <i>Được cập nhật tự động vào ngày 01/09/2026.</i>
</div>