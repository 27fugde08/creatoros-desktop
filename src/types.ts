export type ActiveTab =
  | "orchestrator"
  | "workflow"
  | "presets"
  | "workflow-builder"
  | "blueprint-presets"
  | "lan-cluster"
  | "lipsync"
  | "highlight"
  | "review"
  | "translate"
  | "semi-edit"
  | "voice-local"
  | "seo-suite"
  | "batch-downloader"
  | "ai-comic"
  | "phone-farm"
  | "fb-suite"
  | "dashboard"
  | "api-docs"
  | "user-guide";

// Highlight Tool Types
export interface HighlightItem {
  id: string;
  startTime: string;
  endTime: string;
  hookTitle: string;
  viralScore: number;
  voiceScript: string;
  brollSuggestion: string;
  caption: string;
}

export interface HighlightResult {
  highlights: HighlightItem[];
  summary: string;
  retentionAdvice: string;
}

// Review Tool Types
export interface ReviewAct {
  actName: string;
  duration: string;
  content: string;
  visualPrompt: string;
}

export interface ReviewResult {
  title: string;
  language: string;
  hook: string;
  acts: ReviewAct[];
  verdict: {
    rating: string;
    pros: string[];
    cons: string[];
    targetAudience: string;
  };
  callToAction: string;
}

// Translate Video Types
export interface TranslationSegment {
  id: number;
  timeStart: string;
  timeEnd: string;
  original: string;
  translated: string;
  voiceEmotion: string;
  subtitleStyled: string;
}

export interface TranslationResult {
  sourceLang: string;
  targetLang: string;
  segments: TranslationSegment[];
  srtOutput: string;
}

// Semi-Content Editor Types
export interface SemiContentResult {
  projectTitle: string;
  splitLayout: {
    topVideo: string;
    bottomVideo: string;
    ratio: string;
  };
  audioModifications: {
    pitchShift: string;
    speedFactor: string;
    bgm: string;
    sfxCues: Array<{ time: string; sfx: string }>;
  };
  visualFilters: {
    colorLUT: string;
    grainLevel: string;
    borderFrame: string;
    mirrorHorizontal: boolean;
  };
  fairUseScore: number;
  voiceScript: string;
  renderChecklist: string[];
}

// SEO & Thumbnail Types
export interface ViralTitle {
  title: string;
  ctrEstimate: string;
  hookType: string;
}

export interface ThumbnailIdea {
  concept: string;
  textOverlay: string;
  focalPoint: string;
  promptForAIImage: string;
}

export interface SeoResult {
  viralTitles: ViralTitle[];
  optimizedDescription: string;
  rankedTags: string[];
  thumbnailIdeas: ThumbnailIdea[];
}

// AI Comic Types
export interface CharacterDNA {
  name: string;
  gender: string;
  appearance: string;
  seedPromptKey: string;
  consistentSeed: number;
}

export interface ComicPanel {
  panelNumber: number;
  sceneDescription: string;
  dialogue: string;
  soundEffect: string;
  visualPrompt: string;
}

export interface ComicStoryResult {
  characterDNA: CharacterDNA;
  storyTitle: string;
  panels: ComicPanel[];
}

// Channel Audit Types
export interface ChannelAuditResult {
  channelName: string;
  healthScore: number;
  retentionAnalysis: {
    dropOffPoint: string;
    avgWatchPercentage: string;
    idealDuration: string;
  };
  monetizationRPM: {
    estimatedRPM: string;
    rpmVN: string;
    potentialMonthlyRevenue: string;
  };
  strengths: string[];
  bottlenecks: string[];
  actionRoadmap30Days: Array<{ week: string; task: string }>;
}

// FB Automation Types
export interface FbMatrixSlot {
  slot: string;
  time: string;
  target: string;
}

export interface FbAutomationResult {
  title?: string;
  niche?: string;
  postCaption: string;
  firstCommentLink: string;
  fbAntiCopyrightMeasures: string[];
  scheduledTimes: string[];
  matrixSchedule?: FbMatrixSlot[];
  hashtags: string[];
  generatedMd5?: string;
  outputFile?: string;
  aspectRatio?: string;
}

