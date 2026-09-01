import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Video,
  Upload,
  Play,
  Terminal,
  Sliders,
  CheckCircle,
  SplitSquareHorizontal,
  RefreshCcw,
  Download,
  StopCircle
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { io } from "socket.io-client";

export const SemiContentTool: React.FC = () => {
  // Dynamic list of dubbed videos
  const [dubbedVideos, setDubbedVideos] = useState<{ id: string; title: string }[]>([]);

  // Input Selection
  const [selectedVideo, setSelectedVideo] = useState("dubbed_video_1");
  
  // Anti-Strike Configurations
  const [config, setConfig] = useState({
    changeMD5: true,
    horizontalFlip: true,
    speedUp: false,
    blurryPadding: true,
    microNoise: false,
    colorShift: false
  });

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const mockIntervalRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  // Load dubbed videos from TranslateVideo state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dubbedVideosState");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) {
          setDubbedVideos(list);
          setSelectedVideo(list[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading dubbed videos", e);
    }
  }, []);

  // Save bypassed video state when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      try {
        const saved = localStorage.getItem("bypassedVideosState");
        const currentList = saved ? JSON.parse(saved) : [];
        const currentVideoName = dubbedVideos.find(v => v.id === selectedVideo)?.title || 
                                 (selectedVideo === "dubbed_video_1" ? "Dubbed_TikTok_123.mp4" : 
                                  selectedVideo === "dubbed_video_2" ? "Dubbed_YouTube_Shorts.mp4" : 
                                  selectedVideo === "raw_video_3" ? "Raw_Douyin_Viral.mp4" : "Dubbed_Video.mp4");
        
        const newVideo = {
          id: `bypassed_${selectedVideo}_${Date.now()}`,
          title: `NoStrike_${currentVideoName.replace(/\.[^/.]+$/, "")}.mp4`,
          sourceId: selectedVideo,
          timestamp: Date.now()
        };

        if (!currentList.some((v: any) => v.sourceId === selectedVideo)) {
          currentList.push(newVideo);
          localStorage.setItem("bypassedVideosState", JSON.stringify(currentList));
        }
      } catch (e) {
        console.error("Error saving bypassed video state", e);
      }
    }
  }, [progress]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const handleToggle = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartRender = () => {
    setIsProcessing(true);
    setProgress(0);
    setStatusText("Khởi tạo môi trường...");
    setTerminalLogs(["[init] Starting No-Strike Rendering Pipeline..."]);
    soundSynth.playSfx("whoosh");

    const electronAPI = (window as any).electronAPI;

    if (electronAPI) {
      setTerminalLogs(prev => [...prev, "[electron] Electron environment detected. Invoking child_process.spawn for Python pipeline..."]);
      
      const removeProgress = electronAPI.onRenderProgress((progressVal: number) => {
        setProgress(progressVal);
        if (progressVal >= 100) {
          setStatusText("Hoàn tất! Render video thành công.");
        } else if (progressVal > 60) {
          setStatusText("Đang Re-encode h264_nvenc...");
        } else if (progressVal > 30) {
          setStatusText("Đang xử lý phần cứng FFmpeg...");
        } else {
          setStatusText("Đang áp dụng Filter...");
        }
      });

      const removeLog = electronAPI.onRenderLog((logMsg: string) => {
        setTerminalLogs(prev => [...prev, logMsg]);
      });

      const removeComplete = electronAPI.onRenderComplete(() => {
        setIsProcessing(false);
        setProgress(100);
        setStatusText("Hoàn tất! Video đã được render hoàn chỉnh.");
        soundSynth.playSfx("success");
        
        removeProgress();
        removeLog();
        removeComplete();
        removeError();
      });

      const removeError = electronAPI.onRenderError((errMsg: string) => {
        setIsProcessing(false);
        setTerminalLogs(prev => [...prev, `[error] ${errMsg}`]);
        setStatusText("Lỗi render video!");
        soundSynth.playSfx("boom");
        
        removeProgress();
        removeLog();
        removeComplete();
        removeError();
      });

      electronAPI.renderVideo({
        video: selectedVideo,
        changeMD5: config.changeMD5,
        horizontalFlip: config.horizontalFlip,
        speedUp: config.speedUp,
        blurryPadding: config.blurryPadding,
        microNoise: config.microNoise,
        colorShift: config.colorShift,
        isNoStrike: true
      });

    } else {
      setTerminalLogs(prev => [...prev, "[web] Web browser environment detected. Connecting to live Express Socket.io server..."]);
      
      const socketURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const socket = io(socketURL);
      socketRef.current = socket;

      socket.on("connect", () => {
        setTerminalLogs(prev => [...prev, "[socket] Successfully connected. Launching real No-Strike Python engine..."]);
        
        fetch("/api/nostrike/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: selectedVideo,
            config: {
              changeMD5: config.changeMD5,
              horizontalFlip: config.horizontalFlip,
              speedUp: config.speedUp,
              blurryPadding: config.blurryPadding,
              microNoise: config.microNoise,
              colorShift: config.colorShift
            }
          })
        })
        .then(res => res.json())
        .then(data => {
          setTerminalLogs(prev => [...prev, `[server] ${data.message}`]);
        })
        .catch(err => {
          setTerminalLogs(prev => [...prev, `[error] Failed to trigger server: ${err.message}`]);
          setIsProcessing(false);
          soundSynth.playSfx("boom");
          socket.disconnect();
        });
      });

      socket.on("nostrike_progress", (data: { progress?: number; status?: string; log?: string }) => {
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.status) {
          setStatusText(data.status);
        }
        if (data.log) {
          setTerminalLogs(prev => [...prev, data.log]);
        }
        if (data.progress !== undefined && data.progress >= 100) {
          setIsProcessing(false);
          soundSynth.playSfx("success");
          socket.disconnect();
        }
      });

      socket.on("connect_error", (err) => {
        setTerminalLogs(prev => [...prev, `[socket_error] Failed to connect: ${err.message}`]);
        setIsProcessing(false);
        soundSynth.playSfx("boom");
      });
    }
  };

  const handleCancelRender = () => {
    soundSynth.playSfx("boom");
    const electronAPI = (window as any).electronAPI;

    if (electronAPI) {
      electronAPI.cancelRender();
      electronAPI.removeRenderListeners();
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    setIsProcessing(false);
    setStatusText("Tác vụ đã bị hủy!");
    setTerminalLogs(prev => [
      ...prev,
      "[system] HỦY TÁC VỤ: Tiến trình bị hủy chủ động bởi người dùng (SIGTERM)."
    ]);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
            Edit Bản Content (No-Strike)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bypass bản quyền bằng mã MD5, filter lật video, nhiễu hạt và padding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Config */}
        <div className="xl:col-span-5 space-y-6">
          {/* Input Area */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" /> Khung Đầu Vào (Input)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn Video (Từ Auto Dub)</label>
                <select 
                  value={selectedVideo}
                  onChange={e => setSelectedVideo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                >
                  {dubbedVideos.length > 0 ? (
                    dubbedVideos.map(vid => (
                      <option key={vid.id} value={vid.id}>{vid.title}</option>
                    ))
                  ) : (
                    <>
                      <option value="dubbed_video_1">Dubbed_TikTok_123.mp4</option>
                      <option value="dubbed_video_2">Dubbed_YouTube_Shorts.mp4</option>
                      <option value="raw_video_3">Raw_Douyin_Viral.mp4</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs text-slate-600 font-medium px-2 bg-slate-900 z-10">HOẶC KÉO THẢ</span>
                <div className="h-px bg-slate-800 absolute w-full left-0 mt-3 -z-10"></div>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/50 cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-300 font-medium">Kéo thả file video vào đây</p>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ MP4, MOV (Tối đa 500MB)</p>
              </div>
            </div>
          </div>

          {/* Anti-Strike Toggles */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" /> Cấu Hình Bypass (Chống Gậy)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToggleItem 
                label="Đổi mã MD5 tĩnh" 
                desc="Tạo hash file hoàn toàn mới"
                isActive={config.changeMD5} 
                onToggle={() => handleToggle("changeMD5")} 
              />
              <ToggleItem 
                label="Lật hình ảnh" 
                desc="Horizontal Flip (-vf hflip)"
                isActive={config.horizontalFlip} 
                onToggle={() => handleToggle("horizontalFlip")} 
              />
              <ToggleItem 
                label="Tăng tốc video" 
                desc="Speed up 1.05x - 1.1x"
                isActive={config.speedUp} 
                onToggle={() => handleToggle("speedUp")} 
              />
              <ToggleItem 
                label="Thêm viền mờ" 
                desc="Blurry background padding"
                isActive={config.blurryPadding} 
                onToggle={() => handleToggle("blurryPadding")} 
              />
              <ToggleItem 
                label="Phủ Micro-noise" 
                desc="Nhiễu hạt siêu nhỏ chống quét AI"
                isActive={config.microNoise} 
                onToggle={() => handleToggle("microNoise")} 
              />
              <ToggleItem 
                label="Đảo dải màu nhẹ" 
                desc="Color grading shift (Hue/Saturation)"
                isActive={config.colorShift} 
                onToggle={() => handleToggle("colorShift")} 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Terminal */}
        <div className="xl:col-span-7 flex flex-col space-y-6">
          {/* Split Screen Preview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <SplitSquareHorizontal className="w-4 h-4 text-blue-400" />
                Xem Trước (Preview)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 h-[240px]">
              {/* Before */}
              <div className="relative rounded-xl bg-black border border-slate-700 overflow-hidden flex items-center justify-center">
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-1 rounded text-slate-300">
                  GỐC (BEFORE)
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center backdrop-blur shadow-xl">
                  <Play className="w-5 h-5 text-slate-400 ml-1" />
                </div>
              </div>

              {/* After (With mock CSS filters based on config) */}
              <div className="relative rounded-xl bg-black border border-slate-700 overflow-hidden flex items-center justify-center"
                style={{
                  transform: config.horizontalFlip ? 'scaleX(-1)' : 'none',
                  filter: `
                    ${config.colorShift ? 'hue-rotate(15deg) contrast(1.1)' : ''}
                  `
                }}
              >
                {/* Blurry Padding Mock */}
                {config.blurryPadding && (
                  <div className="absolute inset-0 border-[16px] border-slate-800/40 backdrop-blur-md pointer-events-none z-10"></div>
                )}
                {/* Noise Mock */}
                {config.microNoise && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none z-20" 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\\"0 0 200 200\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noiseFilter\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.85\\" numOctaves=\\"3\\" stitchTiles=\\"stitch\\"%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width=\\"100%25\\" height=\\"100%25\\" filter=\\"url(%23noiseFilter)\\"%3E%3C/rect%3E%3C/svg%3E")' }}>
                  </div>
                )}

                <div className="absolute top-2 left-2 bg-orange-500/80 backdrop-blur text-[10px] font-bold px-2 py-1 rounded text-white z-30"
                  style={{ transform: config.horizontalFlip ? 'scaleX(-1)' : 'none' }}>
                  ĐÃ XỬ LÝ (AFTER)
                </div>
                
                <div className="w-12 h-12 rounded-full bg-orange-600/80 flex items-center justify-center backdrop-blur shadow-xl z-30"
                  style={{ transform: config.horizontalFlip ? 'scaleX(-1)' : 'none' }}>
                  <Play className="w-5 h-5 text-white ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Execution & Logs */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex-1 flex flex-col">
            <div className="flex flex-col mb-4 space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={handleStartRender}
                  disabled={isProcessing}
                  className={`py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isProcessing ? "w-2/3" : "w-full"
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : progress === 100 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Terminal className="w-5 h-5" />
                  )}
                  {isProcessing ? "Đang Render..." : progress === 100 ? "Render Thành Công" : "Bắt Đầu Render No-Strike"}
                </button>

                {isProcessing && (
                  <button 
                    type="button"
                    onClick={handleCancelRender}
                    className="w-1/3 py-3.5 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-in fade-in slide-in-from-right-3 duration-200"
                  >
                    <StopCircle className="w-4 h-4 animate-pulse" />
                    <span>Hủy</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(isProcessing || progress > 0) && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-orange-400">{statusText}</span>
                    <span className="font-mono text-orange-300">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Window */}
            <div className="flex-1 bg-black rounded-xl border border-slate-800 p-3 flex flex-col min-h-[160px]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 ml-2">FFmpeg Output (Simulated)</span>
              </div>
              
              <div 
                ref={terminalRef}
                className="flex-1 overflow-y-auto text-[11px] font-mono text-slate-300 space-y-1.5 pr-2 custom-scrollbar"
              >
                {terminalLogs.length === 0 ? (
                  <div className="text-slate-600 italic">Sẵn sàng thực thi. Bấm Render để bắt đầu...</div>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className={`${
                      log.includes("[success]") ? "text-emerald-400 font-bold" :
                      log.includes("[hwaccel]") ? "text-orange-300" :
                      log.includes("[filter_complex]") ? "text-blue-300" :
                      log.includes("[error]") ? "text-red-400" : ""
                    }`}>
                      <span className="text-slate-600 mr-2">{'>'}</span>{log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Download Button appears after success */}
            {!isProcessing && progress === 100 && (
              <button className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Download className="w-4 h-4 text-emerald-400" />
                Tải Video (Đã Bypass)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleItem = ({ label, desc, isActive, onToggle }: { label: string, desc: string, isActive: boolean, onToggle: () => void }) => {
  return (
    <div 
      onClick={onToggle}
      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
        isActive 
          ? "bg-slate-800/80 border-orange-500/50" 
          : "bg-slate-900 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div>
        <div className={`text-sm font-semibold ${isActive ? "text-slate-200" : "text-slate-400"}`}>
          {label}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      
      {/* Custom Tailwind Switch */}
      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${isActive ? "bg-orange-500" : "bg-slate-700"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
};
