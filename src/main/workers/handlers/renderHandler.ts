import videoWorker, { VideoProcessOptions, VideoProcessResult } from '../../services/videoWorker';

export type TaskProgressCallback = (progress: number, message?: string) => void;

/**
 * Handle FFmpeg Video Render & Subtitle Insertion Task
 */
export async function executeRenderTask(
  payload: VideoProcessOptions,
  onProgress?: TaskProgressCallback
): Promise<VideoProcessResult> {
  console.log(`[Render Handler] 🎬 Bắt đầu tiến trình render video FFmpeg (CUDA Acceleration)...`);

  if (!payload || !payload.input || !payload.output) {
    throw new Error('[Render Handler] Payload không hợp lệ. Cần truyền input và output video path.');
  }

  if (onProgress) onProgress(10, `Khởi tạo luồng FFmpeg mã hóa video ${payload.input}...`);
  console.log(`[Render Handler] 📂 Input: ${payload.input} -> Output: ${payload.output}`);

  try {
    if (onProgress) onProgress(30, 'Đang chuẩn bị bộ lọc chèn Subtitle & cấu hình phần cứng GPU NVENC/CPU...');

    if (onProgress) onProgress(60, 'Đang render mã hóa video H.264 & ghép âm thanh...');

    const result = await videoWorker.processVideo(payload);

    if (onProgress) onProgress(100, `Render video hoàn tất 100%! Đã xuất tại: ${result.path}`);
    console.log(`[Render Handler] ✅ Render video thành công: ${result.path}`);

    return result;
  } catch (err: any) {
    console.error(`[Render Handler] ❌ Lỗi tiến trình FFmpeg Render:`, err.message || err);
    if (onProgress) onProgress(0, `Render thất bại: ${err.message || 'Lỗi mã hóa video'}`);
    throw err;
  }
}
