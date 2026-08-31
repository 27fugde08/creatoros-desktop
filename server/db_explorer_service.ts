import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

// Xác định đường dẫn DB linh hoạt
export const USER_DATA_DIR = process.env.CREATOROS_USER_DATA || process.cwd();
export const CREATOROS_DB_PATH = process.env.CREATOROS_DB_PATH || path.join(USER_DATA_DIR, "creatoros_state.db");
export const SEQUELIZE_DB_PATH = path.join(USER_DATA_DIR, "database.sqlite");

function getDbPath(target?: string): string {
  if (target === "database.sqlite" || target === "sequelize") {
    return SEQUELIZE_DB_PATH;
  }
  return CREATOROS_DB_PATH;
}

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: TableColumn[];
  database: string;
}

/**
 * Mở kết nối SQLite dạng async / Promise
 */
export function openSqlite(targetDb?: string): Promise<sqlite3.Database> {
  const dbPath = getDbPath(targetDb);
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

/**
 * Khởi tạo bảng và dữ liệu mẫu phong phú cho creatoros_state.db
 */
export async function seedCreatorOSStateIfEmpty(): Promise<void> {
  const db = await openSqlite("creatoros_state.db");

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Kích hoạt chế độ WAL & Pragma
      db.run("PRAGMA journal_mode = WAL;");
      db.run("PRAGMA synchronous = NORMAL;");

      // 2. Bảng pipelines
      db.run(`
        CREATE TABLE IF NOT EXISTS pipelines (
          pipeline_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          priority TEXT DEFAULT 'HIGH',
          status TEXT DEFAULT 'RUNNING',
          current_stage_index INTEGER DEFAULT 0,
          total_stages INTEGER DEFAULT 6,
          progress_percent INTEGER DEFAULT 0,
          config_json TEXT DEFAULT '{}',
          error_message TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          completed_at INTEGER
        )
      `);

      // 3. Bảng pipeline_stages
      db.run(`
        CREATE TABLE IF NOT EXISTS pipeline_stages (
          stage_id TEXT PRIMARY KEY,
          pipeline_id TEXT NOT NULL,
          stage_name TEXT NOT NULL,
          stage_index INTEGER NOT NULL,
          status TEXT DEFAULT 'PENDING',
          input_artifacts_json TEXT DEFAULT '{}',
          output_artifacts_json TEXT DEFAULT '{}',
          execution_time_ms INTEGER DEFAULT 0,
          checkpoint_hash TEXT,
          error_log TEXT,
          started_at INTEGER,
          completed_at INTEGER,
          FOREIGN KEY(pipeline_id) REFERENCES pipelines(pipeline_id)
        )
      `);

      // 4. Bảng dag_checkpoints
      db.run(`
        CREATE TABLE IF NOT EXISTS dag_checkpoints (
          pipeline_id TEXT,
          node_id TEXT,
          status TEXT,
          artifacts_json TEXT,
          execution_time_ms REAL,
          updated_at REAL,
          PRIMARY KEY (pipeline_id, node_id)
        )
      `);

      // 5. Bảng dag_pipeline_states
      db.run(`
        CREATE TABLE IF NOT EXISTS dag_pipeline_states (
          pipeline_id TEXT PRIMARY KEY,
          title TEXT,
          priority TEXT,
          current_step_index INTEGER,
          total_steps INTEGER,
          status TEXT,
          completed_steps_json TEXT,
          artifacts_json TEXT,
          updated_at REAL
        )
      `);

      // 6. Bảng artifacts_cache
      db.run(`
        CREATE TABLE IF NOT EXISTS artifacts_cache (
          artifact_id TEXT PRIMARY KEY,
          pipeline_id TEXT NOT NULL,
          stage_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size_bytes INTEGER DEFAULT 0,
          file_type TEXT,
          sha256_hash TEXT,
          is_temporary INTEGER DEFAULT 1,
          created_at INTEGER
        )
      `);

      // 7. Bảng user_presets
      db.run(`
        CREATE TABLE IF NOT EXISTS user_presets (
          preset_id TEXT PRIMARY KEY,
          preset_name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          config_json TEXT NOT NULL,
          tags TEXT DEFAULT '[]',
          is_favorite INTEGER DEFAULT 0,
          created_at INTEGER,
          updated_at INTEGER
        )
      `);

      // 8. Bảng drm_licenses
      db.run(`
        CREATE TABLE IF NOT EXISTS drm_licenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_key TEXT UNIQUE NOT NULL,
          tier TEXT NOT NULL,
          owner_name TEXT,
          fingerprint_bound TEXT NOT NULL,
          issued_at INTEGER,
          expires_at INTEGER,
          is_active INTEGER DEFAULT 1,
          features_json TEXT,
          activated_at INTEGER
        )
      `);

      // Kiểm tra xem đã có dữ liệu mẫu chưa
      db.get("SELECT COUNT(*) as count FROM dag_checkpoints", (err, row: any) => {
        if (!err && row && row.count === 0) {
          const now = Date.now();
          const samplePipelineId1 = "dag_pipeline_viral_8921";
          const samplePipelineId2 = "dag_pipeline_comic_3304";

          // Seed dag_checkpoints
          const stmtCkpt = db.prepare(`
            INSERT OR REPLACE INTO dag_checkpoints (pipeline_id, node_id, status, artifacts_json, execution_time_ms, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          stmtCkpt.run(samplePipelineId1, "step_ingest_hash", "completed", JSON.stringify({
            input_file: "input/tu_tien_tap_45.mp4",
            sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            file_size_mb: 84.5
          }), 320.5, (now - 120000) / 1000);

          stmtCkpt.run(samplePipelineId1, "step_demucs_isolation", "completed", JSON.stringify({
            vocal_stem: "temp/cache/vocal_stem_clean.wav",
            bgm_stem: "temp/cache/bgm_isolated.wav",
            vram_peak_mb: 2850
          }), 1450.0, (now - 90000) / 1000);

          stmtCkpt.run(samplePipelineId1, "step_whisper_transcription", "completed", JSON.stringify({
            srt_path: "temp/cache/tu_tien_subtitles.srt",
            total_words: 420,
            confidence_avg: 0.96
          }), 980.2, (now - 60000) / 1000);

          stmtCkpt.run(samplePipelineId1, "step_rag_qc_audit", "completed", JSON.stringify({
            viral_score: 96,
            matched_pattern: "drama_curiosity",
            qc_passed: true,
            issues_found: []
          }), 410.8, (now - 30000) / 1000);

          stmtCkpt.run(samplePipelineId1, "step_nvenc_render", "running", JSON.stringify({
            target_resolution: "1080x1920",
            fps: 60,
            encoder: "h264_nvenc",
            rendered_percent: 68
          }), 3500.0, now / 1000);

          stmtCkpt.finalize();

          // Seed dag_pipeline_states
          db.run(`
            INSERT OR REPLACE INTO dag_pipeline_states 
            (pipeline_id, title, priority, current_step_index, total_steps, status, completed_steps_json, artifacts_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            samplePipelineId1,
            "Video Tu Tiên Kịch Tính Triệu View #45 (60 FPS No-Strike)",
            "CRITICAL",
            4,
            6,
            "RUNNING",
            JSON.stringify(["step_ingest_hash", "step_demucs_isolation", "step_whisper_transcription", "step_rag_qc_audit"]),
            JSON.stringify({
              output_preview: "output/tu_tien_tap_45_NoStrike.mp4",
              subtitles: "temp/cache/tu_tien_subtitles.srt",
              viral_hook: "Không ngờ cái kết lại bất ngờ đến thế!"
            }),
            now / 1000
          ]);

          db.run(`
            INSERT OR REPLACE INTO dag_pipeline_states 
            (pipeline_id, title, priority, current_step_index, total_steps, status, completed_steps_json, artifacts_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            samplePipelineId2,
            "AI Comic Đồng Bộ 100% Nhân Vật: Ma Tôn Xuống Núi Ep.02",
            "HIGH",
            6,
            6,
            "COMPLETED",
            JSON.stringify(["step_prompt_dna", "step_face_lock", "step_voice_synth", "step_panel_stitch", "step_nvenc", "step_dispatch"]),
            JSON.stringify({
              output_video: "output/comic_maton_ep02.mp4",
              seed_locked: 89412958102,
              duration: "01:25"
            }),
            (now - 3600000) / 1000
          ]);

          // Seed pipelines
          db.run(`
            INSERT OR REPLACE INTO pipelines
            (pipeline_id, title, priority, status, current_stage_index, total_stages, progress_percent, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            samplePipelineId1,
            "Video Tu Tiên Kịch Tính Triệu View #45 (60 FPS No-Strike)",
            "CRITICAL",
            "RUNNING",
            4,
            6,
            68,
            JSON.stringify({ gpu_encoder: "nvenc", speed: "1.05x", pitch: "+3.2%", resolution: "1080x1920" }),
            now - 180000,
            now
          ]);

          // Seed pipeline_stages
          const stmtStage = db.prepare(`
            INSERT OR REPLACE INTO pipeline_stages 
            (stage_id, pipeline_id, stage_name, stage_index, status, input_artifacts_json, output_artifacts_json, execution_time_ms, checkpoint_hash, started_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmtStage.run(
            `${samplePipelineId1}_stg_0`, samplePipelineId1, "1_DOWNLOAD_INGEST", 0, "COMPLETED",
            JSON.stringify({ source_url: "https://youtu.be/sample45" }),
            JSON.stringify({ local_path: "input/tu_tien_tap_45.mp4" }),
            320, "sha256_chk_01", now - 180000, now - 179680
          );
          stmtStage.run(
            `${samplePipelineId1}_stg_1`, samplePipelineId1, "2_DEMUCS_STEM_ISOLATION", 1, "COMPLETED",
            JSON.stringify({ input: "input/tu_tien_tap_45.mp4" }),
            JSON.stringify({ vocal: "temp/cache/vocal.wav", bgm: "temp/cache/bgm.wav" }),
            1450, "sha256_chk_02", now - 179680, now - 178230
          );
          stmtStage.run(
            `${samplePipelineId1}_stg_2`, samplePipelineId1, "3_AI_HIGHLIGHT_RAG", 2, "COMPLETED",
            JSON.stringify({ transcript: "tu_tien_subtitles.srt" }),
            JSON.stringify({ score: 96, hook: "3 Giây Vàng Thu Hút" }),
            980, "sha256_chk_03", now - 178230, now - 177250
          );
          stmtStage.run(
            `${samplePipelineId1}_stg_3`, samplePipelineId1, "4_QC_PRE_VALIDATION", 3, "COMPLETED",
            JSON.stringify({ check_copyright: true }),
            JSON.stringify({ clean_content_id: true }),
            410, "sha256_chk_04", now - 177250, now - 176840
          );
          stmtStage.run(
            `${samplePipelineId1}_stg_4`, samplePipelineId1, "5_RENDER_FFMPEG_NVENC", 4, "RUNNING",
            JSON.stringify({ preset: "p4", rc: "vbr" }),
            JSON.stringify({ current_fps: 68.5 }),
            3500, "sha256_chk_05", now - 176840, null
          );

          stmtStage.finalize();

          // Seed user_presets
          db.run(`
            INSERT OR REPLACE INTO user_presets 
            (preset_id, preset_name, category, description, config_json, tags, is_favorite, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            "preset_tu_tien_shorts",
            "Tu Tiên & Huyền Huyễn Shorts 60FPS",
            "Anime / Comic",
            "Tự động trích xuất Hook 3s đầu, tách vocal lồng nhạc Epic BGM và đổi MD5 chống quét bản quyền.",
            JSON.stringify({ resolution: "1080x1920", fps: 60, speed: 1.05, pitch: 3.2, font: "Montserrat-Black", lut: "Cinematic Teal" }),
            JSON.stringify(["TuTiên", "Shorts", "NVENC", "NoStrike"]),
            1,
            now - 86400000,
            now
          ]);

          // Seed drm_licenses
          db.run(`
            INSERT OR REPLACE INTO drm_licenses 
            (license_key, tier, owner_name, fingerprint_bound, issued_at, expires_at, is_active, features_json, activated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            "CRTOR-PRO-2026-X981-OFFLINE",
            "ENTERPRISE_LIFETIME",
            "VIP Studio Creator",
            "GPU-GTX1660S-UUID-9812-7712",
            now - 2592000000,
            now + 315360000000,
            1,
            JSON.stringify(["UNLIMITED_DAG_WORKFLOWS", "LOCAL_LLM_RAG", "DEMUCS_CUDA", "NVENC_DUAL_STREAM", "COMMERCIAL_MATRIX_PUSH"]),
            now - 2500000000
          ]);
        }
        db.close();
        resolve();
      });
    });
  });
}

/**
 * Lấy thống kê tổng quan của cả 2 cơ sở dữ liệu SQLite
 */
export async function getDatabaseStats() {
  const stats: Record<string, any> = {};

  const checkDb = async (name: string, filePath: string) => {
    let exists = false;
    let sizeBytes = 0;
    let tableCount = 0;
    let tables: string[] = [];
    let journalMode = "unknown";

    if (fs.existsSync(filePath)) {
      exists = true;
      const fileStat = fs.statSync(filePath);
      sizeBytes = fileStat.size;

      try {
        const db = await openSqlite(name);
        tables = await new Promise<string[]>((res, rej) => {
          db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows: any[]) => {
            if (err) return rej(err);
            res(rows.map(r => r.name));
          });
        });

        tableCount = tables.length;

        const pragmaRow = await new Promise<any>((res) => {
          db.get("PRAGMA journal_mode", (err, row) => {
            res(row || {});
          });
        });
        journalMode = pragmaRow.journal_mode || "wal";
        db.close();
      } catch (err) {
        console.error(`Error checking DB ${name}:`, err);
      }
    }

    return {
      name,
      filePath,
      exists,
      sizeBytes,
      sizeFormatted: sizeBytes > 1048576 
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB` 
        : `${(sizeBytes / 1024).toFixed(1)} KB`,
      tableCount,
      tables,
      journalMode
    };
  };

  stats["creatoros_state.db"] = await checkDb("creatoros_state.db", CREATOROS_DB_PATH);
  stats["database.sqlite"] = await checkDb("database.sqlite", SEQUELIZE_DB_PATH);

  return stats;
}

/**
 * Lấy danh sách tất cả các bảng cùng schema chi tiết & số dòng
 */
export async function getTablesList(targetDb = "creatoros_state.db"): Promise<TableInfo[]> {
  const db = await openSqlite(targetDb);

  try {
    const tableNames = await new Promise<string[]>((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC", (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(r => r.name));
      });
    });

    const result: TableInfo[] = [];

    for (const tbl of tableNames) {
      // 1. Get row count
      const countRow = await new Promise<any>((res) => {
        db.get(`SELECT COUNT(*) as cnt FROM "${tbl}"`, (err, r) => {
          res(r || { cnt: 0 });
        });
      });

      // 2. Get table info/columns
      const columns = await new Promise<TableColumn[]>((res) => {
        db.all(`PRAGMA table_info("${tbl}")`, (err, rows: any[]) => {
          res(rows || []);
        });
      });

      result.push({
        name: tbl,
        rowCount: countRow.cnt,
        columns,
        database: targetDb
      });
    }

    db.close();
    return result;
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Truy vấn danh sách dòng từ một bảng kèm phân trang, tìm kiếm & sắp xếp
 */
export async function queryTableRows(
  tableName: string,
  options: {
    targetDb?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    filterColumn?: string;
    filterValue?: string;
  } = {}
) {
  const {
    targetDb = "creatoros_state.db",
    page = 1,
    pageSize = 25,
    search = "",
    sortBy,
    sortOrder = "DESC",
    filterColumn,
    filterValue
  } = options;

  const db = await openSqlite(targetDb);

  try {
    // 1. Lấy thông tin cột
    const columns = await new Promise<TableColumn[]>((res) => {
      db.all(`PRAGMA table_info("${tableName}")`, (err, rows: any[]) => {
        res(rows || []);
      });
    });

    // 2. Xây dựng câu WHERE
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filterColumn && filterValue !== undefined && filterValue !== "") {
      whereClauses.push(`"${filterColumn}" LIKE ?`);
      params.push(`%${filterValue}%`);
    }

    if (search.trim()) {
      const searchTerms = columns
        .filter(c => c.type.toLowerCase().includes("text") || c.type.toLowerCase().includes("char") || c.type.toLowerCase().includes("varchar") || c.name.includes("id") || c.name.includes("title") || c.name.includes("status"))
        .map(c => `"${c.name}" LIKE ?`);

      if (searchTerms.length > 0) {
        whereClauses.push(`(${searchTerms.join(" OR ")})`);
        for (let i = 0; i < searchTerms.length; i++) {
          params.push(`%${search.trim()}%`);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 3. Đếm tổng số dòng thoả mãn
    const countSql = `SELECT COUNT(*) as total FROM "${tableName}" ${whereSql}`;
    const totalCountRow = await new Promise<any>((resolve, reject) => {
      db.get(countSql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || { total: 0 });
      });
    });

    const totalRows = totalCountRow.total;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    const offset = (page - 1) * pageSize;

    // 4. Xây dựng ORDER BY
    let orderSql = "";
    if (sortBy && columns.some(c => c.name === sortBy)) {
      orderSql = `ORDER BY "${sortBy}" ${sortOrder === "ASC" ? "ASC" : "DESC"}`;
    } else {
      // Ưu tiên sắp xếp theo cột updated_at, created_at, id
      const autoSortCol = columns.find(c => ["updated_at", "updatedAt", "created_at", "createdAt", "pipeline_id", "id"].includes(c.name));
      if (autoSortCol) {
        orderSql = `ORDER BY "${autoSortCol.name}" DESC`;
      }
    }

    // 5. Lấy dữ liệu dòng
    const dataSql = `SELECT * FROM "${tableName}" ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const rows = await new Promise<any[]>((resolve, reject) => {
      db.all(dataSql, [...params, pageSize, offset], (err, r) => {
        if (err) return reject(err);
        resolve(r || []);
      });
    });

    // 6. Tìm Primary Key column
    const pkCol = columns.find(c => c.pk === 1)?.name || columns[0]?.name || "id";

    db.close();

    return {
      tableName,
      database: targetDb,
      columns,
      primaryKeyColumn: pkCol,
      rows,
      pagination: {
        page,
        pageSize,
        totalRows,
        totalPages
      }
    };
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Thực thi câu lệnh SQL tuỳ biến an toàn (SELECT)
 */
export async function executeCustomQuery(sql: string, targetDb = "creatoros_state.db") {
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // Chỉ cho phép SELECT / PRAGMA / EXPLAIN để an toàn khi query tự do
  if (!lowerSql.startsWith("select") && !lowerSql.startsWith("pragma") && !lowerSql.startsWith("explain")) {
    throw new Error("Chỉ hỗ trợ thực thi các câu lệnh SELECT, PRAGMA hoặc EXPLAIN để đảm bảo tính an toàn.");
  }

  const db = await openSqlite(targetDb);
  const startTime = Date.now();

  try {
    const rows = await new Promise<any[]>((resolve, reject) => {
      db.all(cleanSql, (err, r) => {
        if (err) return reject(err);
        resolve(r || []);
      });
    });

    const durationMs = Date.now() - startTime;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    db.close();

    return {
      sql: cleanSql,
      database: targetDb,
      rowCount: rows.length,
      durationMs,
      columns,
      rows
    };
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Xoá một dòng khỏi bảng theo Primary Key hoặc cột định danh
 */
export async function deleteTableRow(
  tableName: string,
  criteria: Record<string, any>,
  targetDb = "creatoros_state.db"
) {
  const db = await openSqlite(targetDb);

  try {
    const whereParts: string[] = [];
    const params: any[] = [];

    for (const [col, val] of Object.entries(criteria)) {
      whereParts.push(`"${col}" = ?`);
      params.push(val);
    }

    if (whereParts.length === 0) {
      throw new Error("Không có điều kiện định danh dòng cần xoá.");
    }

    const deleteSql = `DELETE FROM "${tableName}" WHERE ${whereParts.join(" AND ")}`;

    const changes = await new Promise<number>((resolve, reject) => {
      db.run(deleteSql, params, function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    db.close();
    return {
      success: true,
      tableName,
      deletedCount: changes
    };
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Làm rỗng bảng (Clear / Truncate)
 */
export async function clearTable(tableName: string, targetDb = "creatoros_state.db") {
  const db = await openSqlite(targetDb);

  try {
    const deleteSql = `DELETE FROM "${tableName}"`;
    const changes = await new Promise<number>((resolve, reject) => {
      db.run(deleteSql, function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    db.close();
    return {
      success: true,
      tableName,
      clearedRows: changes
    };
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Chèn một Mock DAG Checkpoint / Test Row vào creatoros_state.db
 */
export async function insertMockDAGCheckpoint(data: {
  pipelineId?: string;
  nodeId?: string;
  status?: string;
  artifacts?: Record<string, any>;
  durationMs?: number;
}) {
  const db = await openSqlite("creatoros_state.db");
  const now = Date.now();

  const pipelineId = data.pipelineId || `dag_test_${now}`;
  const nodeId = data.nodeId || "step_demucs_isolation";
  const status = data.status || "completed";
  const artifactsJson = JSON.stringify(data.artifacts || {
    vocal_track: "temp/cache/mock_vocal.wav",
    bgm_track: "temp/cache/mock_bgm.wav",
    vram_peak_mb: 2950,
    mock_injected: true
  });
  const durationMs = data.durationMs || 1250.5;

  try {
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO dag_checkpoints (pipeline_id, node_id, status, artifacts_json, execution_time_ms, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [pipelineId, nodeId, status, artifactsJson, durationMs, now / 1000], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Cập nhật cả dag_pipeline_states
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO dag_pipeline_states 
        (pipeline_id, title, priority, current_step_index, total_steps, status, completed_steps_json, artifacts_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pipelineId,
        `Tác Vụ Kiểm Thử DAG Auto-Resume #${now.toString().slice(-4)}`,
        "HIGH",
        2,
        6,
        "RUNNING",
        JSON.stringify(["step_ingest_hash", nodeId]),
        artifactsJson,
        now / 1000
      ], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    db.close();
    return {
      success: true,
      pipelineId,
      nodeId,
      status,
      message: `Đã chèn thành công Checkpoint mẫu [${pipelineId} :: ${nodeId}]`
    };
  } catch (err) {
    db.close();
    throw err;
  }
}

/**
 * Tối ưu hoá & Thu nhỏ kích thước SQLite DB (VACUUM & PRAGMA optimize)
 */
export async function vacuumDatabase(targetDb = "creatoros_state.db") {
  const db = await openSqlite(targetDb);

  try {
    await new Promise<void>((resolve, reject) => {
      db.run("VACUUM", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      db.run("PRAGMA optimize", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    db.close();
    return {
      success: true,
      database: targetDb,
      message: "Đã tối ưu hóa và giải phóng dung lượng SQLite thành công."
    };
  } catch (err) {
    db.close();
    throw err;
  }
}
