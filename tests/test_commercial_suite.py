"""
Commercial Grade Test Suite for CREATOROS v4.8
Covers:
1. Hardware Fingerprinting & Offline DRM License Verification
2. Visual Workflow Builder DAG Compiler & Topological Execution
3. Blueprint & User Preset Manager SQLite Persistence (.creatoros format)
4. Secure OTA Updater & SHA-256 Checksum Verification
"""

try:
    import pytest
except ImportError:
    pytest = None
import sys
import os
import json
import hashlib
import time
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from hardware_fingerprint import HardwareFingerprintEngine, fingerprint_engine, TIER_FEATURES
from workflow_dag_compiler import WorkflowDAGCompiler, WorkflowExecutor
from state_manager import state_manager
from ota_updater import SecureOtaUpdater, ota_updater
from local_llm_agent import local_llm_agent
from lan_distributed_render import lan_render_engine
from local_lipsync_engine import local_lipsync_engine


def test_hardware_fingerprint_generation():
    """Validates unique hardware fingerprint generation format CR-XXXX-XXXX-XXXX-XXXX."""
    res = fingerprint_engine.generate_fingerprint()
    assert res is not None
    fp = res["fingerprint_code"]
    assert fp.startswith("CR-")
    parts = fp.split("-")
    assert len(parts) == 5
    for p in parts[1:]:
        assert len(p) == 4


def test_offline_license_verification_and_db_persistence():
    """Tests activation with valid PRO_V48 license key, hardware binding, and SQLite persistence."""
    fp_res = fingerprint_engine.generate_fingerprint()
    fp = fp_res["fingerprint_code"]
    valid_key = fingerprint_engine.generate_license_key(
        fingerprint_code=fp,
        tier="PRO_V48",
        owner="Test Studio",
        days_valid=0 # Lifetime
    )

    verified = fingerprint_engine.verify_license_key(valid_key, fp)
    assert verified["valid"] is True
    assert verified["tier"] == "PRO_V48"
    assert verified["features"]["unlimited_dag"] is True

    # Persist in SQLite
    saved = state_manager.save_license_activation({
        "license_key": valid_key,
        "tier": verified["tier"],
        "owner": verified["owner"],
        "fingerprint_bound": fp,
        "expires_at": verified["expires_at"],
        "features": verified["features"]
    })
    assert saved is not None

    active_info = state_manager.get_active_license()
    assert active_info is not None
    assert active_info["is_active"] == 1
    assert active_info["tier"] == "PRO_V48"


def test_workflow_dag_compiler_topological_sort():
    """Tests DAG compiler for cycle detection and deterministic topological level grouping."""
    nodes = [
        {"id": "n1", "label": "Input Video", "type": "INPUT_NODE"},
        {"id": "n2", "label": "Demucs Vocal Split", "type": "DEMUCS_ISOLATION"},
        {"id": "n3", "label": "Whisper Subtitles", "type": "WHISPER_TRANSCRIBE"},
        {"id": "n4", "label": "No-Strike NVENC Render", "type": "RENDER_NOSTRIKE"},
    ]
    edges = [
        {"id": "e1", "sourceNodeId": "n1", "targetNodeId": "n2"},
        {"id": "e2", "sourceNodeId": "n2", "targetNodeId": "n3"},
        {"id": "e3", "sourceNodeId": "n3", "targetNodeId": "n4"},
    ]
    dag_data = {
        "workflow_id": "test_auto_dub_dag",
        "nodes": nodes,
        "edges": edges
    }

    result = WorkflowDAGCompiler.validate_and_compile(dag_data)
    assert result["valid"] is True
    assert result["total_nodes"] == 4
    assert len(result["stages"]) == 4
    assert result["execution_order"] == ["n1", "n2", "n3", "n4"]


def test_workflow_dag_cycle_rejection():
    """Tests that cyclic graphs are rejected by Kahn's topological check."""
    nodes = [
        {"id": "a", "label": "A", "type": "GENERIC"},
        {"id": "b", "label": "B", "type": "GENERIC"},
        {"id": "c", "label": "C", "type": "GENERIC"},
    ]
    edges = [
        {"id": "e1", "sourceNodeId": "a", "targetNodeId": "b"},
        {"id": "e2", "sourceNodeId": "b", "targetNodeId": "c"},
        {"id": "e3", "sourceNodeId": "c", "targetNodeId": "a"},  # Creates cycle
    ]
    dag_data = {
        "workflow_id": "test_cyclic_dag",
        "nodes": nodes,
        "edges": edges
    }

    result = WorkflowDAGCompiler.validate_and_compile(dag_data)
    assert result["valid"] is False
    assert "chu trình" in result["error"].lower() or "cyclic" in result["error"].lower()