// Batch Downloader Types
export interface DownloadQueueItem {
  id: string;
  url: string;
  platform: "tiktok" | "youtube" | "douyin" | "facebook" | "instagram" | "kuaishou" | "unknown";
  title: string;
  thumbnail: string;
  duration: string;
  resolution: string;
  fileSize: string;
  progress: number;
  status: "pending" | "downloading" | "completed" | "error";
  speed: string;
  errorCount?: number;
  retryAttempts?: number;
  errorLogs?: string[];
  videoId?: string;
}

// Global Task Queue Types
export type GlobalTaskType =
  | "download"
  | "video-edit"
  | "translate"
  | "highlight"
  | "voice-synth"
  | "fb-render"
  | "comic-render"
  | "seo-generate";

export type GlobalTaskStatus = "queued" | "processing" | "completed" | "failed" | "paused";

export interface GlobalTaskItem {
  id: string;
  type: GlobalTaskType;
  title: string;
  subtitle?: string;
  sourceUrl?: string;
  thumbnail?: string;
  targetChannel?: string;
  platform?: "tiktok" | "youtube" | "facebook" | "instagram" | "douyin" | "general";
  estimatedDuration?: string;
  resolution?: string;
  viralScore?: number;
  scriptSnippet?: string;
  tags?: string[];
  approved?: boolean;
  approvedAt?: number;
  scheduledTime?: string;
  progress: number; // 0 - 100
  status: GlobalTaskStatus;
  currentStep: string;
  speed?: string;
  eta?: string;
  createdAt: number;
  completedAt?: number;
  logs: Array<{ timestamp: string; message: string }>;
  outputArtifact?: {
    name: string;
    size?: string;
    type?: "video" | "audio" | "srt" | "zip" | "image";
    downloadUrl?: string;
  };
  error?: string;
}

export interface QueueStats {
  total: number;
  processing: number;
  queued: number;
  completed: number;
  failed: number;
  paused: number;
}

export interface QueueSettings {
  autoRemoveCompleted: boolean;
  autoRemoveDelaySeconds: number; // 0 (ngay lập tức), 5, 10, 30, 60, 300
  autoRemoveOnModalClose: boolean;
}

// Backend Sync & WebSocket Types
export type BackendConnectionStatus = "connected" | "connecting" | "polling" | "disconnected" | "simulation";

export interface BackendSyncConfig {
  enabled: boolean;
  wsUrl: string;
  httpUrl: string;
  pollIntervalMs: number;
  autoReconnect: boolean;
}

export interface BackendTaskUpdatePayload {
  id: string;
  progress?: number;
  status?: GlobalTaskStatus;
  currentStep?: string;
  speed?: string;
  eta?: string;
  outputArtifact?: GlobalTaskItem["outputArtifact"];
  error?: string;
  log?: { timestamp: string; message: string };
  logs?: Array<{ timestamp: string; message: string }>;
}

// Phone Farm Types
export interface PhoneDevice {
  id: string;
  name: string;
  brand: string;
  androidVersion: string;
  battery: number;
  status: "online" | "syncing" | "idle" | "farming";
  currentTask: string;
  ipProxy: string;
  screenImage: string;
  appsInstalled: string[];
}

// ========================================
// UNIFIED PIPELINE ORCHESTRATOR & HARDWARE TYPES
// ========================================

export type PipelinePriority = "HIGH" | "NORMAL" | "LOW";

export interface HardwareTelemetryStats {
  gpu_name: string;
  vram_total_mb: number;
  vram_used_mb: number;
  vram_percent: number;
  gpu_util_percent: number;
  gpu_temp_c?: number;
  nvenc_sessions?: number;
  ram_total_mb: number;
  ram_used_mb: number;
  ram_percent: number;
  nvme_cache_mb: number;
  throttling_active: boolean;
  nvme_speed_status?: string;
}

export interface PipelineStepNode {
  id: string;
  name: string;
  description: string;
  module: "ingestion" | "nostrike_edit" | "ai_highlight_review" | "local_voice_dub" | "fb_reels_dispatch" | "custom";
  status: "idle" | "running" | "completed" | "failed" | "skipped";
  iconName: string;
  estimatedVramMb: number;
  gpuAccelerated: boolean;
}

export interface PipelineJobItem {
  id: string;
  title: string;
  priority: PipelinePriority;
  status: "queued" | "running" | "paused" | "completed" | "failed";
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: string[];
  artifacts?: Record<string, any>;
  checkpointSaved: boolean;
  hardwareSnapshot?: HardwareTelemetryStats | null;
  logs?: string[];
  progress: number;
  createdAt: number;
  updatedAt?: number;
}

