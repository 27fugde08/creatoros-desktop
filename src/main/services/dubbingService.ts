import geminiKeyPool from './keyPool';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getLogger } from './logger';

export interface DubbingRequestData {
  originalText: string;
  customPrompt?: string;
  targetLanguage: string;
  voiceName: string;
  volume: number; // Percentage 100 - 200
}

export interface DubbingProcessResult {
  success: boolean;
  filePath: string;
  text: string;
}

export class DubbingService {
  /**
   * Process dubbing pipeline: translate text via Gemini API, synth audio, adjust volume via FFmpeg
   */
  public async processDubbing(data: DubbingRequestData): Promise<DubbingProcessResult> {
    const { originalText, customPrompt = '', targetLanguage, voiceName, volume } = data;

    if (!originalText || !originalText.trim()) {
      throw new Error('Original text is required for dubbing.');
    }

    // 1. Dịch thuật bằng Gemini API
    const translatedText = await this.translateText(originalText, customPrompt, targetLanguage);

    // 2. Chuyển Text sang Audio (TTS)
    const tempDir = app ? app.getPath('temp') : path.join(process.cwd(), 'temp');
    const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'temp_data');

    const tempAudioPath = path.join(tempDir, `dub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`);
    const finalAudioDir = path.join(userDataDir, 'dubbed_videos');
    const finalAudioPath = path.join(finalAudioDir, `result_${Date.now()}.mp3`);

    await fs.ensureDir(path.dirname(tempAudioPath));
    await fs.ensureDir(finalAudioDir);

    try {
      // Dynamic require edge-tts to handle missing optional module gracefully
      let EdgeTTS: any;
      try {
        const edgeModule = require('edge-tts');
        EdgeTTS = edgeModule.EdgeTTS || edgeModule;
      } catch (err) {
        getLogger().warn('[DubbingService] edge-tts package not installed, generating mock output audio path');
      }

      if (EdgeTTS) {
        const tts = new EdgeTTS({ voice: voiceName || 'vi-VN-HoaiMyNeural', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
        await tts.save(translatedText, tempAudioPath);
      } else {
        // Fallback placeholder file if edge-tts is unavailable
        await fs.writeFile(tempAudioPath, Buffer.from([]));
      }

      // 3. Xử lý Volume bằng FFmpeg
      const volumeFactor = Math.max(0.1, Math.min(3.0, volume / 100));

      return await new Promise<DubbingProcessResult>((resolve, reject) => {
        ffmpeg(tempAudioPath)
          .audioFilters(`volume=${volumeFactor}`)
          .save(finalAudioPath)
          .on('end', async () => {
            await fs.remove(tempAudioPath).catch(() => {});
            getLogger().info(`[DubbingService] Successfully generated dubbed audio at ${finalAudioPath}`);
            resolve({ success: true, filePath: finalAudioPath, text: translatedText });
          })
          .on('error', async (err: Error) => {
            await fs.remove(tempAudioPath).catch(() => {});
            getLogger().error('[DubbingService] FFmpeg volume adjustment failed:', err);
            reject(new Error(`FFmpeg audio processing failed: ${err.message}`));
          });
      });
    } catch (err: any) {
      await fs.remove(tempAudioPath).catch(() => {});
      getLogger().error('[DubbingService] Dubbing pipeline error:', err);
      throw err;
    }
  }

  /**
   * Translate text using Gemini Key Pool
   */
  public async translateText(text: string, customPrompt: string, lang: string): Promise<string> {
    const prompt = `
      Bạn là một chuyên gia lồng tiếng và dịch thuật chuyên nghiệp.
      Yêu cầu: Dịch đoạn văn bản sau sang ngôn ngữ: ${lang}.
      Văn phong: Tự nhiên, cảm xúc, bảo toàn ý nghĩa, không dùng từ ngữ cứng nhắc, máy móc.
      ${customPrompt ? `Hướng dẫn bổ sung: ${customPrompt}` : ''}
      
      Văn bản gốc:
      "${text}"
    `;

    return await geminiKeyPool.execute(async (apiKey: string) => {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        getLogger().error('[DubbingService] Gemini API translation call failed:', err);
        throw err;
      }
    });
  }
}

const dubbingService = new DubbingService();
export default dubbingService;
