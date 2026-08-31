import React, { useState, useEffect } from "react";
import { Activity, Server, RefreshCw, Cpu, HardDrive, BarChart3, TrendingUp, Zap, Flame, Thermometer } from "lucide-react";
import { getApiUrl } from "../utils/apiClient";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export interface SystemHealthData {
  status: string;
  version?: string;
  uptime?: number;
  geminiConnected?: boolean;
  activeWorkers?: number;
}

const completionData = [
  { day: "T2", rate: 85, tasks: 120 },
  { day: "T3", rate: 88, tasks: 135 },
  { day: "T4", rate: 92, tasks: 150 },
  { day: "T5", rate: 90, tasks: 142 },
  { day: "T6", rate: 95, tasks: 180 },
  { day: "T7", rate: 97, tasks: 210 },
  { day: "CN", rate: 96, tasks: 195 },
];

const toolUsageData = [
  { name: "Tải Video", usage: 450 },
  { name: "AI TTS", usage: 320 },
  { name: "Kịch Bản", usage: 280 },
  { name: "Dịch Thuật", usage: 210 },
  { name: "SEO Meta", usage: 150 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-white text-xs font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-[11px]" style={{ color: entry.color }}>
            {entry.name === "rate" ? "Tỷ lệ hoàn thành: " : "Số tác vụ: "}
            {entry.value}
            {entry.name === "rate" ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardWidget: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [gpuStats, setGpuStats] = useState<any>(null);
  const [gpuTempHistory, setGpuTempHistory] = useState<{ time: string; temp: number }[]>([]);

  const checkHealth = async () => {
    const startTime = performance.now();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/health"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));

      if (res.ok) {
        const data = await res.json().catch(() => ({ status: "ok" }));
        setIsHealthy(true);
        setHealthData(data);
      } else {
        setIsHealthy(false);
      }
    } catch (error) {
      console.warn("Health check connection error:", error);
      setIsHealthy(false);
    } finally {
      setLoading(false);
      setLastChecked(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    const socketURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const socket = io(socketURL);

    const handleGpuStats = (stats: any) => {
      setGpuStats(stats);
      setGpuTempHistory(prev => {
        const timeStr = new Date().toLocaleTimeString("vi-VN", { minute: "2-digit", second: "2-digit" });
        const newHistory = [...prev, { time: timeStr, temp: stats.temp || 0 }];
        return newHistory.length > 20 ? newHistory.slice(newHistory.length - 20) : newHistory;
      });
    };

    socket.on('gpu_stats', handleGpuStats);

    return () => {
      clearInterval(interval);
      socket.off('gpu_stats', handleGpuStats);
      socket.disconnect();
    };
  }, []);

  const memoizedCompletionData = React.useMemo(() => completionData, []);
  
  if (loading && isHealthy === null) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Skeleton System Health */}
        <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-5 h-48 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-800/80 rounded"></div>
                <div className="w-24 h-3 bg-slate-800/80 rounded"></div>
              </div>
            </div>
            <div className="w-24 h-6 bg-slate-800/80 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="w-full h-12 bg-slate-800/80 rounded-lg"></div>
            <div className="w-full h-12 bg-slate-800/80 rounded-lg"></div>
          </div>
        </div>

        {/* Skeleton GPU Monitor */}
        <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-5 h-64">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80"></div>
              <div className="space-y-2">
                <div className="w-40 h-4 bg-slate-800/80 rounded"></div>
                <div className="w-32 h-3 bg-slate-800/80 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
               <div className="w-full h-16 bg-slate-800/80 rounded-lg"></div>
               <div className="w-full h-16 bg-slate-800/80 rounded-lg"></div>
               <div className="w-full h-16 bg-slate-800/80 rounded-lg"></div>
               <div className="w-full h-16 bg-slate-800/80 rounded-lg"></div>
            </div>
            <div className="w-full h-24 bg-slate-800/80 rounded-lg mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Health */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-slate-700">
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`} />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800/90 text-indigo-400 border border-slate-700/50 shadow-inner">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Hệ Thống Backend</h3>
              <p className="text-[11px] text-slate-400">Node.js / Express Core</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span>ONLINE (HEALTHY)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold shadow-sm animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 animate-ping" />
                <span>OFFLINE / LỖI</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Độ Trễ (Latency)</span>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm font-bold text-white">{latency !== null ? `${latency}ms` : "---"}</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Trạng Thái AI</span>
            <div className="flex items-center gap-1 mt-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Gemini Pro</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Worker Đa Luồng</span>
            <div className="flex items-center gap-1 mt-1">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold text-white">{healthData?.activeWorkers || 8} Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Lần quét cuối: {lastChecked || "Đang cập nhật..."}</span>
          </div>
          <button onClick={checkHealth} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium border border-slate-700/60">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Kiểm tra ngay</span>
          </button>
        </div>
      </div>

      {/* GPU Worker Monitoring */}
      {gpuStats && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${gpuStats.gpu > 80 ? "bg-amber-500" : "bg-emerald-500"}`} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800/90 text-amber-400 border border-slate-700/50 shadow-inner">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {gpuStats.available ? "NVIDIA GTX 1660 Super" : "NVIDIA GPU (Simulated)"}
                </h3>
                <p className="text-[11px] text-slate-400">Worker Node • Tăng tốc phần cứng CUDA (NVENC)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
              <span>FFmpeg Worker ONLINE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* GPU Core */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> GPU Core
                </span>
                <span className="text-xs font-bold text-amber-300">{gpuStats.gpu}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300" style={{ width: `${gpuStats.gpu}%` }} />
              </div>
            </div>

            {/* VRAM Usage */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> VRAM Util
                </span>
                <span className="text-xs font-bold text-indigo-300">{gpuStats.memUtil}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${gpuStats.memUtil}%` }} />
              </div>
            </div>

            {/* VRAM Amount */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Bộ nhớ VRAM</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-white">{gpuStats.memUsed} MB</span>
                <span className="text-[10px] text-slate-500">/ {gpuStats.memTotal} MB</span>
              </div>
            </div>

            {/* Temp */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Nhiệt độ
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-sm font-bold ${gpuStats.temp > 80 ? 'text-rose-500' : gpuStats.temp > 70 ? 'text-amber-500' : 'text-emerald-400'}`}>
                  {gpuStats.temp}°C
                </span>
              </div>
            </div>
          </div>

          {/* Thermal Chart */}
          <div className="mt-5 bg-slate-950/50 rounded-xl p-4 border border-slate-800/60 relative">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Biểu đồ nhiệt độ thời gian thực
              </h4>
              {gpuStats.temp > 80 && (
                <span className="animate-pulse px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded border border-rose-500/30 shadow-lg shadow-rose-500/20 z-10">
                  CẢNH BÁO QUÁ NHIỆT
                </span>
              )}
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gpuTempHistory} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gpuStats.temp > 80 ? "#f43f5e" : "#10b981"} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={gpuStats.temp > 80 ? "#f43f5e" : "#10b981"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[30, 100]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "11px", color: "#f8fafc" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke={gpuStats.temp > 80 ? "#f43f5e" : "#10b981"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Completion Rate (Area Chart) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tỷ Lệ Hoàn Thành Tác Vụ</h3>
              <p className="text-[11px] text-slate-400">Hiệu suất xử lý 7 ngày qua</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tool Usage Stats (Bar Chart) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Thống Kê Sử Dụng Công Cụ</h3>
              <p className="text-[11px] text-slate-400">Số lượng tác vụ đã thực thi</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                <Bar dataKey="usage" fill="#34d399" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
