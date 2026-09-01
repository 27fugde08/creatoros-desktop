import React from 'react';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progressPercent: number;
  currentStep: string;
  totalItems: number;
  completedItems: number;
  isProcessing: boolean;
  isScanning: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercent,
  currentStep,
  totalItems,
  completedItems,
  isProcessing,
  isScanning,
}) => {
  if (!isProcessing && !isScanning && progressPercent === 0) {
    return null;
  }

  const isCompleted = progressPercent >= 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 shadow-md backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isScanning || isProcessing ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-bold text-slate-200">
            {isScanning ? "Đang quét dữ liệu..." : isProcessing ? "Đang tiến hành tải..." : "Hoàn tất"}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({completedItems}/{totalItems} video)
          </span>
        </div>
        <span className="font-extrabold font-mono text-cyan-400 text-sm">
          {Math.min(100, Math.max(0, Math.round(progressPercent)))}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 animate-pulse"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
        <span className="truncate max-w-[80%]">{currentStep || "Sẵn sàng nhận tác vụ"}</span>
        <span>{isCompleted ? "Hoàn thành 100%" : "Thời gian thực (Real-time)"}</span>
      </div>
    </div>
  );
};
