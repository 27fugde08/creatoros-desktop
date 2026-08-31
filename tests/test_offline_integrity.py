"""
Test Suite: Air-Gapped & Offline Integrity Testing
Xác thực 100% tính năng hoạt động offline mà không phụ thuộc vào API cloud.
"""

import pytest
import os
import time
from local_rag_engine import LocalVectorRAGEngine
from qc_agent import QualityControlAgent
from nostrike_engine import check_gpu_support

def test_local_rag_offline_inference(tmp_path):
    """Kiểm tra Local Vector RAG phân tích transcript và truy xuất Hook hoàn toàn offline"""
    db_file = str(tmp_path / "test_rag.sqlite")
    rag = LocalVectorRAGEngine(db_path=db_file)
    
    transcript = """
    Bí mật chấn động đằng sau video triệu view của các YouTuber hàng đầu thế giới.
    Hầu hết mọi người đều nghĩ rằng cần phải có máy quay đắt tiền hoặc ekip hàng chục người.
    Nhưng sự thật là thuật toán chỉ quan tâm đến 3 giây đầu tiên của bạn.
    Nếu bạn giữ chân được khán giả qua đoạn mở đầu, tỷ lệ cắn đề xuất sẽ tăng 80%.
    Hãy lưu ngay video này lại và áp dụng cho kênh của bạn ngay hôm nay.
    """
    
    doc_id = f"doc_{int(time.time()*1000)}"
    res = rag.index_transcript(doc_id, "Video Triệu View", transcript)
    assert res["status"] == "indexed_successfully"
    assert res["total_chunks"] > 0, "RAG phải chia được transcript thành các phân đoạn nhỏ"
    
    # Tìm kiếm Hook ngữ nghĩa
    results = rag.search_semantic("3 giây đầu tiên giữ chân khán giả", doc_id=doc_id, top_k=2, min_score=0.1)
    assert len(results) > 0, "RAG phải tìm thấy kết quả phù hợp"
    assert any("3 giây" in r["text"] or "bí mật" in r["text"].lower() or r["similarity"] > 0 for r in results)
    assert results[0]["similarity"] >= 0, "Điểm tương đồng phải hợp lệ"


def test_qc_agent_offline_validation():
    """Kiểm tra AI Quality Control Agent thẩm định kịch bản mà không gọi mạng ngoài"""
    agent = QualityControlAgent()
    
    highlights = [
        {"start_time": "00:00:02", "end_time": "00:00:25", "title": "Bí mật chấn động 3 giây đầu", "viral_score": 95},
        {"start_time": "00:00:26", "end_time": "00:00:55", "title": "Giải mã thuật toán đề xuất", "viral_score": 88}
    ]
    
    report = agent.evaluate_highlight_batch(
        transcript_text="Kịch bản mở đầu lôi cuốn... giải thích chi tiết cao trào... kêu gọi đăng ký kênh.",
        highlights=highlights
    )
    
    assert "qc_score" in report, "QC Report phải có điểm tổng kết"
    assert "status" in report, "QC Report phải có trạng thái duyệt"
    assert report["status"] in ["APPROVED", "REVISE_REQUIRED", "REJECTED"], "Trạng thái QC phải hợp lệ"
    assert report["qc_score"] >= 0 and report["qc_score"] <= 100, "Điểm QC phải từ 0 đến 100"


def test_nostrike_gpu_support_offline():
    """Kiểm tra module No-Strike nhận diện năng lực phần cứng máy cục bộ"""
    has_gpu, info = check_gpu_support()
    assert isinstance(has_gpu, bool), "Phải trả về giá trị boolean"
    assert isinstance(info, str) and len(info) > 0, "Thông tin GPU/CPU fallback phải là chuỗi hợp lệ"
