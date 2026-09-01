import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface TerminalLogProps {
  logs: string[];
  onClear: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-full min-h-[200px]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">System Logs</span>
        </div>
        <button 
          onClick={onClear}
          className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-rose-500"
          title="Xóa log"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div 
        ref={scrollRef}
        className="p-3 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 space-y-1 custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="text-slate-700 italic">Chưa có hoạt động nào...</div>
        ) : (
          logs.map((log, index) => {
            const isError = log.includes('[error]');
            const isSuccess = log.includes('[success]');
            const isInfo = log.includes('[info]');
            const isProcess = log.includes('[process]');

            return (
              <div key={index} className="flex gap-2 group">
                <span className="text-slate-600 select-none opacity-50">{(index + 1).toString().padStart(3, '0')}</span>
                <span className={`
                  ${isError ? 'text-rose-400' : ''}
                  ${isSuccess ? 'text-emerald-400' : ''}
                  ${isInfo ? 'text-cyan-400' : ''}
                  ${isProcess ? 'text-amber-400' : ''}
                  ${!isError && !isSuccess && !isInfo && !isProcess ? 'text-slate-300' : ''}
                `}>
                  {log}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
