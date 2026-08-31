import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Download,
  Terminal,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Activity,
  PlusCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  Crown,
  SlidersHorizontal,
  Timer,
  Pin,
  Check,
  ToggleLeft,
  ToggleRight,
  Info,
  ScrollText,
  History,
  Server,
  Radio,
  Code2,
  Database
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { GlobalTaskItem, GlobalTaskType, GlobalTaskStatus } from "../types";
import { soundSynth } from "../utils/audioUtils";
import {
  downloadVideoBlob,
  downloadSrtFile,
  downloadAssFile,
  downloadTaskJson,
} from "../utils/downloadUtils";
import confetti from "canvas-confetti";
import { ActivityLogTab } from "./ActivityLogTab";

export const GlobalTaskQueueModal: React.FC = () => {
  const {
    tasks,
    taskHistory,
    stats,
    isQueueOpen,
    closeQueue,
    cancelTask,
    pauseTask,
    resumeTask,
    retryTask,
    clearCompleted,
    keepCompletedTask,
    addTask,
    reorderTaskById,
    moveTaskToTop,
    moveTaskUp,
    moveTaskDown,
    queueSettings,
    updateQueueSettings,
    backendStatus,
    backendConfig,
    updateBackendConfig,
    reconnectBackend,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<"queue" | "activity-logs">("queue");
  const [filterStatus, setFilterStatus] = useState<"all" | GlobalTaskStatus>("all");
  const [filterType, setFilterType] = useState<"all" | GlobalTaskType>("all");
  const [expandedLogTaskId, setExpandedLogTaskId] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false);
  const [downloadMenuTaskId, setDownloadMenuTaskId] = useState<string | null>(null);

  // Live timer for countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Handle escape key to close queue modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isQueueOpen) {
        closeQueue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQueueOpen, closeQueue]);

  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"top" | "bottom" | null>(null);

  if (!isQueueOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  const getTaskIcon = (type: GlobalTaskType) => {
    switch (type) {
      case "video-edit":
        return <FileVideo className="w-4 h-4 text-indigo-400" />;
      case "download":
        return <Download className="w-4 h-4 text-emerald-400" />;
      case "translate":
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case "highlight":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "fb-render":
        return <Activity className="w-4 h-4 text-blue-400" />;
      case "comic-render":
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTaskBadge = (type: GlobalTaskType) => {
    switch (type) {
      case "video-edit":
        return { label: "Video Edit", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
      case "download":
        return { label: "Downloader", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "translate":
        return { label: "Dịch Video", bg: "bg-pink-500/10 text-pink-400 border-pink-500/20" };
      case "highlight":
        return { label: "Highlight AI", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "fb-render":
        return { label: "FB Auto", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "comic-render":
        return { label: "AI Manga", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      default:
        return { label: "Task", bg: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const handleDownloadArtifact = (task: GlobalTaskItem, format: "video" | "srt" | "ass" | "json" = "video") => {
    soundSynth.playSfx("success");
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
    });
    if (format === "srt") {
      downloadSrtFile(task);
    } else if (format === "ass") {
      downloadAssFile(task);
    } else if (format === "json") {
      downloadTaskJson(task);
    } else {
      downloadVideoBlob(task);
    }
  };

  const handleAddSampleJob = () => {
    const jobTypes: Array<{ type: GlobalTaskType; title: string; subtitle: string; step: string }> = [
      {
        type: "video-edit",
        title: "Edit Tự Động: Shorts Minecraft Parkour + Voice Review",
        subtitle: "Khử bản quyền 60fps • Gán Karaoke Subtitles",
        step: "Render FFmpeg Split-Screen 1080x1920 60FPS",
      },
      {
        type: "translate",
        title: "Dịch & Khớp Phụ Đề: Video Công Nghệ US/UK sang Tiếng Việt",
        subtitle: "Lồng tiếng TTS AI 1.1x • Phụ đề kiểu Alex Hormozi",
        step: "AI Khớp timeline từng chữ (Word-level Sync)...",
      },
      {
        type: "download",
        title: "Tải Hàng Loạt 10 Video TikTok Douyin No-Watermark",
        subtitle: "1080p Ultra HD • Đóng gói ZIP tự động",
        step: "Bypass CDN & Tải video Ultra HD...",
      },
    ];

    const pick = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    addTask({
      type: pick.type,
      title: pick.title,
      subtitle: pick.subtitle,
      progress: 5,
      status: "processing",
      currentStep: pick.step,
      speed: "2.4 MB/s",
      eta: "10s còn lại",
      outputArtifact: {
        name: `Export_${pick.type}_${Date.now()}.mp4`,
        size: "24.5 MB",
        type: "video",
      },
    });
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
    soundSynth.playSfx("pop");
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedTaskId === taskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isTop = e.clientY < midY;

    setDragOverTaskId(taskId);
    setDropPosition(isTop ? "top" : "bottom");
  };

  const handleDragLeave = (e: React.DragEvent, taskId: string) => {
    if (dragOverTaskId === taskId) {
      setDragOverTaskId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = draggedTaskId || e.dataTransfer.getData("text/plain");
    
    if (sourceTaskId && sourceTaskId !== targetTaskId) {
      reorderTaskById(sourceTaskId, targetTaskId);
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const delayOptions = [
    { label: "0s (Ngay)", value: 0 },
    { label: "5s", value: 5 },
    { label: "15s (Khuyên dùng)", value: 15 },
    { label: "30s", value: 30 },
    { label: "1 phút", value: 60 },
    { label: "5 phút", value: 300 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeQueue}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Hàng Đợi Xử Lý Tác Vụ Toàn Cục
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold animate-pulse">
                    REAL-TIME
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold flex items-center gap-1">
                    <Database className="w-3 h-3 text-indigo-400" /> SQLite PERSISTED
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} /> AUTO-RESUME
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Theo dõi tiến trình tải hàng loạt, edit bán content & dịch thuật video
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Backend Sync Status Indicator & Config Toggle */}
            <button
              id="btn-backend-sync-toggle"
              onClick={() => {
                soundSynth.playSfx("pop");
                setShowBackendConfig(!showBackendConfig);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                backendStatus === "connected"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : backendStatus === "polling"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Cấu hình kết nối Backend Python FastAPI / WebSocket"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {backendStatus === "connected"
                  ? "WS Live"
                  : backendStatus === "polling"
                  ? "HTTP Poll"
                  : backendStatus === "connecting"
                  ? "Đang nối..."
                  : "GPU Local"}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "connected"
                    ? "bg-emerald-400 animate-pulse"
                    : backendStatus === "polling"
                    ? "bg-amber-400 animate-ping"
                    : "bg-indigo-400"
                }`}
              />
            </button>

            {/* Toggle Settings Panel Button */}
            <button
              id="btn-queue-settings-toggle"
              onClick={() => {
                soundSynth.playSfx("pop");
                setShowSettingsPanel(!showSettingsPanel);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                showSettingsPanel || queueSettings.autoRemoveCompleted || queueSettings.autoRemoveOnModalClose
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Cài đặt tự động xóa tác vụ khi hoàn tất"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tự Động Xóa</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                {queueSettings.autoRemoveCompleted
                  ? queueSettings.autoRemoveDelaySeconds === 0
                    ? "Ngay"
                    : `${queueSettings.autoRemoveDelaySeconds}s`
                  : queueSettings.autoRemoveOnModalClose
                  ? "Khi Đóng"
                  : "Tắt"}
              </span>
            </button>

            <button
              id="btn-add-sample-job"
              onClick={handleAddSampleJob}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-all"
              title="Thêm tác vụ mô phỏng vào hàng đợi"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Tác Vụ Thử Nghiệm</span>
            </button>

            <button
              id="btn-close-queue"
              onClick={closeQueue}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Đóng cửa sổ (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Top Tabs Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-[#0B1120] px-4 pt-1 gap-2">
          <button
            id="tab-btn-active-queue"
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveTab("queue");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "queue"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Hàng Đợi Đang Chạy</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "queue"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {stats.total}
            </span>
            {stats.processing > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping ml-0.5" />
            )}
          </button>

          <button
            id="tab-btn-activity-logs"
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveTab("activity-logs");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "activity-logs"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg shadow-inner"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Nhật Ký & Lịch Sử Thực Thi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "activity-logs"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {taskHistory.length}
            </span>
          </button>
        </div>

        {/* Tab 2: Activity Logs View */}
        {activeTab === "activity-logs" && <ActivityLogTab />}

        {/* Tab 1: Active Queue View */}
        {activeTab === "queue" && (
          <>
            {/* Collapsible Backend Python FastAPI / WebSocket Config Panel */}
            {showBackendConfig && (
              <div className="p-4 bg-slate-900 border-b border-indigo-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Cấu Hình Kết Nối Backend Python (FastAPI / WebSocket)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowBackendConfig(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Đóng
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WS URL */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">WebSocket URL</label>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        backendStatus === "connected"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {backendStatus.toUpperCase()}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={backendConfig.wsUrl}
                      onChange={(e) => updateBackendConfig({ wsUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                      placeholder="ws://127.0.0.1:3000/ws/tasks"
                    />
                    <p className="text-[10px] text-slate-400">Luồng cập nhật % render, FPS và log thời gian thực.</p>
                  </div>

                  {/* HTTP Polling Fallback URL */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-200">HTTP Polling URL (Fallback)</label>
                    <input
                      type="text"
                      value={backendConfig.httpUrl}
                      onChange={(e) => updateBackendConfig({ httpUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
                      placeholder="http://127.0.0.1:3000/api/tasks/status"
                    />
                    <p className="text-[10px] text-slate-400">Tự động kích hoạt khi WebSocket bị ngắt kết nối.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={reconnectBackend}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Kết Nối Lại Ngay</span>
                    </button>
                    <button
                      onClick={() => updateBackendConfig({ enabled: !backendConfig.enabled })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        backendConfig.enabled
                          ? "bg-slate-800 border-slate-700 text-slate-300"
                          : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {backendConfig.enabled ? "Chuyển Chế Độ Offline/Local" : "Bật Kết Nối Backend"}
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Trạng thái: <strong className="text-white">{backendStatus === "connected" ? "Đã nối WebSocket" : backendStatus === "polling" ? "Đang chạy HTTP Polling" : "Mô phỏng GPU cục bộ"}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Collapsible Auto-Remove Settings Configuration Panel */}
            {showSettingsPanel && (
          <div className="p-4 bg-slate-900 border-b border-indigo-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Cấu Hình Tự Động Xóa Tác Vụ Hoàn Tất (Auto-Remove)
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Auto-remove delay */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-200">1. Tự động xóa sau thời gian chờ</p>
                    <p className="text-[11px] text-slate-400">Gỡ video/tác vụ đã xong sau độ trễ xác định</p>
                  </div>
                  <button
                    onClick={() => updateQueueSettings({ autoRemoveCompleted: !queueSettings.autoRemoveCompleted })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      queueSettings.autoRemoveCompleted ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        queueSettings.autoRemoveCompleted ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {queueSettings.autoRemoveCompleted && (
                  <div className="pt-1.5 space-y-2">
                    <p className="text-[10px] font-semibold text-indigo-300">Chọn thời gian chờ xóa:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {delayOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateQueueSettings({ autoRemoveDelaySeconds: opt.value })}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center ${
                            queueSettings.autoRemoveDelaySeconds === opt.value
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Auto-remove on modal close */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">2. Dọn sạch khi đóng cửa sổ</p>
                      <p className="text-[11px] text-slate-400">Tự động xóa toàn bộ tác vụ đã hoàn thành khi tắt hàng đợi</p>
                    </div>
                    <button
                      onClick={() => updateQueueSettings({ autoRemoveOnModalClose: !queueSettings.autoRemoveOnModalClose })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        queueSettings.autoRemoveOnModalClose ? "bg-emerald-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          queueSettings.autoRemoveOnModalClose ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Các tác vụ đang chạy hoặc bị tạm dừng sẽ <strong>luôn được bảo vệ</strong> và tiếp tục xử lý dưới nền.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview Bar */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/60 border-b border-slate-800 text-center">
          <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <p className="text-[10px] text-slate-400 font-medium">Tổng tác vụ</p>
            <p className="text-base font-bold text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-[10px] text-indigo-300 font-medium flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              Đang chạy
            </p>
            <p className="text-base font-bold text-indigo-400 mt-0.5">{stats.processing}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-300 font-medium">Hoàn tất</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{stats.completed}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-amber-300 font-medium">Tạm dừng / Lỗi</p>
            <p className="text-base font-bold text-amber-400 mt-0.5">{stats.paused + stats.failed}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-3 border-b border-slate-800 bg-[#0F172A] flex flex-wrap items-center justify-between gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: "all", label: "Tất cả" },
              { id: "processing", label: `Đang chạy (${stats.processing})` },
              { id: "completed", label: `Hoàn tất (${stats.completed})` },
              { id: "paused", label: "Tạm dừng" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setFilterStatus(st.id as any);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  filterStatus === st.id
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Action Clear completed */}
          {stats.completed > 0 && (
            <button
              id="btn-clear-completed-jobs"
              onClick={clearCompleted}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã xong ({stats.completed})</span>
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Priority Help Tip */}
          {filteredTasks.length > 1 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 mb-1">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Kéo & thả (Drag & Drop)</strong> hoặc dùng nút <strong>⬆ ⬇</strong> để ưu tiên Render/Tải video trước.
                </span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded font-mono font-bold hidden sm:inline">
                Ưu Tiên Tự Động
              </span>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-700 opacity-60" />
              <div>
                <p className="text-sm font-semibold text-slate-300">Không có tác vụ nào trong hàng đợi</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Khi bạn bấm Tải hàng loạt, Render Edit Bán Content hoặc Dịch video, các tiến trình sẽ hiển thị trực tiếp tại đây.
                </p>
              </div>
              <button
                onClick={handleAddSampleJob}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-semibold transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Tạo Tác Vụ Mẫu Ngay
              </button>
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const badge = getTaskBadge(task.type);
              const isExpanded = expandedLogTaskId === task.id;
              const isDragged = draggedTaskId === task.id;
              const isDragOver = dragOverTaskId === task.id;
              const isFirst = index === 0;
              const isLast = index === filteredTasks.length - 1;

              // Calculate auto-remove remaining countdown
              let autoRemoveCountdown: number | null = null;
              if (
                task.status === "completed" &&
                queueSettings.autoRemoveCompleted &&
                task.completedAt &&
                queueSettings.autoRemoveDelaySeconds >= 0
              ) {
                const elapsedMs = now - task.completedAt;
                const totalMs = queueSettings.autoRemoveDelaySeconds * 1000;
                autoRemoveCountdown = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
              }

              return (
                <div
                  key={task.id}
                  id={`queue-card-${task.id}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragLeave={(e) => handleDragLeave(e, task.id)}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-xl border transition-all relative select-none ${
                    isDragged ? "opacity-40 scale-[0.98] border-indigo-500 shadow-2xl" : "opacity-100"
                  } ${
                    isDragOver && dropPosition === "top"
                      ? "border-t-4 border-t-indigo-400 -translate-y-0.5"
                      : ""
                  } ${
                    isDragOver && dropPosition === "bottom"
                      ? "border-b-4 border-b-indigo-400 translate-y-0.5"
                      : ""
                  } ${
                    task.status === "processing"
                      ? "bg-slate-900/90 border-indigo-500/30 shadow-lg shadow-indigo-950/20"
                      : task.status === "completed"
                      ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      : task.status === "paused"
                      ? "bg-amber-950/20 border-amber-500/30"
                      : "bg-rose-950/20 border-rose-500/30"
                  }`}
                >
                  {/* Top line: Drag Handle + Priority Rank + Type + Status + Actions */}
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Drag Handle */}
                      <div
                        className="flex items-center gap-1 shrink-0 mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Kéo & thả để sắp xếp thứ tự ưu tiên"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Icon */}
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 shrink-0 mt-0.5">
                        {getTaskIcon(task.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Priority indicator tag */}
                          {isFirst ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Crown className="w-3 h-3 text-amber-400" />
                              Ưu Tiên #1
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              #{index + 1}
                            </span>
                          )}

                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                            {task.title}
                          </span>
                        </div>
                        {task.subtitle && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick controls + Priority Reorder Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move to Top quick action */}
                      {!isFirst && task.status !== "completed" && (
                        <button
                          onClick={() => moveTaskToTop(task.id)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 transition-all text-[11px] flex items-center gap-1"
                          title="Đưa lên vị trí ưu tiên số 1"
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-[10px] font-semibold">Ưu tiên #1</span>
                        </button>
                      )}

                      {/* Reorder Up/Down arrows */}
                      <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700 p-0.5">
                        <button
                          onClick={() => moveTaskUp(task.id)}
                          disabled={isFirst}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          title="Chuyển lên trên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveTaskDown(task.id)}
                          disabled={isLast}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          title="Chuyển xuống dưới"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {task.status === "processing" && (
                        <button
                          onClick={() => pauseTask(task.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
                          title="Tạm dừng"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {task.status === "paused" && (
                        <button
                          onClick={() => resumeTask(task.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="Tiếp tục"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {task.status === "failed" && (
                        <button
                          onClick={() => retryTask(task.id)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                          title="Thử lại"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {task.status === "completed" && task.outputArtifact && (
                        <div className="relative flex items-center gap-1">
                          <button
                            onClick={() => handleDownloadArtifact(task, "video")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-xs"
                            title="Tải video thành phẩm MP4"
                          >
                            <FileVideo className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Tải MP4</span>
                          </button>

                          <button
                            onClick={() => handleDownloadArtifact(task, "srt")}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all text-xs"
                            title="Tải phụ đề SubRip .srt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDownloadArtifact(task, "ass")}
                            className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 transition-all text-xs"
                            title="Tải phụ đề Karaoke .ass"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDownloadArtifact(task, "json")}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs"
                            title="Tải JSON Metadata"
                          >
                            <Code2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      )}

                      {task.status === "processing" && (
                        <button
                          onClick={() => cancelTask(task.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                          title="Hủy tác vụ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        {task.status === "processing" && (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        )}
                        {task.status === "completed" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {task.status === "paused" && (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {task.status === "failed" && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="text-[11px] truncate max-w-[240px] sm:max-w-md">
                          {task.currentStep}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-semibold">
                        {task.speed && (
                          <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
                            {task.speed}
                          </span>
                        )}
                        <span
                          className={
                            task.status === "completed"
                              ? "text-emerald-400"
                              : task.status === "failed"
                              ? "text-rose-400"
                              : "text-indigo-300"
                          }
                        >
                          {task.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          task.status === "completed"
                            ? "bg-emerald-500"
                            : task.status === "failed"
                            ? "bg-rose-500"
                            : task.status === "paused"
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400"
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Auto-remove countdown bar & Pin action for completed task */}
                  {task.status === "completed" && (
                    <div className="mt-2.5 flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {autoRemoveCountdown !== null ? (
                          <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
                            <Timer className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                            Tự động xóa sau <strong>{autoRemoveCountdown}s</strong>
                          </span>
                        ) : task.completedAt === undefined ? (
                          <span className="flex items-center gap-1 text-[11px] text-indigo-300">
                            <Pin className="w-3 h-3 text-indigo-400" />
                            Đã ghim giữ lại (Không tự xóa)
                          </span>
                        ) : queueSettings.autoRemoveOnModalClose ? (
                          <span className="text-[11px] text-slate-400">
                            Sẽ tự động xóa khi bạn đóng cửa sổ này
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Hoàn tất lúc {new Date(task.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>

                      {autoRemoveCountdown !== null && (
                        <button
                          onClick={() => keepCompletedTask(task.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Hủy đếm ngược và giữ lại tác vụ này"
                        >
                          Giữ Lại
                        </button>
                      )}
                    </div>
                  )}

                  {/* Bottom Meta & Log Toggle */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Bắt đầu: {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {task.eta && task.status === "processing" && (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.eta}
                        </span>
                      )}
                      {task.outputArtifact && (
                        <span className="text-slate-400 hidden sm:inline">
                          Dung lượng: <strong className="text-slate-300">{task.outputArtifact.size}</strong>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedLogTaskId(isExpanded ? null : task.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>{isExpanded ? "Ẩn Nhật Ký" : "Xem Nhật Ký"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Terminal Execution Logs Drawer */}
                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[10px] space-y-1 max-h-36 overflow-y-auto">
                      <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                        <span>LIVE EXECUTION PIPELINE</span>
                        <span className="text-[9px] text-emerald-400">THREAD_ACTIVE</span>
                      </div>
                      {task.logs.map((log, lIdx) => (
                        <div key={lIdx} className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </>
        )}

        {/* Footer info & Turbo Status */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>GPU Acceleration: <strong className="text-emerald-400">NVENC Active</strong></span>
          </div>

          <div className="text-slate-400 text-[11px]">
            {queueSettings.autoRemoveCompleted
              ? `Tự động giải phóng sau ${queueSettings.autoRemoveDelaySeconds}s`
              : queueSettings.autoRemoveOnModalClose
              ? "Tự động dọn dẹp khi đóng bảng điều khiển"
              : "Lưu giữ hàng đợi vĩnh viễn"}
          </div>
        </div>
      </div>
    </div>
  );
};
