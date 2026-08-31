import React, { useEffect } from "react";
import { Flame } from "lucide-react";

interface RenderProgressWidgetProps {
  isRendering: boolean;
  renderProgress: number;
  mockGpuStats: {
    gpu: number;
    memUtil: number;
    memUsed: number;
    temp: number;
  };
}

export const RenderProgressWidget: React.FC<RenderProgressWidgetProps> = React.memo(({ isRendering, renderProgress, mockGpuStats }) => {
  if (!isRendering) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 mt-4">
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${mockGpuStats.temp > 80 ? "bg-amber-500" : "bg-emerald-500"}`} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/90 text-amber-400 border border-slate-700/50 shadow-inner">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              NVIDIA GTX 1660 Super
            </h3>
            <p className="text-[11px] text-slate-400">Đang Render (CUDA / NVENC)...</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span>{renderProgress}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-300 ease-linear" 
          style={{ width: `${renderProgress}%` }} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
             GPU Core
          </span>
          <span className="text-sm font-bold text-amber-300 mt-1">{mockGpuStats.gpu}%</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
             VRAM Util
          </span>
          <span className="text-sm font-bold text-indigo-300 mt-1">{mockGpuStats.memUtil}%</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Bộ nhớ VRAM</span>
          <span className="text-sm font-bold text-white mt-1">{mockGpuStats.memUsed} MB <span className="text-[10px] text-slate-500 font-normal">/ 6144 MB</span></span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
             Nhiệt độ
          </span>
          <span className={`text-sm font-bold mt-1 ${mockGpuStats.temp > 80 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {mockGpuStats.temp}°C
          </span>
        </div>
      </div>
    </div>
  );
});
