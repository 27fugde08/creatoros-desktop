import sys
import yt_dlp
import re

def my_hook(d):
    if d['status'] == 'downloading':
        # Lấy phần trăm và xóa các ký tự ANSI màu sắc thừa
        percent_str = d.get('_percent_str', '0.0%')
        clean_percent = re.sub(r'\x1b\[[0-9;]*m', '', percent_str).strip()
        # In ra chuẩn định dạng để Node.js đọc qua luồng stdout
        print(f"[PROGRESS] {clean_percent}", flush=True)
    elif d['status'] == 'finished':
        print(f"\n[SUCCESS] {d['filename']}", flush=True)

def download_video(url):
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': 'downloads/%(id)s.%(ext)s', # Lưu vào thư mục downloads
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': [my_hook],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("[ERROR] Missing URL", file=sys.stderr)
        sys.exit(1)
    
    target_url = sys.argv[1]
    download_video(target_url)
