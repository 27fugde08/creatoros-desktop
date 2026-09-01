import React, { useState, useEffect } from "react";
import { LipSyncEngineInfo, LipSyncProcessResult } from "../../shared/types";
import { 
  Sparkles, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Music, 
  Video, 
  Gauge, 
  ShieldCheck, 
  Zap, 
  Sliders,
  Volume2
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function LipSyncStudioTool() {
  const { addToast } = useToast();
  const [engineInfo, setEngineInfo] = useState<LipSyncEngineInfo | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("CUDAExecutionProvider");
  const [sourceVideo, setSourceVideo] = useState("avatar_presenter_short.mp4");
  const [sourceAudio, setSourceAudio] = useState("voice_clone_namminh_vietnam.wav");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<LipSyncProcessResult | null>(null);
  const [faceCropEnhance, setFaceCropEnhance] = useState(true);
  const [mouthSmoothFactor, setMouthSmoothFactor] = useState(0.92);

  useEffect(() => {
    fetchEngineInfo();
  }, []);

  const fetchEngineInfo = async () => {
    try {
      const res = await fetch("/api/lipsync/info");
      const json = await res.json();
      if (json.success && json.data) {
        setEngineInfo(json.data);
      }
    } catch (e) {
      console.warn("Could not fetch LipSync info", e);
    }
  };

  const handleRunLipSync = async () => {
    setIsProcessing(true);
    setProcessResult(null);

    addToast("info", `Đang trích xuất Face Landmarks & đồng bộ khẩu hình qua ${selectedProvider}...`);

    try {
      const res = await fetch("/api/lipsync/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_path: sourceVideo,
          audio_path: sourceAudio,
          provider: selectedProvider,
          duration_sec: 15.0
        })
      });
      const json = await res.json();

      setTimeout(() => {
        setIsProcessing(false);
        if (json.success && json.data) {
          setProcessResult(json.data);
          addToast("success", `Đồng bộ khẩu hình hoàn tất! ${json.data.metrics.inference_fps} FPS, độ tự nhiên ${Math.round(json.data.metrics.sync_confidence_score * 100)}%.`);
        }
      }, 1200);
    } catch (e) {
      setIsProcessing(false);
      addToast("error", "Không thể xử lý Lip-Sync cục bộ.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F172A] text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> CREATOROS v5.0 Next-Gen
            </span>
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-500/30">
              ONNX Runtime & TensorRT INT8
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-400" />
            Studio Đồng Bộ Khẩu Hình Miệng Cục Bộ (Local AI Lip-Sync)
          </h1>
          <p className="text-sm text-slate-400">
            Tự động căn chỉnh và tái tạo chuyển động khớp môi theo âm thanh lồng tiếng Local TTS bằng mô hình Wav2Lip ONNX tăng tốc GPU NVIDIA.
          </p>
        </div>
      </div>

      {/* Hardware Profile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Mô Hình ONNX</div>
            <div className="text-sm font-bold text-white truncate max-w-[170px]">
              {engineInfo?.model_name || "Wav2Lip-HQ-TensorRT"}
            </div>
            <div className="text-xs text-emerald-400">Độ phân giải ROI 96x96</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tăng Tốc Phần Cứng</div>
            <div className="text-sm font-bold text-cyan-300">TensorRT + CUDA EP</div>
            <div className="text-xs text-slate-400">Tốc độ ~68.5 FPS (2x Real-time)</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Landmark Tracking</div>
            <div className="text-sm font-bold text-amber-300">68 Điểm Khuôn Mặt</div>
            <div className="text-xs text-slate-400">Khử rung lắc khung hình môi</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bảo Mật Quyền Riêng Tư</div>
            <div className="text-sm font-bold text-emerald-300">Offline On-Premise</div>
            <div className="text-xs text-slate-400">Không gửi video nhân vật lên mây</div>
          </div>
        </div>
      </div>

      {/* Main Studio Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Thiết Lập Pipeline Lip-Sync
            </h2>

            {/* Execution Provider Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hardware Execution Provider (ONNX)
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="TensorrtExecutionProvider">TensorRT FP16/INT8 (NVIDIA GPU - Siêu Nhanh ~68 FPS)</option>
                <option value="CUDAExecutionProvider">CUDA Direct Execution Provider (~45 FPS)</option>
                <option value="CPUExecutionProvider">CPU Fallback (Mọi dòng máy ~12 FPS)</option>
              </select>
            </div>

            {/* Video Input Source */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                Video Nguồn Khuôn Mặt (Source Video)
              </label>
              <input
                type="text"
                value={sourceVideo}
                onChange={(e) => setSourceVideo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="avatar_source.mp4"
              />
            </div>

            {/* Audio Voice Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                File Âm Thanh Lồng Tiếng TTS (Audio Track)
              </label>
              <input
                type="text"
                value={sourceAudio}
                onChange={(e) => setSourceAudio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="voice_vietnam_tts.wav"
              />
            </div>

            {/* Smoothing & Feathering */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Làm Mịn Biên Khớp Môi (Feathering)</span>
                <input
                  type="checkbox"
                  checked={faceCropEnhance}
                  onChange={(e) => setFaceCropEnhance(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Hệ số mượt mà (Smoothing):</span>
                  <span className="font-mono text-indigo-400 font-semibold">{mouthSmoothFactor}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.02"
                  value={mouthSmoothFactor}
                  onChange={(e) => setMouthSmoothFactor(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunLipSync}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <Play className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Đang Đồng Bộ Khẩu Hình ONNX..." : "Khởi Chạy Đồng Bộ Khẩu Hình (Run Lip-Sync)"}
            </button>
          </div>
        </div>

        {/* Right Preview & Landmark Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" />
                Mô Phỏng Nhận Diện 68 Face Landmarks & Mel Spectrogram
              </span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                30.0 FPS Sync
              </span>
            </h2>

            {/* Visual Landmark Overlay Box */}
            <div className="relative aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Simulated Face Geometry Grid */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="w-44 h-56 rounded-full border border-dashed border-indigo-400 flex flex-col items-center justify-center relative">
                  {/* Eye markers */}
                  <div className="flex gap-12 mb-8">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
                  </div>
                  {/* Nose point */}
                  <span className="w-2 h-2 rounded-full bg-indigo-400 mb-6"></span>
                  {/* Mouth Landmark Ring */}
                  <div className={`w-16 h-8 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center transition-all ${
                    isProcessing ? "scale-125 animate-pulse" : "scale-100"
                  }`}>
                    <span className="text-[9px] font-mono text-emerald-300 font-bold">LIP ROI</span>
                  </div>
                </div>
              </div>

              {/* Status Overlay */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Face Detection: <strong className="text-white">68 Landmarks Locked</strong></span>
                </div>
                <div className="text-slate-400 font-mono">
                  Audio Spectral Bands: <strong className="text-cyan-300">80 Mels</strong>
                </div>
              </div>
            </div>

            {/* Process Results Card */}
            {processResult && (
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Đồng Bộ Khẩu Hình Thành Công
                  </div>
                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Confidence: {Math.round(processResult.metrics.sync_confidence_score * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400">Tốc độ xử lý:</div>
                    <div className="font-bold text-white font-mono">{processResult.metrics.inference_fps} FPS</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Tổng frames:</div>
                    <div className="font-bold text-white font-mono">{processResult.metrics.total_frames_processed} frames</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Thời gian thực thi:</div>
                    <div className="font-bold text-cyan-300 font-mono">{processResult.metrics.total_execution_time_sec}s</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Đỉnh VRAM GPU:</div>
                    <div className="font-bold text-amber-300 font-mono">{processResult.metrics.vram_peak_mb} MB</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-mono bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                  <span>File Output: {processResult.output_video}</span>
                  <span className="text-emerald-400 font-semibold">2K NVENC Ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
