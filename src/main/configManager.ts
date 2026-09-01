import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';

interface AppConfig {
  videoStoragePath: string;
  skipCompletedVideos: boolean;
  [key: string]: any;
}

class ConfigManager {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    const userData = app ? app.getPath('userData') : path.join(process.cwd(), 'temp_data');
    this.configPath = path.join(userData, 'config.json');
    this.config = {
      videoStoragePath: '',
      skipCompletedVideos: false
    };

    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readJsonSync(this.configPath);
        this.config = { ...this.config, ...data };
      } else {
        this.saveConfig();
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }

  private saveConfig(): void {
    try {
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    } catch (err) {
      console.error('Error saving config:', err);
    }
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  public getAll(): AppConfig {
    return { ...this.config };
  }
}

export default new ConfigManager();

