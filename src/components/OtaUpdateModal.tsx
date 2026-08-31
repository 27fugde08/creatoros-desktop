import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Zap,
  HardDrive,
  X,
  FileCheck2,
  ArrowUpRight
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useToast } from "../context/ToastContext";
import { OtaUpdateMetadata, OtaDownloadProgress } from "../types";

interface OtaUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OtaUpdateModal: React.FC<OtaUpdateModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [updateInfo, setUpdateInfo] = useState<OtaUpdateMetadata | null>(null);
  const [progressState, setProgressState] = useState<OtaDownloadProgress>({
    status: "IDLE",
    percent: 0,
    speed_mbps: 0,
    downloaded_mb: 0,
    total_mb: 42.8,
    eta_seconds: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchUpdateMetadata();
    }
  }, [isOpen]);

  const fetchUpdateMetadata = async () => {
    try {
      const res = await fetch("/api/ota/check");
      const json = await res.json();
      if (json.success) {
        setUpdateInfo(json.data);
      }
    } catch (e) {
      console.warn("Could not check OTA updates", e);
    }
  };

  const handleStartDownload = async () => {
    try {
      soundSynth.playPop();
      setProgressState(prev => ({ ...prev, status: "DOWNLOADING", percent: 5 }));
      await fetch("/api/ota/download", { method: "POST" });
      
      // Simulate real-time progress update polling
      const timer = setInterval(async () => {
        try {
          const res = await fetch("/api/ota/status");
          const json = await res.json();
          if (json.success && json.data) {
            setProgressState(json.data);
            if (json.data.status === "READY_TO_RESTART") {
              clearInterval(timer);
              soundSynth.playSuccess();
              addToast("success", "Bản cập nhật v4.8.5 đã tải xong và xác thực SHA256 hợp lệ!");
            }
          }
        } catch (e) {
          clearInterval(timer);
        }
      }, 300);
    } catch (e) {
      addToast("error", "Lỗi tải bản cập nhật OTA");
    }
  };

  const handleApplyUpdate = async () => {
    try {
      soundSynth.playSuccess();
      await fetch("/api/ota/apply", { method: "POST" });
      addToast("info", "Ứng dụng đang khởi động lại...");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (e) {
      addToast("error", "Lỗi khởi động lại ứng dụng");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Trung Tâm Cập Nhật Phần Mềm OTA
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                  Secure Patch
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động kiểm tra bản phát hành mới, tải tệp phân đoạn và kiểm tra mã băm SHA256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Version Comparative Banner */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Phiên Bản Hiện Tại</span>
              <div className="text-sm font-bold text-slate-200">
                {updateInfo?.current_version || "4.8.0-Enterprise"}
              </div>
            </div>

            <div className="p-2 rounded-full bg-slate-800 text-indigo-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>

            <div className="space-y-1 text-right">
              <span className="text-xs text-slate-400">Phiên Bản Mới Nhất</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                <Sparkles className="w-4 h-4" />
                {updateInfo?.latest_version || "4.8.5-Commercial"}
              </div>
            </div>
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              NHẬT KÝ THAY ĐỔI (RELEASE NOTES v4.8.5)
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs text-slate-300">
              {(updateInfo?.release_notes || [
                "Tích hợp Visual Workflow Builder kéo thả Canvas & DAG Topological Compiler.",
                "Bổ sung hệ thống DRM Hardware Fingerprinting & Offline License Activation.",
                "Nâng cấp bộ lọc No-Strike FFmpeg NVENC 4:5 Facebook Reels tối ưu độ nét 2K.",
                "Hỗ trợ Blueprint & Preset Manager xuất nhập file .creatoros chuẩn mã hóa."
              ]).map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download Progress Bar if Downloading / Ready */}
          {progressState.status !== "IDLE" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-2">
                  {progressState.status === "DOWNLOADING" && <Download className="w-4 h-4 text-cyan-400 animate-bounce" />}
                  {progressState.status === "VERIFYING_SHA256" && <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />}
                  {progressState.status === "READY_TO_RESTART" && <FileCheck2 className="w-4 h-4 text-emerald-400" />}
                  
                  {progressState.status === "DOWNLOADING" && "Đang tải tệp cài đặt CREATOROS-Setup-4.8.5.exe..."}
                  {progressState.status === "VERIFYING_SHA256" && "Đang xác thực mã băm an toàn SHA-256..."}
                  {progressState.status === "READY_TO_RESTART" && "Đã hoàn tất tải và xác thực toàn vẹn gói cập nhật!"}
                </span>
                <span className="font-mono text-cyan-300 font-bold">{progressState.percent}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressState.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{progressState.downloaded_mb} MB / {progressState.total_mb} MB</span>
                <span>Tốc độ: {progressState.speed_mbps} MB/s</span>
                <span>Còn lại: {progressState.eta_seconds}s</span>
              </div>
            </div>
          )}

          {/* Security SHA256 Details */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chữ Ký SHA256:</span>
            </div>
            <span className="font-mono text-slate-300 text-[10px] select-all">
              {updateInfo?.sha256_checksum || "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Để sau
          </button>

          {progressState.status === "READY_TO_RESTART" ? (
            <button
              onClick={handleApplyUpdate}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Khởi Động Lại & Cài Đặt Ngay
            </button>
          ) : (
            <button
              onClick={handleStartDownload}
              disabled={progressState.status === "DOWNLOADING" || progressState.status === "VERIFYING_SHA256"}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {progressState.status === "DOWNLOADING" ? "Đang Tải Xuống..." : "Tải Xuống Bản Cập Nhật (42.8 MB)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
