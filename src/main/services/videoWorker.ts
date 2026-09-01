import ffmpeg from 'fluent-ffmpeg';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export interface SubtitleConfig {
  font: string;
  size: number;
  color: string;
  pos?: string;
}

export interface VideoProcessOptions {
  input: string;
  output: string;
  subtitle: string;
  subConfig: SubtitleConfig;
}

export interface VideoProcessResult {
  success: boolean;
  path: string;
}

class VideoWorker {
  private useGpu: boolean;

  constructor() {
    this.useGpu = this.detectHardware();
  }

  /**
   * Detect if NVIDIA GPU is available for hardware acceleration
   * @returns {boolean} True if NVIDIA GPU is detected
   */
  private detectHardware(): boolean {
    try {
      // Check for NVIDIA driver via nvidia-smi
      execSync('nvidia-smi', { stdio: 'ignore' });
      console.log('[VideoWorker] NVIDIA GPU detected, enabling CUDA acceleration.');
      return true;
    } catch (e) {
      console.warn('[VideoWorker] No NVIDIA GPU detected or driver issue. Falling back to CPU.');
      return false;
    }
  }

  /**
   * Process video with subtitles
   * @param {VideoProcessOptions} options Video processing options
   * @param {boolean} isRetry Flag to indicate if this is a retry attempt
   * @returns {Promise<VideoProcessResult>} Process result
   */
  public async processVideo(options: VideoProcessOptions, isRetry: boolean = false): Promise<VideoProcessResult> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure directories exist
        const outputDir = path.dirname(options.output);
        fs.ensureDirSync(outputDir);

        const command = ffmpeg(options.input);

        // Configure Subtitle Filter (Escape Windows characters for FFmpeg)
        const subPath = options.subtitle.replace(/\\/g, '/').replace(/:/g, '\\:');
        const filter = `subtitles='${subPath}':force_style='FontName=${options.subConfig.font},FontSize=${options.subConfig.size},PrimaryColour=${options.subConfig.color}'`;

        // Configure Hardware Acceleration (CUDA vs CPU)
        const isGpu = this.useGpu && !isRetry;
        
        if (isGpu) {
          command
            .inputOptions('-hwaccel cuda')
            .videoCodec('h264_nvenc')
            .outputOptions(['-preset p4', '-tune hq']);
        } else {
          command
            .videoCodec('libx264')
            .outputOptions(['-preset medium', '-crf 23']);
        }

        command
          .videoFilters(filter)
          .save(options.output)
          .on('start', (cmd: string) => console.log(`[VideoWorker] FFmpeg started with command: ${cmd}`))
          .on('end', () => {
            console.log(`[VideoWorker] Successfully processed video: ${options.output}`);
            resolve({ success: true, path: options.output });
          })
          .on('error', (err: any) => {
            if (isGpu && !isRetry) {
              console.warn('[VideoWorker] GPU rendering failed, retrying with CPU...', err.message);
              // Fallback: Retry with CPU
              return resolve(this.processVideo(options, true));
            }
            console.error('[VideoWorker] FFmpeg processing failed:', err);
            reject(err);
          });
      } catch (error) {
        console.error('[VideoWorker] Error setting up FFmpeg:', error);
        reject(error);
      }
    });
  }
}

export default new VideoWorker();
