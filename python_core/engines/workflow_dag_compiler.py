#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Visual Workflow Builder DAG Compiler & Async Execution Engine
Biên dịch đồ thị DAG (Directed Acyclic Graph) từ React Flow Canvas,
kiểm tra tính toàn vẹn (Topological Sort / Cycle Detection),
và thực thi chuỗi tác vụ song song/tuần tự với cơ chế truyền Data Artifacts.
"""

import os
import sys
import json
import time
import uuid
import threading
from typing import Dict, List, Any, Optional, Set, Callable
from collections import defaultdict, deque

from state_manager import state_manager
from hardware_governor import governor
from qc_agent import qc_agent
from nostrike_engine import check_gpu_support

class WorkflowDAGCompiler:
    """
    Biên dịch và kiểm tra tính hợp lệ của đồ thị DAG
    """

    @classmethod
    def validate_and_compile(cls, dag_data: Dict[str, Any]) -> Dict[str, Any]:
        nodes = dag_data.get("nodes", [])
        edges = dag_data.get("edges", [])
        workflow_id = dag_data.get("workflow_id", f"wf_{int(time.time()*1000)}")

        if not nodes:
            return {"valid": False, "error": "Đồ thị Workflow chưa có Node nào"}

        node_map = {n["id"]: n for n in nodes}
        adj_list = defaultdict(list)
        in_degree = {n["id"]: 0 for n in nodes}
        parent_map = defaultdict(list)

        # Xây dựng danh sách kề và tính bậc vào (In-degree)
        for e in edges:
            src = e.get("sourceNodeId") or e.get("source")
            tgt = e.get("targetNodeId") or e.get("target")
            
            if src not in node_map or tgt not in node_map:
                return {"valid": False, "error": f"Liên kết không hợp lệ giữa Node '{src}' và '{tgt}'"}

            adj_list[src].append(tgt)
            parent_map[tgt].append(src)
            in_degree[tgt] += 1

        # Thuật toán Kahn tìm chu trình (Cyclic Dependency Check) và sắp xếp Tô-pô (Topological Sort)
        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        execution_order = []
        stages = []
        
        current_stage = []
        while queue:
            level_size = len(queue)
            stage_nodes = []
            for _ in range(level_size):
                curr = queue.popleft()
                execution_order.append(curr)
                stage_nodes.append(curr)
                
                for neighbor in adj_list[curr]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        queue.append(neighbor)
            stages.append({
                "stage_index": len(stages),
                "parallel_nodes": stage_nodes
            })

        if len(execution_order) != len(nodes):
            return {
                "valid": False,
                "error": "Phát hiện chu trình vòng lặp lặp lại (Cyclic Dependency) trong đồ thị Workflow!"
            }

        return {
            "valid": True,
            "workflow_id": workflow_id,
            "total_nodes": len(nodes),
            "stages": stages,
            "execution_order": execution_order,
            "parent_map": dict(parent_map),
            "adjacency_list": dict(adj_list)
        }


class WorkflowExecutor:
    """
    Thực thi chuỗi DAG Workflow bất đồng bộ
    """
    def __init__(self, broadcast_fn: Optional[Callable[[str, Any], None]] = None):
        self.broadcast = broadcast_fn or (lambda event, data: None)
        self.active_executions: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def execute_workflow_async(self, dag_data: Dict[str, Any]) -> Dict[str, Any]:
        validation = WorkflowDAGCompiler.validate_and_compile(dag_data)
        if not validation["valid"]:
            return {"success": False, "error": validation["error"]}

        workflow_id = validation["workflow_id"]
        
        # Đăng ký pipeline trong SQLite State Manager
        state_manager.create_or_get_pipeline(
            pipeline_id=workflow_id,
            title=dag_data.get("title", "Visual Workflow DAG"),
            priority="HIGH",
            config=dag_data
        )

        with self._lock:
            self.active_executions[workflow_id] = {
                "status": "RUNNING",
                "validation": validation,
                "dag_data": dag_data,
                "node_outputs": {},
                "started_at": time.time(),
                "completed_at": None,
                "current_node_id": None
            }

        # Khởi chạy luồng thực thi nền
        thread = threading.Thread(target=self._run_dag_worker, args=(workflow_id,), daemon=True)
        thread.start()

        return {
            "success": True,
            "workflow_id": workflow_id,
            "execution_plan": validation
        }

    def _run_dag_worker(self, workflow_id: str):
        with self._lock:
            exec_ctx = self.active_executions.get(workflow_id)
        if not exec_ctx:
            return

        validation = exec_ctx["validation"]
        dag_data = exec_ctx["dag_data"]
        nodes_dict = {n["id"]: n for n in dag_data.get("nodes", [])}
        node_outputs = exec_ctx["node_outputs"]
        parent_map = validation["parent_map"]

        self.broadcast("workflow_started", {
            "workflow_id": workflow_id,
            "total_stages": len(validation["stages"]),
            "total_nodes": validation["total_nodes"]
        })

        all_success = True
        error_msg = None

        for stage_idx, stage in enumerate(validation["stages"]):
            stage_nodes = stage["parallel_nodes"]
            
            # Thực thi các Node trong cùng Stage (Song song / Tuần tự bảo đảm VRAM)
            for node_id in stage_nodes:
                node_data = nodes_dict.get(node_id, {})
                node_type = node_data.get("type", "unknown")
                node_title = node_data.get("title") or node_data.get("label") or node_id

                # Thu thập Input Artifacts từ các Node cha đã chạy xong
                inherited_inputs = {}
                for parent_id in parent_map.get(node_id, []):
                    if parent_id in node_outputs:
                        inherited_inputs.update(node_outputs[parent_id])

                # Bắt đầu chạy Node
                self.broadcast("node_status_change", {
                    "workflow_id": workflow_id,
                    "node_id": node_id,
                    "status": "RUNNING",
                    "progress": 20
                })

                node_params = node_data.get("params", {})
                node_params["inherited_artifacts"] = inherited_inputs

                try:
                    out_artifacts = self._dispatch_node_execution(node_type, node_params, node_id)
                    node_outputs[node_id] = out_artifacts
                    
                    self.broadcast("node_status_change", {
                        "workflow_id": workflow_id,
                        "node_id": node_id,
                        "status": "COMPLETED",
                        "progress": 100,
                        "output_artifacts": out_artifacts
                    })

                    # Cập nhật state SQLite
                    state_manager.complete_stage(
                        pipeline_id=workflow_id,
                        stage_name=f"NODE_{node_type}_{node_id}",
                        stage_index=stage_idx,
                        total_stages=len(validation["stages"]),
                        output_artifacts=out_artifacts
                    )

                except Exception as e:
                    all_success = False
                    error_msg = str(e)
                    self.broadcast("node_status_change", {
                        "workflow_id": workflow_id,
                        "node_id": node_id,
                        "status": "FAILED",
                        "error": error_msg
                    })
                    state_manager.fail_stage(
                        pipeline_id=workflow_id,
                        stage_name=f"NODE_{node_type}_{node_id}",
                        error_message=error_msg
                    )
                    break
            
            if not all_success:
                break

        with self._lock:
            if workflow_id in self.active_executions:
                self.active_executions[workflow_id]["status"] = "COMPLETED" if all_success else "FAILED"
                self.active_executions[workflow_id]["completed_at"] = time.time()
                self.active_executions[workflow_id]["error"] = error_msg

        self.broadcast("workflow_finished", {
            "workflow_id": workflow_id,
            "status": "COMPLETED" if all_success else "FAILED",
            "error": error_msg,
            "final_outputs": node_outputs
        })

    def _dispatch_node_execution(self, node_type: str, params: Dict[str, Any], node_id: str) -> Dict[str, Any]:
        """
        Thực thi nghiệp vụ cụ thể cho từng loại Node
        """
        inherited = params.get("inherited_artifacts", {})
        
        if node_type == "ingest_video":
            source_url = params.get("source_url") or "sample_local_video.mp4"
            resolution = params.get("resolution", "1080p")
            time.sleep(0.6) # Giả lập ingest/download
            return {
                "source_video_path": f"downloads/{node_id}_video.mp4",
                "duration_sec": 75.0,
                "resolution": resolution,
                "video_title": params.get("title", "Video Nguồn Ingest")
            }

        elif node_type == "demucs_stem":
            source_video = inherited.get("source_video_path") or "downloads/source.mp4"
            time.sleep(0.8) # Giả lập tách stem Demucs
            return {
                "vocals_path": f"temp/{node_id}_vocals.wav",
                "bgm_path": f"temp/{node_id}_no_vocals.wav",
                "stems_isolated": ["vocals", "drums", "bass", "other"]
            }

        elif node_type == "nostrike_nvenc":
            lut = params.get("color_lut", "Cinematic Warm")
            grain = params.get("grain", "Medium")
            source_video = inherited.get("source_video_path") or "downloads/source.mp4"
            time.sleep(0.9) # Giả lập Render GPU NVENC
            return {
                "rendered_video_path": f"output/{node_id}_nostrike_1080x1920.mp4",
                "fair_use_ratio": 96.5,
                "new_sha256": f"SHA256_{uuid.uuid4().hex[:16]}",
                "render_engine": "FFmpeg NVENC Hardware"
            }

        elif node_type == "voice_local":
            voice_id = params.get("voice", "Nam Minh (Trầm Ấm)")
            speed = params.get("speed", 1.1)
            time.sleep(0.5)
            return {
                "generated_audio_path": f"output/{node_id}_speech.wav",
                "voice_profile": voice_id,
                "duration_sec": 48.2
            }

        elif node_type == "ai_recap":
            genre = params.get("genre", "Phim Hành Động")
            time.sleep(0.5)
            return {
                "recap_script": "3 giây đầu tiên là cú lật ngoạn mục...",
                "hook_title": f"Bí Mật Đỉnh Cao: {genre}",
                "viral_score": 94
            }

        elif node_type == "qc_validation":
            time.sleep(0.4)
            return {
                "qc_status": "APPROVED",
                "qc_score": 98.5,
                "retention_estimate": "88% giữ chân khán giả"
            }

        elif node_type == "fb_dispatch":
            time.sleep(0.4)
            return {
                "dispatch_status": "SCHEDULED",
                "platforms": ["Facebook Reels 4:5", "TikTok 9:16", "YouTube Shorts"],
                "scheduled_time": "19:30 Cùng Ngày"
            }

        else:
            time.sleep(0.3)
            return {"status": "success", "node_id": node_id}


# Singleton Instance
workflow_executor = WorkflowExecutor()
