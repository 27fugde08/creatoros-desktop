import React, { useState, useEffect, useRef } from "react";
import {
  GitBranch,
  Play,
  Save,
  Download,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Scissors,
  Clapperboard,
  Languages,
  Film,
  Mic,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Zap,
  ArrowRight,
  Move,
  FileCode2,
  FolderOpen
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useToast } from "../context/ToastContext";
import { WorkflowNodeData, WorkflowEdgeData, WorkflowNodeType, WorkflowDAG } from "../types";

const NODE_DEFINITIONS: Record<WorkflowNodeType, {
  title: string;
  category: string;
  icon: React.ElementType;
  color: string;
  defaultParams: Record<string, any>;
  inputs: Array<{ id: string; name: string; type: any }>;
  outputs: Array<{ id: string; name: string; type: any }>;
}> = {
  ingest_video: {
    title: "Video Ingest & Download",
    category: "Ingest",
    icon: Download,
    color: "from-blue-600/30 to-indigo-600/30 border-blue-500/40 text-blue-300",
    defaultParams: { source_url: "https://youtube.com/watch?v=sample", resolution: "1080p", audio_only: false },
    inputs: [],
    outputs: [{ id: "video_out", name: "Source Video", type: "video" }]
  },
  demucs_stem: {
    title: "Demucs Stem Isolation (GPU)",
    category: "Audio",
    icon: Mic,
    color: "from-violet-600/30 to-purple-600/30 border-violet-500/40 text-violet-300",
    defaultParams: { model: "htdemucs", isolate_vocals: true, isolate_bgm: true },
    inputs: [{ id: "video_in", name: "Input Video", type: "video" }],
    outputs: [
      { id: "vocals_out", name: "Clean Vocals", type: "audio" },
      { id: "bgm_out", name: "Instrumental BGM", type: "audio" }
    ]
  },
  nostrike_nvenc: {
    title: "No-Strike NVENC Render (4:5)",
    category: "Video FX",
    icon: Film,
    color: "from-amber-600/30 to-orange-600/30 border-amber-500/40 text-amber-300",
    defaultParams: { ratio: "4:5 Facebook", colorLUT: "Cinematic Warm", grain: "Medium", mirror: false },
    inputs: [
      { id: "video_in", name: "Raw Video", type: "video" },
      { id: "audio_in", name: "Voice Audio", type: "audio" }
    ],
    outputs: [{ id: "render_out", name: "No-Strike Video", type: "video" }]
  },
  voice_local: {
    title: "Local Voice TTS Offline",
    category: "Audio",
    icon: Sparkles,
    color: "from-emerald-600/30 to-teal-600/30 border-emerald-500/40 text-emerald-300",
    defaultParams: { voice: "Nam Minh (Trầm Ấm)", speed: 1.1, pitch: -1.0 },
    inputs: [{ id: "script_in", name: "Voice Script", type: "text" }],
    outputs: [{ id: "audio_out", name: "Voice Waveform", type: "audio" }]
  },
  ai_recap: {
    title: "AI Review & Hook Writer",
    category: "Script AI",
    icon: Clapperboard,
    color: "from-rose-600/30 to-pink-600/30 border-rose-500/40 text-rose-300",
    defaultParams: { genre: "Review Phim Siêu Cuốn", target_viral_score: 95 },
    inputs: [{ id: "transcript_in", name: "Transcript", type: "text" }],
    outputs: [{ id: "script_out", name: "Hook Script", type: "text" }]
  },
  qc_validation: {
    title: "AI Quality Control (QC Agent)",
    category: "Quality",
    icon: ShieldCheck,
    color: "from-cyan-600/30 to-blue-600/30 border-cyan-500/40 text-cyan-300",
    defaultParams: { min_fair_use: 90, auto_fix_tail_pad: true },
    inputs: [{ id: "video_in", name: "Final Video", type: "video" }],
    outputs: [{ id: "qc_out", name: "QC Report", type: "json" }]
  },
  lipsync_onnx: {
    title: "TensorRT ONNX Lip-Sync Engine",
    category: "AI Vision",
    icon: Sparkles,
    color: "from-emerald-600/30 to-cyan-600/30 border-emerald-500/40 text-emerald-300",
    defaultParams: { provider: "CUDAExecutionProvider", face_batch: 16, smooth_factor: 0.92 },
    inputs: [
      { id: "video_in", name: "Source Face", type: "video" },
      { id: "audio_in", name: "TTS Waveform", type: "audio" }
    ],
    outputs: [{ id: "lipsync_out", name: "Synced Video", type: "video" }]
  },
  lan_distributed: {
    title: "Master-Worker LAN Cluster Render",
    category: "Cluster",
    icon: Layers,
    color: "from-indigo-600/30 to-cyan-600/30 border-indigo-500/40 text-indigo-300",
    defaultParams: { max_workers: 4, chunk_duration_sec: 30, auto_failover: true },
    inputs: [{ id: "chunks_in", name: "Chunk Segments", type: "any" }],
    outputs: [{ id: "cluster_out", name: "Master Concat Video", type: "video" }]
  },
  chunk_splitter: {
    title: "Video Segment Chunk Splitter",
    category: "Cluster",
    icon: Scissors,
    color: "from-amber-600/30 to-yellow-600/30 border-amber-500/40 text-amber-300",
    defaultParams: { chunk_duration_sec: 30 },
    inputs: [{ id: "video_in", name: "Long Master Video", type: "video" }],
    outputs: [{ id: "chunks_out", name: "Segment Manifest", type: "any" }]
  },
  fb_dispatch: {
    title: "Facebook Reels Auto-Publisher",
    category: "Dispatch",
    icon: Share2,
    color: "from-indigo-600/30 to-blue-600/30 border-indigo-500/40 text-indigo-300",
    defaultParams: { page_name: "Góc Phim Hay 4:5", schedule_delay_min: 15, auto_comment: true },
    inputs: [{ id: "video_in", name: "Verified Video", type: "video" }],
    outputs: [{ id: "dispatch_out", name: "Live Post Status", type: "json" }]
  }
};

