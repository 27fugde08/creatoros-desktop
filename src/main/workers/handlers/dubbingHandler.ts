import dubbingService, { DubbingRequestData, DubbingProcessResult } from '../../services/dubbingService';

export type TaskProgressCallback = (progress: number, message?: string) => void;

/**
 * Handle AI Dubbing & TTS Task
 */
export async function executeDubbingTask(
  payload: DubbingRequestData,
  onProgress?: TaskProgressCallback
): Promise<DubbingProcessResult> {
  console.log(`[Dubbing Handler] 🎙️ Bắt đầu tiến trình dịch thuật & lồng tiếng AI...`);

  if (!payload || !payload.originalText || !payload.originalText.trim()) {
    throw new Error('[Dubbing Handler] Văn bản gốc (originalText) là bắt buộc cho lồng tiếng.');
  }

  // 1. Dịch văn bản qua Gemini API
  if (onProgress) onProgress(15, `Đang dịch văn bản sang tiếng ${payload.targetLanguage || 'Việt'} qua Gemini AI...`);
  console.log(`[Dubbing Handler] 🤖 Gọi Gemini API dịch thuật văn bản (${payload.originalText.length} ký tự)...`);

  try {
    if (onProgress) onProgress(40, 'Đang tạo file âm thanh TTS với giọng đọc AI...');
    console.log(`[Dubbing Handler] 🔊 Khởi tạo luồng TTS giọng đọc: ${payload.voiceName || 'vi-VN-HoaiMyNeural'}...`);

    if (onProgress) onProgress(70, `Đang hiệu chỉnh âm lượng audio (${payload.volume || 100}%)...`);

    const result = await dubbingService.processDubbing(payload);

    if (onProgress) onProgress(100, `Hoàn tất lồng tiếng AI! File lưu tại: ${result.filePath}`);
    console.log(`[Dubbing Handler] ✅ Tiến trình lồng tiếng hoàn thành thành công: ${result.filePath}`);

    return result;
  } catch (err: any) {
    console.error(`[Dubbing Handler] ❌ Lỗi tiến trình lồng tiếng AI:`, err.message || err);
    if (onProgress) onProgress(0, `Thất bại: ${err.message || 'Lỗi không xác định'}`);
    throw err;
  }
}
