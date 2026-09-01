import React from 'react';
import { DownloadQueueItem } from '../../../shared/types';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Play
} from 'lucide-react';

interface QueueTableProps {
  queue: DownloadQueueItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  queue,
  selectedIds,
  onToggleSelect,
  onSelectAll
}) => {
  const isAllSelected = queue.length > 0 && selectedIds.size === queue.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 w-10">
                <button 
                  onClick={onSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isAllSelected ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-950 border-slate-700'
                  }`}
                >
                  {isAllSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                </button>
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Video / Tiêu đề</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nền tảng</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {queue.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-600 italic text-sm">
                  Chưa có liên kết nào được quét. Hãy dán link và bắt đầu quét!
                </td>
              </tr>
            ) : (
              queue.map((item) => (
                <tr key={item.id} className={`group hover:bg-slate-800/30 transition-colors ${selectedIds.has(item.id) ? 'bg-cyan-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => onToggleSelect(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        selectedIds.has(item.id) ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      {selectedIds.has(item.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded bg-slate-950 border border-slate-800 flex-shrink-0 overflow-hidden relative group-hover:border-slate-700 transition-colors">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <Play className="w-3 h-3 text-slate-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-300 truncate" title={item.title}>
                          {item.title || "Không có tiêu đề"}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate mt-0.5">{item.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      {item.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {item.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin" />}
                      {item.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      {item.status === 'pending' && <Clock className="w-3.5 h-3.5 text-slate-600" />}
                      <span className={`text-[10px] font-bold uppercase ${
                        item.status === 'completed' ? 'text-emerald-500' : 
                        item.status === 'processing' ? 'text-cyan-500' :
                        item.status === 'failed' ? 'text-rose-500' : 'text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
