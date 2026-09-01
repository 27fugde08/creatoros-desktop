# 📘 CREATOROS CLI & BULK DOWNLOADER ENGINE - TÀI LIỆU KỸ THUẬT (TECHNICAL REFERENCE MANUAL)
### Hệ Thống Tải Video Hàng Loạt Chuyên Nghiệp Đa Luồng, Tự Động Nhận Diện Nền Tảng & Checkpoint Check

---

## 📑 MỤC LỤC
1. [Giới Thiệu Tổng Quan (Introduction)](#1-giới-thiệu-tổng-quan)
2. [Kiến Trúc Kỹ Thuật (Architecture Design)](#2-kiến-trúc-kỹ-thuật)
3. [Các Tính Năng Cốt Lõi (Core Features)](#3-các-tính-năng-cốt-lõi)
4. [Hướng Dẫn Cài Đặt & Yêu Cầu Môi Trường (Installation)](#4-hướng-dẫn-cài-đặt--yêu-cầu-môi-trường)
5. [Cú Pháp & Danh Mục Tham Số CLI (CLI Reference)](#5-cú-pháp--danh-mục-tham-số-cli)
6. [Các Kịch Bản Sử Dụng Điển Hình (Usage Scenarios)](#6-các-kịch-bản-sử-dung-điển-hình)
7. [Cơ Chế Đồng Bộ SQLite Checkpoint & State Manager](#7-cơ-chế-đồng-bộ-sqlite-checkpoint--state-manager)
8. [Cơ Chế Dừng An Toàn & Dọn Dẹp Tệp Tạm (Graceful Shutdown)](#8-cơ-chế-dừng-an-toàn--dọn-dẹp-tệp-tạm)
9. [Cơ Chế Xử Lý Lỗi & Tự Phục Hồi (Self-Healing & Fallbacks)](#9-cơ-chế-xử-lý-lỗi--tự-phục-hồi)

---

## 1. GIỚI THIỆU TỔNG QUAN

Hệ thống tải xuống của CREATOROS bao gồm hai module chính được tối ưu hóa cao:
- [run_downloader.py](run_downloader.py): Giao diện dòng lệnh (CLI - Command Line Interface) độc lập hiển thị đồ họa trực quan qua terminal.
- [bulk_downloader_engine.py](bulk_downloader_engine.py): Lõi xử lý ngầm (Background Engine) được gọi trực tiếp bởi Electron Main Process thông qua `downloadHandler.ts` và Task Dispatcher để phục vụ cho giao diện người dùng Desktop React/Electron.

Các nền tảng được hỗ trợ tự động:
- **TikTok**: Tự động bóc tách và tải video gốc không dính Watermark (No-Watermark Stream).
- **Douyin (Tiktok Trung Quốc)**: Tải video độ phân giải cao 1080p+ kèm âm thanh chất lượng cao.
- **YouTube**: Tự động tải YouTube Shorts, YouTube Video chuẩn MP4/H.264 hoặc bóc tách Audio MP3.
- **Facebook**: Tải Facebook Reels và Video công khai chất lượng HD.
- **Instagram**: Tải Reels, Stories và Video bài đăng.
- **Kuaishou**: Tải video định dạng sạch.

---

## 2. KIẾN TRÚC KỸ THUẬT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GIAO DIỆN ELECTRON / TERMINAL / CLI                │
│   • React App / BatchDownloaderTool.tsx gửi yêu cầu qua IPC 'run-task'       │
│   • Hoặc chạy trực tiếp qua CLI với Rich Console Live Progress (Speed, ETA)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (JSON-RPC IPC / Tham số dòng lệnh)
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CORE DOWNLOADER CONTROLLER                             │
│   • URL Normalizer & Platform Detector (Tự động nhận diện nền tảng)         │
│   • ThreadPoolExecutor Controller (Quản lý đa luồng đồng thời)              │
│   • ShutdownHandler (Bắt tín hiệu SIGINT/SIGTERM, dọn dẹp tệp tạm)          │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐ ┌────────────────────────────────────┐
│         WORKER DOWNLOAD ENGINE       │ │       SQLITE STATE & CHECKPOINT    │
│ • yt-dlp Core Engine                 │ │ • creatoros_state.db (WAL Mode)    │
│ • Synthetic High-Res Fallback        │ │ • Ghi nhận Stage 1_DOWNLOAD_INGEST │
│ • Header Spoofing (Bypass Rate-Limit)│ │ • Cập nhật Artifacts Cache         │
└──────────────────────────────────────┘ └────────────────────────────────────┘
```

---

## 3. CÁC TÍNH NĂNG CỐT LÕI

### 3.1. Giao Diện Dòng Lệnh Trực Quan (Rich Terminal UI)
- Hiển thị tiến trình chi tiết của **từng tệp** (tốc độ tải, kích thước tải được, thanh phần trăm, ETA).
- Thanh tiến trình **Tổng thể (Overall Progress)** giúp theo dõi tiến độ của cả lô tải.
- Bảng tổng kết kết quả (**Summary Report**) dạng bảng định dạng màu sắc sau khi hoàn tất.

### 3.2. Xử Lý Đa Luồng Không Nghẽn (Concurrent Multi-Threading)
- Tận dụng `ThreadPoolExecutor` của Python cho phép tải song song từ 2 đến 16 liên kết cùng lúc.
- Ngăn chặn triệt để tình trạng đơ/nghẽn Terminal I/O.

### 3.3. Cơ Chế Bắt Tín Fe & Dọn Dẹp An Toàn (Graceful Shutdown)
- Lắng nghe tín hiệu `SIGINT` (`Ctrl + C`) hoặc `SIGTERM`.
- Tự động hủy các luồng đang chờ và **xóa sạch toàn bộ các tệp tạm dở dang** (`.part`, `.ytdl`, `.tmp`) trên ổ cứng trước khi thoát, chống rác ổ đĩa NVMe.

### 3.4. Tích Hợp Chặt Chẽ Cơ Sở Dữ Liệu Checkpoint
- Tự động tạo và cập nhật trạng thái Pipeline vào SQLite thông qua [state_manager.py](state_manager.py).
- Đồng bộ dữ liệu sang giao diện Desktop React/Electron mà không cần khởi động lại ứng dụng.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & YÊU CẦU MÔI TRƯỜNG

### 4.1. Yêu Cầu Phần Cứng & Phần Mềm:
- **Hệ Điều Hành**: Windows 10/11 x64, macOS, Linux (Ubuntu 20.04+).
- **Python**: Phiên bản 3.10 đến 3.12.
- **FFmpeg**: Đã được cài đặt và thêm vào biến môi trường `PATH`.

### 4.2. Cài Đặt Thư Viện Phụ Thuộc:
```bash
pip install yt-dlp rich requests
```
*(Hệ thống đã tích hợp sẵn cơ chế Fallback tự động, có thể chạy mượt mà ngay cả khi thiếu thư viện mở rộng).*

---

## 5. CÚ PHÁP & DANH MỤC THAM SỐ CLI

### CLI Cú pháp tổng quát:
```bash
python3 run_downloader.py [URL_1] [URL_2] ... [OPTIONS]
```

### Bảng Danh Mục Tham Số của [run_downloader.py](run_downloader.py):

| Tham Số | Tên Rút Gọn | Kiểu Dữ Liệu | Mặc Định | Mô Tả Chức Năng |
| :--- | :---: | :---: | :---: | :--- |
| `urls` | - | `List[str]` | `None` | Danh sách các URL video cần tải (cách nhau bằng khoảng trắng). |
| `--file` | `-f` | `String` | `None` | Đường dẫn đến tệp tin văn bản (`.txt`) chứa danh sách URL. |
| `--output` | `-o` | `String` | `output/downloads` | Thư mục lưu trữ video thành phẩm. |
| `--workers` | `-w` | `Integer` | `3` | Số luồng tải video đồng thời (Khuyên dùng: 2 - 6 luồng). |
| `--resolution`| `-r` | `String` | `1080p` | Tùy chọn chất lượng: `1080p`, `720p`, `audio` (chỉ tải MP3), `max`. |
| `--pipeline-id`| - | `String` | `Auto ID` | Mã ID định danh để ghi Checkpoint vào bảng `pipelines` SQLite. |
| `--help` | `-h` | - | - | Hiển thị bảng trợ giúp và hướng dẫn chi tiết. |

---

## 6. CÁC KỊCH BẢN SỬ DỤNG ĐIỂN HÌNH

### Kịch Bản 1: Tải Nhanh 1 Video Trực Tiếp
```bash
python3 run_downloader.py "https://www.tiktok.com/@user/video/7123456789"
```

### Kịch Bản 2: Tải Hàng Loạt Video Đa Nền Tảng Với 4 Luồng Song Song
```bash
python3 run_downloader.py \
  "https://www.tiktok.com/@user/video/1" \
  "https://www.youtube.com/shorts/abc" \
  "https://www.facebook.com/reel/123456" \
  -w 4 -o ./my_videos
```

### Kịch Bản 3: Tải Theo Danh Sách Tệp Văn Bản (`urls.txt`)
Tạo tệp `urls.txt` với nội dung:
```text
# Danh sách video tổng hợp TikTok & Douyin
https://www.tiktok.com/@creator/video/111111
https://www.douyin.com/video/222222
https://www.youtube.com/shorts/333333
```
Chạy lệnh:
```bash
python3 run_downloader.py -f urls.txt -w 5 -r 1080p
```

### Kịch Bản 4: Chế Độ Tương Tác Trực Tiếp (Interactive Mode)
Chỉ cần chạy lệnh không kèm tham số, chương trình sẽ hiển thị cửa sổ nhập trực quan:
```bash
python3 run_downloader.py
```
*Dán danh sách URL vào dòng nhắc `>>` và bấm Enter để bắt đầu.*

---

## 7. CƠ CHẾ ĐỒNG BỘ SQLITE CHECKPOINT & STATE MANAGER

Khi thực thi, cả [run_downloader.py](run_downloader.py) và [bulk_downloader_engine.py](bulk_downloader_engine.py) tự động tương tác với cơ sở dữ liệu `creatoros_state.db` qua [state_manager.py](state_manager.py):

1. **Khởi tạo Pipeline**: Tạo bản ghi trong bảng `pipelines` với trạng thái `RUNNING`.
2. **Theo dõi Stage**: Ghi nhận giai đoạn `1_DOWNLOAD_INGEST` với dữ liệu metadata:
   - Số lượng URL tổng cộng.
   - Thư mục lưu trữ đích.
3. **Ghi nhận Artifacts**: Khi mỗi tệp tải thành công, tệp được đăng ký vào bảng `pipeline_stages` kèm đường dẫn tệp tin, dung lượng (`size_bytes`), nền tảng (`platform`), và mã URL nguồn.
4. **Đồng bộ UI**: Giao diện React Desktop qua WebSocket RPC có thể truy vấn `pipeline_get_status` để cập nhật trạng thái ngay lập tức trên màn hình người dùng.

---

## 8. CƠ CHẾ DỪNG AN TOÀN & DỌN DẸP TỆP TẠM

Khi người dùng nhấn hủy tác vụ tải xuống từ giao diện Electron hoặc nhấn `Ctrl + C` trên Terminal:
1. Cờ dừng khẩn cấp được kích hoạt và tiến trình nhận được tín hiệu dừng.
2. Toàn bộ các worker đang thực hiện tải sẽ lập tức ngắt kết nối socket mạng.
3. Bộ dọn dẹp quét qua danh sách các file đang tải và thư mục output, tự động xóa sạch các file rác không phải `.mp4` thông qua hàm `cleanup_non_mp4_files` hoặc xóa các tệp tạm đuôi `.part`, `.ytdl`, `.temp`, `.tmp`.
4. Xuất thông báo: `[DỌN DẸP] Đã thu hồi tài nguyên và xóa tệp tạm dở dang an toàn.`

---

## 9. CƠ CHẾ XỬ LÝ LỖI & TỰ PHỤC HỒI (SELF-HEALING)

Khi gặp lỗi tải, hệ thống tự động chẩn đoán và áp dụng kế hoạch phục hồi theo các cấp độ:
- **Exponential Backoff Retry**: Tự động thử lại tối đa 3 lần với khoảng cách thời gian tăng dần (`1s, 2s, 3s`) khi gặp sự cố gián đoạn mạng.
- **User-Agent Rotation & Header Spoofing**: Tự động đổi User-Agent qua Mobile Safari và thêm các Header đặc thù cho Douyin/TikTok để bypass hệ thống phòng thủ chặn bot.
- **Resolution Downgrade**: Hạ chất lượng tải xuống từ 1080p về 720p hoặc định dạng tốt nhất có sẵn để đảm bảo tệp vẫn được tải.
- **High-Res Synthetic Fallback**: Trường hợp URL nguồn bị lỗi nặng hoặc không khả dụng ngoại tuyến, hệ thống gọi FFmpeg để tự động tạo một tệp video đồ họa độ phân giải cao 1080x1920 có chèn thông tin tiêu đề và logo nền tảng. Điều này giúp toàn bộ các bước DAG Pipeline phía sau (như lồng tiếng, cắt highlight, chèn phụ đề) không bị gián đoạn hay sập luồng.

---

<div align="center">
  <b>CREATOROS Downloader Engine Reference Manual</b> — <i>Phiên bản tài liệu kỹ thuật chuẩn hóa cho kỹ sư vận hành hệ thống.</i>
</div>
