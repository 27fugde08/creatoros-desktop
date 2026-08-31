import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  FileText,
  FileJson,
  Trash2,
  Terminal,
  Layers,
  Sparkles,
  Zap,
  FileVideo,
  Activity,
  Cpu,
  RefreshCw,
  ExternalLink,
  Calendar,
  Eye,
  Film,
  Radio,
  Globe,
  Flame,
  Volume2,
  VolumeX,
  X,
  Code2,
  HardDrive,
  CheckCheck,
  ArrowDownToLine,
  LayoutGrid,
  List,
  FolderArchive,
  Share2
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { GlobalTaskItem, GlobalTaskType } from "../types";
import { soundSynth } from "../utils/audioUtils";
import {
  downloadVideoBlob,
  downloadSrtFile,
  downloadAssFile,
  downloadTaskJson,
  downloadTextFile
} from "../utils/downloadUtils";
import { useDebounce } from "../hooks/useDebounce";
import confetti from "canvas-confetti";

export const TaskHistoryTab: React.FC = () => {
  const { taskHistory, setTaskHistory, clearTaskHistory } = useQueue();

  const [backendHistory, setBackendHistory] = useState<GlobalTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selection for batch actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Inspection Modal
  const [inspectingTask, setInspectingTask] = useState<GlobalTaskItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);

  // Clear confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);

  // Fetch past task history from backend API
  const fetchHistoryFromBackend = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/history");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBackendHistory(json.data);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn("Failed to fetch history from backend, fallback to local state", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryFromBackend();
  }, [fetchHistoryFromBackend]);

  // Merge Context taskHistory and Backend history (completed tasks only)
  const combinedHistory = useMemo(() => {
    const taskMap = new Map<string, GlobalTaskItem>();
    
    // First add from backend
    backendHistory.forEach((t) => {
      if (t.status === "completed" || t.progress === 100) {
        taskMap.set(t.id, t);
      }
    });

    // Then merge from local task history
    taskHistory.forEach((t) => {
      if (t.status === "completed" || t.progress === 100) {
        taskMap.set(t.id, t);
      }
    });

    return Array.from(taskMap.values()).sort(
      (a, b) => (b.completedAt || b.createdAt || 0) - (a.completedAt || a.createdAt || 0)
    );
  }, [backendHistory, taskHistory]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    const now = Date.now();

    return combinedHistory.filter((task) => {
      // Type filter
      if (selectedType !== "all" && task.type !== selectedType) {
        return false;
      }

      // Platform filter
      if (selectedPlatform !== "all" && task.platform !== selectedPlatform) {
        return false;
      }

      // Date range filter
      if (dateFilter === "today") {
        const taskTime = task.completedAt || task.createdAt;
        if (now - taskTime > 24 * 60 * 60 * 1000) return false;
      } else if (dateFilter === "week") {
        const taskTime = task.completedAt || task.createdAt;
        if (now - taskTime > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateFilter === "month") {
        const taskTime = task.completedAt || task.createdAt;
        if (now - taskTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search filter
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesSubtitle = task.subtitle?.toLowerCase().includes(q);
        const matchesScript = task.scriptSnippet?.toLowerCase().includes(q);
        const matchesChannel = task.targetChannel?.toLowerCase().includes(q);
        const matchesArtifact = task.outputArtifact?.name?.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesSubtitle && !matchesScript && !matchesChannel && !matchesArtifact && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [combinedHistory, selectedType, selectedPlatform, dateFilter, debouncedSearch]);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const total = combinedHistory.length;
    const totalMB = combinedHistory.reduce((acc, task) => {
      const sizeStr = task.outputArtifact?.size || "35 MB";
      const num = parseFloat(sizeStr) || 25;
      return acc + num;
    }, 0);

    const avgScore = total > 0
      ? Math.round(combinedHistory.reduce((acc, t) => acc + (t.viralScore || 92), 0) / total)
      : 95;

    const timeSavedHours = (total * 0.75).toFixed(1);

    return {
      total,
      totalStorage: totalMB > 1024 ? `${(totalMB / 1024).toFixed(1)} GB` : `${totalMB.toFixed(0)} MB`,
      avgScore,
      timeSavedHours
    };
  }, [combinedHistory]);

  const handleRefresh = () => {
    soundSynth.playSfx("whoosh");
    fetchHistoryFromBackend();
  };

  const handleCopyScript = (task: GlobalTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = task.scriptSnippet || task.subtitle || task.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(task.id);
    soundSynth.playSfx("pop");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleVoiceAudio = (task: GlobalTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTaskId === task.id) {
      soundSynth.stopSpeech();
      setPlayingTaskId(null);
      return;
    }

    setPlayingTaskId(task.id);
    soundSynth.playSfx("whoosh");
    const textToSpeak = task.scriptSnippet || task.title;
    soundSynth.speakText(textToSpeak, {
      lang: "vi-VN",
      rate: 1.05,
      pitch: 1.0,
      onEnd: () => setPlayingTaskId(null)
    });
  };

  const handleSelectAll = () => {
    soundSynth.playSfx("pop");
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleToggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playSfx("pop");
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportSelectedJson = () => {
    soundSynth.playSfx("cash");
    const tasksToExport = combinedHistory.filter((t) =>
      selectedTaskIds.length > 0 ? selectedTaskIds.includes(t.id) : true
    );

    const jsonStr = JSON.stringify(tasksToExport, null, 2);
    downloadTextFile(`CreatorOS_Task_History_Export_${Date.now()}.json`, jsonStr, "application/json;charset=utf-8");
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  const handleConfirmClear = () => {
    soundSynth.playSfx("pop");
    clearTaskHistory();
    setBackendHistory([]);
    setSelectedTaskIds([]);
    setShowClearModal(false);
  };

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return "Vừa xong";
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Vừa xong";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    const days = Math.floor(diffSec / 86400);
    return `${days} ngày trước`;
  };

  const getTypeBadge = (type: GlobalTaskType | string) => {
    switch (type) {
      case "highlight":
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Highlight AI
          </span>
        );
      case "translate":
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            Dịch & Lồng Tiếng
          </span>
        );
      case "comic-render":
        return (
          <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold flex items-center gap-1">
            <Film className="w-3 h-3 text-pink-400" />
            Truyện Tranh AI
          </span>
        );
      case "video-edit":
        return (
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            Bán Content / No-Strike
          </span>
        );
      case "voice-synth":
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            Voiceover Local
          </span>
        );
      case "seo-generate":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1">
            <Code2 className="w-3 h-3 text-purple-400" />
            SEO & Thumbnail
          </span>
        );
      case "download":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
            <Download className="w-3 h-3 text-blue-400" />
            Batch Download
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Tác Vụ AI
          </span>
        );
    }
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case "youtube":
        return (
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
            <Film className="w-2.5 h-2.5 text-red-400" />
            YT Shorts
          </span>
        );
      case "tiktok":
        return (
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-400" />
            TikTok
          </span>
        );
      case "facebook":
        return (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-blue-400" />
            FB Reels
          </span>
        );
      case "douyin":
        return (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            Douyin
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
            Đa Nền Tảng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tổng Tác Vụ Hoàn Tất</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white">{metrics.total}</div>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span>● 100% Sẵn sàng tải lại</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Dung Lượng Artifacts Đã Sinh</span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white">{metrics.totalStorage}</div>
            <p className="text-[11px] text-indigo-300 font-semibold">
              Bao gồm MP4, SRT, ASS, JSON
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Thời Gian Tiết Kiệm Ước Tính</span>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white">{metrics.timeSavedHours} Giờ</div>
            <p className="text-[11px] text-amber-300 font-semibold">
              Nhờ GPU NVENC & AI Tự Động
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Điểm Viral Tiềm Năng TB</span>
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white">{metrics.avgScore}%</div>
            <p className="text-[11px] text-rose-300 font-semibold">
              Đánh giá thuật toán 2026
            </p>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters, View Modes, Batch Buttons */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề tác vụ, kịch bản, kênh đích, tệp artifact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Đang Tải..." : "Làm Mới Lịch Sử"}</span>
            </button>

            <button
              onClick={handleExportSelectedJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xuất Báo Cáo JSON</span>
            </button>

            {combinedHistory.length > 0 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Xóa Lịch Sử</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
                title="Dạng lưới thẻ (Grid View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "table" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
                title="Dạng bảng danh sách (Table View)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Loại Tác Vụ:
            </span>
            {[
              { id: "all", label: "Tất Cả" },
              { id: "highlight", label: "Highlight AI" },
              { id: "translate", label: "Dịch & Lồng Tiếng" },
              { id: "comic-render", label: "Truyện Tranh AI" },
              { id: "video-edit", label: "Bán Content" },
              { id: "voice-synth", label: "Voiceover" },
              { id: "seo-generate", label: "SEO Suite" },
              { id: "download", label: "Downloader" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setSelectedType(tab.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Thời Gian:</span>
            {[
              { id: "all", label: "Toàn Bộ" },
              { id: "today", label: "Hôm Nay" },
              { id: "week", label: "7 Ngày" },
              { id: "month", label: "30 Ngày" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setDateFilter(t.id as any);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  dateFilter === t.id
                    ? "bg-slate-800 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid vs Table View */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">Không tìm thấy tác vụ nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc tác vụ khác để xem kết quả hoàn tất trước đây.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setDateFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            Đặt Lại Bộ Lọc
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const isPlaying = playingTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => setInspectingTask(task)}
                className={`group p-4 rounded-2xl bg-slate-900/90 border transition-all duration-200 cursor-pointer space-y-3.5 relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-indigo-500/40 ${
                  isSelected ? "border-indigo-500 bg-indigo-950/20" : "border-slate-800"
                }`}
              >
                {/* Card Top: Thumbnail + Badges */}
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                    {task.thumbnail ? (
                      <img
                        src={task.thumbnail}
                        alt={task.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <FileVideo className="w-10 h-10" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {getTypeBadge(task.type)}
                          {getPlatformBadge(task.platform)}
                        </div>

                        {/* Checkbox Selection */}
                        <button
                          onClick={(e) => handleToggleSelectTask(task.id, e)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-900/80 border-slate-700 text-transparent hover:border-slate-500"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                        <span className="px-1.5 py-0.2 rounded bg-black/60 font-bold text-emerald-400">
                          {task.resolution || "1080x1920 60fps"}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-black/60 text-slate-300">
                          {task.estimatedDuration || "00:54"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {task.title}
                      </h4>
                      {task.viralScore && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black shrink-0 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          {task.viralScore}%
                        </span>
                      )}
                    </div>
                    {task.subtitle && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{task.subtitle}</p>
                    )}
                  </div>

                  {/* Script Excerpt */}
                  {task.scriptSnippet && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">Trích dẫn Kịch bản Hook:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleVoiceAudio(task, e)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300"
                            title="Nghe thử giọng đọc TTS"
                          >
                            {isPlaying ? (
                              <VolumeX className="w-3 h-3 text-red-400 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleCopyScript(task, e)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Sao chép kịch bản"
                          >
                            {copiedId === task.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 italic leading-relaxed">
                        "{task.scriptSnippet}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Artifact info & Download Button Dock */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatRelativeTime(task.completedAt || task.createdAt)}
                    </span>
                    <span className="font-mono text-indigo-300 text-[10px] truncate max-w-[140px]">
                      {task.outputArtifact?.name || "Rendered_Video.mp4"}
                    </span>
                  </div>

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-3 gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => downloadVideoBlob(task)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
                      title="Tải video thành phẩm MP4"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Tải MP4</span>
                    </button>

                    <button
                      onClick={() => downloadSrtFile(task)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all cursor-pointer"
                      title="Tải phụ đề SubRip .srt"
                    >
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>Sub .SRT</span>
                    </button>

                    <button
                      onClick={() => setInspectingTask(task)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                      title="Xem toàn bộ thông số và logs chi tiết"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>Chi Tiết</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 pl-4 w-8">
                    <button
                      onClick={handleSelectAll}
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "border-slate-700 text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 pl-2">Tác Vụ AI / Tiêu Đề</th>
                  <th className="py-3.5">Phân Loại</th>
                  <th className="py-3.5">Kênh / Nền Tảng</th>
                  <th className="py-3.5">Artifact Sinh Ra</th>
                  <th className="py-3.5">Điểm Viral</th>
                  <th className="py-3.5">Thời Gian</th>
                  <th className="py-3.5 text-right pr-4">Hành Động Tải Lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setInspectingTask(task)}
                      className={`hover:bg-slate-800/40 transition-all cursor-pointer ${
                        isSelected ? "bg-indigo-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 pl-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectTask(task.id, e)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "border-slate-700 text-transparent hover:border-slate-500"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </td>

                      <td className="py-3.5 pl-2 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                            {task.thumbnail ? (
                              <img src={task.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <FileVideo className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate text-xs">{task.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{task.subtitle || task.currentStep}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">{getTypeBadge(task.type)}</td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          {getPlatformBadge(task.platform)}
                          <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                            {task.targetChannel || "Mặc định"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-[11px] text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-indigo-300 font-semibold truncate max-w-[130px]">
                            {task.outputArtifact?.name || "Render.mp4"}
                          </span>
                          <span className="text-[10px] text-slate-500">{task.outputArtifact?.size || "35 MB"}</span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black text-[10px] flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          {task.viralScore || 95}%
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-[11px] text-slate-400">
                        {formatRelativeTime(task.completedAt || task.createdAt)}
                      </td>

                      <td className="py-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => downloadVideoBlob(task)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="Tải Video .MP4"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadSrtFile(task)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="Tải Phụ Đề .SRT"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadTaskJson(task)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="Tải Metadata .JSON"
                          >
                            <Code2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => setInspectingTask(task)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="Xem Chi Tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION LIGHTBOX MODAL */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeBadge(inspectingTask.type)}
                {getPlatformBadge(inspectingTask.platform)}
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {inspectingTask.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Media & Meta Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thumbnail Visual Container */}
                <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                  {inspectingTask.thumbnail ? (
                    <img
                      src={inspectingTask.thumbnail}
                      alt={inspectingTask.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <FileVideo className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono text-emerald-400 font-bold">
                        {inspectingTask.resolution || "1080x1920 60FPS"}
                      </span>
                      <span className="font-mono text-slate-300">
                        {inspectingTask.estimatedDuration || "00:54"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Specifications */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Điểm Thuật Toán Viral:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {inspectingTask.viralScore || 95}% Tiềm Năng
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Kênh Đích:</span>
                      <span className="font-bold text-indigo-300">{inspectingTask.targetChannel || "Kênh Mặc Định"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Tốc Độ Xử Lý:</span>
                      <span className="font-mono text-emerald-400">{inspectingTask.speed || "60 FPS (NVENC CUDA)"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Thời Điểm Hoàn Tất:</span>
                      <span className="font-mono text-slate-300">
                        {new Date(inspectingTask.completedAt || inspectingTask.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Trạng Thái:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã Xuất Bản & Lưu Trữ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Script & Hook Inspector */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Kịch Bản Lời Thoại / Hook Sinh Ra:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleVoiceAudio(inspectingTask, e)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{playingTaskId === inspectingTask.id ? "Dừng Phát" : "Nghe TTS"}</span>
                    </button>
                    <button
                      onClick={(e) => handleCopyScript(inspectingTask, e)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      {copiedId === inspectingTask.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã Copy!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Kịch Bản</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed p-3 bg-slate-900 rounded-lg border border-slate-800/80 font-normal">
                  {inspectingTask.scriptSnippet || inspectingTask.subtitle || "Không có đoạn văn bản trích dẫn."}
                </p>
              </div>

              {/* Hashtags & SEO Meta */}
              {inspectingTask.tags && inspectingTask.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Bộ Hashtags Tối Ưu:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingTask.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 text-xs font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminal Logs Inspector */}
              {inspectingTask.logs && inspectingTask.logs.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Nhật Ký Thực Thi (Subprocess Execution Logs):</span>
                  </div>
                  <div className="p-2.5 bg-black/80 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 max-h-36 overflow-y-auto">
                    {inspectingTask.logs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-2">
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Output Download Studio (MP4, SRT, ASS, JSON) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Tải Trực Tiếp Thành Phẩm & Subtitles:</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inspectingTask.outputArtifact?.name || "Rendered_Output.mp4"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => downloadVideoBlob(inspectingTask)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    title="Tải video thành phẩm MP4 độ phân giải cao"
                  >
                    <FileVideo className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tải Video .MP4</span>
                  </button>

                  <button
                    onClick={() => downloadSrtFile(inspectingTask)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    title="Tải phụ đề SubRip tiêu chuẩn .srt"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Phụ Đề .SRT</span>
                  </button>

                  <button
                    onClick={() => downloadAssFile(inspectingTask)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    title="Tải phụ đề Karaoke chuyển động .ass"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Karaoke .ASS</span>
                  </button>

                  <button
                    onClick={() => downloadTaskJson(inspectingTask)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    title="Tải toàn bộ Metadata & Logs dạng JSON"
                  >
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Metadata .JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                ID Tác Vụ: <code className="text-slate-400 font-mono">{inspectingTask.id}</code>
              </span>

              <button
                onClick={() => setInspectingTask(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR HISTORY CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Toàn Bộ Lịch Sử?</h3>
                <p className="text-xs text-slate-400">
                  Hành động này sẽ dọn sạch danh sách các tác vụ AI đã hoàn tất trong bộ nhớ lưu trữ.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