// ========================================
// AGENTIC ADVANCED TYPES (WS Bridge, Self-Healing, Vector RAG)
// ========================================

export interface WsBridgeStatus {
  status: "connected" | "disconnected" | "reconnecting";
  protocol: string;
  version: string;
  channels: string[];
  latency_ms: number;
  active_connections: number;
}

export interface HealingIncidentItem {
  id: string;
  pipeline_id: string;
  task_type: string;
  error_category: string;
  error_raw_snippet?: string;
  root_cause_analysis: string;
  suggested_action: string;
  fallback_parameters?: Record<string, any>;
  fallback_parameters_json?: string;
  retry_count: number;
  resolved: number | boolean;
  created_at: number;
  resolved_at?: number | null;
}

export interface RagDocumentItem {
  doc_id: string;
  title: string;
  source_type: string;
  total_chunks: number;
  created_at: number;
}

export interface RagSearchResultItem {
  chunk_id: string;
  doc_id: string;
  start_time: string;
  end_time: string;
  text: string;
  similarity: number;
  similarity_percent: number;
  viral_score: number;
  emotional_tag: string;
}

export interface QcReport {
  qc_passed: boolean;
  qc_score: number;
  status: "APPROVED" | "REQUIRES_ATTENTION" | "REJECTED";
  total_clips: number;
  estimated_duration_sec: number;
  fair_use_ratio: number;
  narrative_arc: string;
  issues: string[];
  recommendations: string[];
  fixes_applied: string[];
  timestamp: number;
}

// ========================================
// DRM & HARDWARE FINGERPRINT TYPES
// ========================================

export type LicenseTier = "COMMUNITY" | "PRO_V48" | "ENTERPRISE" | "LIFETIME_STUDIO";

export interface HardwareFingerprint {
  machine_guid: string;
  cpu_model: string;
  disk_serial_hash: string;
  mac_hash: string;
  fingerprint_code: string;
  os_platform: string;
  generated_at: number;
}

export interface LicenseStatus {
  is_activated: boolean;
  tier: LicenseTier;
  license_key: string;
  fingerprint_bound: string;
  owner_name: string;
  issued_at: number;
  expires_at: number; // 0 for lifetime
  max_nvenc_streams: number;
  features: {
    unlimited_dag: boolean;
    demucs_gpu_isolation: boolean;
    local_voice_cloning: boolean;
    no_strike_matrix: boolean;
    batch_fb_phone_farm: boolean;
    ota_priority_updates: boolean;
  };
}

// ========================================
// VISUAL WORKFLOW BUILDER (DAG) TYPES
// ========================================

export type WorkflowNodeType =
  | "ingest_video"
  | "demucs_stem"
  | "nostrike_nvenc"
  | "voice_local"
  | "lipsync_onnx"
  | "lan_distributed"
  | "chunk_splitter"
  | "ai_recap"
  | "qc_validation"
  | "fb_dispatch";

export interface WorkflowNodePort {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "json" | "any";
}

export interface WorkflowNodeData {
  id: string;
  type: WorkflowNodeType;
  title: string;
  label: string;
  x: number;
  y: number;
  status?: "IDLE" | "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress?: number;
  params: Record<string, any>;
  inputs: WorkflowNodePort[];
  outputs: WorkflowNodePort[];
  outputArtifacts?: Record<string, any>;
  errorMessage?: string;
}

export interface WorkflowEdgeData {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  animated?: boolean;
}

export interface WorkflowDAG {
  workflow_id: string;
  title: string;
  description?: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  created_at: number;
  updated_at: number;
}

export interface WorkflowExecutionPlan {
  workflow_id: string;
  stages: Array<{
    stage_index: number;
    parallel_nodes: string[];
  }>;
  total_nodes: number;
  execution_order: string[];
}

// ========================================
// USER PRESETS & BLUEPRINTS TYPES
// ========================================

export type PresetCategory = "nostrike" | "voice" | "script" | "workflow" | "qc" | "general" | "social" | "recap";

export interface UserPresetItem {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  config: Record<string, any>;
  tags: string[];
  is_favorite: boolean;
  created_at: number;
  updated_at: number;
}

