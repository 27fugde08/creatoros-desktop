import React, { useState, useMemo, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Film,
  Zap,
  Globe,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ListOrdered,
  Grid,
  ListFilter,
  CheckSquare,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Clock,
  Calendar,
  Download,
  Share2,
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  FileVideo,
  Flame,
  Radio,
  Send,
  Sliders,
  Maximize2,
  Award,
  Layers,
  Copy,
  Hash,
  AlertCircle,
  FileText,
  Code2
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useQueue } from "../context/QueueContext";
import { DashboardWidget } from "./DashboardWidget";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { GlobalTaskItem, GlobalTaskType, GlobalTaskStatus } from "../../shared/types";
import {
  downloadVideoBlob,
  downloadSrtFile,
  downloadAssFile,
  downloadTaskJson,
} from "../utils/downloadUtils";
import confetti from "canvas-confetti";
import { ActivityLogTab } from "./ActivityLogTab";
import { DashboardTerminalLogs } from "./DashboardTerminalLogs";
import { TaskHistoryTab } from "./TaskHistoryTab";
import { DatabaseExplorerTab } from "./DatabaseExplorerTab";
import { Database } from "lucide-react";

export const DashboardTool: React.FC = () => {
  const {
    tasks,
    stats: queueStats,
    toggleQueue,
    approveTask,
    bulkApproveTasks,
    scheduleTasks,
    rejectTask,
    loadSampleTasksForReview,
    addTask
  } = useQueue();

  const [activeDashboardTab, setActiveDashboardTab] = useState<"bulk-preview" | "channels" | "pipeline" | "activity-logs" | "task-history" | "db-explorer">("bulk-preview");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"viral" | "newest" | "progress" | "duration">("viral");
  
  // Audio playback state for voiceover hook previews
  const [playingHookTaskId, setPlayingHookTaskId] = useState<string | null>(null);

  // Inspector Lightbox Modal State
  const [inspectingTask, setInspectingTask] = useState<GlobalTaskItem | null>(null);

  // Bulk schedule modal/popover state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState("19:30 Tối nay (Khung giờ vàng)");

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const stats = [
    {
      title: "Tổng Lượt Xem Tháng Này",
      value: "148.5M",
      change: "+34.2%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Doanh Thu Đã Ước Tính (RPM)",
      value: "$34,820.50",
      change: "+28.6%",
      isPositive: true,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Kênh & Fanpage Đang Chạy",
      value: "42 Kênh",
      change: "+6 kênh mới",
      isPositive: true,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Video Đã Sản Xuất & Xuất Bản",
      value: "1,840 Video",
      change: "100% Fair-Use",
      isPositive: true,
      icon: Film,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const initialChannels = [
    {
      name: "Tech Lab AI Automation (YTB Shorts)",
      platform: "YouTube",
      dailyViews: "1.8M",
      rpm: "$2.85",
      revenueDaily: "$480",
      health: "100% Sạch",
      botStatus: "Running",
    },
    {
      name: "Ghiền Phim Review 24h (TikTok VN)",
      platform: "TikTok",
      dailyViews: "3.2M",
      rpm: "$0.45",
      revenueDaily: "$310",
      health: "100% Sạch",
      botStatus: "Running",
    },
    {
      name: "Bí Mật Lịch Sử & Vũ Trụ (FB Reels)",
      platform: "Facebook",
      dailyViews: "2.4M",
      rpm: "$1.20",
      revenueDaily: "$420",
      health: "98% Sạch",
      botStatus: "Running",
    },
    {
      name: "Solo Anime Manhwa Recap (YTB US)",
      platform: "YouTube US",
      dailyViews: "950K",
      rpm: "$5.40",
      revenueDaily: "$850",
      health: "100% Sạch",
      botStatus: "Running",
    },
    {
      name: "Satisfying Douyin Clip Hub (Reels Matrix)",
      platform: "Douyin / Reels",
      dailyViews: "4.1M",
      rpm: "$0.65",
      revenueDaily: "$380",
      health: "100% Sạch",
      botStatus: "Idle",
    },
  ];

  const [channels, setChannels] = useState(() => {
    try {
      const saved = localStorage.getItem("creator_managed_channels_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load channels from storage", e);
    }
    return initialChannels;
  });

  useEffect(() => {
    try {
      localStorage.setItem("creator_managed_channels_v1", JSON.stringify(channels));
    } catch (e) {
      console.error("Failed to save channels to storage", e);
    }
  }, [channels]);

  const handleRefresh = () => {
    setRefreshing(true);
    soundSynth.playSfx("whoosh");
    setTimeout(() => {
      setRefreshing(false);
      soundSynth.playSfx("cash");
      confetti({ particleCount: 30, spread: 50 });
      showToast("✨ Đã đồng bộ dữ liệu toàn bộ hệ sinh thái thời gian thực!");
    }, 600);
  };

  // Filter and sort tasks for Bulk Preview
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query filter
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchChannel = task.targetChannel?.toLowerCase().includes(q) || false;
          const matchScript = task.scriptSnippet?.toLowerCase().includes(q) || false;
          const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q)) || false;
          
          // Match status text
          let statusText = task.status;
          if (task.approved) statusText += " approved duyệt";
          else statusText += " pending chờ duyệt đang chờ";
          const matchStatus = statusText.toLowerCase().includes(q);

          if (!matchTitle && !matchChannel && !matchScript && !matchTags && !matchStatus) return false;
        }

        // Platform filter
        if (filterPlatform !== "all") {
          if (task.platform !== filterPlatform) return false;
        }

        // Status filter
        if (filterStatus === "pending") {
          // Unapproved or queued or processing
          if (task.approved) return false;
        } else if (filterStatus === "approved") {
          if (!task.approved) return false;
        } else if (filterStatus === "processing") {
          if (task.status !== "processing") return false;
        } else if (filterStatus === "completed") {
          if (task.status !== "completed") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "viral") {
          return (b.viralScore || 0) - (a.viralScore || 0);
        } else if (sortBy === "newest") {
          return b.createdAt - a.createdAt;
        } else if (sortBy === "progress") {
          return b.progress - a.progress;
        } else if (sortBy === "duration") {
          return (b.estimatedDuration || "").localeCompare(a.estimatedDuration || "");
        }
        return 0;
      });
  }, [tasks, debouncedSearchQuery, filterPlatform, filterStatus, sortBy]);

  // Pending tasks that need approval
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => !t.approved && (t.status === "processing" || t.status === "completed" || t.status === "queued")).length;
  }, [tasks]);

  // Selection handlers
  const handleToggleSelectTask = (id: string) => {
    soundSynth.playSfx("pop");
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    soundSynth.playSfx("whoosh");
    const unapprovedIds = filteredTasks.filter((t) => !t.approved).map((t) => t.id);
    if (selectedTaskIds.length === unapprovedIds.length && unapprovedIds.length > 0) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(unapprovedIds);
    }
  };

  const handleSelectAllVisible = () => {
    soundSynth.playSfx("whoosh");
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  // Bulk Approve Action
  const handleExecuteBulkApprove = () => {
    const idsToApprove = selectedTaskIds.length > 0 
      ? selectedTaskIds 
      : filteredTasks.filter((t) => !t.approved).map((t) => t.id);

    if (idsToApprove.length === 0) {
      soundSynth.playSfx("pop");
      showToast("⚠️ Không có video nào đang chờ duyệt!");
      return;
    }

    setIsApproving(true);
    
    // Giả lập thời gian xử lý bằng API
    setTimeout(() => {
      bulkApproveTasks(idsToApprove);
      showToast(`🎉 Đã phê duyệt thành công ${idsToApprove.length} video! Tự động xếp lịch xuất bản đa kênh.`);
      setSelectedTaskIds([]);
      setIsApproving(false);
    }, 2000);
  };

  // Single Approve
  const handleSingleApprove = (task: GlobalTaskItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    approveTask(task.id);
    showToast(`✅ Đã phê duyệt video "${task.title}"!`);
  };

  // Reject Action
  const handleReject = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    rejectTask(taskId);
    showToast("❌ Video đã bị từ chối duyệt và trả về hàng đợi biên tập.");
  };

  // Schedule Action
  const handleBulkSchedule = () => {
    const idsToSchedule = selectedTaskIds.length > 0
      ? selectedTaskIds
      : filteredTasks.map((t) => t.id);

    if (idsToSchedule.length === 0) return;

    scheduleTasks(idsToSchedule, selectedSchedulePreset);
    setIsScheduleModalOpen(false);
    showToast(`📅 Đã lên lịch tự động cho ${idsToSchedule.length} video (${selectedSchedulePreset})`);
    setSelectedTaskIds([]);
  };

  // Export metadata JSON
  const handleExportMetadata = () => {
    soundSynth.playSfx("cash");
    const exportData = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      platform: t.platform || "tiktok",
      targetChannel: t.targetChannel || "General",
      duration: t.estimatedDuration || "00:60",
      viralScore: t.viralScore || 90,
      scriptSnippet: t.scriptSnippet || "",
      tags: t.tags || [],
      approved: t.approved || false,
      scheduledTime: t.scheduledTime || "Auto-Queue",
      status: t.status,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Creator_Bulk_Approved_Metadata_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Đã xuất trích xuất file JSON Metadata đầy đủ!");
  };

  // Audio Hook Speech Playback
  const handleTogglePlayHook = (task: GlobalTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingHookTaskId === task.id) {
      soundSynth.stopSpeech();
      setPlayingHookTaskId(null);
      return;
    }

    soundSynth.stopSpeech();
    setPlayingHookTaskId(task.id);
    soundSynth.playSfx("whoosh");

    const textToSpeak = task.scriptSnippet || task.title;
    soundSynth.speakText(textToSpeak, {
      lang: "vi-VN",
      rate: 1.05,
      pitch: 1.0,
      onEnd: () => {
        setPlayingHookTaskId(null);
      },
    });
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case "youtube":
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
            <Film className="w-3 h-3 text-red-400" />
            YT Shorts
          </span>
        );
      case "tiktok":
        return (
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            TikTok VN
          </span>
        );
      case "facebook":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-400" />
            FB Reels
          </span>
        );
      case "douyin":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Douyin HD
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            Đa Kênh
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce p-3.5 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white text-xs font-bold border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dashboard Quản Trị & Xem Trước Hàng Loạt (Bulk Preview Studio)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl">
              Trung tâm kiểm duyệt trực quan: Xem trước đồng thời toàn bộ thumbnail, kịch bản Hook, điểm Viral & metadata của các tác vụ trong hàng đợi trước khi kích hoạt phê duyệt hàng loạt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Real-time Connection Health & Ping-Pong Badge */}
            <ConnectionStatusBadge wsUrl="ws://127.0.0.1:8765" />

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Đang Đồng Bộ..." : "Làm Mới"}</span>
            </button>

            <button
              onClick={toggleQueue}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold border border-indigo-500/40 transition-all cursor-pointer shadow-sm"
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hàng Đợi ({queueStats.total})</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Health Status Indicator Widget */}
      <DashboardWidget />

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{stat.title}</span>
                <span className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("bulk-preview");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "bulk-preview"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Xem Trước Lưới Hàng Loạt (Bulk Preview)</span>
            {pendingTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("channels");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "channels"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Ma Trận 42+ Kênh & RPM</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("pipeline");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "pipeline"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Tiến Trình GPU & Logs</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("task-history");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "task-history"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Task History (Lịch Sử Tác Vụ AI)</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("activity-logs");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "activity-logs"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity Logs (Nhật ký)</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setActiveDashboardTab("db-explorer");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "db-explorer"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Database Explorer (SQLite & DAG State)</span>
          </button>
        </div>

        {activeDashboardTab === "bulk-preview" && (
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={loadSampleTasksForReview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Nạp danh sách video mẫu để trải nghiệm duyệt"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nạp Tác Vụ Mẫu</span>
            </button>

            <button
              onClick={handleExportMetadata}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BULK PREVIEW STUDIO */}
      {activeDashboardTab === "bulk-preview" && (
        <div className="space-y-5">
          {/* Controls Bar: Search, Filters, Sorters, Selection */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề video, kịch bản, kênh đích, trạng thái..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Platform Filter */}
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                >
                  <option value="all">Tất Cả Nền Tảng</option>
                  <option value="tiktok">TikTok Video</option>
                  <option value="youtube">YouTube Shorts</option>
                  <option value="facebook">Facebook Reels</option>
                  <option value="douyin">Douyin Clips</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                >
                  <option value="all">Tất Cả Trạng Thái</option>
                  <option value="pending">⏳ Chờ Phê Duyệt ({pendingTasksCount})</option>
                  <option value="approved">✅ Đã Phê Duyệt</option>
                  <option value="processing">⚙️ Đang Render</option>
                  <option value="completed">🎉 Hoàn Tất</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                >
                  <option value="viral">🔥 Điểm Viral Cao Nhất</option>
                  <option value="newest">🕒 Tác Vụ Mới Nhất</option>
                  <option value="progress">⚡ Tiến Độ Render</option>
                  <option value="duration">⏱️ Thời Lượng Video</option>
                </select>
              </div>
            </div>

            {/* Selection Status & Quick Batch Action Ribbon */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAllPending}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.filter((t) => !t.approved).length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    Chọn tất cả video chờ duyệt ({filteredTasks.filter((t) => !t.approved).length})
                  </span>
                </button>

                <span className="text-slate-600">•</span>

                <button
                  onClick={handleSelectAllVisible}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả hiển thị"}
                </button>

                {selectedTaskIds.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                    Đã chọn {selectedTaskIds.length} / {filteredTasks.length} video
                  </span>
                )}
              </div>

              {/* Action Buttons in Ribbon */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteBulkApprove}
                  disabled={isApproving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all ${
                    isApproving
                      ? "bg-emerald-600/50 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 cursor-pointer"
                  }`}
                >
                  {isApproving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isApproving
                      ? "Đang xử lý..."
                      : selectedTaskIds.length > 0
                      ? `Phê Duyệt ${selectedTaskIds.length} Video Đã Chọn`
                      : "Duyệt Tất Cả Đang Chờ"}
                  </span>
                </button>

                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lên Lịch Đăng</span>
                </button>
              </div>
            </div>
          </div>

          {/* BULK PREVIEW GRID */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <Film className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Không tìm thấy video nào phù hợp</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Thử thay đổi bộ lọc tìm kiếm hoặc nhấn "Nạp Tác Vụ Mẫu" để xem thử lưới preview với các kịch bản thực tế.
                </p>
              </div>
              <button
                onClick={loadSampleTasksForReview}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Nạp Danh Sách Video Mẫu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                const isPlayingThisHook = playingHookTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleSelectTask(task.id)}
                    className={`group relative rounded-2xl bg-slate-900 border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-lg hover:shadow-indigo-500/10 ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/40 bg-slate-900/95"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Visual Thumbnail Area (9:16 vertical ratio header) */}
                    <div className="relative aspect-[16/10] sm:aspect-[16/11] bg-slate-950 overflow-hidden">
                      {task.thumbnail ? (
                        <img
                          src={task.thumbnail}
                          alt={task.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
                          <FileVideo className="w-10 h-10 text-indigo-400/40" />
                        </div>
                      )}

                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/60 pointer-events-none" />

                      {/* Top Badges: Selection Checkbox & Platform */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                        {/* Checkbox */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectTask(task.id);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/50"
                              : "bg-slate-900/80 text-transparent border border-slate-600 hover:border-indigo-400"
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                        </div>

                        {/* Platform Badge */}
                        {getPlatformBadge(task.platform)}
                      </div>

                      {/* Viral Score Pill (Top Right or Bottom Left) */}
                      {task.viralScore && (
                        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/90 text-amber-300 border border-amber-500/30 text-[10px] font-black backdrop-blur-md">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                          <span>{task.viralScore}% Viral</span>
                        </div>
                      )}

                      {/* Duration & Resolution */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 text-slate-300 text-[10px] font-mono font-semibold backdrop-blur-md">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{task.estimatedDuration || "00:50"}</span>
                      </div>

                      {/* Play / Inspect Overlay Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingTask(task);
                          }}
                          className="p-3 rounded-full bg-indigo-600/90 text-white hover:bg-indigo-500 hover:scale-110 transition-all shadow-xl shadow-indigo-600/40"
                          title="Xem Chi Tiết Kịch Bản & Video"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar (if processing) */}
                    <div className="w-full h-1.5 bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          task.approved
                            ? "bg-emerald-500"
                            : task.status === "completed"
                            ? "bg-indigo-500"
                            : "bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-400 animate-pulse"
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {/* Card Content / Essential Metadata */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {/* Title & Target Channel */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold truncate max-w-[180px]">
                            {task.targetChannel || "@creator_network"}
                          </span>
                          {task.approved ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                              Đã Duyệt
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                              Chờ Duyệt
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-relaxed group-hover:text-indigo-200 transition-colors">
                          {task.title}
                        </h3>

                        {task.subtitle && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {task.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Script Hook Preview Box */}
                      {task.scriptSnippet && (
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Hook 3s Giữ Chân:
                            </span>
                            <button
                              onClick={(e) => handleTogglePlayHook(task, e)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                isPlayingThisHook
                                  ? "bg-red-500 text-white animate-pulse"
                                  : "bg-slate-800 hover:bg-slate-700 text-indigo-300"
                              }`}
                              title="Nghe thử giọng đọc AI TTS"
                            >
                              {isPlayingThisHook ? (
                                <>
                                  <VolumeX className="w-2.5 h-2.5" />
                                  <span>Dừng</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-2.5 h-2.5" />
                                  <span>Nghe TTS</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed">
                            "{task.scriptSnippet}"
                          </p>
                        </div>
                      )}

                      {/* Hashtags Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-[9px] px-1 py-0.5 text-slate-500 font-mono">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quick Single Action Footer */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingTask(task);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi Tiết</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!task.approved ? (
                            <button
                              onClick={(e) => handleSingleApprove(task, e)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã Lên Lịch</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bulk Action Dock (Bottom Bar) */}
          {selectedTaskIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
              <div className="p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 shadow-2xl shadow-indigo-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-black text-sm">
                    {selectedTaskIds.length}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Đã chọn {selectedTaskIds.length} video trong hàng đợi
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sẵn sàng kích hoạt xuất bản tự động đa nền tảng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedTaskIds([])}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Bỏ chọn
                  </button>

                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lên Lịch</span>
                  </button>

                  <button
                    onClick={handleExecuteBulkApprove}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/40 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>🚀 Duyệt {selectedTaskIds.length} Video</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHANNELS MATRIX */}
      {activeDashboardTab === "channels" && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Ma Trận Kênh Đang Quản Trị Tự Động
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toàn bộ các kênh trong hệ sinh thái được bảo vệ bằng Anti Content-ID và tự động đăng lịch trình.
              </p>
            </div>

            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Kênh Khỏe Mạnh
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Tên Kênh / Nền Tảng</th>
                  <th className="pb-3">View Ngày</th>
                  <th className="pb-3">RPM Ước Tính</th>
                  <th className="pb-3">Doanh Thu/Ngày</th>
                  <th className="pb-3">Sức Khỏe Kênh</th>
                  <th className="pb-3 text-right pr-2">Trạng Thái Bot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {channels.map((ch, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3.5 pl-2 font-bold text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-indigo-300 font-mono">
                        {ch.platform}
                      </span>
                      <span className="truncate max-w-xs">{ch.name}</span>
                    </td>
                    <td className="py-3.5 font-mono text-cyan-300 font-semibold">{ch.dailyViews}</td>
                    <td className="py-3.5 font-mono text-amber-300 font-semibold">{ch.rpm}</td>
                    <td className="py-3.5 font-mono text-emerald-400 font-bold">{ch.revenueDaily}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                        {ch.health}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ch.botStatus === "Running"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {ch.botStatus === "Running" ? "● Bot Auto Đang Chạy" : "○ Chờ Lệnh"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PIPELINE WORKER */}
      {activeDashboardTab === "pipeline" && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tiến Trình Xử Lý Video Tự Động (Global Background Worker)
                </h2>
                <p className="text-xs text-slate-400">
                  GPU NVENC & Turbo Multi-thread đang xử lý {queueStats.processing} tác vụ trực tiếp
                </p>
              </div>
            </div>

            <button
              onClick={toggleQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Mở Toàn Bộ Hàng Đợi ({queueStats.total})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                onClick={() => setInspectingTask(task)}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {task.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.currentStep}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                      task.approved
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    }`}
                  >
                    {task.progress}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      task.approved
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-indigo-500 to-emerald-400"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDashboardTab === "task-history" && (
        <TaskHistoryTab />
      )}

      {activeDashboardTab === "activity-logs" && (
        <div className="h-[800px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <ActivityLogTab />
        </div>
      )}

      {activeDashboardTab === "db-explorer" && (
        <DatabaseExplorerTab />
      )}

      {/* Terminal Log Subprocess Real-time Stream */}
      <div className="mt-4">
        <DashboardTerminalLogs />
      </div>

      {/* INSPECTION LIGHTBOX MODAL */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPlatformBadge(inspectingTask.platform)}
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {inspectingTask.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
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
                        {inspectingTask.estimatedDuration || "00:58"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Protection Specifications */}
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
                      <span className="font-bold text-indigo-300">{inspectingTask.targetChannel || "Mặc định"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Bảo Vệ Bản Quyền:</span>
                      <span className="font-bold text-emerald-400">100% Sạch Content-ID</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Pitch Shift & B-Roll:</span>
                      <span className="font-mono text-slate-300">+3.2% / GTA5 60fps</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Trạng Thái Duyệt:</span>
                      <span className={`font-bold ${inspectingTask.approved ? "text-emerald-400" : "text-amber-400"}`}>
                        {inspectingTask.approved ? "✅ Đã Phê Duyệt" : "⏳ Đang Chờ Phê Duyệt"}
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
                    Nội Dung Kịch Bản Lời Bình (Review Hook):
                  </span>
                  <button
                    onClick={(e) => handleTogglePlayHook(inspectingTask, e)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe Giọng Đọc TTS</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                  {inspectingTask.scriptSnippet || "Đang trích xuất và tối ưu kịch bản chuyển đổi..."}
                </p>
              </div>

              {/* Hashtags & SEO Meta */}
              {inspectingTask.tags && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Bộ Hashtags SEO:</span>
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

              {/* Direct Output Download Studio (MP4, SRT, ASS, JSON) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Tải Trực Tiếp Thành Phẩm & Subtitles:</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inspectingTask.outputArtifact?.name || "Rendered_Video_FullHD.mp4"}
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
              <button
                onClick={() => {
                  handleReject(inspectingTask.id);
                  setInspectingTask(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 cursor-pointer"
              >
                Từ Chối & Làm Lại
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>

                {!inspectingTask.approved && (
                  <button
                    onClick={() => {
                      handleSingleApprove(inspectingTask);
                      setInspectingTask(null);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Phê Duyệt Video Này</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Lên Lịch Xuất Bản Tự Động</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Chọn cơ chế giãn cách hoặc khung giờ vàng đăng bài cho {selectedTaskIds.length > 0 ? selectedTaskIds.length : filteredTasks.length} video:
            </p>

            <div className="space-y-2">
              {[
                "19:30 Tối nay (Khung giờ vàng)",
                "21:00 Tối nay (Traffic đỉnh điểm)",
                "Giãn cách tự động mỗi 2 giờ (Staggered)",
                "Đăng ngay lập tức (Instant Multi-Channel Push)",
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSchedulePreset(preset)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSchedulePreset === preset
                      ? "bg-indigo-600/20 text-indigo-300 border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>{preset}</span>
                  {selectedSchedulePreset === preset && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkSchedule}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Xác Nhận Lên Lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