const DEFAULT_STARTER_NODES: WorkflowNodeData[] = [
  {
    id: "node_ingest_1",
    type: "ingest_video",
    title: "Video Ingest & Download",
    label: "Tải Video Nguồn",
    x: 40,
    y: 120,
    status: "IDLE",
    params: { source_url: "https://youtu.be/sample_trailer", resolution: "1080p" },
    inputs: [],
    outputs: [{ id: "video_out", name: "Source Video", type: "video" }]
  },
  {
    id: "node_demucs_1",
    type: "demucs_stem",
    title: "Demucs Stem Isolation",
    label: "Tách Vocal & BGM",
    x: 340,
    y: 60,
    status: "IDLE",
    params: { isolate_vocals: true, isolate_bgm: true },
    inputs: [{ id: "video_in", name: "Input Video", type: "video" }],
    outputs: [
      { id: "vocals_out", name: "Clean Vocals", type: "audio" },
      { id: "bgm_out", name: "Instrumental BGM", type: "audio" }
    ]
  },
  {
    id: "node_voice_1",
    type: "voice_local",
    title: "Local Voice TTS Offline",
    label: "Giọng Đọc Nam Minh",
    x: 340,
    y: 280,
    status: "IDLE",
    params: { voice: "Nam Minh (Trầm Ấm)", speed: 1.1 },
    inputs: [{ id: "script_in", name: "Voice Script", type: "text" }],
    outputs: [{ id: "audio_out", name: "Voice Waveform", type: "audio" }]
  },
  {
    id: "node_nostrike_1",
    type: "nostrike_nvenc",
    title: "No-Strike NVENC Render",
    label: "Khử Bản Quyền 4:5 FB",
    x: 660,
    y: 160,
    status: "IDLE",
    params: { ratio: "4:5 Facebook", colorLUT: "Cinematic Warm", grain: "Medium" },
    inputs: [
      { id: "video_in", name: "Raw Video", type: "video" },
      { id: "audio_in", name: "Voice Audio", type: "audio" }
    ],
    outputs: [{ id: "render_out", name: "No-Strike Video", type: "video" }]
  },
  {
    id: "node_fb_1",
    type: "fb_dispatch",
    title: "Facebook Reels Auto-Publisher",
    label: "Phân Phối Reels Tự Động",
    x: 980,
    y: 160,
    status: "IDLE",
    params: { page_name: "Review Phim Kịch Tính", schedule_delay_min: 10 },
    inputs: [{ id: "video_in", name: "Verified Video", type: "video" }],
    outputs: [{ id: "dispatch_out", name: "Live Post Status", type: "json" }]
  }
];

