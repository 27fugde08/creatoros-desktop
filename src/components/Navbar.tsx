import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Radio,
  Cpu,
  Globe,
  Bell,
  Layers,
  Terminal,
  Activity,
  Flame,
  Volume2,
  ShieldCheck,
  UserCheck,
  ListOrdered,
  RefreshCw,
  Code2,
  KeyRound,
  Download
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useQueue } from "../context/QueueContext";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";

interface HardwareMetrics {
  cpu: number;
  ram: {
    total: number;
    used: number;
    percent: number;
  };
  gpus: Array<{
    name: string;
    vramTotal: number;
    vramUsed: number;
    vramPercent: number;
    utilization: number;
  }>;
  vramAlert?: {
    triggered: boolean;
    gpuName: string;
    percent: number;
    threshold: number;
  } | null;
}

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenLicenseModal?: () => void;
  onOpenOtaModal?: () => void;
  licenseTier?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenLicenseModal,
  onOpenOtaModal,
  licenseTier = "PRO_V48"
}) => {
  const [isLiveSound, setIsLiveSound] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [hwMetrics, setHwMetrics] = useState<HardwareMetrics | null>(null);
  const { stats, toggleQueue, isQueueOpen, backendStatus } = useQueue();

  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && electronAPI.onHardwareMetrics) {
      const unsubscribe = electronAPI.onHardwareMetrics((data: HardwareMetrics) => {
        setHwMetrics(data);
      });
      return () => {
        unsubscribe();
      };
    } else {
      // Browser fallback simulation loop
      const interval = setInterval(() => {
        const simCpu = Math.floor(Math.random() * 15) + 20; // 20-35%
        const simRamPercent = 68;
        const simVramPercent = Math.floor(Math.random() * 10) + 45; // 45-55%
        setHwMetrics({
          cpu: simCpu,
          ram: {
            total: 16,
            used: 10.8,
            percent: simRamPercent
          },
          gpus: [
            {
              name: "NVIDIA GeForce RTX 4070 (Simulated)",
              vramTotal: 12288,
              vramUsed: Math.round(12288 * (simVramPercent / 100)),
              vramPercent: simVramPercent,
              utilization: Math.floor(Math.random() * 25) + 15
            }
          ]
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    setIsLiveSound(!isLiveSound);
    if (!isLiveSound) {
      soundSynth.playSfx("pop");
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 text-slate-100 select-none">
      {/* Brand Identity & Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl mr-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CREATOR<span className="text-indigo-400">OS</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              PRO v5.0
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md">
          <GlobalSearchBar
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            onOpenQueue={toggleQueue}
            onOpenOtaModal={onOpenOtaModal}
            onOpenLicenseModal={onOpenLicenseModal}
            onToggleSound={toggleSound}
          />
        </div>
      </div>

      {/* Center Status Badges */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Python Core WebSocket Real-time Connection Health Badge */}
        <ConnectionStatusBadge wsUrl="ws://127.0.0.1:8765" />

        {/* Real-time Hardware telemetry (CPU) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-xs font-medium text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>CPU: {hwMetrics?.cpu || 0}%</span>
        </div>

        {/* Real-time Hardware telemetry (RAM) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-xs font-medium text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>RAM: {hwMetrics?.ram?.percent || 0}%</span>
        </div>

        {/* Real-time Hardware telemetry (GPU / VRAM) */}
        {hwMetrics?.gpus && hwMetrics.gpus.map((gpu, idx) => {
          const isAlert = gpu.vramPercent >= 92 || hwMetrics?.vramAlert?.triggered;
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isAlert 
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse" 
                  : "bg-slate-800/80 border-slate-700/80 text-slate-300"
              }`}
              title={`${gpu.name}: ${gpu.vramUsed}MB / ${gpu.vramTotal}MB (${gpu.utilization}% Load)`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAlert ? "text-rose-400 animate-bounce" : "text-amber-400"}`} />
              <span>VRAM: {gpu.vramPercent}%</span>
              {isAlert && <span className="text-[9px] px-1 py-0.2 rounded bg-rose-600 text-white font-extrabold uppercase ml-1 animate-pulse">OVERLOAD</span>}
            </div>
          );
        })}

        {/* Global Task Queue Status Quick Badge */}
        <button
          id="btn-queue-header-status"
          onClick={toggleQueue}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer ${
            stats.processing > 0
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30"
              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
          title="Xem hàng đợi tác vụ nền"
        >
          {stats.processing > 0 ? (
            <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
          ) : (
            <ListOrdered className="w-3 h-3 text-slate-400" />
          )}
          <span className="text-xs font-medium">
            Hàng đợi: <strong className={stats.processing > 0 ? "text-indigo-300" : "text-slate-300"}>{stats.processing} đang chạy</strong>
          </span>
        </button>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Global Queue Drawer Button */}
        <button
          id="btn-open-global-queue"
          onClick={toggleQueue}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isQueueOpen || stats.processing > 0
              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
          title="Mở Hàng Đợi Xử Lý Tác Vụ Toàn Cục"
        >
          <ListOrdered className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Hàng Đợi ({stats.total})</span>
          {stats.processing > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
        </button>

        {/* SFX Toggle */}
        <button
          id="btn-toggle-sfx"
          onClick={toggleSound}
          title={isLiveSound ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
          className={`p-2 rounded-lg border transition-all ${
            isLiveSound
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* REST API Quick Switch */}
        <button
          id="btn-nav-api-docs"
          onClick={() => {
            soundSynth.playSfx("pop");
            onSelectTab("api-docs");
          }}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeTab === "api-docs"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
              : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>REST API</span>
        </button>

        {/* Dashboard Quick Switch */}
        <button
          id="btn-nav-dashboard"
          onClick={() => {
            soundSynth.playSfx("pop");
            onSelectTab("dashboard");
          }}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeTab === "dashboard"
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
              : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Internal Dash</span>
        </button>

        {/* OTA Update Checker Badge */}
        {onOpenOtaModal && (
          <button
            id="btn-nav-ota-update"
            onClick={onOpenOtaModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all shadow-sm"
            title="Kiểm tra bản cập nhật OTA v4.8.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">OTA v4.8.5</span>
          </button>
        )}

        {/* License DRM Trigger Badge */}
        {onOpenLicenseModal && (
          <button
            id="btn-nav-license-drm"
            onClick={onOpenLicenseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm"
            title="Quản lý bản quyền & Hardware Fingerprint"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{licenseTier || "PRO v4.8"}</span>
          </button>
        )}

        {/* User Account / Membership */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-3 sm:pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Enterprise Member</p>
            <p className="text-xs font-semibold text-slate-200">Alpha User</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-inner">
            AO
          </div>
        </div>
      </div>
    </header>
  );
};
