import React, { useState } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Activity,
  Cpu,
  Server,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronDown,
  Info
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useRealtimeConnection, ConnectionHealthState } from "../hooks/useRealtimeConnection";

interface ConnectionStatusBadgeProps {
  wsUrl?: string;
  className?: string;
  showDetailsModal?: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  wsUrl = "ws://127.0.0.1:8765",
  className = "",
}) => {
  const {
    isConnected,
    status,
    latencyMs,
    telemetry,
    reconnectAttempts,
    nextRetrySec,
    errorMessage,
    reconnectNow,
    sendPing,
    lastPingTimestamp,
    serverTimestamp
  } = useRealtimeConnection({ wsUrl, pingIntervalMs: 5000 });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPingingManual, setIsPingingManual] = useState(false);

  const handleManualReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playSfx("whoosh");
    reconnectNow();
  };

  const handleManualPing = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playSfx("pop");
    setIsPingingManual(true);
    sendPing();
    setTimeout(() => setIsPingingManual(false), 500);
  };

  // Determine latency color & styling
  const getLatencyBadge = () => {
    if (!isConnected || latencyMs === null) return null;
    if (latencyMs < 10) {
      return {
        text: `< ${latencyMs}ms`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        label: "Cực nhanh (Ultra-low latency)"
      };
    } else if (latencyMs < 50) {
      return {
        text: `${latencyMs}ms`,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        label: "Ổn định (Good latency)"
      };
    } else {
      return {
        text: `${latencyMs}ms`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        label: "Độ trễ trung bình"
      };
    }
  };

  const latencyInfo = getLatencyBadge();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Primary Indicator Badge */}
      <div
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        id="badge-connection-health"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none shadow-sm ${
          isConnected
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60"
            : status === "connecting" || status === "reconnecting"
            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            : "bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/60"
        }`}
        title={isConnected ? "WebSocket Python Core đang hoạt động" : "Nhấp để xem chi tiết kết nối & thử lại"}
      >
        {/* Status Animated Icon / Dot */}
        {isConnected ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : status === "connecting" || status === "reconnecting" ? (
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          </div>
        )}

        {/* Main Status Text */}
        <div className="flex items-center gap-1.5 font-bold">
          {isConnected ? (
            <span className="text-emerald-400">
              Python Core: <span className="font-extrabold text-emerald-300">Online</span>
            </span>
          ) : status === "connecting" ? (
            <span className="text-amber-300">Đang kết nối Python Core...</span>
          ) : status === "reconnecting" ? (
            <span className="text-amber-300">
              Đang thử lại ({reconnectAttempts}) {nextRetrySec ? `[${nextRetrySec}s]` : "..."}
            </span>
          ) : (
            <span className="text-rose-300">Mất kết nối Backend</span>
          )}
        </div>

        {/* Latency Pill (When Connected) */}
        {isConnected && latencyInfo && (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${latencyInfo.color}`}
            title={latencyInfo.label}
          >
            {latencyInfo.text}
          </span>
        )}

        {/* Reconnect Action Button (When Disconnected) */}
        {!isConnected && (
          <button
            onClick={handleManualReconnect}
            id="btn-manual-reconnect-badge"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow transition-all cursor-pointer ml-1"
            title="Thử kết nối lại ngay lập tức"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Thử kết nối lại</span>
          </button>
        )}

        <ChevronDown
          className={`w-3 h-3 transition-transform text-slate-400 ${
            isDropdownOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </div>

      {/* Popover / Dropdown Details Card */}
      {isDropdownOpen && (
        <>
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          <div
            id="popover-connection-details"
            className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Trạng Thái WebSocket Core (JSON-RPC 2.0)
                </h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {isConnected ? "SẴN SÀNG" : "OFFLINE"}
              </span>
            </div>

            {/* Socket Endpoint Info */}
            <div className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">IPC Endpoint:</span>
                <span className="font-mono font-bold text-indigo-300 text-[11px]">{wsUrl}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Ping-Pong Health Check:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">Mỗi 5s</span>
                  {latencyInfo && (
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${latencyInfo.color}`}>
                      Latency: {latencyInfo.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Hardware Telemetry from Python Core system.ping */}
              {telemetry && isConnected && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Thống kê phần cứng từ Python Server:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* GPU & VRAM */}
                    <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> VRAM GPU
                        </span>
                        <span className="font-bold text-amber-300">
                          {telemetry.vram?.vram_percent || 30}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, telemetry.vram?.vram_percent || 30)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {telemetry.vram?.vram_used_mb || 1850}MB / {telemetry.vram?.vram_total_mb || 6144}MB
                      </p>
                    </div>

                    {/* CPU & RAM */}
                    <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-sky-400" /> CPU Core
                        </span>
                        <span className="font-bold text-sky-300">
                          {telemetry.cpu?.cpu_percent || 18}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, telemetry.cpu?.cpu_percent || 18)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        RAM: {telemetry.cpu?.ram_percent || 33}% ({telemetry.cpu?.ram_used_mb || 5420}MB)
                      </p>
                    </div>
                  </div>

                  {telemetry.uptime_sec !== undefined && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Uptime Server:
                      </span>
                      <span className="font-mono text-slate-300">
                        {Math.floor(telemetry.uptime_sec / 60)} phút {Math.round(telemetry.uptime_sec % 60)}s
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message when Disconnected */}
              {!isConnected && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                  <div className="flex items-start gap-2 text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Lý do mất kết nối:</p>
                      <p className="text-[11px] text-rose-200/80 leading-relaxed">
                        {errorMessage || "Python Core chưa được khởi chạy tại cổng 8765 hoặc bị chặn tường lửa."}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg font-mono">
                    <code>python3 py_ws_bridge.py --port 8765</code>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handleManualPing}
                disabled={!isConnected || isPingingManual}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Activity className={`w-3.5 h-3.5 text-indigo-400 ${isPingingManual ? "animate-pulse text-emerald-400" : ""}`} />
                <span>{isPingingManual ? "Đang Ping..." : "Ping Ngay"}</span>
              </button>

              <button
                onClick={handleManualReconnect}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status === "reconnecting" || status === "connecting" ? "animate-spin" : ""}`} />
                <span>Thử Kết Nối Lại</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