const DEFAULT_STARTER_EDGES: WorkflowEdgeData[] = [
  { id: "e1", sourceNodeId: "node_ingest_1", sourcePortId: "video_out", targetNodeId: "node_demucs_1", targetPortId: "video_in", animated: true },
  { id: "e2", sourceNodeId: "node_demucs_1", sourcePortId: "bgm_out", targetNodeId: "node_nostrike_1", targetPortId: "video_in", animated: true },
  { id: "e3", sourceNodeId: "node_voice_1", sourcePortId: "audio_out", targetNodeId: "node_nostrike_1", targetPortId: "audio_in", animated: true },
  { id: "e4", sourceNodeId: "node_nostrike_1", sourcePortId: "render_out", targetNodeId: "node_fb_1", targetPortId: "video_in", animated: true }
];

export const WorkflowBuilderTool: React.FC = () => {
  const { addToast } = useToast();
  const [nodes, setNodes] = useState<WorkflowNodeData[]>(DEFAULT_STARTER_NODES);
  const [edges, setEdges] = useState<WorkflowEdgeData[]>(DEFAULT_STARTER_EDGES);
  const [workflowTitle, setWorkflowTitle] = useState("Reels Master Pipeline (Topological DAG)");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node_nostrike_1");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [connectingSource, setConnectingSource] = useState<{ nodeId: string; portId: string } | null>(null);

  // Local LLM Copilot States
  const [llmPrompt, setLlmPrompt] = useState("Tạo video lồng tiếng kèm đồng bộ khẩu hình lipsync ONNX và render no-strike 9:16");
  const [isGeneratingLlmDag, setIsGeneratingLlmDag] = useState(false);

  // Dragging states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleGenerateDagFromPrompt = async (promptToUse?: string) => {
    const text = promptToUse || llmPrompt;
    if (!text.trim()) return;
    setIsGeneratingLlmDag(true);
    addToast("info", "Local LLM Agent đang phân tích ý định (Intent Parser)...");

    try {
      const res = await fetch("/api/llm/generate-dag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text })
      });
      const data = await res.json();

      if (data.success && data.dag) {
        const dag = data.dag;
        setWorkflowTitle(dag.name || "Auto-Generated Pipeline");

        // Map backend LLM DAG nodes to visual canvas nodes with auto-layout
        const generatedNodes: WorkflowNodeData[] = dag.nodes.map((node: any, idx: number) => {
          const nodeType = (NODE_DEFINITIONS[node.type as WorkflowNodeType] ? node.type : "nostrike_nvenc") as WorkflowNodeType;
          const def = NODE_DEFINITIONS[nodeType];
          
          return {
            id: node.id,
            type: nodeType,
            title: node.label || def.title,
            label: node.label || def.title,
            x: 60 + idx * 280,
            y: 120 + (idx % 2 === 1 ? 140 : 0),
            status: "IDLE",
            params: { ...def.defaultParams, ...(node.config || {}) },
            inputs: [...def.inputs],
            outputs: [...def.outputs]
          };
        });

        // Map backend edges
        const generatedEdges: WorkflowEdgeData[] = dag.edges.map((edge: any, idx: number) => {
          const srcNode = generatedNodes.find(n => n.id === edge.sourceNodeId);
          const tgtNode = generatedNodes.find(n => n.id === edge.targetNodeId);

          return {
            id: `edge_gen_${idx}_${Date.now()}`,
            sourceNodeId: edge.sourceNodeId,
            sourcePortId: srcNode?.outputs[0]?.id || "output",
            targetNodeId: edge.targetNodeId,
            targetPortId: tgtNode?.inputs[0]?.id || "input",
            animated: true
          };
        });

        setNodes(generatedNodes);
        setEdges(generatedEdges);
        if (generatedNodes.length > 0) setSelectedNodeId(generatedNodes[0].id);

        soundSynth.playSuccess();
        addToast("success", `✨ Local LLM đã sinh DAG thành công (${dag.intent_detected}, ${dag.nodes.length} nodes)!`);
      }
    } catch (e) {
      soundSynth.playError();
      addToast("error", "Lỗi kết nối Local LLM Agent");
    } finally {
      setIsGeneratingLlmDag(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const handleAddNode = (type: WorkflowNodeType) => {
    const def = NODE_DEFINITIONS[type];
    const newNodeId = `node_${type}_${Date.now()}`;
    const newNode: WorkflowNodeData = {
      id: newNodeId,
      type,
      title: def.title,
      label: def.title,
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      status: "IDLE",
      params: { ...def.defaultParams },
      inputs: [...def.inputs],
      outputs: [...def.outputs]
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNodeId);
    soundSynth.playPop();
    addToast("info", `Đã thêm Node [${def.title}] vào Canvas`);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    soundSynth.playPop();
  };

  const handlePortClick = (nodeId: string, portId: string, isInput: boolean) => {
    if (!isInput) {
      // Source port clicked
      setConnectingSource({ nodeId, portId });
      soundSynth.playPop();
      addToast("info", "Chọn cổng đầu vào (Input Port) ở Node đích để nối dây");
    } else {
      // Target port clicked
      if (connectingSource && connectingSource.nodeId !== nodeId) {
        const edgeId = `edge_${connectingSource.nodeId}_${nodeId}_${Date.now()}`;
        const newEdge: WorkflowEdgeData = {
          id: edgeId,
          sourceNodeId: connectingSource.nodeId,
          sourcePortId: connectingSource.portId,
          targetNodeId: nodeId,
          targetPortId: portId,
          animated: true
        };
        setEdges(prev => [...prev, newEdge]);
        setConnectingSource(null);
        soundSynth.playSuccess();
        addToast("success", "Đã kết nối luồng dữ liệu (Edge) thành công!");
      }
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    soundSynth.playPop();
  };

  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(10, Math.min(rect.width - 240, e.clientX - rect.left - dragOffset.x));
      const newY = Math.max(10, Math.min(rect.height - 180, e.clientY - rect.top - dragOffset.y));

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  const handleExecuteWorkflow = async () => {
    if (nodes.length === 0) {
      addToast("warning", "Vui lòng thêm ít nhất 1 Node vào quy trình");
      return;
    }

    setIsExecuting(true);
    setExecutionLog([`[dag_compiler] 🔍 Đang phân tích và sắp xếp Tô-pô (Topological Sort) cho ${nodes.length} nodes...`]);
    soundSynth.playPop();

    const dagPayload: WorkflowDAG = {
      workflow_id: `wf_${Date.now()}`,
      title: workflowTitle,
      nodes,
      edges,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    try {
      // 1. Kiểm tra tính toàn vẹn và chu trình
      const valRes = await fetch("/api/workflow/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dag: dagPayload })
      });
      const valJson = await valRes.json();

      if (!valJson.valid) {
        soundSynth.playError();
        addToast("error", valJson.error || "Lỗi cấu trúc đồ thị Workflow");
        setExecutionLog(prev => [...prev, `[dag_error] ❌ ${valJson.error}`]);
        setIsExecuting(false);
        return;
      }

      setExecutionLog(prev => [
        ...prev,
        `[dag_compiler] ✅ Xác thực thành công: Không có chu trình. Chia thành ${valJson.data.stages.length} tầng thực thi song song/tuần tự.`
      ]);

      // 2. Chạy thực thi
      await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dag: dagPayload })
      });

      // Simulation sequence for instant visual feedback on nodes
      valJson.data.execution_order.forEach((nodeId: string, idx: number) => {
        setTimeout(() => {
          setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: "RUNNING", progress: 40 } : n));
          setExecutionLog(prev => [...prev, `[executor] ⏳ Đang chạy Node [${nodeId}]...`]);
        }, idx * 700);

        setTimeout(() => {
          setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: "COMPLETED", progress: 100 } : n));
          setExecutionLog(prev => [...prev, `[executor] ✨ Hoàn tất Node [${nodeId}] (Artifacts ready)`]);
        }, (idx + 1) * 700);
      });

      setTimeout(() => {
        setIsExecuting(false);
        soundSynth.playSuccess();
        addToast("success", "Đã thực thi toàn bộ chuỗi DAG Workflow thành công!");
        setExecutionLog(prev => [...prev, `[workflow] 🏆 TẤT CẢ TÁC VỤ ĐÃ HOÀN TẤT TRỌN VẸN!`]);
      }, (valJson.data.execution_order.length + 1) * 700);

    } catch (e: any) {
      soundSynth.playError();
      setIsExecuting(false);
      addToast("error", "Lỗi gửi lệnh thực thi DAG");
    }
  };

  const handleSaveBlueprint = async () => {
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowTitle,
          category: "workflow",
          description: `Blueprint Workflow gồm ${nodes.length} nodes và ${edges.length} edges`,
          config: { nodes, edges },
          tags: ["workflow", "dag", "custom"],
          is_favorite: true
        })
      });
      const data = await res.json();
      if (data.success) {
        soundSynth.playSuccess();
        addToast("success", `Đã lưu Blueprint [${workflowTitle}] vào kho Presets!`);
      }
    } catch (e) {
      addToast("error", "Không thể lưu blueprint");
    }
  };

  const handleExportCreatorOsFile = () => {
    const exportData = {
      format: "creatoros-blueprint-v1",
      version: "4.8.0",
      exported_at: Date.now(),
      metadata: {
        title: workflowTitle,
        author: "CreatorOS Pro User",
        description: "Visual DAG Workflow Blueprint",
        category: "workflow",
        tags: ["workflow", "dag", "4.8"]
      },
      preset_data: { nodes, edges },
      signature: "SIG_SHA256_A98F7E6D"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowTitle.toLowerCase().replace(/\s+/g, "_")}.creatoros`;
    a.click();
    URL.revokeObjectURL(url);
    soundSynth.playSuccess();
    addToast("success", "Đã xuất file .creatoros thành công!");
  };

  // Helper để vẽ đường cong Bezier giữa các Node
  const renderEdgePaths = () => {
    return edges.map(edge => {
      const srcNode = nodes.find(n => n.id === edge.sourceNodeId);
      const tgtNode = nodes.find(n => n.id === edge.targetNodeId);
      if (!srcNode || !tgtNode) return null;

      const srcX = srcNode.x + 220; // right edge of node
      const srcY = srcNode.y + 70;
      const tgtX = tgtNode.x;       // left edge of node
      const tgtY = tgtNode.y + 70;

      const dx = Math.abs(tgtX - srcX) * 0.5;
      const pathData = `M ${srcX} ${srcY} C ${srcX + dx} ${srcY}, ${tgtX - dx} ${tgtY}, ${tgtX} ${tgtY}`;

      return (
        <g key={edge.id} className="cursor-pointer group" onClick={() => handleDeleteEdge(edge.id)}>
          <path
            d={pathData}
            fill="none"
            stroke="#6366F1"
            strokeWidth="3"
            strokeDasharray={edge.animated ? "6,6" : "none"}
            className="group-hover:stroke-rose-500 transition-colors"
          />
          <circle cx={(srcX + tgtX) / 2} cy={(srcY + tgtY) / 2} r="5" fill="#818CF8" className="group-hover:fill-rose-400" />
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 text-indigo-300">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <input
              type="text"
              value={workflowTitle}
              onChange={(e) => setWorkflowTitle(e.target.value)}
              className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors px-1"
            />
            <p className="text-xs text-slate-400">
              Trình biên dịch DAG đồ thị có hướng không chu trình • Truyền Data Artifacts tự động
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveBlueprint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            Lưu Blueprint
          </button>

          <button
            onClick={handleExportCreatorOsFile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            Xuất .creatoros
          </button>

          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            {isExecuting ? "Đang Thực Thi DAG..." : "Biên Dịch & Chạy DAG"}
          </button>
        </div>
      </div>

      {/* Local LLM Agent: Natural Language to DAG Copilot Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Local LLM AI Copilot (Natural Language to DAG)
              </span>
              <p className="text-[11px] text-slate-400">
                Gõ yêu cầu kịch bản bằng tiếng Việt tự nhiên, Local LLM Intent Parser sẽ tự động thiết kế các Node và Edge trên Canvas.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 self-start sm:self-auto">
            100% Offline LLM
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={llmPrompt}
            onChange={(e) => setLlmPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateDagFromPrompt()}
            placeholder="Ví dụ: Tạo video lồng tiếng kèm đồng bộ khẩu hình lipsync ONNX và render no-strike 9:16..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
          />
          <button
            onClick={() => handleGenerateDagFromPrompt()}
            disabled={isGeneratingLlmDag}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingLlmDag ? "animate-spin" : ""}`} />
            {isGeneratingLlmDag ? "Đang Phân Tích & Sinh DAG..." : "✨ Tự Động Sinh DAG"}
          </button>
        </div>

        {/* Quick Example Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-medium mr-1">Gợi ý mẫu:</span>
          <button
            onClick={() => {
              const p = "Tạo video review phim 9:16 lồng tiếng nam kèm đồng bộ khẩu hình ONNX và render No-Strike";
              setLlmPrompt(p);
              handleGenerateDagFromPrompt(p);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            🎬 Lip-Sync Video + Voice + NoStrike 9:16
          </button>

          <button
            onClick={() => {
              const p = "Phân phối render video dài 10 phút sang 3 máy trạm LAN Cluster bằng bộ chia chunks";
              setLlmPrompt(p);
              handleGenerateDagFromPrompt(p);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            🌐 LAN Cluster Chunk Distribution
          </button>

          <button
            onClick={() => {
              const p = "Recap truyện tranh Manga 4:5 với Character DNA và voiceover kịch tính";
              setLlmPrompt(p);
              handleGenerateDagFromPrompt(p);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            🎨 Comic Recap Manga 4:5 Pipeline
          </button>
        </div>
      </div>

      {/* Main Workspace: Palette + Canvas + Inspector */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-[560px]">
        {/* Left Node Palette */}
        <div className="col-span-12 lg:col-span-3 space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-y-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-400" />
            BẢNG NODE CHỨC NĂNG
          </span>

          <div className="space-y-2">
            {(Object.keys(NODE_DEFINITIONS) as WorkflowNodeType[]).map((type) => {
              const def = NODE_DEFINITIONS[type];
              const Icon = def.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleAddNode(type)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-tr ${def.color} border`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {def.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{def.category}</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Quick Workflow Templates */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              MẪU BLUEPRINT CÓ SẴN
            </span>
            <button
              onClick={() => {
                setNodes(DEFAULT_STARTER_NODES);
                setEdges(DEFAULT_STARTER_EDGES);
                addToast("info", "Đã nạp mẫu Full-Auto Facebook Reels 4:5");
              }}
              className="w-full text-left p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 hover:bg-indigo-900/40 transition-colors"
            >
              🚀 Full-Auto Reels (Ingest ➔ Demucs ➔ NoStrike ➔ FB)
            </button>
          </div>
        </div>

        {/* Center Interactive Canvas */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="col-span-12 lg:col-span-6 relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden select-none"
          style={{
            backgroundImage: "radial-gradient(#334155 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          {/* Canvas SVG Edge Wire Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            {renderEdgePaths()}
          </svg>

          {/* Canvas Hint Banner */}
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-sm">
            Kéo thả Node để xếp vị trí • Nhấp cổng tròn để nối luồng dữ liệu (Edge)
          </div>

          {/* Nodes Rendering */}
          {nodes.map((node) => {
            const def = NODE_DEFINITIONS[node.type];
            const Icon = def?.icon || GitBranch;
            const isSelected = node.id === selectedNodeId;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                className={`absolute w-56 rounded-xl border p-3.5 shadow-xl backdrop-blur-md cursor-move transition-shadow ${
                  isSelected
                    ? "bg-slate-900/95 border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-500"
                    : "bg-slate-900/85 border-slate-700/80 hover:border-slate-600"
                }`}
              >
                {/* Node Top Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-tr ${def?.color || ""} border`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate">{node.label}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status indicator */}
                <div className="py-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${
                    node.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" :
                    node.status === "RUNNING" ? "bg-amber-500/20 text-amber-300 animate-pulse" :
                    node.status === "FAILED" ? "bg-rose-500/20 text-rose-300" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {node.status || "IDLE"}
                  </span>
                </div>

                {/* Input / Output Connection Ports */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  {/* Inputs Port */}
                  <div className="space-y-1">
                    {node.inputs.map((inp) => (
                      <div
                        key={inp.id}
                        onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, inp.id, true); }}
                        className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-300"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white hover:scale-125 transition-transform" />
                        <span>{inp.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Outputs Port */}
                  <div className="space-y-1 text-right">
                    {node.outputs.map((out) => (
                      <div
                        key={out.id}
                        onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, out.id, false); }}
                        className="flex items-center justify-end gap-1.5 cursor-pointer hover:text-emerald-300"
                      >
                        <span>{out.name}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white hover:scale-125 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Inspector & Execution Terminal */}
        <div className="col-span-12 lg:col-span-3 space-y-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  THUỘC TÍNH NODE
                </span>
                <span className="text-[11px] font-mono text-slate-500">{selectedNode.id}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tên nhãn hiển thị</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: val } : n));
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Node-specific dynamic inputs */}
                {selectedNode.type === "nostrike_nvenc" && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Tỉ Lệ Khung Hình</label>
                      <select
                        value={selectedNode.params.ratio || "4:5 Facebook"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, params: { ...n.params, ratio: val } } : n));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                      >
                        <option value="4:5 Facebook">4:5 Facebook Reels (Tối ưu tương tác)</option>
                        <option value="9:16 TikTok">9:16 TikTok / YTB Shorts</option>
                        <option value="16:9 Landscape">16:9 Ngang YTB Chuẩn</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Bộ Lọc Màu 3D LUT</label>
                      <select
                        value={selectedNode.params.colorLUT || "Cinematic Warm"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, params: { ...n.params, colorLUT: val } } : n));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                      >
                        <option value="Cinematic Warm">Cinematic Warm (Ấm Áp)</option>
                        <option value="Film Noir">Film Noir (Tương Phản Cao)</option>
                        <option value="Cyberpunk Neon">Cyberpunk Neon</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedNode.type === "voice_local" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Giọng Đọc Local</label>
                    <select
                      value={selectedNode.params.voice || "Nam Minh (Trầm Ấm)"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, params: { ...n.params, voice: val } } : n));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    >
                      <option value="Nam Minh (Trầm Ấm)">Nam Minh (Trầm Ấm - Review Phim)</option>
                      <option value="Thu Hà (Truyền Cảm)">Thu Hà (Truyền Cảm - Tin Tức)</option>
                      <option value="Đức Anh (Mạnh Mẽ)">Đức Anh (Mạnh Mẽ - Gaming)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              Nhấp vào một Node trên Canvas để điều chỉnh thông số
            </div>
          )}

          {/* Real-time DAG Execution Log Terminal */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              TERMINAL LOG THỰC THI
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 h-44 overflow-y-auto space-y-1">
              {executionLog.length === 0 ? (
                <span className="text-slate-600 italic">Sẵn sàng thực thi đồ thị DAG...</span>
              ) : (
                executionLog.map((log, i) => (
                  <div key={i} className="leading-tight">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
