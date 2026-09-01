import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedVideoData {
  id: string;
  title: string;
  content: string;
  likes: number;
  views: number;
  author: string;
  thumbnail: string;
  url: string;
}

class VideoScraperService {
  /**
   * Cào dữ liệu video từ URL
   * @param {string} url - URL của video cần quét
   * @param {string} cookie - (Optional) Cookie xác thực
   * @param {string} proxy - (Optional) Proxy sử dụng
   * @returns {Promise<ScrapedVideoData>} Dữ liệu video đã scrape
   */
  public async scrapeVideo(url: string, cookie?: string, proxy?: string): Promise<ScrapedVideoData> {
    try {
      console.log(`[VideoScraper] Bắt đầu quét: ${url}`);
      
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      if (cookie) {
        headers['Cookie'] = cookie;
      }

      // TODO: Tích hợp proxy nếu cần thiết qua HttpsProxyAgent
      
      const response = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);

      // Trích xuất dữ liệu cơ bản (Giả lập cấu trúc chung)
      // Cần tuỳ biến riêng cho từng nền tảng (YouTube, TikTok, Douyin...)
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: $('title').text() || 'Unknown Title',
        content: $('meta[name="description"]').attr('content') || 'Video description...',
        likes: 0, 
        views: 1000, 
        author: $('meta[name="author"]').attr('content') || 'Unknown Author',
        thumbnail: $('meta[property="og:image"]').attr('content') || '',
        url: url
      };
    } catch (error: any) {
      console.error(`[VideoScraper] Lỗi khi quét ${url}:`, error.message);
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }
}

export default new VideoScraperService();
