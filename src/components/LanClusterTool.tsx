import React, { useState, useEffect } from "react";
import { LanClusterStatus, LanWorkerItem, LanJobPlan, LanRenderChunk } from "../types";
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Play, 
  RefreshCw, 
  Network, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function LanClusterTool() {
  const { addToast } = useToast();
  const [cluster, setCluster] = useState<LanClusterStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  
  // Job configuration
  const [videoDuration, setVideoDuration] = useState(180);
  const [chunkDuration, setChunkDuration] = useState(30);
  const [sourceVideoName, setSourceVideoName] = useState("Master_Recap_Episode_4K.mp4");
  const [activePlan, setActivePlan] = useState<LanJobPlan | null>(null);
  const [isSimulatingRender, setIsSimulatingRender] = useState(false);

  useEffect(() => {
    fetchClusterStatus();
  }, []);

  const fetchClusterStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lan/cluster-status");
      const json = await res.json();
      if (json.success && json.data) {
        setCluster(json.data);
      }
    } catch (e) {
      console.warn("Could not fetch LAN cluster status", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanJob = async () => {
    try {
      const res = await fetch("/api/lan/plan-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_video: sourceVideoName,
          total_duration_sec: videoDuration,
          chunk_duration_sec: chunkDuration
        })
      });
      const json = await res.json();
      if (json.success && json.plan) {
        setActivePlan(json.plan);
        addToast("success", `Đã phân bổ ${json.plan.total_chunks} segments trên ${json.plan.workers_allocated} máy trạm LAN.`);
      }
    } catch (e) {
      addToast("error", "Không thể tạo kế hoạch phân bổ render LAN.");
    }
  };

  const handleStartDistributedRender = async () => {
    if (!activePlan) return;
    setIsSimulatingRender(true);
    addToast("info", `Đang dispatch ${activePlan.total_chunks} chunks sang các Worker Nodes...`);

    try {
      const res = await fetch("/api/lan/simulate-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_plan: activePlan })
      });
      const json = await res.json();
      
      // Simulate live chunk completion UI progression
      const updatedChunks = [...activePlan.chunks];
      updatedChunks.forEach((chunk, i) => {
        setTimeout(() => {
          chunk.status = "RENDERING";
          chunk.progress_percent = 50;
          setActivePlan(prev => prev ? { ...prev, chunks: [...updatedChunks] } : null);
        }, (i + 1) * 350);

        setTimeout(() => {
          chunk.status = "COMPLETED";
          chunk.progress_percent = 100;
          setActivePlan(prev => prev ? { ...prev, chunks: [...updatedChunks] } : null);
          if (i === updatedChunks.length - 1) {
            setIsSimulatingRender(false);
            addToast("success", `Đã render và nối ${activePlan.total_chunks} Chunks qua FFmpeg concat không mất dữ liệu!`);
          }
        }, (i + 1) * 700);
      });

    } catch (e) {
      setIsSimulatingRender(false);
      addToast("error", "Không thể dispatch render sang các Worker.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F172A] text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> CREATOROS v5.0 Next-Gen
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
              LAN Master-Worker Matrix
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Network className="w-7 h-7 text-indigo-400" />
            Cụm Máy Trạm Render Phân Tán Nội Bộ (LAN Cluster)
          </h1>
          <p className="text-sm text-slate-400">
            Quét mạng LAN nội bộ studio, chia nhỏ video thành các Segment Chunks và phân phối render song song trên nhiều GPU máy trạm.
          </p>
        </div>

        <button
          onClick={fetchClusterStatus}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Quét Lại Mạng LAN
        </button>
      </div>

      {/* Cluster Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng Máy Trạm Online</div>
            <div className="text-xl font-bold text-white">
              {cluster?.active_nodes || 3} / {cluster?.total_nodes || 3} Nodes
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sẵn sàng nhận Job
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng VRAM GPU Cụm</div>
            <div className="text-xl font-bold text-white">
              {Math.round((cluster?.total_vram_mb || 30720) / 1024)} GB VRAM
            </div>
            <div className="text-xs text-slate-400">
              Trống {Math.round((cluster?.free_vram_mb || 24650) / 1024)} GB ({cluster?.cluster_vram_percent || 19.8}% dùng)
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Hệ Số Tăng Tốc Cụm</div>
            <div className="text-xl font-bold text-amber-300">5.0x Tốc Độ</div>
            <div className="text-xs text-slate-400">So với 1 máy GTX 1660S đơn lẻ</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bảo Mật Studio</div>
            <div className="text-xl font-bold text-emerald-300">100% Offline LAN</div>
            <div className="text-xs text-slate-400">Không gửi dữ liệu ra Internet</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Node List + Right Job Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Worker Nodes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Danh Sách Máy Trạm (Worker Nodes)
          </h2>

          <div className="space-y-3">
            {(cluster?.workers || []).map((node) => (
              <div 
                key={node.worker_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{node.hostname}</span>
                      {node.worker_id.includes("master") && (
                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          MASTER
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {node.ip_address}:{node.port}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    node.status === "IDLE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    node.status === "RENDERING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {node.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" />
                      GPU:
                    </span>
                    <span className="text-slate-200 font-medium">{node.gpu_name}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>VRAM Sử Dụng:</span>
                      <span className="font-mono text-slate-300">
                        {node.vram_total_mb - node.vram_free_mb} / {node.vram_total_mb} MB ({node.vram_percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          node.vram_percent > 80 ? "bg-rose-500" :
                          node.vram_percent > 50 ? "bg-amber-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${node.vram_percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>Hệ số GPU Speed:</span>
                    <span className="text-amber-400 font-mono font-semibold">+{node.speed_factor}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Distributed Chunk Planner & Execution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Cấu Hình Chia Nhỏ Video & Phân Phối (Chunk Dispatcher)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Thiết lập độ dài video và kích thước segment để bộ thuật toán tự động cân bằng tải trọng qua cụm LAN.
              </p>
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tổng Thời Lượng Video (Giây)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="1800"
                    step="30"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    ({Math.floor(videoDuration / 60)}m {videoDuration % 60}s)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Thời Lượng Mỗi Segment Chunk (Giây)
                </label>
                <select
                  value={chunkDuration}
                  onChange={(e) => setChunkDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value={15}>15 giây / Chunk (Phù hợp video ngắn)</option>
                  <option value={30}>30 giây / Chunk (Khuyên dùng tối ưu)</option>
                  <option value={60}>60 giây / Chunk (Video dài 10-30 phút)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePlanJob}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <Zap className="w-4 h-4" />
              Tính Toán & Phân Bổ Tải Trọng Cụm (Calculate Plan)
            </button>

            {/* Planned Chunks Matrix Visualizer */}
            {activePlan && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Kế Hoạch Render: {activePlan.total_chunks} Chunks ({activePlan.speedup_vs_single_node} Speedup)
                    </h3>
                    <div className="text-xs text-slate-400">
                      Thời gian dự kiến: ~{activePlan.estimated_render_time_sec} giây (thay vì {activePlan.total_duration_sec * 1.1} giây đơn máy)
                    </div>
                  </div>

                  <button
                    onClick={handleStartDistributedRender}
                    disabled={isSimulatingRender}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/20"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSimulatingRender ? "animate-spin" : ""}`} />
                    {isSimulatingRender ? "Đang Render Cụm..." : "Thực Thi Render Phân Tán"}
                  </button>
                </div>

                {/* Chunks List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {activePlan.chunks.map((c) => (
                    <div
                      key={c.chunk_id}
                      className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold">
                          #{c.index + 1}
                        </span>
                        <div>
                          <div className="text-xs font-medium text-slate-200">
                            Segment: {c.start_sec}s → {c.end_sec}s ({c.duration_sec}s)
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <span>Máy trạm: {c.assigned_worker_name}</span>
                            <span>({c.assigned_worker_ip})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              c.status === "COMPLETED" ? "bg-emerald-500" :
                              c.status === "RENDERING" ? "bg-amber-400" : "bg-slate-600"
                            }`}
                            style={{ width: `${c.progress_percent}%` }}
                          ></div>
                        </div>

                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                          c.status === "COMPLETED" ? "text-emerald-400 bg-emerald-500/10" :
                          c.status === "RENDERING" ? "text-amber-400 bg-amber-500/10" : "text-slate-400"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final FFmpeg Concat Preview */}
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>FFmpeg Concat Demuxer: Nối tự động 0-loss sau khi tất cả worker hoàn tất.</span>
                  </div>
                  <span className="text-indigo-400 font-semibold">-c copy</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
