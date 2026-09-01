import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  Scissors,
  Sparkles,
  Play,
  Pause,
  Copy,
  Download,
  Flame,
  Clock,
  Video,
  Volume2,
  CheckCircle,
  FileText,
  Eye,
  Sliders
} from "lucide-react";
import { HighlightResult, HighlightItem } from "../../shared/types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";
import { RenderProgressWidget } from "./RenderProgressWidget";

export const HighlightTool: React.FC = () => {
  const [videoTitle, setVideoTitle] = useState("Podcast Bí Mật Thành Công Triệu Đô Của Các Tỷ Phú");
  const [videoTopic, setVideoTopic] = useState(
    "Cuộc trò chuyện kéo dài 2 tiếng bàn về cách vượt qua khủng hoảng tài chính, 3 thói quen buổi sáng thay đổi cuộc đời và cú twist phá sản năm 25 tuổi."
  );
  const [targetDuration, setTargetDuration] = useState("60s");
  const [style, setStyle] = useState("Hype/Shocking (Gây sốc, Giật gân)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HighlightResult | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightItem | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  
  // Render simulation states
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [mockGpuStats, setMockGpuStats] = useState({
    gpu: 0,
    memUtil: 0,
    memUsed: 0,
    temp: 50
  });

  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    const socketURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const socket = io(socketURL);

    const handleTaskUpdated = (task: any) => {
      if (task && taskId && task.id === taskId) {
        setRenderProgress(task.progress || 0);
        if (task.status === "completed") {
          soundSynth.playSfx("success");
          setIsRendering(false);
          setTaskId(null);
        } else if (task.status === "failed") {
          alert(`Lỗi render: ${task.error}`);
          setIsRendering(false);
          setTaskId(null);
        }
      }
    };

    const handleGpuStats = (stats: any) => {
      if (isRendering) {
        setMockGpuStats(prev => ({
          ...prev,
          ...stats
        }));
      }
    };

    socket.on("task_updated", handleTaskUpdated);
    socket.on("gpu_stats", handleGpuStats);

    return () => {
      socket.off("task_updated", handleTaskUpdated);
      socket.off("gpu_stats", handleGpuStats);
      socket.disconnect();
    };
  }, [taskId, isRendering]);

  const startRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    soundSynth.playSfx("whoosh");
    
    try {
      const response = await fetch(getApiUrl("/api/db/tasks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Render Highlight: ${videoTitle}`,
          type: "video-edit",
          status: "pending",
          progress: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tạo task render");
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setTaskId(resData.data.id);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi: ${e.message}`);
      setIsRendering(false);
    }
  };

  const samplePresets = [
    {
      title: "Podcast Doanh Nhân & Bài Học 10 Triệu Đô",
      topic: "Chia sẻ khoảnh khắc suýt phá sản và bài học tâm đắc nhất giúp vực dậy công ty chỉ trong 6 tháng.",
      style: "Hype/Shocking (Gây sốc, Giật gân)",
    },
    {
      title: "Review Siêu Phẩm Điện Ảnh Đoạt Giải Oscar",
      topic: "Tóm tắt các phân đoạn cao trào, pha đối đầu giữa hai nhân vật và cú twist bẻ lái phút 89.",
      style: "Kể chuyện ly kỳ / Mystery",
    },
    {
      title: "Livestream Phân Tích Công Nghệ AI 2026",
      topic: "Trình diễn các công cụ AI tự động hóa video và bí quyết kiếm tiền từ kênh YouTube không cần lộ mặt.",
      style: "Chuyên sâu / Giá trị cao",
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    soundSynth.playSfx("whoosh");
    try {
      const response = await fetch(getApiUrl("/api/ai/highlight"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoTitle,
          transcript: videoTopic,
          duration: targetDuration,
          style,
          videoTitle,
          videoTopic,
          targetDuration,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      const outputData = resData.data || resData;
      if (outputData && (outputData.highlights || outputData.title)) {
        setResult(outputData);
        setSelectedHighlight(outputData.highlights?.[0] || null);
        soundSynth.playSfx("cash");
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        throw new Error("Không nhận được dữ liệu highlight từ FastAPI.");
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi xử lý Highlight: ${e.message || "Không thể trích xuất highlight."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVoice = (item: HighlightItem) => {
    if (playingId === item.id) {
      soundSynth.stopSpeech();
      setPlayingId(null);
      return;
    }
    soundSynth.stopSpeech();
    setPlayingId(item.id);
    soundSynth.speakText(item.voiceScript, {
      lang: "vi-VN",
      rate: 1.05,
      pitch: 1.0,
      onEnd: () => setPlayingId(null),
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    soundSynth.playSfx("pop");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const downloadSRT = () => {
    let srtContent = "";
    const dataToExport = result ? result.highlights : [
      { startTime: "01:15", endTime: "02:00", caption: "Bài học 10 triệu đô #kinhdoanh #baihoc" },
      { startTime: "05:30", endTime: "06:15", caption: "Dậy sớm để thành công? #thanhcong #dongluc" }
    ];
    
    dataToExport.forEach((hl, idx) => {
      srtContent += `${idx + 1}\n00:${hl.startTime}:00,000 --> 00:${hl.endTime}:00,000\n${hl.caption}\n\n`;
    });
    
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `highlights_${Date.now()}.srt`;
    a.click();
    soundSynth.playSfx("success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Scissors className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Highlight Tự Tìm Cảnh Hay & Viết Lời Thoại
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Tự động quét video dài, phát hiện điểm thót tim, cao trào cảm xúc <strong>(Viral Hook 0-3s)</strong> và tự sinh kịch bản lồng tiếng cuốn hút cho Shorts, TikTok & Reels.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Auto Peak Moment Detection
            </span>
          </div>
        </div>
      </div>

      {/* Preset Quick Chooser */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium">Mẫu gợi ý nhanh:</span>
        {samplePresets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setVideoTitle(p.title);
              setVideoTopic(p.topic);
              setStyle(p.style);
              soundSynth.playSfx("pop");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-all"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Input & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            Nội Dung Video Đầu Vào
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tiêu đề hoặc Link Video</label>
            <input
              id="input-hl-title"
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="VD: Podcast 2 tiếng bàn về kinh doanh..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nội dung tóm tắt hoặc Transcript video</label>
            <textarea
              id="input-hl-topic"
              rows={4}
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
              placeholder="Dán nội dung, tóm tắt hoặc phụ đề video gốc vào đây..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Thời lượng Highlight</label>
              <select
                id="select-hl-duration"
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="30s">30 giây (Siêu ngắn)</option>
                <option value="60s">60 giây (Shorts / Reels)</option>
                <option value="90s">90 giây (TikTok Top)</option>
                <option value="3 phút">3 phút (Mini Recap)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phong cách lời thoại</label>
              <select
                id="select-hl-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Hype/Shocking (Gây sốc, Giật gân)">Hype / Gây sốc</option>
                <option value="Kể chuyện ly kỳ / Mystery">Kể chuyện ly kỳ / Mystery</option>
                <option value="Chuyên sâu / Giá trị cao">Chuyên sâu / Giá trị cao</option>
                <option value="Hài hước / Meme lôi cuốn">Hài hước / Meme lôi cuốn</option>
              </select>
            </div>
          </div>

          <button
            id="btn-generate-highlight"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI Đang Phân Tích Cảnh Hay & Viết Lời...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Trích Xuất Highlight & Viết Lời Ngay</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Showcase */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Chiến lược Viral AI
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {result?.highlights 
                    ? `Đã tìm thấy ${result.highlights.length} đoạn hội thoại có khả năng giữ chân người xem tốt nhất.` 
                    : "Chưa có dữ liệu, hãy trích xuất video."}
                </p>
              </div>
            </div>

            {/* Video Player Mock */}
            <div className="w-full aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative group flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop" 
                alt="Video thumbnail" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <button className="w-16 h-16 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-105 z-10 shadow-xl">
                <Play className="w-6 h-6 ml-1" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-10">
                <div className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded-md backdrop-blur-md">
                  {selectedHighlight ? `${selectedHighlight.startTime} / ${selectedHighlight.endTime}` : "00:00 / 00:00"}
                </div>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[60%]" />
                </div>
              </div>
            </div>

            {/* Highlight Cards */}
            <div className="space-y-3">
              {(result?.highlights || []).map((hl: HighlightItem) => {
                const isSelected = selectedHighlight?.id === hl.id;
                const isPlaying = playingId === hl.id;
                return (
                  <div
                    key={hl.id}
                    onClick={() => setSelectedHighlight(hl)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900/90 border-indigo-500/80 shadow-md shadow-indigo-500/10"
                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                          {hl.startTime} - {hl.endTime}
                        </span>
                        <h4 className="text-sm font-bold text-white">{hl.hookTitle}</h4>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-xs font-bold border border-rose-500/20">
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>Viral: {hl.viralScore}%</span>
                      </div>
                    </div>

                    {/* Voice script text */}
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 mb-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center justify-between">
                        <span>Lời thoại lồng tiếng (Voice Script):</span>
                        <span className="text-indigo-400">Giọng đọc AI Local</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        "{hl.voiceScript}"
                      </p>
                    </div>

                    {/* B-roll & Caption footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate"><strong>B-roll:</strong> {hl.brollSuggestion}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate font-semibold text-cyan-300"><strong>Cap:</strong> {hl.caption}</span>
                      </div>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoice(hl);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isPlaying
                            ? "bg-rose-500 text-white"
                            : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30"
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Dừng Nghe</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe Thử Giọng Đọc</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(hl.voiceScript);
                        }}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedScript ? "Đã chép!" : "Sao chép lời"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Render Progress Widget (Conditional) */}
            <RenderProgressWidget 
              isRendering={isRendering} 
              renderProgress={renderProgress} 
              mockGpuStats={mockGpuStats} 
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={downloadSRT}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Tải Kịch Bản (.SRT)</span>
              </button>
              <button
                onClick={startRender}
                disabled={isRendering && renderProgress < 100}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>{renderProgress === 100 ? "Render Xong!" : "Bắt đầu Render Video"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
