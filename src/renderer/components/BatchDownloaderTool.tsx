import React, { Component, ReactNode, ErrorInfo } from "react";
import { 
  Download, 
  Play, 
  X, 
  Trash2, 
  RefreshCw 
} from "lucide-react";
import { useBatchDownloader } from "../hooks/useBatchDownloader";
import { TerminalLog } from "./BatchDownloader/TerminalLog";
import { ControlPanel } from "./BatchDownloader/ControlPanel";
import { QueueTable } from "./BatchDownloader/QueueTable";
import { ProgressBar } from "./BatchDownloader/ProgressBar";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class BatchDownloaderErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[BatchDownloader ErrorBoundary] ❌ Lỗi render:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/40 border border-red-500/50 rounded-xl text-white m-6">
          <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Lỗi render Batch Downloader</h2>
          <pre className="text-sm text-red-200 bg-black/40 p-3 rounded mt-2">{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const BatchDownloaderContent: React.FC = () => {
  const {
    bulkUrls, setBulkUrls,
    isProcessing,
    isScanning,
    progressPercent,
    currentStep,
    completedItems,
    totalItems,
    selectedIds,
    terminalLogs,
    queue,
    cookie, setCookie,
    proxy, setProxy,
    removeWatermark, setRemoveWatermark,
    extractMp3, setExtractMp3,
    handleScanLinks,
    handleStopScanning,
    handleDownloadSelected,
    handleClearQueue,
    toggleSelect,
    selectAll,
    clearLogs
  } = useBatchDownloader();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Download className="w-3 h-3" /> Multi-Platform Engine
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Batch Downloader Pro</h1>
            <p className="text-slate-400 text-xs mt-0.5">Tải video hàng loạt không giới hạn từ TikTok, Douyin, YouTube, Facebook...</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearQueue}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Xóa Hàng Đợi</span>
            </button>
            <button
              onClick={handleDownloadSelected}
              disabled={isProcessing || selectedIds.size === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Đã Chọn ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Danh sách URL (Mỗi dòng 1 link)
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="https://www.tiktok.com/...&#10;https://www.youtube.com/shorts/..."
              className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500/50 outline-none resize-none custom-scrollbar transition-all font-mono"
            />
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                disabled={isScanning || isProcessing}
                onClick={handleScanLinks}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Quét...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Bắt đầu quét</span>
                  </>
                )}
              </button>

              <button
                disabled={!isScanning && !isProcessing}
                onClick={handleStopScanning}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Dừng quét</span>
              </button>
            </div>
          </div>

          <ProgressBar
            progressPercent={progressPercent}
            currentStep={currentStep}
            totalItems={totalItems}
            completedItems={completedItems}
            isProcessing={isProcessing}
            isScanning={isScanning}
          />

          <ControlPanel 
            cookie={cookie} setCookie={setCookie}
            proxy={proxy} setProxy={setProxy}
            removeWatermark={removeWatermark} setRemoveWatermark={setRemoveWatermark}
            extractMp3={extractMp3} setExtractMp3={setExtractMp3}
          />

          <div className="h-48">
            <TerminalLog logs={terminalLogs} onClear={clearLogs} />
          </div>
        </div>

        <div className="lg:col-span-7 h-[650px]">
          <QueueTable 
            queue={queue}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
          />
        </div>
      </div>
    </div>
  );
};

export const BatchDownloaderTool: React.FC = () => (
  <BatchDownloaderErrorBoundary>
    <BatchDownloaderContent />
  </BatchDownloaderErrorBoundary>
);
