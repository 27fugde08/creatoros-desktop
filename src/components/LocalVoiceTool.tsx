import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Globe,
  Music,
  Download,
  Copy,
  CheckCircle,
  Activity,
  Layers,
  Radio,
  Terminal,
  Loader2,
  VolumeX,
  PlayCircle
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import confetti from "canvas-confetti";
import { io } from "socket.io-client";

export const LocalVoiceTool: React.FC = () => {
  const [text, setText] = useState(
    "Chào mừng các bạn đã quay trở lại với kênh! Trong video ngày hôm nay, chúng ta sẽ cùng khám phá một bí mật cực kỳ thú vị mà 99% mọi người đều chưa từng nghe tới."
  );
  const [language, setLanguage] = useState("vi-VN");
  const [rate, setRate] = useState(1.05);
  const [pitch, setPitch] = useState(1.0);
  const [bgm, setBgm] = useState("Lo-Fi Deep Focus (Thư giãn)");
  const [bgmVolume, setBgmVolume] = useState(0.15);
  
  // Real-time State Management
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Sẵn sàng tổng hợp");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[info] Local Voice Synthesis Engine đã sẵn sàng.",
    "[info] Động cơ chạy hoàn toàn offline 100%, không tốn API credit."
  ]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);

  // Auto Scroll Terminal Logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Audio Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 2;

      const bars = 40;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        let amplitude = (isPlaying || isSynthesizing)
          ? Math.sin(i * 0.3 + phase) * 20 + Math.cos(i * 0.5 - phase) * 12 + 8
          : 3;
        amplitude = Math.max(2, Math.abs(amplitude));

        ctx.fillStyle = (isPlaying || isSynthesizing)
          ? `hsl(${(i * 8 + phase * 20) % 360}, 85%, 60%)`
          : "#475569";
        ctx.fillRect(x - 2, centerY - amplitude, 4, amplitude * 2);
      }

      if (isPlaying || isSynthesizing) {
        phase += 0.15;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isSynthesizing]);

  // Handle Synthesis
  const handleStartSynthesis = () => {
    if (isSynthesizing) return;
    if (!text.trim()) return;

    setIsSynthesizing(true);
    setProgress(0);
    setStatusText("Đang bắt đầu...");
    setTerminalLogs([
      "[system] Khởi chạy tiến trình tổng hợp Offline Voice Local...",
      `[params] Ngôn ngữ: ${language} | Tốc độ: ${rate}x | Cao độ: ${pitch} | Nhạc nền: ${bgm}`
    ]);
    setAudioUrl(null);

    const isElectron = typeof window !== "undefined" && (window as any).electronAPI;

    if (isElectron) {
      const electronAPI = (window as any).electronAPI;

      // Register temporary IPC progress updates
      electronAPI.onRenderStageUpdate((stage: string) => {
        setStatusText(stage);
      });

      electronAPI.onRenderProgress((prog: number) => {
        setProgress(prog);
      });

      electronAPI.onRenderLog((logMsg: string) => {
        setTerminalLogs(prev => [...prev, logMsg]);
      });

      electronAPI.onRenderComplete((result: any) => {
        setIsSynthesizing(false);
        setProgress(100);
        setStatusText("Hoàn tất!");
        setTerminalLogs(prev => [...prev, "[success] Đã tổng hợp thành công giọng nói Local!", `[path] File kết xuất: output/synthesized_voice.mp3`]);
        setAudioUrl("/output/synthesized_voice.mp3");
        soundSynth.playSfx("success");
        confetti();
        electronAPI.removeRenderListeners();
      });

      electronAPI.onRenderError((err: string) => {
        setIsSynthesizing(false);
        setStatusText("Lỗi tổng hợp!");
        setTerminalLogs(prev => [...prev, `[error] Thất bại: ${err}`]);
        soundSynth.playSfx("boom");
        electronAPI.removeRenderListeners();
      });

      // Trigger IPC Call
      electronAPI.renderVideo({
        isVoiceLocal: true,
        text: text,
        language: language,
        rate: rate,
        pitch: pitch,
        bgm: bgm,
        bgm_volume: bgmVolume
      });

    } else {
      // Browser Web Mode via socket.io-client and API post
      const socketURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const socket = io(socketURL);
      socketRef.current = socket;

      socket.on("connect", () => {
        setTerminalLogs(prev => [...prev, "[socket] Đã thiết lập kết nối thời gian thực với máy chủ."]);

        fetch("/api/voice/synthesize-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language,
            rate,
            pitch,
            bgm,
            bgm_volume: bgmVolume
          })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            setTerminalLogs(prev => [...prev, `[error] Máy chủ phản hồi thất bại: ${data.error}`]);
            setIsSynthesizing(false);
            soundSynth.playSfx("boom");
          }
        })
        .catch(err => {
          setTerminalLogs(prev => [...prev, `[error] Không thể gọi API: ${err.message}`]);
          setIsSynthesizing(false);
          soundSynth.playSfx("boom");
          socket.disconnect();
        });
      });

      socket.on("voice_local_progress", (data: { progress?: number; status?: string; log?: string; audioUrl?: string }) => {
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.status) {
          setStatusText(data.status);
        }
        if (data.log) {
          setTerminalLogs(prev => [...prev, data.log!]);
        }
        if (data.progress !== undefined && data.progress >= 100) {
          setIsSynthesizing(false);
          if (data.audioUrl) {
            setAudioUrl(data.audioUrl);
          } else {
            setAudioUrl("/output/synthesized_voice.mp3");
          }
          soundSynth.playSfx("success");
          confetti();
          socket.disconnect();
        }
      });

      socket.on("connect_error", (err) => {
        setTerminalLogs(prev => [...prev, `[error] Kết nối thất bại: ${err.message}`]);
        setIsSynthesizing(false);
        soundSynth.playSfx("boom");
      });
    }
  };

  const handleTogglePlayAudio = () => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Audio playback error:", err));
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "synthesized_voice.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundSynth.playSfx("pop");
  };

  const sampleVoicePrompts = [
    {
      title: "Lời thoại kịch tính (TikTok/Shorts)",
      text: "Bạn có biết bí mật đen tối nhất bị che giấu suốt 100 năm qua là gì không? Hãy nhìn thật kỹ chi tiết này...",
      lang: "vi-VN",
      rate: 1.1,
      pitch: 0.95,
      bgm: "Cinematic Tension (Kịch tính dồn dập)"
    },
    {
      title: "Review Đập hộp Công nghệ",
      text: "Sau đúng 1 tuần trải nghiệm thì đây là 3 lý do bạn TUYỆT ĐỐI không nên mua thiết bị này nếu chưa xem hết video!",
      lang: "vi-VN",
      rate: 1.15,
      pitch: 1.05,
      bgm: "Upbeat Tech Vlog (Sôi động)"
    },
    {
      title: "Viral Motivation (English)",
      text: "Stop waiting for the right moment. The moment is now. Create your own opportunity and never look back.",
      lang: "en-US",
      rate: 1.0,
      pitch: 1.0,
      bgm: "Lo-Fi Deep Focus (Thư giãn)"
    },
    {
      title: "Bí ẩn rùng rợn (Kể chuyện)",
      text: "Đêm hôm đó, căn phòng bỗng lạnh toát. Tiếng bước chân thầm lặng ngoài hành lang cứ thế tiến lại gần...",
      lang: "vi-VN",
      rate: 0.95,
      pitch: 0.9,
      bgm: "Dark Mystery Suspense (Bí ẩn)"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/90 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Mic className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Voice Local Không Giới Hạn (0đ Offline)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Tổng hợp giọng đọc chất lượng phòng thu trực tiếp trên hệ thống. Hỗ trợ đa ngôn ngữ, tự động đồng bộ lồng nhạc nền và kích hoạt radio-style auto-ducking triệt tiêu tiếng ồn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              100% Free Offline Engine
            </span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium">Mẫu gợi ý kịch bản:</span>
        {sampleVoicePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              setLanguage(p.lang);
              setRate(p.rate);
              setPitch(p.pitch);
              setBgm(p.bgm);
              soundSynth.playSfx("pop");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Inputs & Waves */}
        <div className="lg:col-span-7 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Soạn Thảo Lời Thoại Kịch Bản
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {text.length} ký tự • ~{Math.ceil(text.split(" ").length / 2.8)} giây đọc
            </span>
          </div>

          <textarea
            id="input-voice-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập hoặc dán nội dung kịch bản cần tổng hợp giọng nói..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          />

          {/* Sound wave spectrum visualizer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mb-1.5 px-1 font-mono">
              <span>TRẠNG THÁI: {isSynthesizing ? "ĐANG TỔNG HỢP GIỌNG ĐỌC" : isPlaying ? "ĐANG PHÁT AUDIO CHẤT LƯỢNG CAO" : "SẴN SÀNG"}</span>
              <span>FREQUENCY SPECTRUM VISUALIZER</span>
            </div>
            <canvas ref={canvasRef} width={500} height={50} className="w-full h-12 rounded-lg bg-slate-900/40" />
          </div>

          {/* Audio player if output is ready */}
          {audioUrl && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlayAudio}
                  className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-white">Audio Output Sẵn Sàng</h4>
                  <p className="text-[10px] text-indigo-300">Format: MP3 Stereo • 192kbps • Dual Audio Channel Mixed</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="py-2 px-3.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Audio MP3</span>
              </button>
            </div>
          )}

          {/* Progress bar */}
          {isSynthesizing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  {statusText}
                </span>
                <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStartSynthesis}
              disabled={isSynthesizing || !text.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isSynthesizing
                  ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-600/30"
              }`}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tổng hợp Offline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span>Tổng Hợp Audio Local (0đ)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Section: Configuration Parameters & Live Logs */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Controls Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Tham Số & Sắc Thái Lời Nói
            </h2>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Ngôn ngữ tổng hợp (Language Profile)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="vi-VN">Tiếng Việt (Vietnamese - Nam Minh)</option>
                <option value="en-US">English (US - American Guy)</option>
                <option value="en-GB">English (UK - British Sonia)</option>
                <option value="zh-CN">Tiếng Trung (Mandarin Xiaoxiao)</option>
                <option value="ja-JP">Tiếng Nhật (Japanese Nanami)</option>
                <option value="ko-KR">Tiếng Hàn (Korean SunHi)</option>
                <option value="es-ES">Tiếng Tây Ban Nha (Spanish Elvira)</option>
                <option value="fr-FR">Tiếng Pháp (French Denise)</option>
                <option value="th-TH">Tiếng Thái (Thai Premwadee)</option>
              </select>
            </div>

            {/* Speed Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Tốc độ đọc (Speech Speed)</span>
                <span className="font-mono text-indigo-400 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Pitch Height Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Cao độ âm tần (Pitch Key)</span>
                <span className="font-mono text-indigo-400 font-bold">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* BGM Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                Lồng Nhạc Nền (Automatic Synth BGM)
              </label>
              <select
                value={bgm}
                onChange={(e) => setBgm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="none">Không lồng nhạc nền (Chỉ giọng nói)</option>
                <option value="Lo-Fi Deep Focus (Thư giãn)">Lo-Fi Deep Focus (Thư giãn nhẹ nhàng)</option>
                <option value="Cinematic Tension (Kịch tính dồn dập)">Cinematic Tension (Kịch tính dồn dập)</option>
                <option value="Upbeat Tech Vlog (Sôi động)">Upbeat Tech Vlog (Sôi động tích cực)</option>
                <option value="Dark Mystery Suspense (Bí ẩn)">Dark Mystery Suspense (Bí ẩn kịch tính)</option>
              </select>
            </div>

            {/* BGM Volume Ducking Slider */}
            {bgm !== "none" && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300">Âm lượng nhạc nền (BGM Volume)</span>
                  <span className="font-mono text-indigo-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.01"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 italic">Hệ thống tự động kích hoạt bộ giảm âm nhạc nền (Ducking Compressor) khi có giọng nói xen ngang.</p>
              </div>
            )}
          </div>

          {/* Terminal Logs Dashboard */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex-1 min-h-[160px] flex flex-col justify-between">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Terminal Logs & Status
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div
              ref={terminalRef}
              className="p-4 flex-1 font-mono text-[10px] space-y-1.5 text-slate-300 overflow-y-auto max-h-[180px]"
            >
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.startsWith("[error]") ? (
                    <span className="text-rose-400">{log}</span>
                  ) : log.startsWith("[success]") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith("[system]") ? (
                    <span className="text-yellow-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
