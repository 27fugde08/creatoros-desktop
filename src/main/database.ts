import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';

export interface DownloadHistoryRecord {
  id: string;
  url: string;
  title: string;
  platform?: string;
  status: string;
  filePath?: string;
  fileSize?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueueTaskRecord {
  id: string;
  type: string;
  title: string;
  status: string;
  progress: number;
  payload?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string = '';
  private isInitialized: boolean = false;

  /**
   * Get the safe database storage path inside user's appData directory
   */
  public getDatabasePath(): string {
    if (this.dbPath) return this.dbPath;

    let userDataDir: string;
    try {
      userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'temp_data');
    } catch {
      userDataDir = process.env.CREATOROS_USER_DATA || path.join(process.cwd(), 'temp_data');
    }

    fs.ensureDirSync(userDataDir);
    this.dbPath = path.join(userDataDir, 'creatoros_state.db');
    return this.dbPath;
  }

  /**
   * Safe Initialization of SQLite Database connection, tables, and indexes
   */
  public async initDatabase(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('[Database Manager] ℹ️ Database connection already initialized.');
      return;
    }

    const targetDbPath = this.getDatabasePath();
    console.log(`[Database Manager] 🗄️ Initializing SQLite Database at: ${targetDbPath}`);

    return new Promise((resolve, reject) => {
      // Enable verbose mode for detailed sqlite3 trace
      const verboseSqlite = sqlite3.verbose();

      this.db = new verboseSqlite.Database(targetDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
        if (err) {
          console.error('[Database Manager] ❌ Error opening SQLite database file:', err.message);
          return reject(err);
        }

        console.log('[Database Manager] ✅ Connected to SQLite database successfully.');

        try {
          // Enable WAL mode (Write-Ahead Logging) and set busy timeout for database lock protection
          await this.runQuery('PRAGMA journal_mode = WAL;');
          await this.runQuery('PRAGMA busy_timeout = 5000;');
          await this.runQuery('PRAGMA synchronous = NORMAL;');

          // Create Tables & Indexes
          await this.createSchemas();
          this.isInitialized = true;
          console.log('[Database Manager] 🎉 Database schemas & indexes verified successfully.');
          resolve();
        } catch (schemaErr: any) {
          console.error('[Database Manager] ❌ Failed to create database schemas:', schemaErr.message);
          reject(schemaErr);
        }
      });
    });
  }

  /**
   * Create required Database Tables & Indexes
   */
  private async createSchemas(): Promise<void> {
    // 1. Download History Table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS download_history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        platform TEXT,
        status TEXT NOT NULL,
        file_path TEXT,
        file_size TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 2. Queue Tasks Table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS queue_tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        payload TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 3. Application Settings Table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Indexes for high performance querying
    await this.runQuery('CREATE INDEX IF NOT EXISTS idx_downloads_status ON download_history(status);');
    await this.runQuery('CREATE INDEX IF NOT EXISTS idx_downloads_created ON download_history(created_at);');
    await this.runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_status ON queue_tasks(status);');
    await this.runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_created ON queue_tasks(created_at);');
  }

  /**
   * Promise wrapper for db.run (INSERT / UPDATE / DELETE)
   */
  public async runQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function (err) {
        if (err) {
          console.error(`[Database Manager] ❌ Query Execution Error: ${err.message} | SQL: ${sql}`);
          return reject(err);
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Promise wrapper for db.all (SELECT Multiple Rows)
   */
  public async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`[Database Manager] ❌ Query All Error: ${err.message} | SQL: ${sql}`);
          return reject(err);
        }
        resolve(rows as T[]);
      });
    });
  }

  /**
   * Promise wrapper for db.get (SELECT Single Row)
   */
  public async getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          console.error(`[Database Manager] ❌ Query Single Error: ${err.message} | SQL: ${sql}`);
          return reject(err);
        }
        resolve(row ? (row as T) : null);
      });
    });
  }

  // ==========================================
  // CRUD HELPER METHODS: DOWNLOAD HISTORY
  // ==========================================

  public async saveDownloadRecord(record: Partial<DownloadHistoryRecord> & { id: string; url: string; title: string }): Promise<void> {
    const now = Date.now();
    const sql = `
      INSERT INTO download_history (id, url, title, platform, status, file_path, file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        platform = excluded.platform,
        status = excluded.status,
        file_path = excluded.file_path,
        file_size = excluded.file_size,
        updated_at = excluded.updated_at;
    `;
    await this.runQuery(sql, [
      record.id,
      record.url,
      record.title,
      record.platform || 'unknown',
      record.status || 'pending',
      record.filePath || null,
      record.fileSize || null,
      record.createdAt || now,
      now,
    ]);
  }

  public async getDownloadHistory(limit: number = 100): Promise<DownloadHistoryRecord[]> {
    const sql = 'SELECT * FROM download_history ORDER BY created_at DESC LIMIT ?;';
    const rows = await this.getAll<any>(sql, [limit]);
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      platform: r.platform,
      status: r.status,
      filePath: r.file_path,
      fileSize: r.file_size,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async deleteDownloadRecord(id: string): Promise<void> {
    await this.runQuery('DELETE FROM download_history WHERE id = ?;', [id]);
  }

  // ==========================================
  // CRUD HELPER METHODS: QUEUE TASKS
  // ==========================================

  public async saveQueueTask(task: Partial<QueueTaskRecord> & { id: string; type: string; title: string }): Promise<void> {
    const now = Date.now();
    const sql = `
      INSERT INTO queue_tasks (id, type, title, status, progress, payload, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        title = excluded.title,
        status = excluded.status,
        progress = excluded.progress,
        payload = excluded.payload,
        error = excluded.error,
        updated_at = excluded.updated_at;
    `;
    await this.runQuery(sql, [
      task.id,
      task.type,
      task.title,
      task.status || 'queued',
      task.progress || 0,
      task.payload ? JSON.stringify(task.payload) : null,
      task.error || null,
      task.createdAt || now,
      now,
    ]);
  }

  public async updateTaskStatus(id: string, status: string, progress?: number, error?: string): Promise<void> {
    const now = Date.now();
    let sql = 'UPDATE queue_tasks SET status = ?, updated_at = ?';
    const params: any[] = [status, now];

    if (progress !== undefined) {
      sql += ', progress = ?';
      params.push(progress);
    }
    if (error !== undefined) {
      sql += ', error = ?';
      params.push(error);
    }

    sql += ' WHERE id = ?;';
    params.push(id);

    await this.runQuery(sql, params);
  }

  public async getQueueTasks(limit: number = 100): Promise<QueueTaskRecord[]> {
    const sql = 'SELECT * FROM queue_tasks ORDER BY created_at ASC LIMIT ?;';
    const rows = await this.getAll<any>(sql, [limit]);
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      status: r.status,
      progress: r.progress,
      payload: r.payload ? JSON.parse(r.payload) : undefined,
      error: r.error,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async deleteQueueTask(id: string): Promise<void> {
    await this.runQuery('DELETE FROM queue_tasks WHERE id = ?;', [id]);
  }

  // ==========================================
  // CRUD HELPER METHODS: APP SETTINGS
  // ==========================================

  public async getSetting(key: string): Promise<string | null> {
    const row = await this.getOne<{ value: string }>('SELECT value FROM app_settings WHERE key = ?;', [key]);
    return row ? row.value : null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    const now = Date.now();
    const sql = `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at;
    `;
    await this.runQuery(sql, [key, value, now]);
  }

  /**
   * Safe close of database connection on app shutdown
   */
  public async closeDatabase(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      console.log('[Database Manager] ⏳ Closing SQLite database connection...');
      this.db!.close((err) => {
        if (err) {
          console.error('[Database Manager] ❌ Error closing SQLite database:', err.message);
        } else {
          console.log('[Database Manager] 👋 SQLite database connection closed cleanly.');
        }
        this.db = null;
        this.isInitialized = false;
        resolve();
      });
    });
  }
}

export const databaseManager = new DatabaseManager();
export default databaseManager;
