import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  Layers,
  FileArchive,
  RefreshCw,
  Video,
  Music,
  Trash2,
  Play,
  Globe,
  ListOrdered,
  X,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Film,
  Loader2,
  FolderDown,
  FolderOpen,
  Copy
} from "lucide-react";
import { DownloadQueueItem } from "../types";
import { soundSynth } from "../utils/audioUtils";
import { useQueue } from "../context/QueueContext";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";
import { io } from "socket.io-client";

export const BatchDownloaderTool: React.FC = () => {
  const { addTask } = useQueue();
  const [bulkUrls, setBulkUrls] = useState(
    `https://www.tiktok.com/@creator/video/739102938491823\nhttps://www.douyin.com/video/729183920194827\nhttps://www.youtube.com/shorts/kx89WqLa021\nhttps://www.facebook.com/reel/102938475619283\nhttps://www.instagram.com/reel/C89281jalsk\nhttps://www.kuaishou.com/short-video/3x9182930`
  );
  const [resolution, setResolution] = useState("1080p (Full HD Gốc)");
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [extractMp3, setExtractMp3] = useState(false);
  const [outputDir, setOutputDir] = useState("downloads");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const [queue, setQueue] = useState<DownloadQueueItem[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[system] Multi-Platform Bulk Downloader Engine sẵn sàng.",
    "[info] Băng thông đa luồng tải đồng thời, lưu trực tiếp file .MP4 sạch vào thư mục đã chọn."
  ]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorModalItem, setErrorModalItem] = useState<DownloadQueueItem | null>(null);

  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    const savedData = localStorage.getItem("batchDownloaderState");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.bulkUrls !== undefined) setBulkUrls(parsed.bulkUrls);
        if (parsed.resolution !== undefined) setResolution(parsed.resolution);
        if (parsed.removeWatermark !== undefined) setRemoveWatermark(parsed.removeWatermark);
        if (parsed.extractMp3 !== undefined) setExtractMp3(parsed.extractMp3);
        if (parsed.outputDir !== undefined) setOutputDir(parsed.outputDir);
        if (parsed.queue !== undefined) setQueue(parsed.queue);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const socket = io();

    const handleProgress = (data: any) => {
      setQueue((prevQueue) =>
        prevQueue.map((item) =>
          item.id === data.id
            ? {
                ...item,
                progress: data.progress,
                status: data.status,
                speed: data.speed || item.speed,
                filePath: data.filePath || item.filePath
              }
            : item
        )
      );
    };

    const handleDownloaderLog = (logMsg: string) => {
      setTerminalLogs((prev) => [...prev, logMsg]);
    };

    socket.on("download_progress", handleProgress);
    socket.on("downloader_log", handleDownloaderLog);

    return () => {
      socket.off("download_progress", handleProgress);
      socket.off("downloader_log", handleDownloaderLog);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "batchDownloaderState",
        JSON.stringify({
          bulkUrls,
          resolution,
          removeWatermark,
          extractMp3,
          outputDir,
          queue,
        })
      );
    }
  }, [bulkUrls, resolution, removeWatermark, extractMp3, outputDir, queue, isLoaded]);

  // Handler Chọn Thư Mục Lưu qua Electron Native Dialog
  const handleSelectOutputDir = async () => {
    soundSynth.playSfx("pop");
    const isElectron = typeof window !== "undefined" && (window as any).electronAPI;
    if (isElectron && typeof (window as any).electronAPI.selectDirectory === "function") {
      try {
        const res = await (window as any).electronAPI.selectDirectory(outputDir);
        if (res && res.success && res.dirPath) {
          setOutputDir(res.dirPath);
          setTerminalLogs((prev) => [
            ...prev,
            `[config] 📁 Đã chọn thư mục lưu trữ: ${res.dirPath}`
          ]);
        }
      } catch (err: any) {
        console.error("Error choosing directory:", err);
      }
    } else {
      // Fallback web prompt
      const customPath = prompt("Nhập đường dẫn thư mục lưu trữ trên máy tính:", outputDir);
      if (customPath && customPath.trim()) {
        setOutputDir(customPath.trim());
        setTerminalLogs((prev) => [
          ...prev,
          `[config] 📁 Đã thiết lập thư mục lưu trữ: ${customPath.trim()}`
        ]);
      }
    }
  };

  // Calculate link count
  const linkCount = bulkUrls.split("\n").filter((l) => l.trim().length > 0).length;

  const quickPresets = [
    { label: "+ TikTok Viral", url: "https://www.tiktok.com/@trend/video/739199201948" },
    { label: "+ Douyin 1080p", url: "https://www.douyin.com/video/729188491823" },
    { label: "+ YouTube Shorts", url: "https://www.youtube.com/shorts/wE982KqO10" },
    { label: "+ Facebook Reels", url: "https://www.facebook.com/reel/9283746152" },
    { label: "+ Instagram Reel", url: "https://www.instagram.com/reel/D99210skal" },
    { label: "+ Kuaishou Kwai", url: "https://www.kuaishou.com/short-video/3x881920" }
  ];

  const handleAddPreset = (url: string) => {
    soundSynth.playSfx("pop");
    setBulkUrls((prev) => (prev ? `${prev}\n${url}` : url));
  };

  const handleScanLinks = async () => {
    setIsScanning(true);
    soundSynth.playSfx("whoosh");
    const links = bulkUrls.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (links.length === 0) {
      alert("Vui lòng nhập ít nhất một URL hợp lệ.");
      setIsScanning(false);
      return;
    }

    setTerminalLogs((prev) => [
      ...prev,
      `[scan] Đang phân tích cú pháp & bóc tách metadata cho ${links.length} URLs...`
    ]);

    try {
      const response = await fetch(getApiUrl("/api/download/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: links }),
      });
      if (!response.ok) throw new Error(`Server status ${response.status}`);
      const resData = await response.json();
      if (resData.success && resData.items) {
        setQueue(resData.items);
        setTerminalLogs((prev) => [
          ...prev,
          `[success] Đã quét thành công ${resData.items.length} link. Sẵn sàng tải xuống!`
        ]);
        soundSynth.playSfx("pop");
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      setTerminalLogs((prev) => [...prev, `[error] Lỗi quét: ${error.message}`]);
      alert(`Lỗi quét Link: ${error.message || "Không thể kết nối đến server."}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadAll = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    soundSynth.playSfx("cash");
    setTerminalLogs((prev) => [
      ...prev,
      `[launch] Bắt đầu tải hàng loạt ${queue.length} video (Độ phân giải: ${resolution}, Xóa Watermark: ${removeWatermark}, Lưu tại: ${outputDir})...`
    ]);

    const isElectron = typeof window !== "undefined" && (window as any).electronAPI;

    if (isElectron) {
      const electronAPI = (window as any).electronAPI;

      electronAPI.onRenderLog((logMsg: string) => {
        setTerminalLogs((prev) => [...prev, logMsg]);
      });

      electronAPI.onRenderProgress((prog: number) => {
        setOverallProgress(prog);
      });

      electronAPI.onRenderComplete(() => {
        setIsProcessing(false);
        setQueue((prev) => prev.map((q) => ({ ...q, status: "completed", progress: 100 })));
        soundSynth.playSfx("success");
        confetti({ particleCount: 60, spread: 80 });
        electronAPI.removeRenderListeners();
      });

      electronAPI.renderVideo({
        isBulkDownload: true,
        items: queue,
        resolution,
        remove_watermark: removeWatermark,
        output_dir: outputDir
      });
    } else {
      try {
        const response = await fetch(getApiUrl("/api/download/execute"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: queue,
            resolution,
            remove_watermark: removeWatermark,
            output_dir: outputDir
          }),
        });
        if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      } catch (error: any) {
        console.error("Download error:", error);
        setTerminalLogs((prev) => [...prev, `[error] Lỗi kết nối: ${error.message}`]);
        alert(`Lỗi kết nối Server: ${error.message}`);
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadSingle = async (item: DownloadQueueItem) => {
    soundSynth.playSfx("pop");
    setTerminalLogs((prev) => [
      ...prev,
      `[download] Bắt đầu tải video [${item.videoId || item.id}] về thư mục: ${outputDir}...`
    ]);

    try {
      await fetch(getApiUrl("/api/download/execute"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [item],
          resolution,
          remove_watermark: removeWatermark,
          output_dir: outputDir
        }),
      });
    } catch (error: any) {
      console.error("Single download error:", error);
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    soundSynth.playSfx("pop");
  };

  const completedCount = queue.filter((q) => q.status === "completed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Download className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Tool Download Hàng Loạt Đa Nền Tảng (Tốc Độ Video/s)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Hỗ trợ tải không giới hạn TikTok (No Watermark), Douyin 1080p+, YouTube Shorts, Facebook Reels, Kuaishou, Instagram. Tự động bóc tách ID, xóa Logo và đóng gói .ZIP chỉ trong 1 click.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Tốc độ: 1-2 Video/Giây
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Bulk Links & Config */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Dán Danh Sách Link (Bulk URLs)
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
                {linkCount} link{linkCount > 1 ? "s" : ""}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Thêm mẫu:</span>
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPreset(p.url)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              id="textarea-bulk-download"
              rows={5}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="Dán mỗi dòng 1 link video (TikTok, Douyin, YTB, FB, Instagram, Kuaishou)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />

            {/* Folder Selection Picker (Yêu cầu 1) */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Thư mục lưu trữ video MP4
                </label>
                <button
                  type="button"
                  onClick={handleSelectOutputDir}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  📁 Chọn Thư Mục Lưu
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="Đường dẫn thư mục (ví dụ: downloads hoặc D:/MyVideos)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400 truncate"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Tất cả file .mp4 tải về sẽ được lưu trực tiếp vào thư mục này.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Độ phân giải</label>
                <select
                  id="select-download-res"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="1080p (Full HD Gốc)">1080p (Full HD Gốc)</option>
                  <option value="4K (Ultra HD)">4K (Ultra HD)</option>
                  <option value="720p (Nén nhẹ)">720p (Nén nhẹ)</option>
                  <option value="Audio MP3 Only">Chỉ Tách Nhạc MP3</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tùy chọn tải</label>
                <div
                  onClick={() => setRemoveWatermark(!removeWatermark)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                    removeWatermark
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 border-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Xóa Logo / ID
                  </span>
                  <CheckCircle className={`w-3.5 h-3.5 ${removeWatermark ? "text-emerald-400" : "text-slate-600"}`} />
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn-start-batch-download"
            disabled={isScanning || isProcessing}
            onClick={handleScanLinks}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Quét & Giải Mã...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>1. Quét & Giải Mã Danh Sách Link</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Task Queue & Table View */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Header */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Danh Sách Quét ({queue.length} video)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {completedCount} Đã Lưu
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadAll}
                disabled={isProcessing || queue.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Tải...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Toàn Bộ .MP4</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearQueue}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                title="Xóa danh sách"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Terminal Log Stream */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 shadow-md flex flex-col justify-between min-h-[95px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Bulk Downloader Real-time Logs
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
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
                    <span className="text-cyan-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Data View (Bước 3 & Bước 4) */}
          {queue.length === 0 ? (
            <div className="min-h-[260px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
              <FolderDown className="w-10 h-10 text-cyan-400/40 mb-2" />
              <h3 className="text-xs font-bold text-slate-200 mb-1">Bảng thông tin quét đang trống</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mb-3">
                Nhập danh sách liên kết ở cột trái và nhấn <b>"1. Quét & Giải Mã Danh Sách Link"</b> để bóc tách thông tin video chi tiết.
              </p>
              <button
                onClick={handleScanLinks}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Quét mẫu {linkCount} liên kết
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/95 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold font-mono">
                      <th className="py-3 px-3 w-12 text-center">STT</th>
                      <th className="py-3 px-3">ID Video</th>
                      <th className="py-3 px-3">Tác Giả / Người Đăng</th>
                      <th className="py-3 px-3">Số Like & View</th>
                      <th className="py-3 px-3 text-right">Trạng Thái / Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {queue.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          item.status === "error"
                            ? "bg-rose-950/10"
                            : item.status === "completed"
                            ? "bg-emerald-950/10"
                            : ""
                        }`}
                      >
                        {/* STT */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* ID Video & Thumbnail Info */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[9px] font-black uppercase shrink-0 ${
                                item.status === "completed"
                                  ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                                  : item.status === "error"
                                  ? "bg-rose-950/50 border-rose-900 text-rose-400"
                                  : "bg-slate-950 border-slate-800 text-cyan-400"
                              }`}
                            >
                              {item.platform.slice(0, 3)}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-mono text-cyan-300 font-bold text-xs block">
                                {item.videoId || item.id.slice(-8)}
                              </span>
                              <span className="text-[11px] text-slate-300 font-medium truncate block max-w-[160px] sm:max-w-[200px]" title={item.title}>
                                {item.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tác Giả */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="text-slate-200 font-semibold block text-xs">
                              {item.author || `@creator_${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {item.duration} • {item.resolution}
                            </span>
                          </div>
                        </td>

                        {/* Số Like & Số View */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block">Lượt thích</span>
                              <span className="font-mono font-bold text-rose-400 text-xs">
                                ❤️ {item.likes || "12.5K"}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block">Lượt xem</span>
                              <span className="font-mono font-bold text-cyan-400 text-xs">
                                👁️ {item.views || "140.2K"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Trạng Thái & Nút Tải Về */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  item.status === "completed"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : item.status === "error"
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : item.status === "pending"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                }`}
                              >
                                {item.status === "completed"
                                  ? "✓ Đã Xong"
                                  : item.status === "error"
                                  ? "✗ Lỗi Tải"
                                  : item.status === "pending"
                                  ? "Chờ Tải"
                                  : `Đang Tải (${item.progress}%)`}
                              </span>

                              <button
                                onClick={() => handleDownloadSingle(item)}
                                disabled={isProcessing || item.status === "completed"}
                                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm ${
                                  item.status === "completed"
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                    : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/20 active:scale-95"
                                }`}
                                title="Tải video này về máy"
                              >
                                <Download className="w-3 h-3" />
                                <span>Tải Về</span>
                              </button>
                            </div>

                            {/* Progress bar mini cho từng dòng */}
                            {item.status !== "pending" && (
                              <div className="w-28 h-1 rounded-full bg-slate-950 overflow-hidden mt-0.5">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    item.status === "completed"
                                      ? "bg-emerald-400"
                                      : item.status === "error"
                                      ? "bg-rose-500"
                                      : "bg-gradient-to-r from-cyan-500 to-indigo-500"
                                  }`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