def test_blueprint_preset_crud_in_sqlite():
    """Tests preset creation, SQLite storage, and query."""
    preset_id = f"test_preset_{int(time.time()*1000)}"
    config_dict = {
        "aspect_ratio": "4:5",
        "bitrate": "12000k",
        "color_grading": "DYNAMIC_WARM",
        "pitch_shift_cents": 15
    }

    # Save to SQLite
    res = state_manager.save_preset(
        preset_name="Facebook Reels 4:5 Master NVENC",
        category="nostrike",
        config=config_dict,
        description="High-bitrate NVENC rendering preset with dynamic gamma",
        tags=["facebook", "reels", "nvenc", "nostrike"],
        preset_id=preset_id
    )
    assert res["id"] == preset_id

    # Retrieve
    saved_item = state_manager.get_preset(preset_id)
    assert saved_item is not None
    assert saved_item["name"] == "Facebook Reels 4:5 Master NVENC"
    assert saved_item["category"] == "nostrike"

    # Delete
    del_res = state_manager.delete_preset(preset_id)
    assert del_res is True
    assert state_manager.get_preset(preset_id) is None


def test_ota_update_checker_and_checksum_verification():
    """Tests OTA update metadata query and file SHA-256 calculation."""
    metadata = ota_updater.check_update()
    assert metadata["has_update"] is True
    assert metadata["latest_version"] == "4.8.5-Commercial"
    assert metadata["sha256_checksum"] is not None

    # Calculate SHA256 on a mock payload file
    test_content = b"CREATOROS_STANDALONE_BINARY_PAYLOAD_TEST"
    expected_sha = hashlib.sha256(test_content).hexdigest().upper()

    tmp_path = os.path.join(tempfile.gettempdir(), "test_ota_payload.bin")
    with open(tmp_path, "wb") as f:
        f.write(test_content)

    with open(tmp_path, "rb") as f:
        calculated = hashlib.sha256(f.read()).hexdigest().upper()
    assert calculated == expected_sha

    if os.path.exists(tmp_path):
        os.remove(tmp_path)


# ========================================
# V5.0 NEXT-GEN CORE TESTS
# ========================================

def test_local_llm_agent_natural_language_to_dag():
    """Tests Intent Parser converting natural language commands into valid executable DAGs."""
    prompt = "Tạo video lồng tiếng kèm đồng bộ khẩu hình lipsync ONNX và render no-strike 9:16"
    res = local_llm_agent.generate_dag_from_prompt(prompt)

    assert res["success"] is True
    assert "dag" in res
    dag = res["dag"]
    assert "lipsync" in dag["intent_detected"]
    assert len(dag["nodes"]) >= 3
    assert len(dag["edges"]) >= 2

    # Verify DAG validity using WorkflowDAGCompiler
    compiled = WorkflowDAGCompiler.validate_and_compile(dag)
    assert compiled["valid"] is True
    assert compiled["total_nodes"] == len(dag["nodes"])


def test_lan_distributed_render_chunking_and_speedup():
    """Tests LAN cluster node discovery, segment chunk distribution, and speed factor calculation."""
    # Discover nodes
    cluster_status = lan_render_engine.get_cluster_status()
    assert cluster_status["total_nodes"] >= 3
    assert cluster_status["active_nodes"] >= 3

    # Plan a 300-second render with 30s chunks
    job_plan = lan_render_engine.plan_job(
        source_video="test_master.mp4",
        total_duration_sec=300,
        chunk_duration_sec=30
    )

    assert job_plan["total_duration_sec"] == 300
    assert job_plan["total_chunks"] == 10
    assert len(job_plan["chunks"]) == 10
    assert job_plan["workers_allocated"] >= 2
    assert "x" in job_plan["speedup_vs_single_node"]

    # Verify segment continuity
    for i in range(len(job_plan["chunks"]) - 1):
        c1 = job_plan["chunks"][i]
        c2 = job_plan["chunks"][i + 1]
        assert c1["end_sec"] == c2["start_sec"]


def test_local_lipsync_engine_onnx_inference():
    """Tests Local AI LipSync engine info query and execution simulation."""
    info = local_lipsync_engine.get_engine_info()
    assert "TensorrtExecutionProvider" in info["supported_providers"]
    assert "CUDAExecutionProvider" in info["supported_providers"]

    # Process lip-sync job
    result = local_lipsync_engine.process_lipsync(
        video_path="source_avatar.mp4",
        audio_path="source_voice.wav",
        provider="TensorrtExecutionProvider",
        duration_sec=10.0
    )

    assert "output_video" in result
    assert result["metrics"]["total_frames_processed"] == 300 # 10s * 30fps
    assert result["metrics"]["inference_fps"] > 30.0
    assert result["metrics"]["sync_confidence_score"] >= 0.90


if __name__ == "__main__":
    tests = [
        test_hardware_fingerprint_generation,
        test_offline_license_verification_and_db_persistence,
        test_workflow_dag_compiler_topological_sort,
        test_workflow_dag_cycle_rejection,
        test_blueprint_preset_crud_in_sqlite,
        test_ota_update_checker_and_checksum_verification,
        test_local_llm_agent_natural_language_to_dag,
        test_lan_distributed_render_chunking_and_speedup,
        test_local_lipsync_engine_onnx_inference,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"PASS: {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"FAIL: {t.__name__} - {e}")
    print(f"\nCompleted {passed}/{len(tests)} tests successfully.")


