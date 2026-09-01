import React from 'react';
import { ShieldCheck, Globe, Zap, Settings2 } from 'lucide-react';

interface ControlPanelProps {
  cookie: string;
  setCookie: (val: string) => void;
  proxy: string;
  setProxy: (val: string) => void;
  removeWatermark: boolean;
  setRemoveWatermark: (val: boolean) => void;
  extractMp3: boolean;
  setExtractMp3: (val: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  cookie, setCookie,
  proxy, setProxy,
  removeWatermark, setRemoveWatermark,
  extractMp3, setExtractMp3
}) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold text-slate-300 uppercase">Cấu hình nâng cao</h3>
      </div>

      <div className="space-y-3">
        {/* Cookie Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase ml-1">
            <ShieldCheck className="w-3 h-3" /> Cookie (Tùy chọn)
          </label>
          <input
            type="text"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Dán cookie để tải video riêng tư/hạn chế..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500/50 outline-none transition-all"
          />
        </div>

        {/* Proxy Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase ml-1">
            <Globe className="w-3 h-3" /> Proxy (HTTP/SOCKS5)
          </label>
          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="ip:port:user:pass hoặc direct"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500/50 outline-none transition-all"
          />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => setRemoveWatermark(!removeWatermark)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
              removeWatermark 
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-tight">Xóa Watermark</span>
            <Zap className={`w-3 h-3 ${removeWatermark ? 'fill-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setExtractMp3(!extractMp3)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
              extractMp3 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-tight">Trích xuất MP3</span>
            <div className={`w-1.5 h-1.5 rounded-full ${extractMp3 ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
