#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Enterprise WebSocket JSON-RPC 2.0 IPC Bridge
Chạy ngầm cục bộ tại ws://127.0.0.1:8765 để giao tiếp hai chiều thời gian thực
với Electron Main Process, Preload Script và Node.js Express Server.

Đặc điểm:
1. Chuẩn JSON-RPC 2.0: {"jsonrpc": "2.0", "method": "...", "params": {...}, "id": ...}
2. Hỗ trợ Server-Initiated Notifications (render_log, render_progress, hardware_metrics, healing_incident).
3. Zero External Dependencies (Thuần Python socket + threading + hashlib) chạy 100% offline.
4. Tích hợp Hardware Governor, Local Vector RAG, Agentic Self-Healing và QC Agent.
"""

import sys
import os
import io

if sys.stdout and hasattr(sys.stdout, 'encoding') and sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import time
import socket
import threading
import hashlib
import base64
import struct
import argparse
from typing import Dict, List, Set, Any, Optional

# Import Core Sub-Engines
try:
    from hardware_governor import governor
except ImportError:
    governor = None

try:
    from state_manager import state_manager
except ImportError:
    state_manager = None

try:
    from local_rag_engine import local_rag
except ImportError:
    local_rag = None

try:
    from agentic_self_healing import self_healing_engine
except ImportError:
    self_healing_engine = None

try:
    from qc_agent import qc_agent
except ImportError:
    qc_agent = None

try:
    from hardware_fingerprint import fingerprint_engine
except ImportError:
    fingerprint_engine = None

try:
    from workflow_dag_compiler import workflow_executor, WorkflowDAGCompiler
except ImportError:
    workflow_executor = None
    WorkflowDAGCompiler = None

try:
    from ota_updater import ota_updater
except ImportError:
    ota_updater = None

try:
    from local_llm_agent import local_llm_agent
except ImportError:
    local_llm_agent = None

try:
    from lan_distributed_render import lan_distributed_engine
except ImportError:
    lan_distributed_engine = None

try:
    from local_lipsync_engine import local_lipsync_engine
except ImportError:
    local_lipsync_engine = None

from creatoros_constants import (
    DEFAULT_WS_HOST,
    DEFAULT_WS_PORT
)
from creatoros_errors import (
    ErrorCode,
    CreatorOSError,
    get_structured_logger
)

logger = get_structured_logger("WSBridge")

DEFAULT_HOST = DEFAULT_WS_HOST
DEFAULT_PORT = DEFAULT_WS_PORT
MAGIC_WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


class EnterpriseJsonRpcWsBridge:
    """
    WebSocket Server chuẩn JSON-RPC 2.0 cho kiến trúc Local AI Studio
    """
    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT):
        self.host = host
        self.port = port
        self.server_socket = None
        self.clients: Set[socket.socket] = set()
        self.clients_lock = threading.Lock()
        self.is_running = False
        self.rpc_methods: Dict[str, Any] = {}
        self.stats = {
            "start_time": time.time(),
            "messages_sent": 0,
            "messages_received": 0,
            "connected_clients": 0,
            "rpc_calls_handled": 0,
            "healing_events": 0,
            "rag_queries": 0
        }
        
        # Kết nối broadcast callback
        if workflow_executor:
            workflow_executor.broadcast = self.broadcast
        if ota_updater:
            ota_updater.broadcast = self.broadcast

        self._register_default_rpc_methods()

    def _register_default_rpc_methods(self):
        """Đăng ký các RPC methods tiêu chuẩn"""
        self.rpc_methods["ping"] = self._rpc_ping
        self.rpc_methods["system.ping"] = self._rpc_ping
        self.rpc_methods["system.info"] = self._rpc_system_info
        self.rpc_methods["governor.telemetry"] = self._rpc_governor_telemetry
        self.rpc_methods["governor.clean_cache"] = self._rpc_governor_clean_cache
        self.rpc_methods["governor.empty_vram"] = self._rpc_governor_empty_vram
        self.rpc_methods["rag.index"] = self._rpc_rag_index
        self.rpc_methods["rag.search"] = self._rpc_rag_search
        self.rpc_methods["rag.list_docs"] = self._rpc_rag_list_docs
        self.rpc_methods["qc.validate"] = self._rpc_qc_validate
        self.rpc_methods["healing.simulate"] = self._rpc_healing_simulate
        self.rpc_methods["healing.list_incidents"] = self._rpc_healing_list
        self.rpc_methods["state.get_pipeline"] = self._rpc_state_get_pipeline
        self.rpc_methods["state.create_pipeline"] = self._rpc_state_create_pipeline
        self.rpc_methods["state.complete_stage"] = self._rpc_state_complete_stage
        self.rpc_methods["state.fail_stage"] = self._rpc_state_fail_stage
        self.rpc_methods["state.get_resumable"] = self._rpc_state_get_resumable
        self.rpc_methods["state.list_all"] = self._rpc_state_list_all
        
        # 1. DRM License & Hardware Fingerprinting
        self.rpc_methods["license.get_fingerprint"] = self._rpc_license_get_fingerprint
        self.rpc_methods["license.activate"] = self._rpc_license_activate
        self.rpc_methods["license.get_status"] = self._rpc_license_get_status
        self.rpc_methods["license.deactivate"] = self._rpc_license_deactivate

        # 2. Visual Workflow Builder DAG
        self.rpc_methods["workflow.validate"] = self._rpc_workflow_validate
        self.rpc_methods["workflow.compile_and_execute"] = self._rpc_workflow_compile_execute
        self.rpc_methods["workflow.get_status"] = self._rpc_workflow_get_status

        # 3. Blueprint & User Presets
        self.rpc_methods["preset.save"] = self._rpc_preset_save
        self.rpc_methods["preset.list"] = self._rpc_preset_list
        self.rpc_methods["preset.get"] = self._rpc_preset_get
        self.rpc_methods["preset.delete"] = self._rpc_preset_delete
        self.rpc_methods["preset.export_blueprint"] = self._rpc_preset_export
        self.rpc_methods["preset.import_blueprint"] = self._rpc_preset_import

        # 4. Secure OTA Updater
        self.rpc_methods["ota.check_update"] = self._rpc_ota_check
        self.rpc_methods["ota.download_update"] = self._rpc_ota_download
        self.rpc_methods["ota.apply_update"] = self._rpc_ota_apply
        self.rpc_methods["ota.get_status"] = self._rpc_ota_get_status

        # 5. Local LLM Agent (Natural Language to DAG)
        self.rpc_methods["llm.parse_prompt_to_dag"] = self._rpc_llm_parse_prompt_to_dag
        self.rpc_methods["llm.get_status"] = self._rpc_llm_get_status

        # 6. Master-Worker LAN Distributed Video Rendering
        self.rpc_methods["lan.get_cluster_status"] = self._rpc_lan_get_cluster_status
        self.rpc_methods["lan.plan_distributed_job"] = self._rpc_lan_plan_job
        self.rpc_methods["lan.simulate_chunk_render"] = self._rpc_lan_simulate_chunk_render

        # 7. Local ONNX / TensorRT Lip-Sync
        self.rpc_methods["lipsync.get_engine_info"] = self._rpc_lipsync_get_info
        self.rpc_methods["lipsync.process_sync"] = self._rpc_lipsync_process_sync

    def _rpc_ping(self, params: Dict[str, Any]) -> Dict[str, Any]:
        telemetry = governor.query_system_telemetry() if governor else {}
        vram_stats = {
            "vram_total_mb": telemetry.get("vram_total_mb", 6144),
            "vram_used_mb": telemetry.get("vram_used_mb", 1850),
            "vram_percent": telemetry.get("vram_percent", 30.1),
            "gpu_name": telemetry.get("gpu_name", "NVIDIA GeForce GTX 1660 SUPER")
        }
        cpu_stats = {
            "cpu_percent": telemetry.get("cpu_percent", 18),
            "ram_percent": telemetry.get("ram_percent", 33.1),
            "ram_used_mb": telemetry.get("ram_used_mb", 5420),
            "ram_total_mb": telemetry.get("ram_total_mb", 16384)
        }
        return {
            "status": "online",
            "pong": True,
            "server_timestamp": time.time(),
            "server_time": time.time(),
            "uptime_sec": round(time.time() - self.stats["start_time"], 1),
            "connected_clients": len(self.clients),
            "vram": vram_stats,
            "cpu": cpu_stats,
            "hardware_telemetry": telemetry
        }

    def _rpc_system_info(self, params: Dict[str, Any]) -> Dict[str, Any]:
        telemetry = governor.query_system_telemetry() if governor else {}
        return {
            "name": "CREATOROS Enterprise Local Studio",
            "version": "3.3.0-Enterprise",
            "protocol": "JSON-RPC 2.0 (WebSocket IPC)",
            "telemetry": telemetry,
            "stats": self.stats
        }

    def _rpc_governor_telemetry(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if governor:
            return governor.query_system_telemetry()
        return {"error": "Governor not initialized"}

    def _rpc_governor_clean_cache(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if governor:
            keep_checkpoints = params.get("keep_checkpoints", True)
            return governor.clean_cache(keep_checkpoints=keep_checkpoints)
        return {"error": "Governor not initialized"}

    def _rpc_governor_empty_vram(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if governor:
            governor.collect_garbage_and_empty_vram()
            return {"success": True, "message": "Đã giải phóng VRAM và RAM rác!"}
        return {"error": "Governor not initialized"}

    def _rpc_rag_index(self, params: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = params.get("doc_id", f"rag_{int(time.time())}")
        title = params.get("title", "Tài Liệu Mới")
        content = params.get("content", "")
        source_type = params.get("source_type", "transcript")
        if local_rag:
            self.stats["rag_queries"] += 1
            return local_rag.index_document(doc_id, title, content, source_type)
        return {"error": "Local RAG not initialized"}

    def _rpc_rag_search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        query = params.get("query", "")
        top_k = params.get("top_k", 5)
        doc_id = params.get("doc_id", None)
        if local_rag:
            self.stats["rag_queries"] += 1
            results = local_rag.semantic_search(query, top_k=top_k, doc_id=doc_id)
            return {"query": query, "results": results, "count": len(results)}
        return {"error": "Local RAG not initialized"}

    def _rpc_rag_list_docs(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if local_rag:
            docs = local_rag.list_all_documents()
            return {"documents": docs, "count": len(docs)}
        return {"documents": [], "count": 0}

    def _rpc_qc_validate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        transcript = params.get("transcript", "")
        highlights = params.get("highlights", [])
        metadata = params.get("metadata", {})
        if qc_agent:
            report = qc_agent.evaluate_highlight_batch(transcript, highlights, metadata)
            self.broadcast("qc_report", report)
            return report
        return {"error": "QC Agent not initialized"}

    def _rpc_healing_simulate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        error_type = params.get("error_type", "CUDA_VRAM_OOM")
        if self_healing_engine:
            self.stats["healing_events"] += 1
            rec = self_healing_engine.diagnose_and_resolve(
                pipeline_id=params.get("pipeline_id", f"sim_{int(time.time())}"),
                task_type="simulation",
                raw_error=f"Simulated error: {error_type} triggered via JSON-RPC"
            )
            self.broadcast("healing_incident", rec)
            return rec
        return {"error": "Self-Healing engine not initialized"}

    def _rpc_healing_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if self_healing_engine:
            incidents = self_healing_engine.list_incidents(limit=params.get("limit", 20))
            return {"incidents": incidents, "count": len(incidents)}
        return {"incidents": [], "count": 0}

    def _rpc_state_get_pipeline(self, params: Dict[str, Any]) -> Dict[str, Any]:
        pipeline_id = params.get("pipeline_id", "")
        if state_manager and pipeline_id:
            state = state_manager.get_pipeline_state(pipeline_id)
            return {"pipeline": state}
        return {"error": "State Manager not initialized or missing pipeline_id"}

    def _rpc_state_create_pipeline(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            pipeline_id = params.get("pipeline_id", f"dag_{int(time.time())}")
            title = params.get("title", "Master DAG Pipeline")
            priority = params.get("priority", "HIGH")
            config = params.get("config", {})
            created = state_manager.create_or_get_pipeline(pipeline_id, title, priority, config)
            self.broadcast("pipeline_created", created)
            return created
        return {"error": "State Manager not initialized"}

    def _rpc_state_complete_stage(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            pipeline_id = params.get("pipeline_id", "")
            stage_name = params.get("stage_name", "")
            stage_index = params.get("stage_index", 0)
            total_stages = params.get("total_stages", 6)
            output_artifacts = params.get("output_artifacts", {})
            exec_time = params.get("execution_time_ms", 0)
            res = state_manager.complete_stage(pipeline_id, stage_name, stage_index, total_stages, output_artifacts, exec_time)
            self.broadcast("stage_completed", res)
            self.broadcast("render_progress", {
                "pipeline_id": pipeline_id,
                "stage": stage_name,
                "progress_percent": res["progress_percent"]
            })
            return res
        return {"error": "State Manager not initialized"}

    def _rpc_state_fail_stage(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            pipeline_id = params.get("pipeline_id", "")
            stage_name = params.get("stage_name", "")
            error_message = params.get("error_message", "Unknown error")
            state_manager.fail_stage(pipeline_id, stage_name, error_message)
            self.broadcast("stage_failed", {"pipeline_id": pipeline_id, "stage": stage_name, "error": error_message})
            return {"success": True, "pipeline_id": pipeline_id, "stage": stage_name}
        return {"error": "State Manager not initialized"}

    def _rpc_state_get_resumable(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            resumable = state_manager.get_resumable_pipelines()
            return {"resumable_pipelines": resumable, "count": len(resumable)}
        return {"resumable_pipelines": [], "count": 0}

    def _rpc_state_list_all(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            limit = params.get("limit", 50)
            pipes = state_manager.list_all_pipelines(limit=limit)
            return {"pipelines": pipes, "count": len(pipes)}
        return {"pipelines": [], "count": 0}

    # =========================================================================
    # 1. DRM LICENSE & HARDWARE FINGERPRINTING RPC
    # =========================================================================

    def _rpc_license_get_fingerprint(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if fingerprint_engine:
            return fingerprint_engine.generate_fingerprint()
        return {"error": "Fingerprint engine not initialized"}

    def _rpc_license_activate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        license_key = params.get("license_key", "").strip()
        if not license_key:
            return {"success": False, "error": "Vui lòng nhập License Key"}

        fp = fingerprint_engine.generate_fingerprint() if fingerprint_engine else {"fingerprint_code": "CR-LOCAL-DEMO"}
        curr_fp_code = fp["fingerprint_code"]

        validation = fingerprint_engine.verify_license_key(license_key, curr_fp_code) if fingerprint_engine else {"valid": True, "tier": "PRO_V48"}
        
        if not validation.get("valid"):
            return {"success": False, "error": validation.get("error", "Khóa bản quyền không hợp lệ")}

        license_record = {
            "license_key": license_key,
            "tier": validation.get("tier", "PRO_V48"),
            "owner": validation.get("owner", "Licensed Creator"),
            "fingerprint_bound": curr_fp_code,
            "issued_at": int(time.time()),
            "expires_at": validation.get("expires_at", 0),
            "features": validation.get("features", {})
        }

        if state_manager:
            state_manager.save_license_activation(license_record)

        self.broadcast("license_activated", {
            "tier": license_record["tier"],
            "owner": license_record["owner"]
        })

        return {
            "success": True,
            "message": f"Kích hoạt thành công gói {license_record['tier']}!",
            "license": license_record
        }

    def _rpc_license_get_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        fp = fingerprint_engine.generate_fingerprint() if fingerprint_engine else {}
        active_lic = state_manager.get_active_license() if state_manager else None

        if active_lic:
            return {
                "is_activated": True,
                "tier": active_lic.get("tier", "PRO_V48"),
                "owner_name": active_lic.get("owner_name", "Creator VIP"),
                "license_key": active_lic.get("license_key", ""),
                "fingerprint_bound": active_lic.get("fingerprint_bound", ""),
                "expires_at": active_lic.get("expires_at", 0),
                "features": active_lic.get("features", {}),
                "hardware_fingerprint": fp
            }
        else:
            return {
                "is_activated": False,
                "tier": "COMMUNITY",
                "owner_name": "Community User",
                "license_key": "",
                "fingerprint_bound": fp.get("fingerprint_code", ""),
                "expires_at": 0,
                "features": {
                    "unlimited_dag": False,
                    "demucs_gpu_isolation": False,
                    "local_voice_cloning": False,
                    "no_strike_matrix": True,
                    "batch_fb_phone_farm": False,
                    "ota_priority_updates": False,
                    "max_nvenc_streams": 1
                },
                "hardware_fingerprint": fp
            }

    def _rpc_license_deactivate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if state_manager:
            state_manager.deactivate_license()
        self.broadcast("license_deactivated", {})
        return {"success": True, "message": "Đã hủy kích hoạt bản quyền trên thiết bị này"}

    # =========================================================================
    # 2. VISUAL WORKFLOW BUILDER DAG RPC
    # =========================================================================

    def _rpc_workflow_validate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        dag_data = params.get("dag", {})
        if WorkflowDAGCompiler:
            return WorkflowDAGCompiler.validate_and_compile(dag_data)
        return {"valid": False, "error": "DAG Compiler not loaded"}

    def _rpc_workflow_compile_execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        dag_data = params.get("dag", {})
        if workflow_executor:
            return workflow_executor.execute_workflow_async(dag_data)
        return {"success": False, "error": "Workflow executor not initialized"}

    def _rpc_workflow_get_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        workflow_id = params.get("workflow_id", "")
        if workflow_executor and workflow_id:
            with workflow_executor._lock:
                exec_state = workflow_executor.active_executions.get(workflow_id)
                if exec_state:
                    return {"workflow_id": workflow_id, "state": exec_state}
        if state_manager and workflow_id:
            pipe = state_manager.get_pipeline_state(workflow_id)
            return {"workflow_id": workflow_id, "pipeline": pipe}
        return {"error": "Workflow execution not found"}

    # =========================================================================
    # 3. USER PRESETS & BLUEPRINTS RPC
    # =========================================================================

    def _rpc_preset_save(self, params: Dict[str, Any]) -> Dict[str, Any]:
        preset_id = params.get("preset_id") or f"preset_{int(time.time()*1000)}"
        name = params.get("name", "Cấu hình tùy biến")
        category = params.get("category", "nostrike")
        config = params.get("config", {})
        description = params.get("description", "")
        tags = params.get("tags", [])
        is_fav = params.get("is_favorite", False)

        if state_manager:
            saved = state_manager.save_preset(preset_id, name, category, config, description, tags, is_fav)
            self.broadcast("preset_updated", saved)
            return {"success": True, "preset": saved}
        return {"error": "State Manager not initialized"}

    def _rpc_preset_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        category = params.get("category")
        if state_manager:
            presets = state_manager.list_presets(category)
            return {"presets": presets, "count": len(presets)}
        return {"presets": [], "count": 0}

    def _rpc_preset_get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        preset_id = params.get("preset_id", "")
        if state_manager and preset_id:
            p = state_manager.get_preset(preset_id)
            if p:
                return {"preset": p}
            return {"error": "Preset not found"}
        return {"error": "Missing preset_id"}

    def _rpc_preset_delete(self, params: Dict[str, Any]) -> Dict[str, Any]:
        preset_id = params.get("preset_id", "")
        if state_manager and preset_id:
            ok = state_manager.delete_preset(preset_id)
            self.broadcast("preset_deleted", {"preset_id": preset_id})
            return {"success": ok}
        return {"error": "Missing preset_id"}

    def _rpc_preset_export(self, params: Dict[str, Any]) -> Dict[str, Any]:
        preset_id = params.get("preset_id", "")
        preset = state_manager.get_preset(preset_id) if state_manager and preset_id else None
        if not preset:
            return {"success": False, "error": "Không tìm thấy preset cần xuất"}

        export_package = {
            "format": "creatoros-blueprint-v1",
            "version": "4.8.0",
            "exported_at": int(time.time()),
            "metadata": {
                "title": preset["name"],
                "author": "CreatorOS User",
                "description": preset.get("description", ""),
                "category": preset.get("category", "general"),
                "tags": preset.get("tags", [])
            },
            "preset_data": preset.get("config", {}),
            "signature": hashlib.sha256(json.dumps(preset.get("config", {})).encode("utf-8")).hexdigest()[:16].upper()
        }
        return {"success": True, "blueprint_package": export_package}

    def _rpc_preset_import(self, params: Dict[str, Any]) -> Dict[str, Any]:
        package = params.get("blueprint_package", {})
        if package.get("format") != "creatoros-blueprint-v1":
            return {"success": False, "error": "Định dạng file không phải là .creatoros blueprint hợp lệ"}

        meta = package.get("metadata", {})
        preset_id = f"imp_{int(time.time()*1000)}"
        name = meta.get("title", "Imported Blueprint")
        category = meta.get("category", "workflow")
        config = package.get("preset_data", {})
        desc = meta.get("description", "Được nhập từ file .creatoros")
        tags = meta.get("tags", ["imported"])

        if state_manager:
            saved = state_manager.save_preset(preset_id, name, category, config, desc, tags, False)
            self.broadcast("preset_updated", saved)
            return {"success": True, "preset": saved}
        return {"error": "State Manager not initialized"}

    # =========================================================================
    # 4. SECURE OTA UPDATER RPC
    # =========================================================================

    def _rpc_ota_check(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if ota_updater:
            return ota_updater.check_update()
        return {"error": "OTA updater not initialized"}

    def _rpc_ota_download(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if ota_updater:
            return ota_updater.start_download_async()
        return {"error": "OTA updater not initialized"}

    def _rpc_ota_apply(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if ota_updater:
            return ota_updater.apply_update_and_restart()
        return {"error": "OTA updater not initialized"}

    def _rpc_ota_get_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if ota_updater:
            return ota_updater.get_status()
        return {"error": "OTA updater not initialized"}

    # =========================================================================
    # 5. LOCAL LLM AGENT (NATURAL LANGUAGE TO DAG) RPC
    # =========================================================================

    def _rpc_llm_parse_prompt_to_dag(self, params: Dict[str, Any]) -> Dict[str, Any]:
        prompt = params.get("prompt", "")
        preferences = params.get("preferences", {})
        if local_llm_agent:
            res = local_llm_agent.parse_prompt_to_dag(prompt, preferences)
            self.broadcast("llm_dag_generated", {"workflow_id": res.get("workflow_id"), "prompt": prompt})
            return res
        return {"success": False, "error": "Local LLM Agent not initialized"}

    def _rpc_llm_get_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if local_llm_agent:
            return local_llm_agent.get_status()
        return {"error": "Local LLM Agent not initialized"}

    # =========================================================================
    # 6. MASTER-WORKER LAN DISTRIBUTED VIDEO RENDERING RPC
    # =========================================================================

    def _rpc_lan_get_cluster_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if lan_distributed_engine:
            return lan_distributed_engine.get_cluster_status()
        return {"error": "LAN Distributed Render Engine not initialized"}

    def _rpc_lan_plan_job(self, params: Dict[str, Any]) -> Dict[str, Any]:
        job_id = params.get("job_id", f"job_lan_{int(time.time())}")
        source_video = params.get("source_video", "input/video.mp4")
        duration = float(params.get("total_duration_sec", 120.0))
        config = params.get("render_config", {})
        if lan_distributed_engine:
            plan = lan_distributed_engine.plan_distributed_job(job_id, source_video, duration, config)
            self.broadcast("lan_job_planned", plan)
            return {"success": True, "plan": plan}
        return {"success": False, "error": "LAN Distributed Render Engine not initialized"}

    def _rpc_lan_simulate_chunk_render(self, params: Dict[str, Any]) -> Dict[str, Any]:
        job_plan = params.get("job_plan", {})
        if lan_distributed_engine:
            res = lan_distributed_engine.simulate_chunk_execution(job_plan)
            self.broadcast("lan_render_completed", res)
            return res
        return {"success": False, "error": "LAN Distributed Render Engine not initialized"}

    # =========================================================================
    # 7. LOCAL AI LIP-SYNC (ONNX / TENSORRT) RPC
    # =========================================================================

    def _rpc_lipsync_get_info(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if local_lipsync_engine:
            return local_lipsync_engine.get_engine_info()
        return {"error": "Local Lip-Sync Engine not initialized"}

    def _rpc_lipsync_process_sync(self, params: Dict[str, Any]) -> Dict[str, Any]:
        video_path = params.get("video_path", "")
        audio_path = params.get("audio_path", "")
        output_path = params.get("output_path")
        config = params.get("config", {})
        if local_lipsync_engine:
            res = local_lipsync_engine.process_lip_sync(video_path, audio_path, output_path, config)
            self.broadcast("lipsync_completed", res)
            return res
        return {"success": False, "error": "Local Lip-Sync Engine not initialized"}

    # =========================================================================
    # WEBSOCKET PROTOCOL ENCODING & FRAMING
    # =========================================================================

    def _create_handshake_response(self, headers: str) -> bytes:
        sec_key = ""
        for line in headers.split("\r\n"):
            if line.lower().startswith("sec-websocket-key:"):
                sec_key = line.split(":", 1)[1].strip()
                break
        
        if not sec_key:
            return b"HTTP/1.1 400 Bad Request\r\n\r\n"

        accept_val = base64.b64encode(
            hashlib.sha1((sec_key + MAGIC_WS_GUID).encode("utf-8")).digest()
        ).decode("utf-8")

        response = (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept_val}\r\n\r\n"
        )
        return response.encode("utf-8")

    def _encode_ws_frame(self, message: str) -> bytes:
        payload = message.encode("utf-8")
        payload_len = len(payload)
        header = bytearray()
        header.append(0x81)  # FIN + Text frame

        if payload_len <= 125:
            header.append(payload_len)
        elif payload_len <= 65535:
            header.append(126)
            header.extend(struct.pack("!H", payload_len))
        else:
            header.append(127)
            header.extend(struct.pack("!Q", payload_len))

        return bytes(header) + payload

    def _decode_ws_frame(self, client_sock: socket.socket) -> Optional[str]:
        try:
            head = client_sock.recv(2)
            if not head or len(head) < 2:
                return None
            byte1, byte2 = head[0], head[1]
            opcode = byte1 & 0x0F
            if opcode == 0x8:  # Close frame
                return None

            is_masked = (byte2 & 0x80) != 0
            payload_len = byte2 & 0x7F

            if payload_len == 126:
                ext = client_sock.recv(2)
                if len(ext) < 2:
                    return None
                payload_len = struct.unpack("!H", ext)[0]
            elif payload_len == 127:
                ext = client_sock.recv(8)
                if len(ext) < 8:
                    return None
                payload_len = struct.unpack("!Q", ext)[0]

            mask_key = None
            if is_masked:
                mask_key = client_sock.recv(4)
                if len(mask_key) < 4:
                    return None

            # Nhận toàn bộ payload
            data = bytearray()
            remaining = payload_len
            while remaining > 0:
                chunk = client_sock.recv(min(remaining, 65536))
                if not chunk:
                    break
                data.extend(chunk)
                remaining -= len(chunk)

            if is_masked and mask_key:
                unmasked = bytearray(len(data))
                for i in range(len(data)):
                    unmasked[i] = data[i] ^ mask_key[i % 4]
                return unmasked.decode("utf-8", errors="ignore")
            else:
                return data.decode("utf-8", errors="ignore")
        except Exception:
            return None

    def broadcast(self, event_type: str, data: Any):
        """Phát sóng notification tới toàn bộ clients đã kết nối"""
        notification = {
            "jsonrpc": "2.0",
            "method": f"notify.{event_type}",
            "params": {
                "event": event_type,
                "data": data,
                "timestamp": time.time()
            }
        }
        encoded = self._encode_ws_frame(json.dumps(notification))
        with self.clients_lock:
            for client in list(self.clients):
                try:
                    client.sendall(encoded)
                    self.stats["messages_sent"] += 1
                except Exception:
                    self.clients.discard(client)

    def _handle_client(self, client_sock: socket.socket, addr):
        try:
            req = client_sock.recv(2048).decode("utf-8", errors="ignore")
            if "Upgrade: websocket" in req or "upgrade: websocket" in req:
                resp = self._create_handshake_response(req)
                client_sock.sendall(resp)
                with self.clients_lock:
                    self.clients.add(client_sock)
                    self.stats["connected_clients"] = len(self.clients)

                # Chào mừng
                welcome = {
                    "jsonrpc": "2.0",
                    "method": "notify.bridge_ready",
                    "params": {
                        "status": "connected",
                        "bridge_version": "3.3.0-Enterprise",
                        "protocol": "JSON-RPC 2.0",
                        "address": f"{self.host}:{self.port}"
                    }
                }
                client_sock.sendall(self._encode_ws_frame(json.dumps(welcome)))

                # Vòng lặp nhận thông điệp
                while self.is_running:
                    raw_msg = self._decode_ws_frame(client_sock)
                    if raw_msg is None:
                        break
                    self.stats["messages_received"] += 1

                    try:
                        parsed = json.loads(raw_msg)
                        # Xử lý theo chuẩn JSON-RPC 2.0
                        if isinstance(parsed, dict) and "method" in parsed:
                            method = parsed["method"]
                            req_id = parsed.get("id")
                            params = parsed.get("params", {})

                            if method in self.rpc_methods:
                                self.stats["rpc_calls_handled"] += 1
                                try:
                                    res = self.rpc_methods[method](params)
                                    if req_id is not None:
                                        rpc_resp = {
                                            "jsonrpc": "2.0",
                                            "result": res,
                                            "id": req_id
                                        }
                                        client_sock.sendall(self._encode_ws_frame(json.dumps(rpc_resp)))
                                except Exception as m_err:
                                    if req_id is not None:
                                        err_resp = {
                                            "jsonrpc": "2.0",
                                            "error": {"code": -32603, "message": str(m_err)},
                                            "id": req_id
                                        }
                                        client_sock.sendall(self._encode_ws_frame(json.dumps(err_resp)))
                            else:
                                if req_id is not None:
                                    err_resp = {
                                        "jsonrpc": "2.0",
                                        "error": {"code": -32601, "message": f"Method '{method}' not found"},
                                        "id": req_id
                                    }
                                    client_sock.sendall(self._encode_ws_frame(json.dumps(err_resp)))
                        elif isinstance(parsed, dict) and "action" in parsed:
                            # Hỗ trợ định dạng cũ (Legacy fallback)
                            action = parsed["action"]
                            if action == "ping":
                                client_sock.sendall(self._encode_ws_frame(json.dumps({
                                    "type": "pong", "time": time.time()
                                })))
                    except Exception as e:
                        pass
        except Exception:
            pass
        finally:
            with self.clients_lock:
                self.clients.discard(client_sock)
                self.stats["connected_clients"] = len(self.clients)
            try:
                client_sock.close()
            except Exception:
                pass

    def start(self):
        """Khởi động WebSocket Server với cơ chế giải phóng / retry port nếu đang bận"""
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE") and os.name == 'nt':
            try:
                self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 0)
            except Exception:
                pass

        bind_success = False
        max_bind_attempts = 5
        for attempt in range(max_bind_attempts):
            try:
                self.server_socket.bind((self.host, self.port))
                self.server_socket.listen(30)
                bind_success = True
                break
            except Exception as e:
                logger.warning(
                    f"Port {self.port} is currently locked/busy (Attempt {attempt+1}/{max_bind_attempts}). Retrying in 1.5s... Error: {e}"
                )
                time.sleep(1.5)

        if not bind_success:
            logger.error(f"❌ Failed to bind WebSocket socket on {self.host}:{self.port} after {max_bind_attempts} attempts.")
            return

        self.is_running = True
        logger.info(f"✅ Enterprise JSON-RPC 2.0 Server running at ws://{self.host}:{self.port}")
        print(f"[WebSocket Bridge] ✅ Enterprise JSON-RPC 2.0 Server đang chạy tại ws://{self.host}:{self.port}")
        sys.stdout.flush()

        # Bật telemetry broadcast nếu có governor
        if governor:
            governor.start_telemetry_loop(
                interval_sec=2.0,
                broadcast_cb=lambda stats: self.broadcast("hardware_metrics", stats)
            )

        while self.is_running:
            try:
                client_sock, addr = self.server_socket.accept()
                client_thread = threading.Thread(
                    target=self._handle_client,
                    args=(client_sock, addr),
                    daemon=True
                )
                client_thread.start()
            except Exception as e:
                if self.is_running:
                    time.sleep(0.1)

    def stop(self):
        self.is_running = False
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
        with self.clients_lock:
            for c in list(self.clients):
                try:
                    c.close()
                except Exception:
                    pass
            self.clients.clear()


# Singleton Instance
_global_bridge = None

def get_or_create_bridge(port: int = DEFAULT_PORT) -> EnterpriseJsonRpcWsBridge:
    global _global_bridge
    if _global_bridge is None:
        _global_bridge = EnterpriseJsonRpcWsBridge(DEFAULT_HOST, port)
        server_thread = threading.Thread(target=_global_bridge.start, daemon=True)
        server_thread.start()
        time.sleep(0.3)
    return _global_bridge

def send_ws_event(event_type: str, data: Any, port: int = DEFAULT_PORT):
    """Gửi notification nhanh qua WebSocket Bridge"""
    try:
        bridge = get_or_create_bridge(port)
        bridge.broadcast(event_type, data)
    except Exception:
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CREATOROS Enterprise WebSocket JSON-RPC 2.0 IPC Bridge")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port lắng nghe WebSocket")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Host lắng nghe")
    args = parser.parse_args()

    bridge = EnterpriseJsonRpcWsBridge(args.host, args.port)
    try:
        bridge.start()
    except KeyboardInterrupt:
        print("\n[WebSocket Bridge] 🛑 Dừng Server.")
        bridge.stop()
