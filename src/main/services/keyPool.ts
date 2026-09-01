import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';

export interface KeyEntry {
  key: string;
  cooldownUntil: number;
}

export class GeminiKeyPool {
  private storagePath: string;
  private keys: KeyEntry[] = [];
  private currentIndex: number = 0;

  constructor() {
    const userData = app ? app.getPath('userData') : path.join(process.cwd(), 'temp_data');
    this.storagePath = path.join(userData, 'apiKeys.json');
    this.loadKeys();
  }

  /**
   * Load API keys safely from local JSON storage
   */
  public loadKeys(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const stored: string[] = fs.readJsonSync(this.storagePath);
        if (Array.isArray(stored)) {
          this.keys = stored.map((key) => ({
            key,
            cooldownUntil: 0,
          }));
        }
      }
    } catch (e) {
      console.error('[GeminiKeyPool] Failed to load API keys:', e);
      this.keys = [];
    }
  }

  /**
   * Persist API keys back to local storage
   */
  public saveKeys(): void {
    try {
      const rawKeys = this.keys.map((k) => k.key);
      fs.writeJsonSync(this.storagePath, rawKeys, { spaces: 2 });
    } catch (e) {
      console.error('[GeminiKeyPool] Failed to save API keys:', e);
    }
  }

  /**
   * Add a new API key to the pool
   */
  public addKey(key: string): boolean {
    const trimmedKey = key.trim();
    if (!trimmedKey) return false;

    if (!this.keys.some((k) => k.key === trimmedKey)) {
      this.keys.push({ key: trimmedKey, cooldownUntil: 0 });
      this.saveKeys();
      return true;
    }
    return false;
  }

  /**
   * Remove an API key from the pool
   */
  public removeKey(key: string): void {
    this.keys = this.keys.filter((k) => k.key !== key);
    this.saveKeys();
    this.currentIndex = 0;
  }

  /**
   * Get all active keys (masked for privacy)
   */
  public getKeys(): Array<{ key: string; isCoolingDown: boolean }> {
    const now = Date.now();
    return this.keys.map((k) => ({
      key: k.key,
      isCoolingDown: now < k.cooldownUntil,
    }));
  }

  /**
   * Execute an API function using round-robin key selection with automatic cooldown on 429 errors
   */
  public async execute<T>(apiFn: (apiKey: string) => Promise<T>): Promise<T> {
    if (this.keys.length === 0) {
      throw new Error('No API keys configured in GeminiKeyPool. Please add an API key first.');
    }

    const now = Date.now();
    let attempts = 0;

    while (attempts < this.keys.length) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      const keyObj = this.keys[this.currentIndex];

      if (now < keyObj.cooldownUntil) {
        attempts++;
        continue;
      }

      try {
        return await apiFn(keyObj.key);
      } catch (error: any) {
        const isQuotaError =
          error?.status === 429 ||
          (typeof error?.message === 'string' &&
            (error.message.includes('429') || error.message.toLowerCase().includes('quota')));

        if (isQuotaError) {
          console.warn(`[GeminiKeyPool] Key quota reached, setting cooldown: ${keyObj.key.substring(0, 6)}...`);
          keyObj.cooldownUntil = Date.now() + 60000; // 60 seconds cooldown
          attempts++;
        } else {
          throw error;
        }
      }
    }

    throw new Error('All API keys in GeminiKeyPool are currently rate-limited (429). Please retry in 60 seconds.');
  }
}

const geminiKeyPool = new GeminiKeyPool();
export default geminiKeyPool;
