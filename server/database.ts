import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Khởi tạo connection SQLite động an toàn trong thư mục userData của người dùng
const dbStorage = process.env.CREATOROS_USER_DATA 
  ? path.join(process.env.CREATOROS_USER_DATA, 'database.sqlite')
  : './database.sqlite';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbStorage,
  logging: false,
  pool: {
    max: 100, // Tối đa 100 kết nối đồng thời
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Định nghĩa Model VideoTask
export const VideoTask = sequelize.define("VideoTask", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending"
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  localFilePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  error: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Định nghĩa Model GlobalTask để lưu hàng đợi công việc của CreatorOS
export const GlobalTask = sequelize.define("GlobalTask", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetChannel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedDuration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resolution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  viralScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  scriptSnippet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT, // Sẽ lưu JSON.stringify của mảng string[]
    allowNull: true
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedAt: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  scheduledTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "queued" // queued, processing, completed, failed, paused
  },
  currentStep: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  speed: {
    type: DataTypes.STRING,
    allowNull: true
  },
  eta: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  completedAt: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  logs: {
    type: DataTypes.TEXT, // Sẽ lưu JSON.stringify của mảng logs
    allowNull: true
  },
  outputArtifact: {
    type: DataTypes.TEXT, // Sẽ lưu JSON.stringify của outputArtifact
    allowNull: true
  },
  error: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Định nghĩa Model PipelineJob để lưu trữ Unified Pipeline Orchestrator & Checkpoints
export const PipelineJob = sequelize.define("PipelineJob", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: "HIGH" // HIGH, NORMAL, LOW
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "queued" // queued, running, paused, completed, failed
  },
  currentStepIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSteps: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  completedSteps: {
    type: DataTypes.TEXT, // JSON.stringify(string[])
    allowNull: true
  },
  artifacts: {
    type: DataTypes.TEXT, // JSON.stringify(object)
    allowNull: true
  },
  checkpointSaved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hardwareSnapshot: {
    type: DataTypes.TEXT, // JSON.stringify(HardwareStats)
    allowNull: true
  },
  logs: {
    type: DataTypes.TEXT, // JSON.stringify(string[])
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
});

// Định nghĩa Model HealingIncident cho Agentic Self-Healing Engine
export const HealingIncident = sequelize.define("HealingIncident", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  pipeline_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  task_type: {
    type: DataTypes.STRING,
    defaultValue: "ffmpeg_render"
  },
  error_category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  error_raw_snippet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  root_cause_analysis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  suggested_action: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fallback_parameters_json: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  resolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  resolved_at: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "healing_incidents",
  timestamps: false
});

// Định nghĩa Model RagDocument cho Local Vector RAG Engine
export const RagDocument = sequelize.define("RagDocument", {
  doc_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source_type: {
    type: DataTypes.STRING,
    defaultValue: "transcript"
  },
  total_chunks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: "rag_documents",
  timestamps: false
});

// Định nghĩa Model RagChunk cho các đoạn vector
export const RagChunk = sequelize.define("RagChunk", {
  chunk_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  doc_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  end_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  start_sec: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  end_sec: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  vector_json: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viral_score: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  emotional_tag: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "rag_chunks",
  timestamps: false
});

// Định nghĩa Model ChannelStats
export const ChannelStats = sequelize.define("ChannelStats", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  totalViews: {
    type: DataTypes.STRING,
    defaultValue: "0"
  },
  revenue: {
    type: DataTypes.STRING,
    defaultValue: "0"
  },
  activeChannels: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

export let isDBConnected = false;

// Hàm đồng bộ Database
export const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối SQLite thành công qua Sequelize.");
    
    // Tạo bảng nếu chưa tồn tại, cập nhật schema nếu có thay đổi
    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      console.warn("⚠️ sequelize.sync({ alter: true }) gặp cảnh báo/lỗi SQLite, chuyển sang sequelize.sync():", syncErr);
      await sequelize.sync();
    }
    isDBConnected = true;
    console.log("✅ Đồng bộ Model SQLite thành công.");
  } catch (error) {
    console.error("❌ Lỗi khi kết nối SQLite:", error);
  }
};
