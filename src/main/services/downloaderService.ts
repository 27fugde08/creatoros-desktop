import { exec } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs-extra';
import { getLogger } from './logger';

export interface DownloadSingleOptions {
  url: string;
  saveDir: string;
  retries?: number;
  onProgress?: (progress: { status: string; attempt: number; message?: string }) => void;
}

export interface VideoDownloadItem {
  id: string;
  url: string;
  title?: string;
}

export interface DownloadSingleResult {
  success: boolean;
  stdout?: string;
  outputPath?: string;
  error?: string;
}

export interface DownloadBatchResult {
  id: string;
  url: string;
  status: 'success' | 'failed';
  stdout?: string;
  error?: string;
}

export interface BatchProgressEvent {
  type: 'start' | 'progress' | 'success' | 'error';
  video: VideoDownloadItem;
  index?: number;
  progress?: { status: string; attempt: number };
  error?: string;
}

export class DownloaderService {
  /**
   * Download a single video with retry logic and error isolation
   */
  public async downloadSingleWithRetry(
    url: string,
    saveDir: string,
    retries: number = 3,
    onProgress?: (progress: { status: string; attempt: number }) => void
  ): Promise<DownloadSingleResult> {
    if (!url || !url.trim()) {
      throw new Error('Invalid URL provided for downloading');
    }

    await fs.ensureDir(saveDir);
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < retries) {
      try {
        attempt++;
        if (onProgress) {
          onProgress({ status: 'downloading', attempt });
        }

        const outputPattern = path.join(saveDir, '%(title)s.%(ext)s');
        const output = await exec(url, {
          output: outputPattern,
          format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          noCheckCertificates: true,
          noWarnings: true,
        });

        getLogger().info(`[Downloader] Download successful for ${url}`);
        return {
          success: true,
          stdout: typeof output.stdout === 'string' ? output.stdout : String(output.stdout || ''),
        };
      } catch (err: any) {
        lastError = err;
        getLogger().warn(`[Downloader] Attempt ${attempt}/${retries} failed for ${url}: ${err.message}`);

        if (attempt >= retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delayMs = attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const errorMessage = lastError ? lastError.message : 'Unknown download error';
    getLogger().error(`[Downloader] Download failed after ${retries} attempts for ${url}: ${errorMessage}`);
    throw new Error(`Failed after ${retries} attempts: ${errorMessage}`);
  }

  /**
   * Batch download videos with dynamic concurrency limit
   */
  public async downloadBatch(
    videos: VideoDownloadItem[],
    saveDir: string,
    concurrency: number = 3,
    onEvent?: (event: BatchProgressEvent) => void
  ): Promise<DownloadBatchResult[]> {
    if (!Array.isArray(videos) || videos.length === 0) {
      return [];
    }

    await fs.ensureDir(saveDir);
    const results: DownloadBatchResult[] = [];
    let index = 0;

    const worker = async () => {
      while (index < videos.length) {
        const currentIndex = index++;
        const video = videos[currentIndex];

        if (!video || !video.url) continue;

        if (onEvent) {
          onEvent({ type: 'start', video, index: currentIndex });
        }

        try {
          const res = await this.downloadSingleWithRetry(video.url, saveDir, 3, (prog) => {
            if (onEvent) {
              onEvent({ type: 'progress', video, progress: prog });
            }
          });

          results.push({ id: video.id, url: video.url, status: 'success', stdout: res.stdout });
          if (onEvent) {
            onEvent({ type: 'success', video });
          }
        } catch (err: any) {
          const errMsg = err?.message || 'Download failed';
          results.push({ id: video.id, url: video.url, status: 'failed', error: errMsg });
          if (onEvent) {
            onEvent({ type: 'error', video, error: errMsg });
          }
        }
      }
    };

    const workerCount = Math.max(1, Math.min(concurrency, videos.length));
    const workers = Array(workerCount)
      .fill(null)
      .map(() => worker());

    await Promise.all(workers);
    return results;
  }
}

const downloaderService = new DownloaderService();
export default downloaderService;
