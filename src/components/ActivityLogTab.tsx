import React, { useState, useMemo, useEffect } from "react";
import { io } from "socket.io-client";
import { useDebounce } from "../hooks/useDebounce";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Copy,
  Check,
  FileText,
  FileJson,
  Trash2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Zap,
  FileVideo,
  Activity,
  Cpu,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  CheckCheck
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { GlobalTaskItem, GlobalTaskType, GlobalTaskStatus } from "../types";
import { soundSynth } from "../utils/audioUtils";
import confetti from "canvas-confetti";

export const ActivityLogTab: React.FC = () => {
  const {
    taskHistory,
    setTaskHistory,
    clearTaskHistory,
    retryTask,
    resumeTask,
    pauseTask
  } = useQueue();

  useEffect(() => {
    // Kết nối socket với server Node.js cùng cổng
    const socket = io();

    const handleTaskCreated = (data: any) => {
      const newTask: GlobalTaskItem = {
        id: `db_task_${data.id}`,
        type: "download",
        title: "Database Task: Download",
        subtitle: data.url,
        status: data.status === "pending" ? "processing" : (data.status as any),
        progress: data.progress || 0,
        createdAt: new Date().getTime(),
        currentStep: "DB Emit: Created",
        logs: [{ timestamp: new Date().toISOString(), message: `New task initialized: ${data.url}` }]
      };
      
      // Update history in real-time
      setTaskHistory(prev => [newTask, ...prev]);
    };

    const handleTaskUpdated = (data: any) => {
      setTaskHistory(prev => prev.map(t => {
        if (t.id === `db_task_${data.id}`) {
          return {
            ...t,
            status: data.status === "pending" ? "processing" : (data.status as any),
            progress: data.progress !== undefined ? data.progress : t.progress,
            currentStep: `DB Emit: Updated (${data.progress}%)`,
            logs: [...(t.logs || []), { timestamp: new Date().toISOString(), message: `Task updated to ${data.status} - ${data.progress}%` }]
          };
        }
        return t;
      }));
    };

    const handleTaskDeleted = (id: string) => {
      setTaskHistory(prev => prev.filter(t => t.id !== `db_task_${id}`));
    };

    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_deleted", handleTaskDeleted);

    return () => {
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_deleted", handleTaskDeleted);
      socket.disconnect();
    };
  }, [setTaskHistory]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedStatus, setSelectedStatus] = useState<"all" | GlobalTaskStatus>("all");
  const [selectedType, setSelectedType] = useState<"all" | GlobalTaskType>("all");
  const [expandedTaskIds, setExpandedTaskIds] = useState<{ [key: string]: boolean }>({});
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Toggle expand for individual task logs
  const toggleExpand = (taskId: string) => {
    soundSynth.playSfx("pop");
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Expand all / Collapse all
  const toggleExpandAll = (expand: boolean) => {
    soundSynth.playSfx("pop");
    const newState: { [key: string]: boolean } = {};
    if (expand) {
      filteredHistory.forEach((t) => {
        newState[t.id] = true;
      });
    }
    setExpandedTaskIds(newState);
  };

  // Filtered Task History
  const filteredHistory = useMemo(() => {
    return taskHistory.filter((task) => {
      // Status filter
      if (selectedStatus !== "all" && task.status !== selectedStatus) {
        return false;
      }
      // Type filter
      if (selectedType !== "all" && task.type !== selectedType) {
        return false;
      }
      // Search query
      if (debouncedSearchQuery.trim() !== "") {
        const query = debouncedSearchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesSubtitle = task.subtitle?.toLowerCase().includes(query) || false;
        const matchesId = task.id.toLowerCase().includes(query);
        const matchesCurrentStep = task.currentStep.toLowerCase().includes(query);
        const matchesArtifact = task.outputArtifact?.name.toLowerCase().includes(query) || false;
        const matchesLogs = task.logs?.some((l) => l.message.toLowerCase().includes(query)) || false;
        return matchesTitle || matchesSubtitle || matchesId || matchesCurrentStep || matchesArtifact || matchesLogs;
      }
      return true;
    });
  }, [taskHistory, selectedStatus, selectedType, debouncedSearchQuery]);

  // Performance Statistics Calculation
  const historyStats = useMemo(() => {
    const total = taskHistory.length;
    const completed = taskHistory.filter((t) => t.status === "completed").length;
    const processing = taskHistory.filter((t) => t.status === "processing").length;
    const failed = taskHistory.filter((t) => t.status === "failed").length;
    const paused = taskHistory.filter((t) => t.status === "paused").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    // Estimate total processing duration
    let totalDurationSeconds = 0;
    taskHistory.forEach((t) => {
      if (t.completedAt && t.createdAt) {
        totalDurationSeconds += Math.max(1, Math.round((t.completedAt - t.createdAt) / 1000));
      } else if (t.status === "processing") {
        totalDurationSeconds += Math.max(1, Math.round((Date.now() - t.createdAt) / 1000));
      }
    });

    return {
      total,
      completed,
      processing,
      failed,
      paused,
      successRate,
      totalDurationSeconds,
    };
  }, [taskHistory]);

  const formatDuration = (startMs: number, endMs?: number) => {
    const durationMs = (endMs || Date.now()) - startMs;
    const seconds = Math.max(1, Math.round(durationMs / 1000));
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    return `${mins}m ${remSec}s`;
  };

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

  const classifyLogMessage = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("hoàn tất") || lower.includes("thành công") || lower.includes("xuất") || lower.includes("tải xong")) {
      return { tag: "SUCCESS", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    }
    if (lower.includes("gpu") || lower.includes("ffmpeg") || lower.includes("nvenc") || lower.includes("render")) {
      return { tag: "RENDER", color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" };
    }
    if (lower.includes("ai") || lower.includes("dịch") || lower.includes("tts") || lower.includes("phân đoạn")) {
      return { tag: "AI_CORE", color: "bg-purple-500/10 text-purple-300 border-purple-500/20" };
    }
    if (lower.includes("lỗi") || lower.includes("hủy") || lower.includes("failed") || lower.includes("error")) {
      return { tag: "ERROR", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    }
    if (lower.includes("tạm dừng") || lower.includes("chờ") || lower.includes("timeout")) {
      return { tag: "WARN", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    }
    return { tag: "INFO", color: "bg-slate-800 text-slate-400 border-slate-700" };
  };

  // Copy Single Task Logs
  const copyTaskLogs = (task: GlobalTaskItem) => {
    soundSynth.playSfx("pop");
    const logHeader = `=== TASK LOG: ${task.title} (ID: ${task.id}) ===\nLoại: ${task.type} | Trạng thái: ${task.status.toUpperCase()}\nBắt đầu: ${new Date(task.createdAt).toLocaleString("vi-VN")}${task.completedAt ? ` | Kết thúc: ${new Date(task.completedAt).toLocaleString("vi-VN")}` : ""}\n\n[TIMELINE EXECUTION LOGS]:\n`;
    const logBody = task.logs.map((l) => `[${l.timestamp}] ${l.message}`).join("\n");
    const fullText = logHeader + logBody;

    navigator.clipboard.writeText(fullText);
    setCopiedTaskId(task.id);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  // Copy All Filtered Logs
  const copyAllFilteredLogs = () => {
    soundSynth.playSfx("pop");
    const content = filteredHistory
      .map((t) => {
        const header = `----------------------------------------\nTASK: ${t.title} [${t.type}] (Status: ${t.status})\nID: ${t.id} | Bắt đầu: ${new Date(t.createdAt).toLocaleTimeString("vi-VN")}\n`;
        const body = t.logs.map((l) => `  [${l.timestamp}] ${l.message}`).join("\n");
        return header + body;
      })
      .join("\n\n");

    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export as JSON file
  const exportLogsAsJson = () => {
    soundSynth.playSfx("success");
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    const exportData = {
      exportTime: new Date().toISOString(),
      app: "Creative Automation Suite",
      stats: historyStats,
      tasks: filteredHistory,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task_activity_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Text file
  const exportLogsAsTxt = () => {
    soundSynth.playSfx("success");
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
    const lines = [
      `=============================================================`,
      `  CREATIVE STUDIO SUITE - NHẬT KÝ THỰC THI HỆ THỐNG TOÀN CỤC`,
      `  Thời gian xuất: ${new Date().toLocaleString("vi-VN")}`,
      `  Tổng số tác vụ: ${filteredHistory.length}`,
      `=============================================================\n`,
    ];

    filteredHistory.forEach((t, idx) => {
      lines.push(`[#${idx + 1}] ${t.title}`);
      lines.push(`  ID: ${t.id} | Phân loại: ${t.type} | Trạng thái: ${t.status.toUpperCase()}`);
      lines.push(`  Bắt đầu: ${new Date(t.createdAt).toLocaleString("vi-VN")}`);
      if (t.completedAt) {
        lines.push(`  Hoàn tất: ${new Date(t.completedAt).toLocaleString("vi-VN")} (Thời gian: ${formatDuration(t.createdAt, t.completedAt)})`);
      }
      if (t.outputArtifact) {
        lines.push(`  Thành phẩm: ${t.outputArtifact.name} (${t.outputArtifact.size || "N/A"})`);
      }
      lines.push(`  --- NHẬT KÝ CHI TIẾT ---`);
      t.logs.forEach((l) => {
        lines.push(`  [${l.timestamp}] ${l.message}`);
      });
      lines.push(`\n-------------------------------------------------------------\n`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task_execution_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0B1120]">
      {/* Top Metric Summary Cards */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Tổng Tác Vụ</span>
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-lg font-bold text-white mt-1 font-mono">{historyStats.total}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-300 text-[11px]">
              <span>Tỷ Lệ Thành Công</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
              {historyStats.successRate}% <span className="text-[10px] text-emerald-300 font-normal">({historyStats.completed}/{historyStats.total})</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
            <div className="flex items-center justify-between text-indigo-300 text-[11px]">
              <span>Thời Gian Xử Lý</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-lg font-bold text-indigo-400 mt-1 font-mono">
              {historyStats.totalDurationSeconds > 60
                ? `${Math.floor(historyStats.totalDurationSeconds / 60)}m ${historyStats.totalDurationSeconds % 60}s`
                : `${historyStats.totalDurationSeconds}s`}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-300 text-[11px]">
              <span>Đang Chạy / Lỗi</span>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-amber-400 mt-1 font-mono">
              {historyStats.processing} / {historyStats.failed}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => toggleExpandAll(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              Mở Rộng Tất Cả
            </button>
            <button
              onClick={() => toggleExpandAll(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              Thu Gọn
            </button>

            <button
              onClick={copyAllFilteredLogs}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 disabled:opacity-40 transition-colors"
              title="Sao chép toàn bộ log đang lọc"
            >
              {copiedAll ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? "Đã Sao Chép!" : "Copy Toàn Bộ Log"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Export JSON */}
            <button
              onClick={exportLogsAsJson}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-colors"
              title="Xuất file nhật ký định dạng JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Xuất JSON</span>
            </button>

            {/* Export TXT */}
            <button
              onClick={exportLogsAsTxt}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-colors"
              title="Xuất file nhật ký văn bản TXT"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Xuất TXT</span>
            </button>

            {/* Clear history */}
            {showClearConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/40 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    clearTaskHistory();
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                >
                  Xác nhận xóa
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={taskHistory.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 disabled:opacity-30 transition-colors"
                title="Dọn sạch toàn bộ lịch sử tác vụ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dọn Lịch Sử</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-[#0F172A] space-y-2.5">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tác vụ, FFmpeg, URL, tên file, ID..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Status filter */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: "all", label: "Tất Cả Trạng Thái" },
              { id: "completed", label: "Hoàn Tất" },
              { id: "processing", label: "Đang Chạy" },
              { id: "paused", label: "Tạm Dừng" },
              { id: "failed", label: "Lỗi" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setSelectedStatus(st.id as any);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                  selectedStatus === st.id
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Type filter dropdown */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              value={selectedType}
              onChange={(e) => {
                soundSynth.playSfx("pop");
                setSelectedType(e.target.value as any);
              }}
              className="bg-slate-900 border border-slate-700 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả loại tác vụ</option>
              <option value="video-edit">Video Edit</option>
              <option value="download">Downloader</option>
              <option value="translate">Dịch Video</option>
              <option value="highlight">Highlight AI</option>
              <option value="fb-render">FB Auto</option>
              <option value="comic-render">AI Manga</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historical Execution Log List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Terminal className="w-12 h-12 mx-auto text-slate-700 opacity-60" />
            <div>
              <p className="text-sm font-semibold text-slate-300">Không tìm thấy nhật ký thực thi nào</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedStatus !== "all" || selectedType !== "all"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc đang kích hoạt."
                  : "Mọi tác vụ khi được kích hoạt hoặc hoàn thành sẽ tự động được ghi lại chi tiết tại đây."}
              </p>
            </div>
            {(searchQuery || selectedStatus !== "all" || selectedType !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("all");
                  setSelectedType("all");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Đặt Lại Bộ Lọc
              </button>
            )}
          </div>
        ) : (
          filteredHistory.map((task, index) => {
            const badge = getTaskBadge(task.type);
            const isExpanded = expandedTaskIds[task.id] ?? false;
            const duration = formatDuration(task.createdAt, task.completedAt);
            const startTimeStr = new Date(task.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const endTimeStr = task.completedAt ? new Date(task.completedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

            return (
              <div
                key={task.id}
                id={`activity-card-${task.id}`}
                className={`rounded-xl border transition-all overflow-hidden ${
                  task.status === "processing"
                    ? "bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-950/20"
                    : task.status === "completed"
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    : task.status === "paused"
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-rose-950/20 border-rose-500/30"
                }`}
              >
                {/* Header Summary Row */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Icon */}
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 shrink-0 mt-0.5">
                        {getTaskIcon(task.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Status Badge */}
                          {task.status === "completed" && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              HOÀN TẤT
                            </span>
                          )}
                          {task.status === "processing" && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              ĐANG CHẠY ({task.progress}%)
                            </span>
                          )}
                          {task.status === "paused" && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                              <Clock className="w-3 h-3" />
                              TẠM DỪNG
                            </span>
                          )}
                          {task.status === "failed" && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                              <AlertCircle className="w-3 h-3" />
                              THẤT BẠI
                            </span>
                          )}

                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>

                          <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                            {task.title}
                          </span>
                        </div>

                        {task.subtitle && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick Task Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Copy Task Logs */}
                      <button
                        onClick={() => copyTaskLogs(task)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                        title="Sao chép nhật ký tác vụ này"
                      >
                        {copiedTaskId === task.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Download Artifact if present */}
                      {task.outputArtifact && (
                        <a
                          href={task.outputArtifact.downloadUrl || "#"}
                          download={task.outputArtifact.name}
                          onClick={() => soundSynth.playSfx("success")}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
                          title="Tải thành phẩm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">File</span>
                        </a>
                      )}

                      {/* Expand / Collapse Toggle Button */}
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        <Terminal className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] font-mono">{task.logs?.length || 0} logs</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Task Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>Bắt đầu: <strong className="text-slate-300">{startTimeStr}</strong></span>
                      {endTimeStr && (
                        <span>Kết thúc: <strong className="text-slate-300">{endTimeStr}</strong></span>
                      )}
                      <span className="text-indigo-300">
                        Thời lượng: <strong>{duration}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.outputArtifact && (
                        <span className="text-slate-300 font-sans text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          📦 {task.outputArtifact.name} ({task.outputArtifact.size})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">ID: {task.id}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Detailed Log Execution Console */}
                {isExpanded && (
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800 font-mono text-[11px] space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-slate-400 font-bold border-b border-slate-800/80 pb-1.5 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5 text-indigo-300">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        CHI TIẾT TIẾN TRÌNH THỰC THI (THREAD EXECUTION LOGS)
                      </span>
                      <span className="text-slate-400">
                        Tổng số bước: <strong className="text-white">{task.logs?.length || 0}</strong>
                      </span>
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {task.logs && task.logs.length > 0 ? (
                        task.logs.map((log, lIdx) => {
                          const classification = classifyLogMessage(log.message);
                          return (
                            <div
                              key={lIdx}
                              className="flex items-start gap-2 p-1 rounded hover:bg-slate-900/60 transition-colors"
                            >
                              <span className="text-slate-400 shrink-0 text-[10px]">[{log.timestamp}]</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${classification.color}`}>
                                {classification.tag}
                              </span>
                              <span className="text-slate-200 text-xs break-words">{log.message}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 italic py-2 text-center text-xs">Không có dòng log nào được ghi lại.</p>
                      )}

                      {task.error && (
                        <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span><strong>Mã lỗi:</strong> {task.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