export interface BlueprintExportPackage {
  format: "creatoros-blueprint-v1";
  version: string;
  exported_at: number;
  metadata: {
    title: string;
    author: string;
    description: string;
    category: string;
    tags: string[];
  };
  preset_data: Record<string, any>;
  signature: string;
}

// ========================================
// SECURE OTA UPDATER TYPES
// ========================================

export interface OtaUpdateMetadata {
  current_version: string;
  latest_version: string;
  has_update: boolean;
  release_date: string;
  release_name: string;
  release_notes: string[];
  download_url: string;
  package_size_mb: number;
  sha256_checksum: string;
  mandatory: boolean;
}

export interface OtaDownloadProgress {
  status: "IDLE" | "CHECKING" | "DOWNLOADING" | "VERIFYING_SHA256" | "READY_TO_RESTART" | "FAILED";
  percent: number;
  downloaded_mb?: number;
  total_mb?: number;
  downloaded_bytes?: number;
  total_bytes?: number;
  speed_mbps: number;
  eta_seconds: number;
  error?: string;
}

// ========================================
// 5. LOCAL LLM AGENT (NATURAL LANGUAGE TO DAG)
// ========================================

export interface LocalLlmStatus {
  version: string;
  model_name: string;
  backend: string;
  gpu_layers_offloaded: number;
  context_window: number;
  is_loaded: boolean;
  supported_models: Array<{
    id: string;
    name: string;
    vram_mb: number;
    recommended: boolean;
  }>;
}

export interface LlmDagResult {
  success: boolean;
  workflow_id: string;
  dag: {
    workflow_id: string;
    name: string;
    description: string;
    intent_detected: string;
    confidence_score: number;
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      config: Record<string, any>;
    }>;
    edges: Array<{
      id: string;
      sourceNodeId: string;
      targetNodeId: string;
    }>;
    metadata?: Record<string, any>;
  };
  summary: string;
}

// ========================================
// 6. MASTER-WORKER LAN CLUSTER RENDERING
// ========================================

export interface LanWorkerItem {
  worker_id: string;
  hostname: string;
  ip_address: string;
  port: number;
  gpu_name: string;
  vram_total_mb: number;
  vram_free_mb: number;
  vram_percent: number;
  status: "IDLE" | "RENDERING" | "BUSY" | "OFFLINE";
  speed_factor: number;
  is_alive: boolean;
  active_chunks: string[];
}

export interface LanClusterStatus {
  cluster_version: string;
  master_node: {
    hostname: string;
    ip: string;
    port: number;
  };
  total_nodes: number;
  active_nodes: number;
  total_vram_mb: number;
  free_vram_mb: number;
  cluster_vram_percent: number;
  workers: LanWorkerItem[];
}

export interface LanRenderChunk {
  chunk_id: string;
  index: number;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  assigned_worker_id: string;
  assigned_worker_name: string;
  assigned_worker_ip: string;
  status: "READY" | "RENDERING" | "COMPLETED" | "FAILED";
  progress_percent: number;
  output_filename: string;
}

export interface LanJobPlan {
  job_id: string;
  source_video: string;
  total_duration_sec: number;
  total_chunks: number;
  workers_allocated: number;
  estimated_render_time_sec: number;
  speedup_vs_single_node: string;
  chunks: LanRenderChunk[];
  final_output_path: string;
}

// ========================================
// 7. LOCAL AI LIP-SYNC (ONNX / TENSORRT)
// ========================================

export interface LipSyncEngineInfo {
  engine: string;
  model_name: string;
  active_provider: "TensorrtExecutionProvider" | "CUDAExecutionProvider" | "CPUExecutionProvider";
  supported_providers: string[];
  is_cuda_available: boolean;
  is_tensorrt_available: boolean;
  target_fps: number;
  inference_batch_size: number;
  face_crop_size: string;
  features: string[];
}

export interface LipSyncProcessResult {
  output_video: string;
  source_video: string;
  source_audio: string;
  provider_used: string;
  metrics: {
    total_frames_processed: number;
    video_duration_sec: number;
    inference_fps: number;
    total_execution_time_sec: number;
    sync_confidence_score: number;
    vram_peak_mb: number;
    face_landmarks_detected: number;
  };
  message: string;
}




