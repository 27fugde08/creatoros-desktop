import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import {
  GlobalTaskItem,
  GlobalTaskType,
  GlobalTaskStatus,
  QueueStats,
  QueueSettings,
  BackendConnectionStatus,
  BackendSyncConfig,
  BackendTaskUpdatePayload,
} from "../../shared/types";
import { soundSynth } from "../utils/audioUtils";
import { BACKEND_BASE_URL, BACKEND_WS_URL, getApiUrl } from "../utils/apiClient";
import {
  downloadVideoBlob,
  downloadSrtFile,
  downloadAssFile,
  downloadTaskJson,
} from "../utils/downloadUtils";
import confetti from "canvas-confetti";
import { useToast } from "./ToastContext";

interface QueueContextType {
  tasks: GlobalTaskItem[];
  taskHistory: GlobalTaskItem[];
  setTaskHistory: React.Dispatch<React.SetStateAction<GlobalTaskItem[]>>;
  stats: QueueStats;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  closeQueue: () => void;
  toggleQueue: () => void;
  queueSettings: QueueSettings;
  updateQueueSettings: (settings: Partial<QueueSettings>) => void;
  // Backend & WebSocket Sync
  backendStatus: BackendConnectionStatus;
  backendConfig: BackendSyncConfig;
  updateBackendConfig: (config: Partial<BackendSyncConfig>) => void;
  reconnectBackend: () => void;
  sendBackendCommand: (command: string, payload?: any) => void;
  // Direct Download Utilities
  downloadTaskArtifact: (task: GlobalTaskItem, type?: "video" | "srt" | "ass" | "json") => Promise<void>;
  // Task Queue Operations
  addTask: (task: Omit<GlobalTaskItem, "id" | "createdAt" | "logs"> & { logs?: Array<{ timestamp: string; message: string }> }) => string;
  cancelTask: (taskId: string) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  approveTask: (taskId: string) => void;
  bulkApproveTasks: (taskIds: string[]) => void;
  scheduleTasks: (taskIds: string[], scheduleTime: string) => void;
  rejectTask: (taskId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  clearTaskHistory: () => void;
  keepCompletedTask: (taskId: string) => void;
  getTasksByType: (type: GlobalTaskType) => GlobalTaskItem[];
  addBatchDownloads: (urls: string[], platform?: string) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  reorderTaskById: (sourceId: string, targetId: string) => void;
  moveTaskToTop: (taskId: string) => void;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  loadSampleTasksForReview: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const defaultQueueSettings: QueueSettings = {
  autoRemoveCompleted: true,
  autoRemoveDelaySeconds: 15,
  autoRemoveOnModalClose: true,
};

const defaultBackendConfig: BackendSyncConfig = {
  enabled: true,
  wsUrl: BACKEND_WS_URL,
  httpUrl: `${BACKEND_BASE_URL}/api/tasks/status`,
  pollIntervalMs: 3000,
  autoReconnect: true,
};

const initialMockTasks: GlobalTaskItem[] = [
  {
    id: "task_edit_1",
    type: "video-edit",
    title: "Split-Screen Bán Content: GTA 5 Parkour + Review Phim Kịch Tính",
    subtitle: "Khử bản quyền Content ID (Pitch +3.2%, 60fps B-Roll)",
    targetChannel: "@reviewphim_official",
    platform: "tiktok",
    thumbnail: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "00:58",
    resolution: "1080x1920 60FPS",
    viralScore: 96,
    scriptSnippet: "CẢNH BÁO: Người đàn ông này đã đào được một mật thất 80 năm dưới nền nhà mà không ai ngờ tới...",
    tags: ["#shorts", "#reviewphim", "#xuhuong", "#fyp", "#gta5"],
    approved: false,
    progress: 74,
    status: "processing",
    currentStep: "Render FFmpeg Split-Screen 1080x1920 60FPS",
    speed: "58.4 FPS",
    eta: "6s còn lại",
    createdAt: Date.now() - 45000,
    logs: [
      { timestamp: "10:14:02", message: "Khởi tạo luồng render FFmpeg phần cứng GPU NVENC" },
      { timestamp: "10:14:15", message: "Đã trích xuất & ghép B-roll GTA 5 Stunt nửa dưới" },
      { timestamp: "10:14:28", message: "Áp dụng bộ lọc màu Cinematic Warm LUT & viền Neon" },
      { timestamp: "10:14:39", message: "Đang mã hóa video đầu ra H.264 / AAC 320kbps..." },
    ],
    outputArtifact: {
      name: "Shorts_GTA5_SplitEdit_Final.mp4",
      size: "28.4 MB",
      type: "video",
      downloadUrl: "#download_edit_1",
    },
  },
  {
    id: "task_trans_2",
    type: "translate",
    title: "Dịch & Lồng Tiếng AI: Douyin Mẹo Khoa Học Triệu View",
    subtitle: "Dịch Trung -> Việt + Khớp Subtitle Chữ Động MrBeast",
    targetChannel: "Tech Lab AI Automation (YTB Shorts)",
    platform: "youtube",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "00:44",
    resolution: "1080x1920 60FPS",
    viralScore: 93,
    scriptSnippet: "Bí mật công nghệ mà các kỹ sư AI giấu kín suốt 5 năm qua vừa bị rò rỉ trên Douyin sáng nay!",
    tags: ["#ai", "#technology", "#viral", "#techshorts"],
    approved: false,
    progress: 42,
    status: "processing",
    currentStep: "Tổng hợp giọng đọc Local TTS Nữ Miền Nam 1.1x",
    speed: "18.2 KB/s",
    eta: "14s còn lại",
    createdAt: Date.now() - 25000,
    logs: [
      { timestamp: "10:14:22", message: "Đã tách file âm thanh gốc từ video Douyin" },
      { timestamp: "10:14:29", message: "AI hoàn tất dịch thuật 14 phân đoạn sang Tiếng Việt" },
      { timestamp: "10:14:38", message: "Đang sinh audio giọng đọc theo từng mốc timestamp..." },
    ],
    outputArtifact: {
      name: "Douyin_Translated_Subtitled.srt",
      size: "4.2 KB",
      type: "srt",
      downloadUrl: "#download_srt_2",
    },
  },
  {
    id: "task_comic_5",
    type: "comic-render",
    title: "AI Manga Motion: Thợ Rèn Cổ Kiếm Thức Tỉnh Rồng",
    subtitle: "Giữ 100% Nhân Vật Nhất Quán + Hiệu Ứng Ken Burns Zoom & Pan",
    targetChannel: "Solo Anime Manhwa Recap (YTB US)",
    platform: "youtube",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "01:12",
    resolution: "1080x1920 60FPS",
    viralScore: 98,
    scriptSnippet: "Lâm Phong rút thanh gỉ kiếm ra khỏi tảng đá cổ. Ánh sáng xanh băng giá bao phủ toàn bộ đại điện...",
    tags: ["#manhwa", "#anime", "#recap", "#sololeveling", "#aiart"],
    approved: false,
    progress: 90,
    status: "processing",
    currentStep: "FFmpeg zoompan Ken Burns hiệu ứng chuyển động chậm",
    speed: "62 FPS",
    eta: "3s còn lại",
    createdAt: Date.now() - 60000,
    logs: [
      { timestamp: "10:13:05", message: "Tạo 6 ảnh phân cảnh với Character Anchor DNA cố định" },
      { timestamp: "10:13:30", message: "Sinh giọng đọc truyền cảm vi-VN-NamMinhNeural" },
      { timestamp: "10:13:48", message: "Đang ghép hiệu ứng Pan & Zoom điện ảnh..." },
    ],
    outputArtifact: {
      name: "AI_Manga_DragonSword_Ep1.mp4",
      size: "34.1 MB",
      type: "video",
    },
  },
  {
    id: "task_fb_6",
    type: "fb-render",
    title: "Bí Mật Lịch Sử: Kim Tự Tháp & Năng Lượng Điện Cổ Đại",
    subtitle: "Facebook Reels 9:16 + Auto Caption Viền Đen Chữ Vàng",
    targetChannel: "Bí Mật Lịch Sử & Vũ Trụ (FB Reels)",
    platform: "facebook",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "00:52",
    resolution: "1080x1920",
    viralScore: 91,
    scriptSnippet: "Tại sao đỉnh kim tự tháp lại được bọc vàng nguyên chất? Sự thật gây sốc về trạm phát điện cổ đại...",
    tags: ["#fbreels", "#lichsu", "#bian", "#vutru", "#khampha"],
    approved: false,
    progress: 100,
    status: "completed",
    currentStep: "Sẵn sàng đăng tải (Chờ duyệt)",
    createdAt: Date.now() - 90000,
    completedAt: Date.now() - 10000,
    logs: [
      { timestamp: "10:13:00", message: "Quét bản quyền âm thanh & giảm âm nền xuống 8%" },
      { timestamp: "10:13:20", message: "Tạo subtitle .ASS ViralShorts font Montserrat in hoa" },
      { timestamp: "10:13:40", message: "Hoàn tất render video thành phẩm." },
    ],
    outputArtifact: {
      name: "FB_Reels_Pyramid_Energy.mp4",
      size: "22.8 MB",
      type: "video",
    },
  },
  {
    id: "task_dl_3",
    type: "download",
    title: "Tải Hàng Loạt TikTok: Top 5 Kênh Xu Hướng Tech",
    subtitle: "5/5 Video No-Watermark 1080p Ultra HD",
    targetChannel: "Satisfying Douyin Clip Hub",
    platform: "tiktok",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "02:30",
    resolution: "1080p Ultra HD",
    viralScore: 89,
    scriptSnippet: "Tổng hợp 5 video công nghệ tương lai đột phá nhất tuần qua không dính logo watermark.",
    tags: ["#tiktoktech", "#gadgets", "#futuretech"],
    approved: true,
    approvedAt: Date.now() - 25000,
    progress: 100,
    status: "completed",
    currentStep: "Hoàn tất đóng gói ZIP 5 Video 1080p",
    speed: "Tốc độ: 1.4 Video/s",
    createdAt: Date.now() - 120000,
    completedAt: Date.now() - 30000,
    logs: [
      { timestamp: "10:12:10", message: "Phân tích 5 URL TikTok và Douyin" },
      { timestamp: "10:12:14", message: "Bypass API CDN xóa logo watermark hoàn tất" },
      { timestamp: "10:12:28", message: "Tải xong 5 video (Tổng dung lượng: 94.6 MB)" },
      { timestamp: "10:12:35", message: "Đã đóng gói thành công file Creator_Batch_Downloads.zip" },
    ],
    outputArtifact: {
      name: "Creator_TikTok_Batch_5Videos.zip",
      size: "94.6 MB",
      type: "zip",
      downloadUrl: "#download_zip_3",
    },
  },
  {
    id: "task_hl_4",
    type: "highlight",
    title: "AI Highlight & Script: Podcast Khởi Nghiệp 2 Giờ",
    subtitle: "Trích xuất 4 phân đoạn Viral Score > 90%",
    targetChannel: "Kinh Doanh & Khởi Nghiệp (FB)",
    platform: "facebook",
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80",
    estimatedDuration: "00:45",
    resolution: "1080x1920",
    viralScore: 94,
    scriptSnippet: "Sai lầm lớn nhất của 99% người khởi nghiệp năm đầu tiên là không biết kiểm soát dòng tiền mặt!",
    tags: ["#podcast", "#kinhdoanh", "#khoinghiep", "#baihoc"],
    approved: true,
    approvedAt: Date.now() - 80000,
    progress: 100,
    status: "completed",
    currentStep: "Đã xuất kịch bản lời dẫn & B-roll timing",
    createdAt: Date.now() - 180000,
    completedAt: Date.now() - 95000,
    logs: [
      { timestamp: "10:11:00", message: "Tải transcript 120 phút podcast" },
      { timestamp: "10:11:20", message: "Thuật toán NLP quét điểm cao trào và cảm xúc" },
      { timestamp: "10:11:45", message: "Hoàn thành 4 kịch bản Shorts giữ chân 3s đầu" },
    ],
    outputArtifact: {
      name: "Podcast_Viral_Highlights_Pack.json",
      size: "18.2 KB",
      type: "srt",
    },
  },
];

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<GlobalTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem("creator_task_queue_v1");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load queue from storage", e);
    }
    return initialMockTasks;
  });

  const [taskHistory, setTaskHistory] = useState<GlobalTaskItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem("creator_task_history_v1");
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error("Failed to load task history from storage", e);
    }
    return initialMockTasks;
  });

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const [queueSettings, setQueueSettings] = useState<QueueSettings>(() => {
    try {
      const saved = localStorage.getItem("creator_task_queue_settings_v1");
      if (saved) {
        return { ...defaultQueueSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load queue settings", e);
    }
    return defaultQueueSettings;
  });

  // Backend Sync & WebSocket Client State
  const [backendConfig, setBackendConfig] = useState<BackendSyncConfig>(() => {
    try {
      const saved = localStorage.getItem("creator_backend_sync_config_v1");
      if (saved) {
        return { ...defaultBackendConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load backend sync config", e);
    }
    return defaultBackendConfig;
  });

  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>("simulation");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Sync backend config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("creator_backend_sync_config_v1", JSON.stringify(backendConfig));
    } catch (e) {
      console.error("Failed to save backend sync config", e);
    }
  }, [backendConfig]);

  // Direct Download Helper
  const downloadTaskArtifact = async (task: GlobalTaskItem, type?: "video" | "srt" | "ass" | "json") => {
    const artifactType = type || (task.outputArtifact?.type === "srt" ? "srt" : task.outputArtifact?.type === "zip" ? "json" : "video");
    if (artifactType === "srt") {
      downloadSrtFile(task);
    } else if (artifactType === "ass") {
      downloadAssFile(task);
    } else if (artifactType === "json") {
      downloadTaskJson(task);
    } else {
      await downloadVideoBlob(task);
    }
  };

  // Helper to merge incoming backend updates into tasks
  const handleIncomingTaskUpdates = useCallback((incomingUpdates: BackendTaskUpdatePayload[] | BackendTaskUpdatePayload) => {
    const updatesArray = Array.isArray(incomingUpdates) ? incomingUpdates : [incomingUpdates];
    if (updatesArray.length === 0) return;

    setTasks((prevTasks) => {
      let hasChanges = false;
      const updated = prevTasks.map((t) => {
        const update = updatesArray.find((u) => u.id === t.id);
        if (!update) return t;

        if (t.status !== update.status && update.status) {
          if (update.status === "completed") {
            showToast(`Tác vụ "${t.title}" đã hoàn tất!`, "success");
            soundSynth.playSfx("success");
          } else if (update.status === "failed") {
            showToast(`Tác vụ "${t.title}" thất bại!`, "error");
            soundSynth.playSfx("boom");
          }
        }

        hasChanges = true;
        const mergedLogs = update.logs
          ? update.logs
          : update.log
          ? [...t.logs, update.log]
          : t.logs;

        return {
          ...t,
          progress: typeof update.progress === "number" ? update.progress : t.progress,
          status: update.status || t.status,
          currentStep: update.currentStep || t.currentStep,
          speed: update.speed !== undefined ? update.speed : t.speed,
          eta: update.eta !== undefined ? update.eta : t.eta,
          outputArtifact: update.outputArtifact || t.outputArtifact,
          error: update.error !== undefined ? update.error : t.error,
          logs: mergedLogs,
          completedAt: update.status === "completed" && !t.completedAt ? Date.now() : t.completedAt,
        };
      });

      return hasChanges ? updated : prevTasks;
    });
  }, [showToast]);

  // WebSocket Connection & HTTP Polling Fallback Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (!backendConfig.enabled) {
      setBackendStatus("simulation");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let pollInterval: any = null;

    const startHttpPolling = () => {
      if (pollInterval) clearInterval(pollInterval);

      const pollFn = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(backendConfig.httpUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (isMountedRef.current) {
              setBackendStatus("polling");
              if (data.tasks) {
                handleIncomingTaskUpdates(data.tasks);
              }
            }
          } else {
            if (isMountedRef.current) setBackendStatus("simulation");
          }
        } catch {
          // If HTTP server is not responding (offline demo mode), smoothly stay in simulation mode
          if (isMountedRef.current) {
            setBackendStatus("simulation");
          }
        }
      };

      pollFn();
      pollInterval = setInterval(pollFn, Math.max(2000, backendConfig.pollIntervalMs));
    };

    const connectWebSocket = () => {
      try {
        setBackendStatus("connecting");
        const ws = new WebSocket(backendConfig.wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setBackendStatus("connected");
          soundSynth.playSfx("success");
          try {
            ws.send(
              JSON.stringify({
                type: "SUBSCRIBE_TASKS",
                client: "CreatorOS_Pro_Frontend",
                timestamp: Date.now(),
              })
            );
          } catch (e) {
            console.error("WS Send error", e);
          }
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "TASK_UPDATE" && msg.task) {
              handleIncomingTaskUpdates(msg.task);
            } else if (msg.type === "TASKS_BATCH" && Array.isArray(msg.tasks)) {
              handleIncomingTaskUpdates(msg.tasks);
            } else if (msg.type === "TASK_LOG" && msg.taskId && msg.log) {
              handleIncomingTaskUpdates({ id: msg.taskId, log: msg.log });
            }
          } catch (err) {
            console.warn("Could not parse WS message:", event.data, err);
          }
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          // Fallback immediately to polling if WS cannot connect
          startHttpPolling();
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          wsRef.current = null;
          startHttpPolling();

          if (backendConfig.autoReconnect) {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && backendConfig.enabled) {
                connectWebSocket();
              }
            }, 10000);
          }
        };
      } catch (err) {
        console.warn("WebSocket init error, falling back to polling", err);
        startHttpPolling();
      }
    };

    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [backendConfig, handleIncomingTaskUpdates]);

  const reconnectBackend = useCallback(() => {
    soundSynth.playSfx("whoosh");
    if (wsRef.current) {
      wsRef.current.close();
    }
    setBackendConfig((prev) => ({ ...prev }));
  }, []);

  const updateBackendConfig = (config: Partial<BackendSyncConfig>) => {
    soundSynth.playSfx("pop");
    setBackendConfig((prev) => ({ ...prev, ...config }));
  };

  const sendBackendCommand = (command: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "COMMAND",
          command,
          payload,
          timestamp: Date.now(),
        })
      );
      soundSynth.playSfx("pop");
    } else {
      // Send via HTTP POST if WS is not open
      fetch(getApiUrl("/api/tasks/command"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, payload }),
      }).catch((e) => console.warn("Backend HTTP Command send failed", e));
    }
  };

  // Sync tasks to local storage and merge into taskHistory
  useEffect(() => {
    try {
      localStorage.setItem("creator_task_queue_v1", JSON.stringify(tasks));
      
      // Merge current tasks into history
      setTaskHistory((prevHistory) => {
        const historyMap = new Map<string, GlobalTaskItem>();
        // Add existing history
        prevHistory.forEach((item) => historyMap.set(item.id, item));
        // Upsert active tasks
        tasks.forEach((task) => historyMap.set(task.id, task));
        
        const merged = Array.from(historyMap.values())
          .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt))
          .slice(0, 100);
        
        try {
          localStorage.setItem("creator_task_history_v1", JSON.stringify(merged));
        } catch (err) {
          console.error("Failed to save task history", err);
        }
        return merged;
      });
    } catch (e) {
      console.error("Failed to save queue to storage", e);
    }
  }, [tasks]);

  // Sync tasks array to SQLite with 1-second debounce to prevent write congestion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tasks.length > 0) {
        fetch("/api/queue/tasks/bulk-upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks })
        })
        .catch(err => console.warn("Error bulk syncing tasks to SQLite", err));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [tasks]);

  // Initial SQLite loading & session Auto-Resume at startup
  useEffect(() => {
    const loadAndAutoResume = async () => {
      try {
        const resumeRes = await fetch("/api/queue/tasks/auto-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        if (resumeRes.ok) {
          const resJson = await resumeRes.json();
          if (resJson.success && resJson.data && resJson.data.length > 0) {
            setTasks(resJson.data);
            if (resJson.resumedCount > 0) {
              showToast(`Đã tự động khôi phục ${resJson.resumedCount} tác vụ đang chạy từ phiên làm việc trước!`, "success");
              soundSynth.playSfx("success");
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to auto-resume tasks from SQLite, falling back to fetch", err);
      }
      
      try {
        const fetchRes = await fetch("/api/queue/tasks");
        if (fetchRes.ok) {
          const resJson = await fetchRes.json();
          if (resJson.success && resJson.data && resJson.data.length > 0) {
            setTasks(resJson.data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch tasks from SQLite at startup", err);
      }
    };

    loadAndAutoResume();
  }, [showToast]);

  // Sync settings to local storage
  useEffect(() => {
    try {
      localStorage.setItem("creator_task_queue_settings_v1", JSON.stringify(queueSettings));
    } catch (e) {
      console.error("Failed to save queue settings", e);
    }
  }, [queueSettings]);

  const clearTaskHistory = () => {
    soundSynth.playSfx("pop");
    setTaskHistory([]);
    try {
      localStorage.removeItem("creator_task_history_v1");
    } catch (e) {
      console.error("Failed to clear task history", e);
    }
  };

  const updateQueueSettings = (settings: Partial<QueueSettings>) => {
    setQueueSettings((prev) => ({ ...prev, ...settings }));
    soundSynth.playSfx("pop");
  };

  const closeQueue = () => {
    soundSynth.playSfx("pop");
    if (queueSettings.autoRemoveOnModalClose) {
      setTasks((prev) => prev.filter((t) => t.status !== "completed"));
    }
    setIsQueueOpen(false);
  };

  const handleSetIsQueueOpen = (open: boolean) => {
    if (!open && queueSettings.autoRemoveOnModalClose) {
      setTasks((prev) => prev.filter((t) => t.status !== "completed"));
    }
    setIsQueueOpen(open);
  };

  // Auto-remove completed tasks after user-defined delay
  useEffect(() => {
    if (!queueSettings.autoRemoveCompleted || queueSettings.autoRemoveDelaySeconds < 0) {
      return;
    }

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const thresholdMs = queueSettings.autoRemoveDelaySeconds * 1000;

      setTasks((prevTasks) => {
        const remaining = prevTasks.filter((task) => {
          if (task.status !== "completed") return true;
          if (!task.completedAt) return true;
          const ageMs = now - task.completedAt;
          return ageMs < thresholdMs;
        });

        if (remaining.length !== prevTasks.length) {
          return remaining;
        }
        return prevTasks;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [queueSettings.autoRemoveCompleted, queueSettings.autoRemoveDelaySeconds]);

  // Real-time task progress ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) => {
        let hasChanges = false;
        const updated = prevTasks.map((task) => {
          if (task.status !== "processing") return task;

          hasChanges = true;
          const increment = Math.floor(Math.random() * 4) + 2; // 2% - 5% per tick
          const nextProgress = Math.min(100, task.progress + increment);

          // Update current step based on progress
          let currentStep = task.currentStep;
          const newLogs = [...task.logs];
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });

          if (task.type === "video-edit") {
            if (nextProgress > 25 && nextProgress <= 50 && task.progress <= 25) {
              currentStep = "Lồng ghép B-roll Gameplay 60fps & Audio Pitch Shift";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            } else if (nextProgress > 50 && nextProgress <= 80 && task.progress <= 50) {
              currentStep = "Render FFmpeg Split-Screen 1080x1920 60FPS";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            } else if (nextProgress > 80 && nextProgress < 100 && task.progress <= 80) {
              currentStep = "Gán phụ đề Karaoke Neon & Watermark mờ";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            }
          } else if (task.type === "translate") {
            if (nextProgress > 30 && nextProgress <= 60 && task.progress <= 30) {
              currentStep = "AI Đồng bộ phụ đề từng từ (Word-level Timestamps)";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            } else if (nextProgress > 60 && nextProgress < 100 && task.progress <= 60) {
              currentStep = "Tổng hợp giọng đọc Local TTS Nữ Miền Nam 1.1x";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            }
          } else if (task.type === "download") {
            if (nextProgress > 40 && nextProgress <= 80 && task.progress <= 40) {
              currentStep = "Bypass CDN & Tải video Ultra HD không logo";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            } else if (nextProgress > 80 && nextProgress < 100 && task.progress <= 80) {
              currentStep = "Đóng gói file ZIP tốc độ cao...";
              newLogs.push({ timestamp: timeNow, message: currentStep });
            }
          }

          if (nextProgress >= 100) {
            newLogs.push({ timestamp: timeNow, message: "🎉 Tác vụ hoàn tất thành công 100%!" });
            soundSynth.playSfx("success");

            return {
              ...task,
              progress: 100,
              status: "completed" as GlobalTaskStatus,
              currentStep: "Hoàn tất thành công",
              completedAt: Date.now(),
              eta: "0s",
              logs: newLogs,
            };
          }

          const remainingSeconds = Math.max(1, Math.ceil((100 - nextProgress) / 3));

          return {
            ...task,
            progress: nextProgress,
            currentStep,
            eta: `${remainingSeconds}s còn lại`,
            logs: newLogs,
          };
        });

        return hasChanges ? updated : prevTasks;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const stats: QueueStats = {
    total: tasks.length,
    processing: tasks.filter((t) => t.status === "processing").length,
    queued: tasks.filter((t) => t.status === "queued").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    paused: tasks.filter((t) => t.status === "paused").length,
  };

  const toggleQueue = () => {
    soundSynth.playSfx("pop");
    setIsQueueOpen((prev) => !prev);
  };

  const addTask = (taskInput: Omit<GlobalTaskItem, "id" | "createdAt" | "logs"> & { logs?: Array<{ timestamp: string; message: string }> }) => {
    soundSynth.playSfx("whoosh");
    const taskId = `task_${taskInput.type}_${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    const initialLogs = taskInput.logs || [{ timestamp: timeNow, message: `Bắt đầu tác vụ ${taskInput.title}` }];

    const newTask: GlobalTaskItem = {
      ...taskInput,
      id: taskId,
      createdAt: Date.now(),
      logs: initialLogs,
    };

    setTasks((prev) => [newTask, ...prev]);
    return taskId;
  };

  const cancelTask = (taskId: string) => {
    soundSynth.playSfx("pop");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            status: "failed",
            currentStep: "Người dùng đã hủy tác vụ",
            logs: [...t.logs, { timestamp: timeNow, message: "⚠️ Tác vụ đã bị hủy thủ công." }],
            error: "Đã hủy bởi người dùng",
          };
        }
        return t;
      })
    );
  };

  const pauseTask = (taskId: string) => {
    soundSynth.playSfx("pop");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            status: "paused",
            currentStep: "Tạm dừng xử lý",
            logs: [...t.logs, { timestamp: timeNow, message: "⏸️ Tác vụ tạm dừng." }],
          };
        }
        return t;
      })
    );
  };

  const resumeTask = (taskId: string) => {
    soundSynth.playSfx("whoosh");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            status: "processing",
            currentStep: "Tiếp tục xử lý tiến trình...",
            logs: [...t.logs, { timestamp: timeNow, message: "▶️ Tiếp tục thực hiện." }],
          };
        }
        return t;
      })
    );
  };

  const retryTask = (taskId: string) => {
    soundSynth.playSfx("whoosh");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            status: "processing",
            progress: 5,
            currentStep: "Khởi động lại tiến trình...",
            error: undefined,
            logs: [...t.logs, { timestamp: timeNow, message: "🔄 Khởi động lại tác vụ." }],
          };
        }
        return t;
      })
    );
  };

  const clearCompleted = () => {
    soundSynth.playSfx("pop");
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
    fetch("/api/queue/tasks/clear-completed", {
      method: "POST"
    }).catch((e) => console.warn("Failed to clear completed in SQLite", e));
  };

  const keepCompletedTask = (taskId: string) => {
    soundSynth.playSfx("pop");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, completedAt: undefined };
        }
        return t;
      })
    );
  };

  const clearAll = () => {
    soundSynth.playSfx("pop");
    setTasks([]);
    fetch("/api/queue/tasks/clear-all", {
      method: "POST"
    }).catch((e) => console.warn("Failed to clear all in SQLite", e));
  };

  const getTasksByType = (type: GlobalTaskType) => {
    return tasks.filter((t) => t.type === type);
  };

  const addBatchDownloads = (urls: string[], platform = "tiktok") => {
    if (urls.length === 0) return;
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });

    addTask({
      type: "download",
      title: `Tải Hàng Loạt ${urls.length} Video (${platform.toUpperCase()})`,
      subtitle: `Bypass Watermark • 1080p Ultra HD • Xuất ZIP`,
      progress: 0,
      status: "processing",
      currentStep: "Kết nối CDN & phân tích URL...",
      speed: "1.6 Video/s",
      eta: "8s còn lại",
      outputArtifact: {
        name: `Batch_Download_${platform}_${Date.now()}.zip`,
        size: `${(urls.length * 18.5).toFixed(1)} MB`,
        type: "zip",
        downloadUrl: "#download_zip",
      },
      logs: [
        { timestamp: timeNow, message: `Bắt đầu hàng đợi tải ${urls.length} video từ ${platform}` },
        { timestamp: timeNow, message: "Đang mở kết nối đa luồng Turbo..." },
      ],
    });
  };

  const reorderTasks = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setTasks((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    soundSynth.playSfx("pop");
  };

  const reorderTaskById = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setTasks((prev) => {
      const sourceIdx = prev.findIndex((t) => t.id === sourceId);
      const targetIdx = prev.findIndex((t) => t.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
    soundSynth.playSfx("pop");
  };

  const moveTaskToTop = (taskId: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.unshift(moved);
      return updated;
    });
    soundSynth.playSfx("whoosh");
  };

  const moveTaskUp = (taskId: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const temp = updated[idx - 1];
      updated[idx - 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
    soundSynth.playSfx("pop");
  };

  const approveTask = (taskId: string) => {
    soundSynth.playSfx("success");
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
    });
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            approved: true,
            approvedAt: Date.now(),
            status: "completed",
            progress: 100,
            currentStep: "Đã phê duyệt và xếp lịch đăng tải",
            logs: [...t.logs, { timestamp: timeNow, message: "✅ Người dùng đã phê duyệt video thành công!" }],
          };
        }
        return t;
      })
    );
  };

  const bulkApproveTasks = (taskIds: string[]) => {
    if (!taskIds.length) return;
    soundSynth.playSfx("cash");
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
    setTasks((prev) =>
      prev.map((t) => {
        if (taskIds.includes(t.id)) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            approved: true,
            approvedAt: Date.now(),
            status: "completed",
            progress: 100,
            currentStep: "Đã duyệt hàng loạt - Đang kích hoạt API Upload",
            logs: [...t.logs, { timestamp: timeNow, message: "🚀 Phê duyệt hàng loạt: Sẵn sàng tự động đăng tải đa kênh." }],
          };
        }
        return t;
      })
    );
  };

  const scheduleTasks = (taskIds: string[], scheduleTime: string) => {
    if (!taskIds.length) return;
    soundSynth.playSfx("bell");
    setTasks((prev) =>
      prev.map((t) => {
        if (taskIds.includes(t.id)) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            approved: true,
            approvedAt: Date.now(),
            scheduledTime: scheduleTime,
            currentStep: `Đã lên lịch đăng lúc ${scheduleTime}`,
            logs: [...t.logs, { timestamp: timeNow, message: `📅 Lên lịch xuất bản tự động vào lúc ${scheduleTime}` }],
          };
        }
        return t;
      })
    );
  };

  const rejectTask = (taskId: string) => {
    soundSynth.playSfx("pop");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          return {
            ...t,
            approved: false,
            status: "failed",
            currentStep: "Bị từ chối duyệt (Cần biên tập lại)",
            error: "Người kiểm duyệt từ chối kịch bản/video",
            logs: [...t.logs, { timestamp: timeNow, message: "❌ Video bị từ chối duyệt. Đã chuyển về trạng thái cần sửa." }],
          };
        }
        return t;
      })
    );
  };

  const loadSampleTasksForReview = () => {
    soundSynth.playSfx("whoosh");
    setTasks(initialMockTasks);
  };

  const moveTaskDown = (taskId: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[idx + 1];
      updated[idx + 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
    soundSynth.playSfx("pop");
  };

  return (
    <QueueContext.Provider
      value={{
        tasks,
        taskHistory,
        setTaskHistory,
        stats,
        isQueueOpen,
        setIsQueueOpen: handleSetIsQueueOpen,
        closeQueue,
        toggleQueue,
        queueSettings,
        updateQueueSettings,
        backendStatus,
        backendConfig,
        updateBackendConfig,
        reconnectBackend,
        sendBackendCommand,
        downloadTaskArtifact,
        addTask,
        cancelTask,
        pauseTask,
        resumeTask,
        retryTask,
        approveTask,
        bulkApproveTasks,
        scheduleTasks,
        rejectTask,
        clearCompleted,
        clearAll,
        clearTaskHistory,
        keepCompletedTask,
        getTasksByType,
        addBatchDownloads,
        reorderTasks,
        reorderTaskById,
        moveTaskToTop,
        moveTaskUp,
        moveTaskDown,
        loadSampleTasksForReview,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};
