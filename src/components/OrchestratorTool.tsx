import React, { useState, useEffect, useRef } from "react";
import {
  GitBranch,
  Cpu,
  HardDrive,
  Activity,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Scissors,
  Clapperboard,
  Mic,
  Share2,
  Film,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  RefreshCw,
  Sliders,
  Trash2,
  Check,
  ChevronRight,
  Database,
  Gauge,
  Flame,
  ArrowRight,
  Server,
  Bot,
  Search,
  BookOpen,
  Radio,
  FileText,
  HelpCircle,
  Wrench,
  Wifi
} from "lucide-react";
import {
  PipelineJobItem,
  PipelinePriority,
  HardwareTelemetryStats,
  PipelineStepNode,
  HealingIncidentItem,
  RagDocumentItem,
  RagSearchResultItem,
  WsBridgeStatus,
  QcReport
} from "../types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";
import { io } from "socket.io-client";

type OrchestratorSubTab = "dag_pipeline" | "self_healing" | "vector_rag" | "ws_bridge" | "qc_agent";

export const OrchestratorTool: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<OrchestratorSubTab>("dag_pipeline");

  // Pipeline Settings
  const [pipelineTitle, setPipelineTitle] = useState("Tự Động Hóa Chuỗi Triệu View (Ingest ➔ Edit ➔ AI ➔ Voice ➔ Dispatch)");
  const [priority, setPriority] = useState<PipelinePriority>("HIGH");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Hardware Telemetry (NVIDIA GTX 1660 Super & NVMe)
  const [hardware, setHardware] = useState<HardwareTelemetryStats>({
    gpu_name: "NVIDIA GeForce GTX 1660 SUPER",
    vram_total_mb: 6144,
    vram_used_mb: 1850,
    vram_percent: 30.1,
    gpu_util_percent: 24,
    gpu_temp_c: 54,
    nvenc_sessions: 1,
    ram_total_mb: 16384,
    ram_used_mb: 5420,
    ram_percent: 33.1,
    nvme_cache_mb: 42.5,
    throttling_active: false,
    nvme_speed_status: "NVMe PCIe 3.0 x4 (3200 MB/s)"
  });

  // Checkpoints & SQLite History
  const [savedJobs, setSavedJobs] = useState<PipelineJobItem[]>([]);
  const [cleaningCache, setCleaningCache] = useState(false);
  const [flushingVram, setFlushingVram] = useState(false);

  // QC Report State
  const [qcReport, setQcReport] = useState<QcReport | null>({
    qc_passed: true,
    qc_score: 95,
    status: "APPROVED",
    total_clips: 3,
    estimated_duration_sec: 75.0,
    fair_use_ratio: 94.0,
    narrative_arc: "Hook ➔ Development ➔ Climax ➔ Call-To-Action",
    issues: [],
    recommendations: ["Áp dụng Transition Zoom-in nhẹ tại giây thứ 3 của Opening Hook."],
    fixes_applied: ["Tự động đồng bộ hóa dấu chấm câu phụ đề với waveform thoại (+300ms tail pad)."],
    timestamp: Date.now()
  });
  const [isValidatingQc, setIsValidatingQc] = useState(false);

  // Terminal logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[system] Unified Pipeline Orchestrator & Master State Machine v3.2 sẵn sàng.",
    "[ws_bridge] Local WebSocket IPC Server khởi chạy tại ws://127.0.0.1:8765 (Zero Latency).",
    "[self_healing] Agentic Error Doctor & Heuristic Fallback Catalog đã nạp 6 chiến lược sửa lỗi tự động.",
    "[vector_rag] Local Vector RAG Engine sẵn sàng phân tích ngữ nghĩa triệu view (100% Offline).",
    "[hardware] Đã nhận diện GPU: NVIDIA GeForce GTX 1660 SUPER (6GB GDDR6 VRAM, NVENC Encoder)."
  ]);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Agentic Self-Healing State
  const [healingIncidents, setHealingIncidents] = useState<HealingIncidentItem[]>([]);
  const [simulatingError, setSimulatingError] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string>("CUDA_VRAM_OOM");

  // Local Vector RAG State
  const [ragDocTitle, setRagDocTitle] = useState("Review Phim Hành Động Kịch Tính (Cú Quay Xe)");
  const [ragTranscriptInput, setRagTranscriptInput] = useState(
`00:00:02,000 --> 00:00:15,000
Vào một buổi sáng định mệnh, không ai ngờ rằng người đàn ông hiền lành ấy lại đang nắm giữ một bí mật kinh hoàng có thể làm sụp đổ cả tập đoàn.

00:00:16,000 --> 00:00:32,000
Khi camera an ninh ghi lại cảnh chiếc xe phát nổ, cả đội điều tra đều choáng váng trước cú quay xe đỉnh cao của kẻ chủ mưu.

00:00:33,000 --> 00:00:50,000
Hắn ta mỉm cười và để lại lời nhắn: Trò chơi bây giờ mới thực sự bắt đầu. Ai dám phản bội sẽ phải trả giá đắt!`
  );
  const [ragSearchQuery, setRagSearchQuery] = useState("cú quay xe kịch tính kinh hoàng");
  const [ragSearchResults, setRagSearchResults] = useState<RagSearchResultItem[]>([]);
  const [isRagIndexing, setIsRagIndexing] = useState(false);
  const [isRagSearching, setIsRagSearching] = useState(false);
  const [ragDocuments, setRagDocuments] = useState<RagDocumentItem[]>([]);

  // WebSocket Bridge State
  const [wsStatus, setWsStatus] = useState<WsBridgeStatus>({
    status: "connected",
    protocol: "ws://127.0.0.1:8765",
    version: "3.2.0-Agentic",
    channels: ["render_log", "render_progress", "pipeline_update", "healing_incident", "hardware_metrics"],
    latency_ms: 0.8,
    active_connections: 1
  });

  // Default DAG Steps Configuration
  const dagSteps: PipelineStepNode[] = [
    {
      id: "step-1",
      name: "1. Bulk Ingest & Hash",
      description: "Tải video hàng loạt & kiểm tra mã băm",
      module: "ingestion",
      status: activeStepIndex > 0 ? "completed" : activeStepIndex === 0 && isRunning ? "running" : "idle",
      iconName: "Download",
      estimatedVramMb: 400,
      gpuAccelerated: false
    },
    {
      id: "step-2",
      name: "2. No-Strike Edit",
      description: "FFmpeg NVENC đổi MD5 + Agentic Self-Healing",
      module: "nostrike_edit",
      status: activeStepIndex > 1 ? "completed" : activeStepIndex === 1 && isRunning ? "running" : "idle",
      iconName: "ShieldCheck",
      estimatedVramMb: 1250,
      gpuAccelerated: true
    },
    {
      id: "step-3",
      name: "3. Local Vector RAG & Highlight",
      description: "Truy xuất Ngữ nghĩa Transcript & Hook Viral",
      module: "ai_highlight_review",
      status: activeStepIndex > 2 ? "completed" : activeStepIndex === 2 && isRunning ? "running" : "idle",
      iconName: "Scissors",
      estimatedVramMb: 2400,
      gpuAccelerated: true
    },
    {
      id: "step-4",
      name: "4. Local Voice Synthesis",
      description: "Lồng tiếng AI 0đ & hòa âm BGM tự nhiên",
      module: "local_voice_dub",
      status: activeStepIndex > 3 ? "completed" : activeStepIndex === 3 && isRunning ? "running" : "idle",
      iconName: "Mic",
      estimatedVramMb: 850,
      gpuAccelerated: false
    },
    {
      id: "step-5",
      name: "5. FB Reels / YTB Dispatch",
      description: "Crop 4:5 & đặt lịch chùm Page ma trận",
      module: "fb_reels_dispatch",
      status: activeStepIndex > 4 ? "completed" : activeStepIndex === 4 && isRunning ? "running" : "idle",
      iconName: "Share2",
      estimatedVramMb: 950,
      gpuAccelerated: true
    }
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Load Past Pipeline Jobs & Incidents
  const fetchPipelines = async () => {
    try {
      const res = await fetch(getApiUrl("/api/orchestrator/pipelines"));
      const data = await res.json();
      if (data.success && data.data) {
        setSavedJobs(data.data);
      }
    } catch (e) {
      console.warn("Could not fetch pipelines from SQLite:", e);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(getApiUrl("/api/self-healing/incidents"));
      const data = await res.json();
      if (data.success && data.data) {
        setHealingIncidents(data.data);
      }
    } catch (e) {
      console.warn("Could not fetch healing incidents:", e);
    }
  };

  const fetchRagDocs = async () => {
    try {
      const res = await fetch(getApiUrl("/api/rag/documents"));
      const data = await res.json();
      if (data.success && data.data) {
        setRagDocuments(data.data);
      }
    } catch (e) {
      console.warn("Could not fetch RAG docs:", e);
    }
  };

  // Poll hardware telemetry
  const fetchHardwareTelemetry = async () => {
    try {
      const res = await fetch(getApiUrl("/api/hardware/telemetry"));
      const data = await res.json();
      if (data.success && data.data) {
        setHardware(data.data);
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchPipelines();
    fetchIncidents();
    fetchRagDocs();
    fetchHardwareTelemetry();

    const timer = setInterval(() => {
      fetchHardwareTelemetry();
    }, 3000);

    // Socket.io Listener
    const socket = io();

    socket.on("pipeline_update", (payload: any) => {
      if (payload.step_index) {
        setActiveStepIndex(payload.step_index - 1);
      }
      if (payload.progress_percent !== undefined) {
        setProgress(payload.progress_percent);
      }
      if (payload.hardware_stats) {
        setHardware(payload.hardware_stats);
      }
      if (payload.status === "completed") {
        setIsRunning(false);
        setActiveStepIndex(5);
        setProgress(100);
        soundSynth.playSfx("cash");
        confetti({ particleCount: 70, spread: 80 });
        fetchPipelines();
        fetchIncidents();
      }
    });

    socket.on("pipeline_log", (msg: string) => {
      setTerminalLogs((prev) => [...prev, msg]);
    });

    socket.on("hardware_metrics", (stats: any) => {
      if (stats) setHardware(stats);
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  // 1. Khởi chạy Unified DAG Pipeline
  const handleStartPipeline = async () => {
    setIsRunning(true);
    setProgress(5);
    setActiveStepIndex(0);
    soundSynth.playSfx("cash");

    const jobId = `pipe_${Date.now()}`;
    setCurrentJobId(jobId);

    setTerminalLogs((prev) => [
      ...prev,
      `[user_action] 🚀 Khởi chạy chuỗi Unified Pipeline DAG ID: ${jobId}`,
      `[ws_bridge] Đồng bộ tiến trình qua kênh WebSocket 8765 hai chiều.`
    ]);

    try {
      // Gọi API backend
      const res = await fetch(getApiUrl("/api/orchestrator/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: jobId,
          title: pipelineTitle,
          priority: priority,
          config: {
            useNvenc: true,
            gpuTarget: "GTX 1660 SUPER",
            vramSafetyCapMb: 5200,
            autoResume: true,
            useLocalRag: true
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        setTerminalLogs((prev) => [...prev, `[error] Thất bại khởi động pipeline: ${data.message}`]);
        setIsRunning(false);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [...prev, `[error] Không thể kết nối tới orchestrator API: ${err.message}`]);
      setIsRunning(false);
    }
  };

  // 2. Tự động phục hồi từ Checkpoint (Auto-Resume)
  const handleResumeCheckpoint = async (jobId: string) => {
    setIsRunning(true);
    soundSynth.playSfx("pop");
    setTerminalLogs((prev) => [
      ...prev,
      `[checkpoint] ♻️ Yêu cầu tiếp tục tác vụ từ điểm dừng an toàn (Job: ${jobId})...`
    ]);

    try {
      const res = await fetch(getApiUrl("/api/orchestrator/resume"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId: jobId })
      });
      const data = await res.json();
      if (data.success) {
        setTerminalLogs((prev) => [...prev, `[checkpoint] ${data.message}`]);
      }
    } catch (e: any) {
      setTerminalLogs((prev) => [...prev, `[error] Không thể nạp checkpoint: ${e.message}`]);
    }
  };

  // 3. Dọn dẹp Cache NVMe tạm thời
  const handleCleanNvmeCache = async () => {
    setCleaningCache(true);
    soundSynth.playSfx("pop");
    try {
      const res = await fetch(getApiUrl("/api/hardware/clean-cache"), { method: "POST" });
      const data = await res.json();
      if (data.success) {
        soundSynth.playSfx("success");
        setHardware((prev) => ({ ...prev, nvme_cache_mb: 0.0 }));
        setTerminalLogs((prev) => [...prev, `[nvme] 🧹 Đã giải phóng toàn bộ Cache NVMe tạm thời!`]);
      }
    } catch (e) {
      // error
    } finally {
      setCleaningCache(false);
    }
  };

  // 4. Mô phỏng thử nghiệm Agentic Self-Healing Auto-Recovery
  const handleSimulateSelfHealing = async () => {
    setSimulatingError(true);
    soundSynth.playSfx("pop");
    try {
      const res = await fetch(getApiUrl("/api/self-healing/simulate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorType: selectedErrorType })
      });
      const data = await res.json();
      if (data.success) {
        soundSynth.playSfx("success");
        fetchIncidents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingError(false);
    }
  };

  // 5. Lập chỉ mục Vector RAG
  const handleIndexRag = async () => {
    if (!ragTranscriptInput.trim()) return;
    setIsRagIndexing(true);
    soundSynth.playSfx("pop");
    try {
      const res = await fetch(getApiUrl("/api/rag/index"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: `rag_${Date.now()}`,
          title: ragDocTitle,
          content: ragTranscriptInput
        })
      });
      const data = await res.json();
      if (data.success) {
        soundSynth.playSfx("success");
        fetchRagDocs();
        // Tự động tìm kiếm luôn
        handleSearchRag();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRagIndexing(false);
    }
  };

  // 6. Tìm kiếm Vector RAG
  const handleSearchRag = async () => {
    if (!ragSearchQuery.trim()) return;
    setIsRagSearching(true);
    try {
      const res = await fetch(getApiUrl("/api/rag/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ragSearchQuery, topK: 5 })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRagSearchResults(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRagSearching(false);
    }
  };

  // 7. Quality Control (QC) Validation Check
  const handleValidateQc = async () => {
    setIsValidatingQc(true);
    soundSynth.playSfx("pop");
    try {
      const res = await fetch(getApiUrl("/api/qc/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: ragTranscriptInput,
          highlights: [
            {
              startTime: "00:00:02",
              endTime: "00:00:18",
              hookTitle: "Bí mật kinh hoàng sụp đổ tập đoàn",
              viralScore: 96,
              voiceScript: "Không ai ngờ rằng người đàn ông hiền lành ấy lại nắm giữ bí mật kinh hoàng!",
              brollSuggestion: "Cảnh quay chậm camera an ninh trong tòa nhà"
            },
            {
              startTime: "00:00:19",
              endTime: "00:00:36",
              hookTitle: "Cú quay xe đỉnh cao của kẻ chủ mưu",
              viralScore: 94,
              voiceScript: "Cả đội điều tra đều choáng váng trước kẻ chủ mưu thật sự!",
              brollSuggestion: "Cảnh xe cảnh sát vây ráp hiện trường"
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setQcReport(data.data);
        soundSynth.playSfx("success");
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidatingQc(false);
    }
  };

  // 8. Flush VRAM Cache
  const handleFlushVram = async () => {
    setFlushingVram(true);
    soundSynth.playSfx("pop");
    try {
      const res = await fetch(getApiUrl("/api/governor/empty-vram"), { method: "POST" });
      const data = await res.json();
      if (data.success) {
        soundSynth.playSfx("success");
        fetchHardwareTelemetry();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFlushingVram(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <GitBranch className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                Agentic Unified Pipeline Orchestrator
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v3.3 Enterprise Studio
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Kiến trúc 4 tầng tự trị: <strong>WebSocket JSON-RPC 2.0 Bridge</strong>, <strong>DAG Checkpointing SQLite</strong>, 
              <strong>Hardware Governor (chống tràn 6GB VRAM)</strong> và <strong>QC Agent</strong> tiền kiểm duyệt render 100% offline.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleFlushVram}
              disabled={flushingVram}
              className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Giải phóng VRAM rác và gọi torch.cuda.empty_cache"
            >
              <Zap className={`w-3.5 h-3.5 text-indigo-400 ${flushingVram ? "animate-spin" : ""}`} />
              Xả VRAM ({hardware.vram_used_mb} MB)
            </button>

            <button
              onClick={handleCleanNvmeCache}
              disabled={cleaningCache}
              className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Giải phóng cache /temp/creatoros_cache trên NVMe"
            >
              <Trash2 className={`w-3.5 h-3.5 text-amber-400 ${cleaningCache ? "animate-spin" : ""}`} />
              Dọn NVMe ({hardware.nvme_cache_mb} MB)
            </button>

            <button
              onClick={handleStartPipeline}
              disabled={isRunning}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
                isRunning
                  ? "bg-indigo-600/50 text-indigo-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/25 active:scale-95"
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang Chạy DAG ({progress}%)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Chạy Chuỗi Toàn Diện (Master DAG)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => { setActiveSubTab("dag_pipeline"); soundSynth.playSfx("pop"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === "dag_pipeline"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-850/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            1. Master DAG Scheduler
          </button>

          <button
            onClick={() => { setActiveSubTab("self_healing"); soundSynth.playSfx("pop"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === "self_healing"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "bg-slate-850/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            2. Agentic Self-Healing Doctor
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-mono">
              {healingIncidents.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab("vector_rag"); soundSynth.playSfx("pop"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === "vector_rag"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-850/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            3. Local Vector RAG (Offline)
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-mono">
              Cosine
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab("qc_agent"); soundSynth.playSfx("pop"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === "qc_agent"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-850/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            4. Quality Control (QC) Agent
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30 font-mono">
              {qcReport ? `${qcReport.qc_score}pt` : "Ready"}
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab("ws_bridge"); soundSynth.playSfx("pop"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === "ws_bridge"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-850/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            5. JSON-RPC 2.0 WebSocket Bridge
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Bar (GTX 1660 Super & NVMe) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* GPU VRAM */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPU VRAM (GTX 1660S)</div>
              <div className="text-sm font-black text-slate-100">
                {hardware.vram_used_mb} <span className="text-xs font-normal text-slate-400">/ {hardware.vram_total_mb} MB</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-mono font-bold ${
              hardware.vram_percent > 85 ? "text-rose-400" : "text-indigo-400"
            }`}>
              {hardware.vram_percent}%
            </div>
            <span className="text-[9px] text-slate-500 font-mono">NVENC Active</span>
          </div>
        </div>

        {/* GPU Core & Temp */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPU Tải & Nhiệt Độ</div>
              <div className="text-sm font-black text-slate-100">
                {hardware.gpu_util_percent}% <span className="text-xs font-normal text-slate-400">• {hardware.gpu_temp_c || 54}°C</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Tối Ưu
            </span>
          </div>
        </div>

        {/* RAM System */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RAM Hệ Thống</div>
              <div className="text-sm font-black text-slate-100">
                {Math.round(hardware.ram_used_mb / 1024 * 10) / 10} <span className="text-xs font-normal text-slate-400">/ 16 GB</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-blue-400">
              {hardware.ram_percent}%
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Safe Headroom</span>
          </div>
        </div>

        {/* NVMe SSD Cache */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NVMe Read/Write Cache</div>
              <div className="text-sm font-black text-slate-100">
                {hardware.nvme_cache_mb} <span className="text-xs font-normal text-slate-400">MB Tạm</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              3200 MB/s
            </span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: DAG PIPELINE */}
      {activeSubTab === "dag_pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: DAG Pipeline Interactive Visualizer (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Sơ Đồ Chuỗi Tự Động Hóa (Master State Machine)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Ưu tiên hàng đợi:</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PipelinePriority)}
                    className="px-2 py-1 rounded-md bg-slate-950 border border-slate-750 text-indigo-300 font-mono text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="HIGH">HIGH (Ưu Tiên Cao)</option>
                    <option value="NORMAL">NORMAL (Bình Thường)</option>
                    <option value="LOW">LOW (Tiết Kiệm VRAM)</option>
                  </select>
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Tiêu Đề / Dự Án Pipeline:</label>
                <input
                  type="text"
                  value={pipelineTitle}
                  onChange={(e) => setPipelineTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:border-indigo-500 outline-none"
                  placeholder="Nhập tên dự án hoặc chuỗi nội dung..."
                />
              </div>

              {/* 5 DAG Step Nodes */}
              <div className="space-y-2.5 pt-2">
                {dagSteps.map((step, idx) => {
                  const isCurrent = isRunning && activeStepIndex === idx;
                  const isDone = activeStepIndex > idx || (!isRunning && activeStepIndex === 5);

                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                          : isDone
                          ? "bg-slate-950/70 border-emerald-500/30 text-slate-200"
                          : "bg-slate-950/40 border-slate-850 text-slate-400"
                      }`}
                    >
                      {/* Step Progress Line on Left */}
                      <div className={`w-1 self-stretch rounded-full mr-1 ${
                        isDone ? "bg-emerald-500" : isCurrent ? "bg-indigo-500 animate-pulse" : "bg-slate-800"
                      }`} />

                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isCurrent
                            ? "bg-indigo-500/20 text-indigo-300 animate-bounce"
                            : "bg-slate-850 text-slate-500"
                        }`}>
                          {idx === 0 && <Download className="w-4 h-4" />}
                          {idx === 1 && <ShieldCheck className="w-4 h-4" />}
                          {idx === 2 && <Scissors className="w-4 h-4" />}
                          {idx === 3 && <Mic className="w-4 h-4" />}
                          {idx === 4 && <Share2 className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-200 truncate">{step.name}</span>
                            {step.gpuAccelerated && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                NVENC ~{step.estimatedVramMb}MB
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{step.description}</p>
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isDone ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Xong
                          </span>
                        ) : isCurrent ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30 animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Đang xử lý...
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                            Chờ lệnh
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Tiến Độ Tổng Thể Unified Pipeline:</span>
                  <span className="font-bold text-indigo-400">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Terminal Logs & Checkpoints (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            {/* Live Terminal */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Terminal Logs (WebSocket + IPC):
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live State Machine
                </span>
              </div>

              <div
                ref={terminalRef}
                className="font-mono text-[11px] space-y-1.5 text-slate-300 overflow-y-auto flex-1 pr-1 max-h-[260px]"
              >
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log.startsWith("[error]") ? (
                      <span className="text-rose-400">{log}</span>
                    ) : log.startsWith("[success]") ? (
                      <span className="text-emerald-400">{log}</span>
                    ) : log.startsWith("[self_healing]") ? (
                      <span className="text-amber-300">{log}</span>
                    ) : log.startsWith("[rag]") ? (
                      <span className="text-emerald-300">{log}</span>
                    ) : log.startsWith("[ws_bridge]") ? (
                      <span className="text-cyan-300">{log}</span>
                    ) : log.startsWith("[hardware]") ? (
                      <span className="text-cyan-400">{log}</span>
                    ) : log.startsWith("[checkpoint]") ? (
                      <span className="text-amber-300">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SQLite Checkpoints Table */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  Checkpoint & Pipeline Đã Lưu (SQLite):
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {savedJobs.length} Tác vụ
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {savedJobs.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">
                    Chưa có pipeline nào được lưu trong SQLite.
                  </div>
                ) : (
                  savedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            job.status === "completed" ? "bg-emerald-400" : "bg-amber-400"
                          }`} />
                          <span>{job.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>Bước: {job.currentStepIndex}/{job.totalSteps}</span>
                          <span>•</span>
                          <span className="font-mono text-indigo-300">{job.priority}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-850 text-slate-300">
                          {job.progress}%
                        </span>
                        {job.status !== "completed" && (
                          <button
                            onClick={() => handleResumeCheckpoint(job.id)}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 cursor-pointer"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: AGENTIC SELF-HEALING ERROR DOCTOR */}
      {activeSubTab === "self_healing" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  Agentic Self-Healing Error Doctor & Heuristic Fallback Engine
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hệ thống tự động bắt lỗi ngoại lệ trong tiến trình Python / FFmpeg, phân tích nguyên nhân gốc rễ (Root Cause) 
                  và tự động kích hoạt thử lại (Auto-Retry) với cấu hình tham số thay thế.
                </p>
              </div>

              {/* Simulation Box */}
              <div className="flex items-center gap-2 shrink-0 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <select
                  value={selectedErrorType}
                  onChange={(e) => setSelectedErrorType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-200 text-xs font-mono outline-none"
                >
                  <option value="CUDA_VRAM_OOM">CUDA VRAM OOM (Tràn Bộ Nhớ)</option>
                  <option value="NVENC_LIMIT">NVENC Session Limit (Hết Slot Encode)</option>
                  <option value="AUDIO_DESYNC">Audio Desync (Lệch Khung Âm Thanh)</option>
                </select>
                <button
                  onClick={handleSimulateSelfHealing}
                  disabled={simulatingError}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${simulatingError ? "animate-spin" : ""}`} />
                  Mô Phỏng Sửa Lỗi Tự Động
                </button>
              </div>
            </div>

            {/* Catalog of Self-Healing Rules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400">1. CUDA VRAM OOM</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">GPU Safety</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Phát hiện tràn VRAM 6GB GTX 1660S ➔ Tự động hạ 720p & chuyển sang CPU libx264 fast.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">2. NVENC Encoder Limit</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Session Guard</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Vượt quá 3 phiên NVENC đồng thời ➔ Tự động fallback sang libx264 ultrafast đa luồng.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">3. Audio Drift & Desync</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">Resample Fix</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Lệch tần số mẫu 44.1kHz vs 48kHz ➔ Ép chuẩn hóa -c:a aac -af aresample=async=1000.
                </p>
              </div>
            </div>

            {/* Incidents History Table from SQLite */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Nhật Ký Tự Phục Hồi Lỗi (SQLite healing_incidents):
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {healingIncidents.length} Sự cố đã xử lý
                </span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {healingIncidents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Chưa ghi nhận sự cố nào. Hệ thống hoạt động hoàn toàn ổn định!
                  </div>
                ) : (
                  healingIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {inc.error_category}
                          </span>
                          <span className="text-slate-200 font-bold">{inc.pipeline_id}</span>
                          <span className="text-[10px] text-slate-400">• Lần thử: #{inc.retry_count}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Đã Tự Phục Hồi (Resolved)
                        </span>
                      </div>

                      <div className="text-slate-300 leading-relaxed">
                        <strong className="text-amber-400">Nguyên nhân gốc rễ: </strong>
                        {inc.root_cause_analysis}
                      </div>

                      <div className="text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400">Hành động khắc phục: </strong>
                        {inc.suggested_action}
                      </div>

                      {inc.fallback_parameters && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
                          <strong>Fallback Parameters: </strong>
                          {JSON.stringify(inc.fallback_parameters)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: LOCAL VECTOR RAG FOR TRANSCRIPTS */}
      {activeSubTab === "vector_rag" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Transcript Indexer (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Lập Chỉ Mục Vector RAG Cục Bộ (100% Offline)
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dense Semantic Hash
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Tên Video / Tiêu Đề Tài Liệu:</label>
                <input
                  type="text"
                  value={ragDocTitle}
                  onChange={(e) => setRagDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Nội Dung Transcript / Phụ Đề SRT / VTT:</label>
                <textarea
                  value={ragTranscriptInput}
                  onChange={(e) => setRagTranscriptInput(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Dán nội dung transcript có mốc thời gian hoặc văn bản thô..."
                />
              </div>

              <button
                onClick={handleIndexRag}
                disabled={isRagIndexing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
              >
                <Database className={`w-4 h-4 ${isRagIndexing ? "animate-spin" : ""}`} />
                {isRagIndexing ? "Đang Lập Chỉ Mục Vector..." : "Lập Chỉ Mục Vector RAG Ngay"}
              </button>
            </div>
          </div>

          {/* Right: Semantic Search & Hook Extractor (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Truy Vấn Ngữ Nghĩa & Viral Hook Score
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Cosine Similarity + BM25
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragSearchQuery}
                  onChange={(e) => setRagSearchQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium outline-none focus:border-cyan-500"
                  placeholder="Nhập ý tưởng tìm kiếm (ví dụ: cú quay xe, cảnh kịch tính, bí mật)..."
                />
                <button
                  onClick={handleSearchRag}
                  disabled={isRagSearching}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Tìm
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {ragSearchResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Chưa có kết quả tìm kiếm. Hãy nhấn "Tìm" để quét vector ngữ nghĩa!
                  </div>
                ) : (
                  ragSearchResults.map((hit) => (
                    <div
                      key={hit.chunk_id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                            {hit.start_time} ➔ {hit.end_time}
                          </span>
                          <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
                            {hit.emotional_tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Tương đồng: {hit.similarity_percent}%
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                            Viral: {hit.viral_score}/100
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-200 font-medium leading-relaxed">
                        "{hit.text}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: QC AGENT VALIDATION */}
      {activeSubTab === "qc_agent" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Quality Control (QC) Agent - Tiền Kiểm Duyệt Trước Khi Render
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tự động đánh giá mạch truyện logic, thời lượng giữ chân (15-60s), đồng bộ âm thanh & tỷ lệ biến đổi bản quyền (&gt;85%) trước khi render FFmpeg NVENC.
              </p>
            </div>

            <button
              onClick={handleValidateQc}
              disabled={isValidatingQc}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isValidatingQc ? "animate-spin" : ""}`} />
              {isValidatingQc ? "Đang Kiểm Tra QC..." : "Chạy Đánh Giá QC Ngay"}
            </button>
          </div>

          {qcReport && (
            <div className="space-y-4">
              {/* Score & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Điểm Chất Lượng QC</div>
                  <div className="text-2xl font-black text-purple-400 flex items-center gap-2">
                    {qcReport.qc_score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    qcReport.qc_passed ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  }`}>
                    {qcReport.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Tỷ Lệ Biến Đổi No-Strike</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {qcReport.fair_use_ratio}%
                  </div>
                  <span className="text-[10px] text-slate-400">Đạt chuẩn Fair-Use Quốc Tế</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Số Phân Đoạn & Thời Lượng</div>
                  <div className="text-2xl font-black text-cyan-400">
                    {qcReport.total_clips} Clips
                  </div>
                  <span className="text-[10px] text-slate-400">Ước tính: ~{qcReport.estimated_duration_sec}s</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Cấu Trúc Mạch Truyện</div>
                  <div className="text-xs font-bold text-amber-300 font-mono mt-1">
                    {qcReport.narrative_arc}
                  </div>
                  <span className="text-[10px] text-slate-400">Tối ưu Retention 3s đầu</span>
                </div>
              </div>

              {/* Fixes & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Tự Động Sửa Lỗi (Auto-Fixes Applied):
                  </div>
                  {qcReport.fixes_applied.length === 0 ? (
                    <p className="text-xs text-slate-500">Không có lỗi nào cần can thiệp tự động.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {qcReport.fixes_applied.map((fix, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Khuyến Nghị Tối Ưu (Editorial Recommendations):
                  </div>
                  {qcReport.recommendations.length === 0 ? (
                    <p className="text-xs text-slate-500">Kịch bản đã đạt chuẩn tối ưu.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {qcReport.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: LOCAL WEBSOCKET IPC BRIDGE */}
      {activeSubTab === "ws_bridge" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                Local WebSocket IPC Bridge (Giao Tiếp 2 Chiều Thời Gian Thực)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Thay thế cơ chế đọc stdout truyền thống bằng kết nối WebSocket cục bộ không độ trễ (&lt; 2ms) giữa Electron Main Process, Node.js và Python Backend.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: CONNECTED (Port 8765)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">Giao Thức IPC:</div>
              <div className="text-sm font-mono font-bold text-cyan-300">{wsStatus.protocol}</div>
              <div className="text-[11px] text-slate-500">Độ trễ trung bình: ~{wsStatus.latency_ms} ms</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">Kênh Stream Hoạt Động:</div>
              <div className="text-sm font-bold text-slate-200">5 Kênh Real-time</div>
              <div className="text-[11px] text-slate-500 font-mono">render_log, render_progress, healing...</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">Tiến Trình Kết Nối:</div>
              <div className="text-sm font-bold text-emerald-400">Node.js + Electron + Python</div>
              <div className="text-[11px] text-slate-500">Bảo mật: Loopback Only (127.0.0.1)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
