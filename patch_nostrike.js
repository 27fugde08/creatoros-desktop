const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
// ==========================================
// AUTO BYPASS NO-STRIKE (ANTI-COPYRIGHT) API
// ==========================================
app.post("/api/nostrike/process", async (req, res) => {
  const { videoId, config } = req.body;
  
  // Trả về response ngay để UI không bị block
  res.json({ success: true, message: "No-Strike processing started" });

  // Giả lập luồng tiến độ render và log ffmpeg
  let mockProgress = 0;
  const intervalMs = 300;
  const step = 8;

  io.emit("nostrike_progress", { progress: 0, status: "Khởi tạo môi trường GPU...", log: "[info] Initializing hardware acceleration (CUDA NVENC)..." });

  const ffmpegLogs = [
    "[hwaccel] Successfully bound to GPU 0 (NVIDIA RTX)",
    "[input] Reading stream 0:0 (video/mp4) - 1920x1080@60fps",
    "[filter_complex] Appending horizontal flip transform (-vf hflip)",
    "[filter_complex] Applying dynamic micro-noise (noise=c0s=7:allf=t)",
    "[filter_complex] Scaling to fit padded frame (1080x1920)",
    "[filter_complex] Adding Gaussian blur to padding area (boxblur=20:2)",
    "[filter_complex] Shifting color grading vectors (hue=s=1.2)",
    "[audio] Speeding up audio by 1.05x (atempo=1.05)",
    "[encoder] Flushing final frames...",
    "[output] Writing metadata, rebuilding MD5 hashes (new hash: e4d909c290d0fb1ca068ffaddf22cbd0)"
  ];

  const interval = setInterval(() => {
    mockProgress += step;
    const logIndex = Math.floor((mockProgress / 100) * ffmpegLogs.length);
    const logStr = ffmpegLogs[Math.min(logIndex, ffmpegLogs.length - 1)];

    if (mockProgress >= 100) {
      clearInterval(interval);
      io.emit("nostrike_progress", { progress: 100, status: "Hoàn tất! MD5 đã được thay đổi.", log: "[success] Video successfully rendered to output/nostrike_video.mp4" });
    } else {
      let status = "Đang áp dụng Filter...";
      if (mockProgress > 30) status = "Đang xử lý phần cứng FFmpeg...";
      if (mockProgress > 60) status = "Đang Re-encode h264_nvenc...";
      
      io.emit("nostrike_progress", { progress: Math.min(mockProgress, 99), status, log: logStr });
    }
  }, intervalMs);
});

`;

// Insert the new route before app.post("/api/download/bulk")
const targetStr = 'app.post("/api/download/bulk"';
if (code.includes(targetStr)) {
  code = code.replace(targetStr, newRoute + targetStr);
  fs.writeFileSync('server.ts', code);
  console.log("Successfully added /api/nostrike/process");
} else {
  console.error("Could not find target string");
}
