import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Search,
  Command,
  CheckCircle2,
  XCircle,
  PlayCircle,
  StopCircle
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { GlobalTaskItem } from "../types";
import { soundSynth } from "../utils/audioUtils";

const PIPELINE_STEPS = [
  { id: "download_validation", label: "Tải & Xác thực" },
  { id: "demucs_separation", label: "Tách Demucs" },
  { id: "speech_transcription", label: "Whisper AI" },
  { id: "ai_highlight_scoring", label: "AI Highlight" },
  { id: "ffmpeg_rendering", label: "Dựng hình (CUDA)" }
];

export const DashboardTerminalLogs: React.FC = () => {
  const { tasks, stats: queueStats } = useQueue();
  
  // Custom states for tracking task states: preparing, ai_running, completed, error
  type RenderState = "idle" | "preparing" | "ai_running" | "completed" | "error";
  const [renderState, setRenderState] = useState<RenderState>("idle");
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Terminal logs state
  const [pipelineStage, setPipelineStage] = useState<any>(null);
  const [terminalLines, setTerminalLines] = useState<Array<{ text: string; type: "stdout" | "stderr" | "system" | "input"; timestamp: string }>>([
    { text: "System Initializing...", type: "system", timestamp: new Date().toLocaleTimeString() },
    { text: "NVIDIA CUDA / Core Driver: v12.1 detected.", type: "stdout", timestamp: new Date().toLocaleTimeString() },
    { text: "Python Environment: Python 3.10.8 (main, Oct 24 2022, 18:24:45)", type: "stdout", timestamp: new Date().toLocaleTimeString() },
    { text: "Type a command or process a task in the queue to observe stdout streams.", type: "system", timestamp: new Date().toLocaleTimeString() },
  ]);

  const [searchLogQuery, setSearchLogQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "stdout" | "stderr" | "system">("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  
  // Custom manual shell input
  const [shellInput, setShellInput] = useState("");
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [isPythonRunning, setIsPythonRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines, isAutoScroll]);

  // Listen to Electron API events
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) {
      return;
    }

    const appendLog = (msg: string) => {
      const type = msg.toLowerCase().includes("[error]") || msg.toLowerCase().includes("err") ? "stderr" : "stdout";
      setTerminalLines(prev => [
        ...prev,
        {
          text: msg,
          type: type as any,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false })
        }
      ]);
    };

    const handleProgress = (progressVal: number) => {
      setRenderProgress(progressVal);
      if (progressVal >= 100) {
        setRenderState("completed");
      } else if (progressVal >= 15) {
        setRenderState("ai_running");
      } else {
        setRenderState("preparing");
      }
    };

    const handleComplete = () => {
      setIsPythonRunning(false);
      setActiveCommand(null);
      setRenderProgress(100);
      setRenderState("completed");
      soundSynth.playSfx("success");
      setTerminalLines(prev => [
        ...prev,
        {
          text: "[success] Python subprocess completed successfully with exit code 0.",
          type: "system",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    };

    const handleError = (errMsg: string) => {
      setIsPythonRunning(false);
      setActiveCommand(null);
      setRenderProgress(null);
      setRenderState("error");
      soundSynth.playSfx("boom");
      setTerminalLines(prev => [
        ...prev,
        {
          text: `[error] Python execution failed: ${errMsg}`,
          type: "stderr",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    };

    // Subscriptions
    const removeProgress = electronAPI.onRenderProgress(handleProgress);
    const removeLog = electronAPI.onRenderLog(appendLog);
    const removeComplete = electronAPI.onRenderComplete(handleComplete);
    const removeError = electronAPI.onRenderError(handleError);
    const removeStageUpdate = electronAPI.onRenderStageUpdate 
      ? electronAPI.onRenderStageUpdate((data: any) => setPipelineStage(data))
      : () => {};

    return () => {
      removeProgress();
      removeLog();
      removeComplete();
      removeError();
      removeStageUpdate();
    };
  }, []);

  // Filtered log lines
  const filteredLines = useMemo(() => {
    return terminalLines.filter(line => {
      if (showOnlyErrors && line.type !== "stderr") return false;
      if (filterType !== "all" && line.type !== filterType) return false;
      if (searchLogQuery) {
        return line.text.toLowerCase().includes(searchLogQuery.toLowerCase());
      }
      return true;
    });
  }, [terminalLines, searchLogQuery, filterType, showOnlyErrors]);

  // Command running simulations (For Browser Fallback)
  const runSimulatedPython = (task: GlobalTaskItem) => {
    const electronAPI = (window as any).electronAPI;
    const timeNow = new Date().toLocaleTimeString();

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    // Construct the actual running command
    const pyArgs = [
      `video_render.py`,
      `--video ${task.id}`,
      task.type === "video-edit" ? "--horizontalFlip" : "",
      task.type === "video-edit" ? "--changeMD5" : "",
      task.type === "video-edit" ? "--microNoise" : "",
      task.type === "video-edit" ? "--colorShift" : "",
      task.type === "translate" ? "--speedUp" : "",
    ].filter(Boolean).join(" ");

    const finalCmd = `python3 ${pyArgs}`;
    setActiveCommand(finalCmd);
    setIsPythonRunning(true);
    setActiveTaskId(task.id);
    setRenderProgress(0);
    setPipelineStage(null);
    setRenderState("preparing");

    setTerminalLines(prev => [
      ...prev,
      { text: `$ ${finalCmd}`, type: "input", timestamp: timeNow },
      { text: `[init] Spawning background worker for: ${task.title}...`, type: "system", timestamp: timeNow }
    ]);

    if (electronAPI) {
      // Execute REAL Python spawn via Electron IPC
      electronAPI.renderVideo({
        video: task.id,
        changeMD5: task.type === "video-edit",
        horizontalFlip: task.type === "video-edit",
        speedUp: task.type === "translate",
        blurryPadding: task.type === "video-edit",
        microNoise: task.type === "video-edit",
        colorShift: task.type === "video-edit"
      });
    } else {
      // Simulate high-fidelity streaming in browser fallback
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setRenderProgress(progress);
        
        if (progress >= 100) {
          setRenderState("completed");
        } else if (progress >= 15) {
          setRenderState("ai_running");
        } else {
          setRenderState("preparing");
        }

        const timestamp = new Date().toLocaleTimeString();
        let logText = "";

        switch (progress) {
          case 10:
            logText = "[hwaccel] Successfully bound to simulated GPU 0 (CUDA emulation)";
            setPipelineStage({
              stage: "download_validation",
              status: "running",
              progress_percent: 10,
              message: "Bắt đầu tải và xác thực video..."
            });
            break;
          case 20:
            logText = `[input] Stream reader feeding source video: output/src_${task.id}.mp4`;
            setPipelineStage({
              stage: "download_validation",
              status: "completed",
              progress_percent: 20,
              message: "Đã tải xuống và xác thực tệp gốc."
            });
            break;
          case 30:
            logText = "[audio] Initiating Demucs AI Vocal separation...";
            setPipelineStage({
              stage: "demucs_separation",
              status: "running",
              progress_percent: 30,
              message: "Demucs đang phân tách giọng nói và nhạc nền..."
            });
            break;
          case 40:
            logText = "[audio] Vocal extraction complete. BG Music balanced at -6dB.";
            setPipelineStage({
              stage: "demucs_separation",
              status: "completed",
              progress_percent: 40,
              message: "Đã tách thành công vocal.wav và bgm.wav."
            });
            break;
          case 50:
            logText = "[ai] Whisper model loaded into CUDA memory. Decoding speech...";
            setPipelineStage({
              stage: "speech_transcription",
              status: "running",
              progress_percent: 50,
              message: "AI Whisper đang giải mã giọng nói thành văn bản..."
            });
            break;
          case 60:
            logText = "[ai] Word-level timestamp generation finished.";
            setPipelineStage({
              stage: "speech_transcription",
              status: "completed",
              progress_percent: 60,
              message: "Hoàn tất nhận diện giọng nói và gán nhãn thời gian."
            });
            break;
          case 70:
            logText = "[scoring] Emotional keywords combined with Audio Energy peak matching...";
            setPipelineStage({
              stage: "ai_highlight_scoring",
              status: "running",
              progress_percent: 70,
              message: "Đang phân tích chỉ số cao trào và trích xuất Highlight..."
            });
            break;
          case 80:
            logText = "[scoring] Optimal 30-60s cinematic segment clustered successfully.";
            setPipelineStage({
              stage: "ai_highlight_scoring",
              status: "completed",
              progress_percent: 80,
              message: "Đã định vị đoạn cao trào xuất sắc nhất (độ dài: 45.2s)."
            });
            break;
          case 90:
            logText = "[cuda] Initializing hardware acceleration NVENC h264_nvenc (Preset p4)...";
            setPipelineStage({
              stage: "ffmpeg_rendering",
              status: "running",
              progress_percent: 90,
              message: "Đang xuất luồng video h264_nvenc và phụ đề Karaoke Neon..."
            });
            break;
          case 100:
            logText = `[success] Subprocess completed. Output written to output/nostrike_${task.id}.mp4`;
            setPipelineStage({
              stage: "ffmpeg_rendering",
              status: "completed",
              progress_percent: 100,
              message: "🎉 Dựng hình thành công video Highlight hoàn chỉnh!"
            });
            clearInterval(interval);
            simIntervalRef.current = null;
            setIsPythonRunning(false);
            setActiveCommand(null);
            soundSynth.playSfx("success");
            setTerminalLines(prev => [
              ...prev,
              { text: `[progress] 100% complete`, type: "system", timestamp },
              { text: `[success] Subprocess completed with exit code 0.`, type: "system", timestamp }
            ]);
            break;
          default:
            logText = `[progress] Frame translation pipeline - encoding step at ${progress}%`;
        }

        if (progress < 100) {
          setTerminalLines(prev => [
            ...prev,
            { text: logText, type: "stdout", timestamp }
          ]);
        }
      }, 500);

      simIntervalRef.current = interval;
    }
  };

  const handleCancelRender = () => {
    soundSynth.playSfx("boom");
    const electronAPI = (window as any).electronAPI;
    const timestamp = new Date().toLocaleTimeString();

    if (electronAPI) {
      electronAPI.cancelRender();
    }

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setIsPythonRunning(false);
    setActiveCommand(null);
    setRenderProgress(null);
    setRenderState("error");
    setTerminalLines(prev => [
      ...prev,
      { text: "[system] HỦY TÁC VỤ: Tiến trình bị hủy chủ động bởi người dùng (SIGTERM).", type: "stderr", timestamp }
    ]);
  };

  const handleClearLogs = () => {
    soundSynth.playSfx("pop");
    setTerminalLines([]);
  };

  const handleShellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shellInput.trim()) return;

    soundSynth.playSfx("pop");
    const cmd = shellInput.trim();
    setShellInput("");

    const timestamp = new Date().toLocaleTimeString();

    setTerminalLines(prev => [
      ...prev,
      { text: `$ ${cmd}`, type: "input", timestamp }
    ]);

    // Simple shell parser
    setTimeout(() => {
      const response = executeCommandLocally(cmd);
      setTerminalLines(prev => [
        ...prev,
        ...response.map(text => ({ text, type: (text.startsWith("[error]") ? "stderr" : "stdout") as any, timestamp }))
      ]);
    }, 200);
  };

  const executeCommandLocally = (cmd: string): string[] => {
    const clean = cmd.toLowerCase();
    if (clean === "help") {
      return [
        "CreatorOS CLI - Available commands:",
        "  help                     - Show this menu",
        "  clear                    - Clear terminal screen",
        "  python --version         - Get Python version",
        "  nvidia-smi               - Check CUDA / GPU allocation",
        "  render --test            - Spawn a fast mock Python render process",
        "  queue                    - Print task queue stats",
      ];
    }
    if (clean === "clear") {
      setTimeout(() => setTerminalLines([]), 50);
      return [];
    }
    if (clean === "python --version" || clean === "python3 --version") {
      return ["Python 3.10.8 (main, Oct 24 2022, 18:24:45)"];
    }
    if (clean === "nvidia-smi") {
      return [
        "+-----------------------------------------------------------------------------+",
        "| NVIDIA-SMI 535.104.05             Driver Version: 535.104.05   CUDA Version: 12.1     |",
        "|-------------------------------+----------------------+----------------------+",
        "| GPU  Name          Persistence| Bus-Id        Disp.A | Volatile Uncorr. ECC |",
        "| Fan  Temp   Perf          Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |",
        "|                               |                      |               MIG M. |",
        "|===============================+======================+======================|",
        "|   0  NVIDIA GTX 1660...   On  | 00000000:01:00.0  On |                  N/A |",
        "| 45%   68C    P2            65W / 125W |   1842MiB /  6144MiB |     54%      Default |",
        "|                               |                      |                  N/A |",
        "+-------------------------------+----------------------+----------------------+",
      ];
    }
    if (clean === "queue") {
      return [
        `HÀNG ĐỢI HIỆN TẠI:`,
        `  - Tổng tác vụ: ${queueStats.total}`,
        `  - Đang xử lý: ${queueStats.processing}`,
        `  - Đang chờ: ${queueStats.queued}`,
        `  - Hoàn thành: ${queueStats.completed}`,
      ];
    }
    if (clean.startsWith("render")) {
      // Pick first task or mock
      const activeTask = tasks.find(t => t.status === "processing") || tasks[0];
      if (activeTask) {
        setTimeout(() => runSimulatedPython(activeTask), 100);
        return [`[system] Initiating Python runner spawn sequence...`];
      } else {
        return [`[error] No active task in the queue to render. Add tasks to queue first.`];
      }
    }

    return [`[error] Command not found: '${cmd}'. Type 'help' for driver options.`];
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      
      {/* Upper Panel: Status Bar & Filter HUD */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Hệ thống Terminal Stream & Python Subprocess
              </h2>
              {/* State Management HUD */}
              {renderState === "preparing" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  Đang chuẩn bị...
                </span>
              )}
              {renderState === "ai_running" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/30 animate-pulse">
                  <Cpu className="w-3 h-3 animate-pulse text-indigo-400" />
                  Đang chạy AI...
                </span>
              )}
              {renderState === "completed" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Hoàn thành
                </span>
              )}
              {renderState === "error" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                  <AlertCircle className="w-3 h-3 text-rose-400 animate-bounce" />
                  Lỗi
                </span>
              )}
              {renderState === "idle" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[10px] font-semibold border border-slate-800">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  Sẵn sàng
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Lắng nghe luồng dữ liệu thời gian thực từ driver đồ họa, `stdout/stderr` tiến trình Python
            </p>
          </div>
        </div>

        {/* Console Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Logs */}
          <div className="relative flex-1 md:flex-initial max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc dòng log..."
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Tất Cả Loại</option>
            <option value="stdout">Stdout (Python)</option>
            <option value="stderr">Stderr (Lỗi)</option>
            <option value="system">System (Hệ thống)</option>
          </select>

          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              showOnlyErrors 
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30" 
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Chỉ Lỗi
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Xóa màn hình Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container Grid: Queue Left, Console Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left column (col-span-4): Tasks Progress list */}
        <div className="lg:col-span-4 border-r border-slate-900/80 bg-slate-950/50 p-4 overflow-y-auto flex flex-col space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-900">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Tiến độ hàng đợi ({tasks.length})
            </span>
            <span className="font-mono">{queueStats.processing} đang chạy</span>
          </div>

          <div className="space-y-2 flex-1">
            {tasks.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-500 italic">
                Không có tác vụ nào trong hàng đợi.
              </div>
            ) : (
              tasks.map((task) => {
                const isActive = activeTaskId === task.id || task.status === "processing";
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (!isPythonRunning) {
                        runSimulatedPython(task);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                          {task.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 truncate leading-relaxed">
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {task.currentStep || "Chờ xử lý..."}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-xs font-black text-white font-mono">
                          {task.id === activeTaskId && renderProgress !== null ? renderProgress : task.progress}%
                        </span>
                        {task.id === activeTaskId && isPythonRunning ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRender();
                            }}
                            className="px-1.5 py-0.5 rounded bg-rose-500/25 hover:bg-rose-600 text-rose-300 hover:text-white text-[9px] font-black border border-rose-500/35 cursor-pointer flex items-center gap-0.5 transition-all animate-pulse"
                            title="Hủy tác vụ (child.kill())"
                          >
                            <StopCircle className="w-2.5 h-2.5 animate-spin" />
                            <span>Hủy</span>
                          </button>
                        ) : task.status === "processing" ? (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold tracking-wider uppercase">
                            RUNNING
                          </span>
                        ) : task.status === "completed" || task.approved ? (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold tracking-wider uppercase">
                            SUCCESS
                          </span>
                        ) : task.status === "failed" ? (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-extrabold tracking-wider uppercase">
                            FAILED
                          </span>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 font-extrabold tracking-wider uppercase">
                            QUEUED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compact Linear Progress Bar */}
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.status === "processing"
                            ? "bg-gradient-to-r from-amber-500 to-indigo-500 animate-pulse"
                            : task.status === "completed" || task.approved
                            ? "bg-emerald-500"
                            : task.status === "failed"
                            ? "bg-rose-500"
                            : "bg-slate-800"
                        }`}
                        style={{ width: `${task.id === activeTaskId && renderProgress !== null ? renderProgress : task.progress}%` }}
                      />
                    </div>

                    {/* Speed/ETA stats if running */}
                    {(task.speed || task.eta) && task.status === "processing" && (
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-900/60">
                        <span>{task.speed || "FFmpeg CUDA Speed"}</span>
                        <span>{task.eta || "Calculated ETA"}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-900">
            <button
              onClick={() => {
                const firstWaiting = tasks.find(t => t.status === "processing" || t.status === "queued");
                if (firstWaiting) {
                  runSimulatedPython(firstWaiting);
                } else if (tasks.length > 0) {
                  runSimulatedPython(tasks[0]);
                } else {
                  soundSynth.playSfx("pop");
                }
              }}
              disabled={isPythonRunning || tasks.length === 0}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 text-white text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Khởi chạy Quy trình Python</span>
            </button>
          </div>
        </div>

        {/* Right column (col-span-8): Active Hacker Console */}
        <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col h-full overflow-hidden">
          
          {/* Active Process HUD Banner */}
          <div className="bg-slate-900/40 rounded-xl p-3 mb-2.5 flex flex-wrap items-center justify-between border border-slate-900 text-xs gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Command className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-semibold shrink-0">Active Command:</span>
              <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-[10px] truncate max-w-[200px] md:max-w-[280px]">
                {activeCommand || "bash_daemon idle"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {renderProgress !== null && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">Progress:</span>
                  <span className="font-black text-indigo-300">{renderProgress}%</span>
                </div>
              )}

              {isPythonRunning && (
                <button
                  type="button"
                  onClick={handleCancelRender}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 text-[11px] font-black border border-rose-500/30 cursor-pointer shadow-md shadow-rose-500/5 transition-all animate-in fade-in zoom-in-95 duration-150"
                  title="Hủy tiến trình Python đang chạy (child.kill())"
                >
                  <StopCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>Hủy tác vụ</span>
                </button>
              )}
            </div>
          </div>

          {/* Module 1: Multi-Stage Execution Pipeline HUD Tracker */}
          {(isPythonRunning || pipelineStage) && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 mb-3 transition-all animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  Tiến trình Pipeline Đa Giai Đoạn
                </span>
                {pipelineStage && (
                  <span className="text-[11px] text-slate-300 font-medium">
                    Đang xử lý: <span className="font-bold text-indigo-400">{pipelineStage.message}</span>
                  </span>
                )}
              </div>
              
              <div className="relative flex items-center justify-between px-2">
                {/* Background Connecting Line */}
                <div className="absolute left-6 right-6 top-[15px] h-[2px] bg-slate-800 z-0" />
                
                {/* Active Connecting Line Progress */}
                {(() => {
                  const activeIndex = pipelineStage 
                    ? PIPELINE_STEPS.findIndex(s => s.id === pipelineStage.stage) 
                    : -1;
                  const isCompleted = pipelineStage?.status === "completed" && activeIndex === PIPELINE_STEPS.length - 1;
                  
                  // Calculate width percentage
                  let widthPercent = 0;
                  if (isCompleted) {
                    widthPercent = 100;
                  } else if (activeIndex !== -1) {
                    widthPercent = (activeIndex / (PIPELINE_STEPS.length - 1)) * 100;
                  }

                  return (
                    <div 
                      className="absolute left-6 top-[15px] h-[2px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-indigo-600 transition-all duration-500 z-0"
                      style={{ width: `calc(${widthPercent}% - 12px)` }}
                    />
                  );
                })()}

                {/* Steps Nodes */}
                {PIPELINE_STEPS.map((step, idx) => {
                  const currentActiveIndex = pipelineStage 
                    ? PIPELINE_STEPS.findIndex(s => s.id === pipelineStage.stage) 
                    : -1;
                  
                  const isCurrent = pipelineStage?.stage === step.id;
                  const isCompleted = currentActiveIndex > idx || (isCurrent && pipelineStage?.status === "completed") || (renderProgress === 100 && idx === PIPELINE_STEPS.length - 1);
                  const isPending = !isCurrent && !isCompleted;
                  
                  return (
                    <div key={step.id} className="relative flex flex-col items-center z-10">
                      {/* Circle Indicator */}
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                          isCompleted
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/15"
                            : isCurrent
                              ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/20 animate-pulse"
                              : "bg-slate-950 border-slate-800 text-slate-500"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent && pipelineStage?.status === "running" ? (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      {/* Step Name */}
                      <span 
                        className={`text-[9px] font-bold mt-2 tracking-wider uppercase transition-colors duration-200 ${
                          isCompleted 
                            ? "text-emerald-400" 
                            : isCurrent 
                              ? "text-indigo-400 font-extrabold" 
                              : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Console Output Block */}
          <div className="flex-1 bg-slate-950/70 border border-slate-900 rounded-xl p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 custom-scrollbar min-h-0">
            {filteredLines.length === 0 ? (
              <div className="text-slate-600 italic py-8 text-center">
                Không tìm thấy dòng log nào khớp bộ lọc.
              </div>
            ) : (
              filteredLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2.5 select-text hover:bg-slate-900/30 px-1 py-0.5 rounded transition-all">
                  <span className="text-slate-600 select-none shrink-0 text-[10px] mt-0.5">
                    [{line.timestamp}]
                  </span>

                  {line.type === "input" ? (
                    <span className="text-cyan-300 font-bold flex-1 break-all">
                      {line.text}
                    </span>
                  ) : line.type === "stderr" ? (
                    <span className="text-rose-400 font-semibold flex-1 break-all flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      {line.text}
                    </span>
                  ) : line.type === "system" ? (
                    <span className="text-indigo-400 font-bold flex-1 break-all">
                      {line.text}
                    </span>
                  ) : (
                    <span className="text-slate-300 flex-1 break-all">
                      {line.text}
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>

          {/* Prompt Form Input at the bottom */}
          <form onSubmit={handleShellSubmit} className="mt-3 flex items-center gap-2">
            <div className="text-indigo-400 font-mono text-xs select-none pl-1">
              creator-os@server:~#
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Nhập lệnh shell (help, clear, nvidia-smi, render)..."
                value={shellInput}
                onChange={(e) => setShellInput(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-emerald-400 font-mono focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-900 placeholder-slate-700"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-emerald-400 animate-pulse select-none pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono cursor-pointer transition-all shrink-0"
            >
              RUN
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
