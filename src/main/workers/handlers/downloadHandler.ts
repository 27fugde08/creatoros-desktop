import videoScraperService, { ScrapedVideoData } from '../../services/scraper';
import downloaderService, { DownloadSingleResult } from '../../services/downloaderService';
import configManager from '../../configManager';

export interface ScrapeTaskPayload {
  urls: string[];
  cookie?: string;
  proxy?: string;
}

export interface SingleDownloadTaskPayload {
  url: string;
  saveDir?: string;
  retries?: number;
}

export interface BatchDownloadTaskPayload {
  videos: Array<{ id: string; url: string; title?: string }>;
  saveDir?: string;
  concurrency?: number;
}

export type TaskProgressCallback = (progress: number, message?: string) => void;

/**
 * Handle Scrape Videos Task
 */
export async function executeScrapeTask(
  payload: ScrapeTaskPayload,
  onProgress?: TaskProgressCallback
): Promise<Array<ScrapedVideoData | { url: string; error: string }>> {
  console.log(`[Download Handler] 🔍 Bắt đầu quét ${payload?.urls?.length || 0} URLs...`);
  if (!payload || !Array.isArray(payload.urls) || payload.urls.length === 0) {
    throw new Error('Payload quét URL không hợp lệ (cần danh sách url non-empty).');
  }

  const results: Array<ScrapedVideoData | { url: string; error: string }> = [];
  const total = payload.urls.length;

  if (onProgress) onProgress(5, `Bắt đầu quét ${total} đường dẫn video...`);

  for (let i = 0; i < total; i++) {
    const url = payload.urls[i].trim();
    if (!url) continue;

    console.log(`[Download Handler] 🌐 Quét URL [${i + 1}/${total}]: ${url}`);
    try {
      const data = await videoScraperService.scrapeVideo(url, payload.cookie, payload.proxy);
      results.push(data);
      console.log(`[Download Handler] ✅ Quét thành công: ${data.title || url}`);
    } catch (err: any) {
      console.error(`[Download Handler] ❌ Lỗi quét ${url}:`, err.message || err);
      results.push({ url, error: err.message || 'Scrape failed' });
    }

    const currentProgress = Math.round(((i + 1) / total) * 90) + 5;
    if (onProgress) {
      onProgress(currentProgress, `Đã bóc tách ${i + 1}/${total} đường dẫn.`);
    }
  }

  if (onProgress) onProgress(100, `Hoàn tất quét ${results.length} đường dẫn video.`);
  console.log(`[Download Handler] 🎉 Quét hoàn tất ${results.length} item.`);
  return results;
}

/**
 * Handle Batch Download Task
 */
export async function executeBatchDownloadTask(
  payload: BatchDownloadTaskPayload,
  onProgress?: TaskProgressCallback
): Promise<Array<{ id: string; status: 'success' | 'failed' | 'error'; stdout?: string; error?: string }>> {
  const videos = payload?.videos || [];
  console.log(`[Download Handler] 📥 Bắt đầu tải hàng loạt ${videos.length} video...`);

  if (!Array.isArray(videos) || videos.length === 0) {
    throw new Error('Danh sách video tải xuống không hợp lệ.');
  }

  const storagePath = payload.saveDir || (configManager.get('videoStoragePath') as string) || './output/downloads';
  const total = videos.length;
  const results: Array<{ id: string; status: 'success' | 'failed' | 'error'; stdout?: string; error?: string }> = [];

  if (onProgress) onProgress(5, `Khởi chạy luồng tải ${total} video đến ${storagePath}...`);

  for (let i = 0; i < total; i++) {
    const video = videos[i];
    if (!video || !video.url) continue;

    console.log(`[Download Handler] ⬇️ Tải video [${i + 1}/${total}]: ${video.url}`);
    if (onProgress) {
      onProgress(
        Math.round((i / total) * 90) + 5,
        `Đang tải video ${i + 1}/${total}: ${video.title || video.url}`
      );
    }

    try {
      const res: DownloadSingleResult = await downloaderService.downloadSingleWithRetry(
        video.url,
        storagePath,
        payload.concurrency || 3
      );
      results.push({ id: video.id, status: 'success', stdout: res.stdout, error: undefined });
      console.log(`[Download Handler] ✅ Tải thành công video ID: ${video.id}`);
    } catch (err: any) {
      const errMsg = err?.message || 'Download failed';
      console.error(`[Download Handler] ❌ Thất bại khi tải video ID ${video.id}:`, errMsg);
      results.push({ id: video.id, status: 'error', error: errMsg });
    }
  }

  if (onProgress) onProgress(100, `Hoàn tất tải xuống ${results.length}/${total} video.`);
  console.log(`[Download Handler] 🎉 Tác vụ tải xuống hàng loạt hoàn tất.`);
  return results;
}
