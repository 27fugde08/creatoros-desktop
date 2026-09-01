import React, { useState, useEffect } from "react";
import {
  Languages,
  Upload,
  Play,
  Volume2,
  Video,
  CheckCircle,
  FileText,
  Sliders,
  Settings,
  Mic,
  Save,
  Download,
  Scissors
} from "lucide-react";
import { getApiUrl } from "../utils/apiClient";
import io from "socket.io-client";

// Types
interface SubtitleSegment {
  id: number;
  timeStart: string;
  timeEnd: string;
  original: string;
  translated: string;
}

export const TranslateVideoTool: React.FC = () => {
  // Dynamic downloaded video list
  const [downloadedVideos, setDownloadedVideos] = useState<{ id: string; title: string }[]>([]);

  // Input State
  const [selectedVideo, setSelectedVideo] = useState("video_1");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  // Config State
  const [sourceLang, setSourceLang] = useState("Tiếng Anh (English)");
  const [targetLang, setTargetLang] = useState("Tiếng Việt");
  const [aiVoice, setAiVoice] = useState("Nữ (Tiêu chuẩn)");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [demucsSeparation, setDemucsSeparation] = useState(true); // Demucs AI background music extraction

  // Subtitle State
  const [segments, setSegments] = useState<SubtitleSegment[]>([
    { id: 1, timeStart: "00:00:00,000", timeEnd: "00:00:02,500", original: "Hello everyone, welcome to the channel.", translated: "Xin chào mọi người, chào mừng đến với kênh." },
    { id: 2, timeStart: "00:00:02,500", timeEnd: "00:00:05,000", original: "Today we are going to learn about AI.", translated: "Hôm nay chúng ta sẽ tìm hiểu về AI." },
    { id: 3, timeStart: "00:00:05,000", timeEnd: "00:00:08,200", original: "This technology is changing the world fast.", translated: "Công nghệ này đang thay đổi thế giới nhanh chóng." }
  ]);

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  // Load downloaded videos from BatchDownloader state
  useEffect(() => {
    try {
      const stateStr = localStorage.getItem("batchDownloaderState");
      if (stateStr) {
        const state = JSON.parse(stateStr);
        if (state.queue && Array.isArray(state.queue)) {
          const completed = state.queue
            .filter((item: any) => item.status === "completed")
            .map((item: any) => ({
              id: item.id,
              title: item.title || `Downloaded_Video_${item.id}.mp4`
            }));
          setDownloadedVideos(completed);
          if (completed.length > 0) {
            setSelectedVideo(completed[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Error loading downloaded videos", e);
    }
  }, []);

  // Save dubbed video state to localStorage when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      try {
        const saved = localStorage.getItem("dubbedVideosState");
        const currentList = saved ? JSON.parse(saved) : [];
        const currentVideoName = downloadedVideos.find(v => v.id === selectedVideo)?.title || 
                                 (selectedVideo === "video_1" ? "TikTok_Video_123.mp4" : 
                                  selectedVideo === "video_2" ? "Douyin_Viral_456.mp4" : 
                                  selectedVideo === "video_3" ? "YouTube_Short_789.mp4" : "Video.mp4");
        
        const newVideo = {
          id: `dubbed_${selectedVideo}_${Date.now()}`,
          title: `Dubbed_${currentVideoName.replace(/\.[^/.]+$/, "")}.mp4`,
          sourceId: selectedVideo,
          timestamp: Date.now()
        };

        if (!currentList.some((v: any) => v.sourceId === selectedVideo)) {
          currentList.push(newVideo);
          localStorage.setItem("dubbedVideosState", JSON.stringify(currentList));
        }
      } catch (e) {
        console.error("Error saving dubbed video state", e);
      }
    }
  }, [progress]);

  useEffect(() => {
    const socket = io(getApiUrl(""));
    socket.on("dubbing_progress", (data: { progress: number; status: string }) => {
      setProgress(data.progress);
      setStatusText(data.status);
      if (data.progress >= 100) {
        setIsProcessing(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpdateSegment = (id: number, field: "original" | "translated", value: string) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, [field]: value } : seg));
  };

  const handleStartDubbing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setStatusText("Đang khởi động Demucs AI...");
    
    try {
      await fetch(getApiUrl("/api/dubbing/process"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: uploadedFile ? `local_${uploadedFile.name}` : selectedVideo,
          fileName: uploadedFile ? uploadedFile.name : undefined,
          sourceLang,
          targetLang,
          aiVoice,
          voiceSpeed,
          segments,
          demucsSeparation
        })
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      setStatusText("Có lỗi xảy ra khi kết nối server.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setStatusText(`Đã chọn tệp: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    }
  };

  const handleTriggerUpload = async () => {
    // Check electron API first if available
    if ((window as any).electronAPI && typeof (window as any).electronAPI.openFileDialog === "function") {
      try {
        const filePath = await (window as any).electronAPI.openFileDialog({
          properties: ["openFile"],
          filters: [{ name: "Media Files", extensions: ["mp4", "mkv", "avi", "mov", "mp3", "wav"] }]
        });
        if (filePath) {
          setUploadedFile({ name: filePath.split(/[\\/]/).pop() || filePath, size: 0 } as any);
          return;
        }
      } catch (err) {
        console.warn("Electron openFileDialog fallback to web input:", err);
      }
    }
    // Fallback to web hidden input click
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-emerald-400" />
            Dịch Thuật & Auto Dub
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tự động lồng tiếng, tách âm BGM bằng Demucs AI, dịch phụ đề, và render bằng FFmpeg CUDA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config */}
        <div className="lg:col-span-4 space-y-6">
          {/* Input Area */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" /> Nguồn Video
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn từ Video Đã Tải</label>
                <select 
                  value={selectedVideo}
                  onChange={e => setSelectedVideo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {downloadedVideos.length > 0 ? (
                    downloadedVideos.map(vid => (
                      <option key={vid.id} value={vid.id}>{vid.title}</option>
                    ))
                  ) : (
                    <>
                      <option value="video_1">TikTok_Video_123.mp4</option>
                      <option value="video_2">Douyin_Viral_456.mp4</option>
                      <option value="video_3">YouTube_Short_789.mp4</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs text-slate-600 font-medium">HOẶC</span>
              </div>

              {/* Hidden File Input */}
              <input 
                type="file"
                ref={fileInputRef}
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button 
                onClick={handleTriggerUpload}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                {uploadedFile ? `📁 ${uploadedFile.name}` : "Tải lên File từ máy tính"}
              </button>
              {uploadedFile && (
                <div className="text-[11px] text-emerald-400 font-mono text-center truncate">
                  Đã chọn: {uploadedFile.name}
                </div>
              )}
            </div>
          </div>

          {/* AI Dubbing Config */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" /> Cấu hình Lồng Tiếng
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngôn ngữ gốc</label>
                <select 
                  value={sourceLang}
                  onChange={e => setSourceLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="Tiếng Anh (English)">Tiếng Anh</option>
                  <option value="Tiếng Trung (Mandarin)">Tiếng Trung</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngôn ngữ đích</label>
                <select 
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="Tiếng Việt">Tiếng Việt</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giọng đọc AI</label>
              <select 
                value={aiVoice}
                onChange={e => setAiVoice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200"
              >
                <option value="Nam (Truyền cảm)">Nam (Truyền cảm)</option>
                <option value="Nữ (Tiêu chuẩn)">Nữ (Tiêu chuẩn)</option>
                <option value="Nữ (Giọng miền Nam)">Nữ (Giọng miền Nam)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-400">Tốc độ giọng (Voice Speed)</label>
                <span className="text-xs text-emerald-400 font-mono">{voiceSpeed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={voiceSpeed}
                onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Demucs AI Vocal Split Toggle */}
            <div 
              onClick={() => setDemucsSeparation(!demucsSeparation)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                demucsSeparation 
                  ? "bg-slate-800/80 border-emerald-500/50" 
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  Tách Nhạc Nền (Demucs AI)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Giữ nhạc nền gốc & đè giọng AI</div>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${demucsSeparation ? "bg-emerald-500" : "bg-slate-700"}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${demucsSeparation ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subtitles & Action */}
        <div className="lg:col-span-8 flex flex-col space-y-6 h-full">
          {/* Subtitle Editor (Dual-pane) */}
          <div className="flex-1 flex flex-col min-h-[400px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-400" />
                Hiệu đính Phụ đề (Inline Edit)
              </h3>
              <div className="text-xs text-slate-500">
                Click vào dòng text để chỉnh sửa trực tiếp
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-2">Thời gian (Timestamp)</div>
                <div className="col-span-5">Phụ đề gốc</div>
                <div className="col-span-5">Bản dịch</div>
              </div>
              
              {segments.map((seg) => (
                <div key={seg.id} className="grid grid-cols-12 gap-4 group">
                  <div className="col-span-2 flex flex-col justify-start">
                    <span className="text-[11px] font-mono text-slate-500">{seg.timeStart}</span>
                    <span className="text-[11px] font-mono text-slate-600">v</span>
                    <span className="text-[11px] font-mono text-slate-500">{seg.timeEnd}</span>
                  </div>
                  <div className="col-span-5">
                    <textarea 
                      className="w-full bg-slate-950/50 border border-transparent hover:border-slate-700 focus:border-emerald-500 focus:bg-slate-900 rounded-lg p-2 text-xs text-slate-300 resize-none transition-colors outline-none h-full min-h-[60px]"
                      value={seg.original}
                      onChange={(e) => handleUpdateSegment(seg.id, "original", e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <textarea 
                      className="w-full bg-slate-950/50 border border-transparent hover:border-slate-700 focus:border-emerald-500 focus:bg-slate-900 rounded-lg p-2 text-xs text-emerald-100 resize-none transition-colors outline-none h-full min-h-[60px]"
                      value={seg.translated}
                      onChange={(e) => handleUpdateSegment(seg.id, "translated", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Section */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Bắt đầu quá trình Render</h3>
                <p className="text-xs text-slate-400 mt-1">Sử dụng sức mạnh GPU HWAccel (CUDA)</p>
              </div>
            </div>

            {!isProcessing && progress === 0 && (
              <button 
                onClick={handleStartDubbing}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Video className="w-5 h-5" />
                Bắt đầu Dịch & Lồng Tiếng (FFmpeg Render)
              </button>
            )}

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    {statusText}
                  </span>
                  <span className="font-mono text-emerald-300">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {!isProcessing && progress === 100 && (
              <div className="w-full space-y-3">
                {/* Video Preview */}
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                  <video controls className="w-full h-auto">
                    <source src="/api/download/video/dubbed_result.mp4" type="video/mp4" />
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>

                <div className="w-full py-3.5 px-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Hoàn tất! Video lồng tiếng đã sẵn sàng.
                </div>
                
                <button 
                  onClick={() => window.open("/api/download/video/dubbed_result.mp4", "_blank")}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải về Video Lồng Tiếng
                </button>

                <button 
                  onClick={() => { setProgress(0); setIsProcessing(false); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-medium text-xs transition-colors"
                >
                  Xử lý video khác
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
