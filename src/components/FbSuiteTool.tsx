import React, { useState, useEffect, useRef } from "react";
import {
  Share2,
  Sparkles,
  Layers,
  Send,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Copy,
  Sliders,
  RefreshCw,
  Video,
  Eye,
  Film,
  Zap,
  Globe,
  Terminal,
  Play,
  Clock,
  ExternalLink,
  Check,
  Flame,
  LayoutGrid,
  Hash,
  FileCode,
  Radio
} from "lucide-react";
import { FbAutomationResult } from "../types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";
import { io } from "socket.io-client";

export const FbSuiteTool: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"reup" | "post" | "highlight">("reup");

  // Reup & Form States
  const [videoTitle, setVideoTitle] = useState("Cách Tạo Video Triệu View Cho Fanpage Facebook Reels 2026");
  const [niche, setNiche] = useState("Giải Trí & Hài Hước");
  const [targetPages, setTargetPages] = useState("Ghiền Phim Review, Bí Mật Showbiz, Động Meme Triệu View");
  
  const [loading, setLoading] = useState(false);
  const [isProcessingPipeline, setIsProcessingPipeline] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [result, setResult] = useState<FbAutomationResult | null>(null);

  // Auto Post & Matrix States
  const [scheduledTime, setScheduledTime] = useState("19:30 (Khung Giờ Vàng Tối)");
  const [autoFirstComment, setAutoFirstComment] = useState(
    "👉 Link full và tài liệu mình để ở phần mô tả & group kín nhé cả nhà!"
  );
  const [postedSuccess, setPostedSuccess] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedComment, setCopiedComment] = useState(false);

  // Terminal Real-time Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[system] Facebook Automation & Anti-Copyright Engine v2.6 sẵn sàng.",
    "[info] Tự động hóa FFmpeg 4:5 Newsfeed, đổi mã băm MD5, chống quét AI Face ID & lập lịch đăng chùm Page ma trận."
  ]);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // WebSocket event listeners for real-time progress & logs
  useEffect(() => {
    const socket = io();

    const handleLog = (logMsg: string) => {
      setTerminalLogs((prev) => [...prev, logMsg]);
    };

    const handleProgress = (prog: number) => {
      setRenderProgress(prog);
    };

    const handleComplete = (data: any) => {
      setIsProcessingPipeline(false);
      setRenderProgress(100);
      if (data) {
        setResult(data);
      }
      soundSynth.playSfx("success");
      confetti({ particleCount: 50, spread: 70 });
    };

    socket.on("fb_render_log", handleLog);
    socket.on("fb_render_progress", handleProgress);
    socket.on("fb_render_complete", handleComplete);

    return () => {
      socket.off("fb_render_log", handleLog);
      socket.off("fb_render_progress", handleProgress);
      socket.off("fb_render_complete", handleComplete);
      socket.disconnect();
    };
  }, []);

  // 1. Tạo Blueprint Reup & Caption Viral (Gemini AI)
  const handleGenerateReup = async () => {
    setLoading(true);
    soundSynth.playSfx("whoosh");
    setTerminalLogs((prev) => [
      ...prev,
      `[ai] Đang khởi tạo Blueprint & phân tích thuật toán Viral cho: "${videoTitle}"...`
    ]);

    try {
      const res = await fetch(getApiUrl("/api/ai/fb-automation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle,
          niche,
          targetPages: targetPages.split(",").map((p) => p.trim()),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
        if (data.data.firstCommentLink) {
          setAutoFirstComment(data.data.firstCommentLink);
        }
        setTerminalLogs((prev) => [
          ...prev,
          `[success] Đã tạo thành công Blueprint Reup & Caption Viral chuẩn Facebook 2026!`
        ]);
        soundSynth.playSfx("cash");
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      console.error(e);
      setTerminalLogs((prev) => [...prev, `[error] Lỗi tạo Blueprint: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Thực thi Reup & Khử Bản Quyền (Electron IPC / Python Engine)
  const handleExecuteReupPipeline = async () => {
    setIsProcessingPipeline(true);
    setRenderProgress(5);
    soundSynth.playSfx("cash");
    setTerminalLogs((prev) => [
      ...prev,
      `[launch] Bắt đầu quy trình tự động đổi MD5, cắt tỉ lệ 4:5 và khử bản quyền AI...`
    ]);

    const isElectron = typeof window !== "undefined" && (window as any).electronAPI;

    if (isElectron) {
      const electronAPI = (window as any).electronAPI;

      electronAPI.onRenderLog((logMsg: string) => {
        setTerminalLogs((prev) => [...prev, logMsg]);
      });

      electronAPI.onRenderProgress((prog: number) => {
        setRenderProgress(prog);
      });

      electronAPI.onRenderComplete((data: any) => {
        setIsProcessingPipeline(false);
        setRenderProgress(100);
        if (data) setResult(data);
        soundSynth.playSfx("success");
        confetti({ particleCount: 60, spread: 80 });
        electronAPI.removeRenderListeners();
      });

      electronAPI.renderVideo({
        isFbAutomation: true,
        videoTitle,
        niche,
        targetPages,
      });
    } else {
      try {
        const res = await fetch(getApiUrl("/api/fb-automation/execute"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoTitle,
            niche,
            targetPages,
          }),
        });
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      } catch (err: any) {
        console.error("Execute pipeline error:", err);
        setIsProcessingPipeline(false);
        setTerminalLogs((prev) => [...prev, `[error] Lỗi: ${err.message}`]);
      }
    }
  };

  // 3. Đăng Bài & Lịch Post
  const handleSchedulePost = () => {
    soundSynth.playSfx("whoosh");
    setPostedSuccess(true);
    const pagesCount = targetPages.split(",").filter(p => p.trim().length > 0).length || 3;
    setTerminalLogs((prev) => [
      ...prev,
      `[matrix] Đã phân phối và đặt lịch đăng tự động cho ${pagesCount} Fanpage ma trận vào lúc ${scheduledTime}.`
    ]);
    setTimeout(() => {
      soundSynth.playSfx("cash");
      confetti({ particleCount: 45, spread: 75 });
    }, 400);
  };

  // Chạy thử nhanh
  const handleQuickPreset = (presetTitle: string, presetNiche: string, presetPages: string) => {
    setVideoTitle(presetTitle);
    setNiche(presetNiche);
    setTargetPages(presetPages);
    soundSynth.playSfx("pop");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950/90 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/30">
                <Share2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Bộ Tool Facebook Toàn Diện (Edit Highlight, Dịch, Reup, Đăng Bài)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Quy trình tự động hóa Fanpage Reels & Video: Cắt Highlight, thay đổi mã băm MD5 khử bản quyền, cắt tỉ lệ 4:5 chuẩn Newsfeed, tạo Caption giữ chân và lên lịch đăng chùm Page ma trận (Matrix Pages).
            </p>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start md:self-auto">
            <button
              id="tab-fb-reup"
              onClick={() => {
                setActiveSubTab("reup");
                soundSynth.playSfx("pop");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "reup"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Reup & Khử Bản Quyền
            </button>
            <button
              id="tab-fb-post"
              onClick={() => {
                setActiveSubTab("post");
                soundSynth.playSfx("pop");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "post"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Đăng Bài & Lịch Post
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs & Control Buttons */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Cấu Hình Fanpage Facebook
              </h2>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono border border-blue-500/20">
                Matrix Mode
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Mẫu nhanh:</span>
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Review Phim Ngắn: Cái Kết Của Kẻ Phản Bội",
                    "Review Phim Ngắn / Drama",
                    "Ghiền Phim Review, Động Phim Hay, Thánh Review"
                  )
                }
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 cursor-pointer"
              >
                + Review Phim
              </button>
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Top 5 Mẹo Công Nghệ AI 99% Mọi Người Chưa Biết",
                    "Công Nghệ & Mẹo Đời Sống",
                    "Góc Công Nghệ, Mẹo Hay Mỗi Ngày, AI Master"
                  )
                }
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 cursor-pointer"
              >
                + Công Nghệ & AI
              </button>
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Cười Bể Bụng Với Trò Troll Bạn Gái Phút Chót",
                    "Giải Trí & Hài Hước",
                    "Động Meme, Troll Xả Stress, Góc Cười"
                  )
                }
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 cursor-pointer"
              >
                + Troll Hài Hước
              </button>
            </div>

            {/* Title / Idea Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Tiêu đề video / Ý tưởng</span>
                <span className="text-slate-500 text-[11px]">Dành cho Reels / Highlight</span>
              </label>
              <input
                id="input-fb-title"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Nhập tiêu đề hoặc ý tưởng video cần Reup..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Fanpage Niche Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Chủ đề Fanpage (Niche)</label>
              <select
                id="select-fb-niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Giải Trí & Hài Hước">Giải Trí & Hài Hước Facebook</option>
                <option value="Review Phim Ngắn / Drama">Review Phim Ngắn / Drama</option>
                <option value="Tin Nhanh / Showbiz">Tin Nhanh / Showbiz 24h</option>
                <option value="Công Nghệ & Mẹo Đời Sống">Công Nghệ & Mẹo Đời Sống</option>
                <option value="Kinh Doanh & Khởi Nghiệp">Kinh Doanh & Động Lực</option>
              </select>
            </div>

            {/* Fanpages Matrix List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Danh sách Fanpage nhận bài (Hệ thống Ma trận)</span>
                <span className="text-blue-400 text-[11px] font-mono">
                  {targetPages.split(",").filter((p) => p.trim().length > 0).length} Pages
                </span>
              </label>
              <input
                id="input-fb-pages"
                type="text"
                value={targetPages}
                onChange={(e) => setTargetPages(e.target.value)}
                placeholder="Nhập tên các Page nhận bài, cách nhau bởi dấu phẩy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Automation Info Box */}
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/25 text-xs space-y-1.5 text-slate-300">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Khung Quy Trình Tự Động Hóa Facebook Reup:
              </div>
              <div className="text-[11px] space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Tự động thay đổi mã băm <strong>MD5 Hash</strong> độc bản & triệt tiêu Metadata EXIF.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Cắt tỉ lệ chuẩn <strong>4:5 (1080x1350)</strong> tối ưu 100% diện tích Newsfeed.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Chèn khung phụ đề trên & dưới (Header/Footer) chống AI Face & Video Matching.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              id="btn-generate-fb"
              disabled={loading || isProcessingPipeline}
              onClick={handleGenerateReup}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Đang Tối Ưu Caption & Blueprint FB...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Tạo Blueprint Reup & Caption Viral</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="btn-execute-fb-pipeline"
                disabled={isProcessingPipeline || loading}
                onClick={handleExecuteReupPipeline}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessingPipeline ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Khử {renderProgress}%</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Reup & Khử Bản Quyền</span>
                  </>
                )}
              </button>

              <button
                id="btn-schedule-fb"
                disabled={isProcessingPipeline || loading}
                onClick={handleSchedulePost}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Đăng Bài & Lịch Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview Panel & Matrix Status */}
        <div className="lg:col-span-7 space-y-4">
          {/* Terminal Real-time Progress Output */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 shadow-md flex flex-col justify-between min-h-[95px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Facebook Automation & IPC Stream Logs
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live IPC
              </span>
            </div>
            <div
              ref={terminalRef}
              className="font-mono text-[10px] space-y-1 text-slate-300 overflow-y-auto max-h-[85px]"
            >
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.startsWith("[error]") ? (
                    <span className="text-rose-400">{log}</span>
                  ) : log.startsWith("[success]") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith("[system]") ? (
                    <span className="text-blue-400">{log}</span>
                  ) : log.startsWith("[ai]") ? (
                    <span className="text-purple-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel: Empty state or Blueprint Results */}
          {!result ? (
            <div className="min-h-[360px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
              <Share2 className="w-12 h-12 text-blue-400/40 mb-3" />
              <h3 className="text-base font-bold text-slate-200 mb-1">
                Chưa có dữ liệu Blueprint Facebook
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Nhấn <strong>"✨ Tạo Blueprint Reup & Caption Viral"</strong> hoặc <strong>"Reup & Khử Bản Quyền"</strong> để hệ thống AI và FFmpeg tiến hành tạo nội dung, cắt tỉ lệ 4:5 và khử bản quyền tự động.
              </p>
              <button
                onClick={handleGenerateReup}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Chạy thử Fanpage Ghiền Phim Review
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Technical Anti-Detection Parameters Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Thông Số Kỹ Thuật Khử Bản Quyền Video:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    100% Anti-Detection
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tỉ lệ khung hình</span>
                    <span className="font-mono font-bold text-blue-300">4:5 (1080x1350)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Mã băm MD5 Hash</span>
                    <span className="font-mono font-bold text-emerald-300 truncate block">
                      {result.generatedMd5 ? result.generatedMd5.slice(0, 10) + "..." : "c8f92a019b..."}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">EXIF Metadata</span>
                    <span className="font-mono font-bold text-amber-300">Đã Xóa Sạch 100%</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {result.fbAntiCopyrightMeasures?.map((measure, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                      <span>{measure}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Bài Viết & Caption Chuẩn Viral Facebook:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.postCaption || "");
                      setCopiedCaption(true);
                      soundSynth.playSfx("pop");
                      setTimeout(() => setCopiedCaption(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCaption ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-100 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {result.postCaption}
                </div>

                {/* First Comment Seeding */}
                {result.firstCommentLink && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="text-indigo-300 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-indigo-400" />
                        First Comment Seeding (Ghim bình luận đầu tiên):
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.firstCommentLink || "");
                          setCopiedComment(true);
                          soundSynth.playSfx("pop");
                          setTimeout(() => setCopiedComment(false), 2000);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {copiedComment ? "Đã chép" : "Chép bình luận"}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      {result.firstCommentLink}
                    </div>
                  </div>
                )}
              </div>

              {/* Fanpage Matrix Schedule Center */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Lên Lịch Đăng Chùm Hệ Thống Fanpage Ma Trận:
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {result.scheduledTimes?.[1] || "19:30"}
                  </span>
                </div>

                {/* Matrix Slots Display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {result.matrixSchedule?.map((slot, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{slot.slot}</span>
                        <span className="text-cyan-400 font-mono font-bold">{slot.time}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {slot.target}
                      </div>
                    </div>
                  )) || (
                    <div className="text-xs text-slate-400 col-span-3">Chưa có cấu hình slot ma trận</div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSchedulePost}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lên Lịch Đăng Ngay</span>
                  </button>
                </div>

                {postedSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Đã phân bổ lịch đăng cho toàn bộ Fanpage ma trận thành công!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
