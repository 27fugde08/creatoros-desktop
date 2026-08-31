"""
Test Suite: Workflow Builder & JSON-RPC 2.0 IPC Bridge Testing
Kiểm thử độ trễ, tính toàn vẹn thông điệp và tải trọng lớn qua JSON-RPC 2.0.
"""

import pytest
import json
import time
from py_ws_bridge import EnterpriseJsonRpcWsBridge

def test_json_rpc_ping_latency():
    """Kiểm tra phản hồi phương thức ping đạt chuẩn JSON-RPC 2.0 với độ trễ thấp"""
    bridge = EnterpriseJsonRpcWsBridge()
    
    # Warm up cache
    bridge.rpc_methods["ping"]({})
    
    t0 = time.perf_counter()
    res = bridge.rpc_methods["ping"]({})
    t1 = time.perf_counter()
    
    rtt_ms = (t1 - t0) * 1000
    assert res["status"] == "online"
    assert res["pong"] is True
    assert "server_time" in res
    assert rtt_ms < 5.0, f"Độ trễ xử lý RPC nội bộ phải < 5ms, thực tế: {rtt_ms:.2f}ms"


def test_json_rpc_system_info():
    """Kiểm tra phương thức system.info trả về đầy đủ metadata JSON-RPC 2.0"""
    bridge = EnterpriseJsonRpcWsBridge()
    info = bridge.rpc_methods["system.info"]({})
    
    assert "version" in info
    assert info["protocol"] == "JSON-RPC 2.0 (WebSocket IPC)"
    assert "telemetry" in info


def test_json_rpc_high_throughput_burst():
    """Kiểm thử gọi liên tiếp 1000 RPC requests dưới áp lực lớn"""
    bridge = EnterpriseJsonRpcWsBridge()
    
    t0 = time.perf_counter()
    for i in range(1000):
        res = bridge.rpc_methods["ping"]({})
        assert res["status"] == "online"
        assert res["pong"] is True
    t1 = time.perf_counter()
    
    total_time_ms = (t1 - t0) * 1000
    avg_rtt_ms = total_time_ms / 1000
    assert avg_rtt_ms < 1.0, f"Thời gian xử lý trung bình mỗi request phải < 1ms (thực tế: {avg_rtt_ms:.3f}ms)"
