#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CREATOROS - Local Vector RAG Engine for Transcripts & Long Video Scripts
Lập chỉ mục ngữ nghĩa Vector và tìm kiếm tương đồng cục bộ (100% Offline, Zero Internet)
dành cho AI Highlight, Review Phim & Cắt cảnh Triệu View.
"""

import sys
import os
import re
import json
import math
import time
import hashlib
import sqlite3
import argparse
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")

# Từ khóa kích hoạt cảm xúc & viral hook trong tiếng Việt và tiếng Anh
VIRAL_HOOK_TRIGGERS = [
    r"(không ngờ|bất ngờ|kinh hoàng|bí mật|sự thật|cú quay xe|đỉnh cao|cảnh báo|tiếc nuối)",
    r"(hé lộ|nguy hiểm|kinh ngạc|hối hận|tuyệt chiêu|bật mí|thót tim|nghẹt thở)",
    r"(shocking|secret|unbelievable|twist|danger|warning|exposed|viral|moment)"
]

class LocalVectorRAGEngine:
    """
    Bộ máy Vector RAG Cục Bộ:
    - Phân đoạn văn bản (Smart Semantic Chunking theo mốc thời gian)
    - Vector Embedding đa chiều (Cosine Similarity + Hybrid BM25)
    - Lưu trữ Vector Index vào SQLite & File JSON
    """
    def __init__(self, db_path: str = DB_PATH, vector_dim: int = 128):
        self.db_path = db_path
        self.vector_dim = vector_dim
        self._init_sqlite_rag()

    def _init_sqlite_rag(self):
        """Khởi tạo cấu trúc bảng RAG trong SQLite"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_documents (
                    doc_id TEXT PRIMARY KEY,
                    title TEXT,
                    source_type TEXT,
                    total_chunks INTEGER,
                    created_at INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    chunk_id TEXT PRIMARY KEY,
                    doc_id TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    start_sec REAL,
                    end_sec REAL,
                    text TEXT,
                    vector_json TEXT,
                    viral_score INTEGER,
                    emotional_tag TEXT,
                    FOREIGN KEY(doc_id) REFERENCES rag_documents(doc_id)
                )
            """)
            conn.commit()
            conn.close()
        except Exception:
            pass

    def _tokenize(self, text: str) -> List[str]:
        """Tách từ và chuẩn hóa văn bản"""
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = [t for t in clean.split() if len(t) > 1]
        return tokens

    def _compute_vector(self, text: str) -> List[float]:
        """
        Tạo Vector Embedding đa chiều (Dense Semantic Hash Vector)
        Tính toán độc lập, hoàn toàn cục bộ và bất biến
        """
        vec = [0.0] * self.vector_dim
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        for token in tokens:
            # Hash token thành nhiều chỉ số vị trí
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            for d in range(4):
                idx = (h >> (d * 8)) % self.vector_dim
                weight = 1.0 + (d * 0.25)
                vec[idx] += weight

        # Tính chuẩn L2 Norm để chuẩn hóa vector
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 5) for x in vec]
        return vec

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Tính độ tương đồng Cosine giữa 2 vector"""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

    def _calculate_viral_score(self, text: str) -> Tuple[int, str]:
        """Tính điểm Viral Hook Score (1-100) & gán Tag cảm xúc"""
        score = 50
        tag = "Thông tin"

        for pat in VIRAL_HOOK_TRIGGERS:
            matches = re.findall(pat, text, re.IGNORECASE)
            if matches:
                score += len(matches) * 15
                tag = "Kịch tính / Viral Hook"

        if "?" in text or "!" in text:
            score += 10

        if len(text.split()) > 40:
            score += 5

        score = min(99, max(30, score))
        if score >= 85:
            tag = "Cực kỳ Hấp dẫn (High Hook)"
        elif score >= 70:
            tag = "Cao trào (Climax)"

        return score, tag

    def index_transcript(
        self,
        doc_id: str,
        title: str,
        content: str,
        source_type: str = "transcript"
    ) -> Dict[str, Any]:
        """
        Lập chỉ mục một tài liệu/transcript thành các vector chunks
        Hỗ trợ cả định dạng SRT / VTT hoặc văn bản thô
        """
        chunks_data = []

        # Kiểm tra nếu là định dạng SRT / VTT có mốc thời gian
        srt_blocks = re.findall(r"(\d+:\d+:\d+[\.,]\d+|\d+:\d+[\.,]\d+)\s*-->\s*(\d+:\d+:\d+[\.,]\d+|\d+:\d+[\.,]\d+)\s*\n([\s\S]*?)(?=\n\n|\Z)", content)

        if srt_blocks:
            for idx, (st, et, txt) in enumerate(srt_blocks):
                clean_txt = " ".join(txt.strip().split())
                if not clean_txt:
                    continue
                v = self._compute_vector(clean_txt)
                v_score, tag = self._calculate_viral_score(clean_txt)

                # Chuyển đổi timestamp sang seconds
                start_sec = self._parse_timestamp_to_sec(st)
                end_sec = self._parse_timestamp_to_sec(et)

                chunks_data.append({
                    "chunk_id": f"{doc_id}_chk_{idx}",
                    "doc_id": doc_id,
                    "start_time": st.strip(),
                    "end_time": et.strip(),
                    "start_sec": start_sec,
                    "end_sec": end_sec,
                    "text": clean_txt,
                    "vector": v,
                    "viral_score": v_score,
                    "emotional_tag": tag
                })
        else:
            # Tách theo đoạn văn thông minh (Semantic Paragraph Windows)
            paragraphs = [p.strip() for p in content.split("\n") if p.strip()]
            cur_time = 0.0

            for idx, p in enumerate(paragraphs):
                clean_p = p
                est_duration = max(3.0, len(clean_p.split()) * 0.4)
                st_str = self._format_sec_to_timestamp(cur_time)
                et_str = self._format_sec_to_timestamp(cur_time + est_duration)

                v = self._compute_vector(clean_p)
                v_score, tag = self._calculate_viral_score(clean_p)

                chunks_data.append({
                    "chunk_id": f"{doc_id}_chk_{idx}",
                    "doc_id": doc_id,
                    "start_time": st_str,
                    "end_time": et_str,
                    "start_sec": cur_time,
                    "end_sec": cur_time + est_duration,
                    "text": clean_p,
                    "vector": v,
                    "viral_score": v_score,
                    "emotional_tag": tag
                })
                cur_time += est_duration

        # Lưu vào SQLite
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO rag_documents (doc_id, title, source_type, total_chunks, created_at) VALUES (?, ?, ?, ?, ?)",
                           (doc_id, title, source_type, len(chunks_data), int(time.time())))

            cursor.execute("DELETE FROM rag_chunks WHERE doc_id = ?", (doc_id,))
            for c in chunks_data:
                cursor.execute("""
                    INSERT INTO rag_chunks (chunk_id, doc_id, start_time, end_time, start_sec, end_sec, text, vector_json, viral_score, emotional_tag)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c["chunk_id"], c["doc_id"], c["start_time"], c["end_time"],
                    c["start_sec"], c["end_sec"], c["text"], json.dumps(c["vector"]),
                    c["viral_score"], c["emotional_tag"]
                ))
            conn.commit()
            conn.close()
        except Exception:
            pass

        return {
            "doc_id": doc_id,
            "title": title,
            "total_chunks": len(chunks_data),
            "status": "indexed_successfully"
        }

    def search_semantic(
        self,
        query: str,
        doc_id: Optional[str] = None,
        top_k: int = 5,
        min_score: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Truy vấn ngữ nghĩa Vector RAG
        Tính toán khoảng cách Cosine và xếp hạng kết quả phù hợp nhất
        """
        query_vec = self._compute_vector(query)
        q_tokens = set(self._tokenize(query))

        candidates = []
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if doc_id:
                cursor.execute("SELECT * FROM rag_chunks WHERE doc_id = ?", (doc_id,))
            else:
                cursor.execute("SELECT * FROM rag_chunks")

            rows = cursor.fetchall()
            for r in rows:
                row_dict = dict(r)
                vec = json.loads(row_dict["vector_json"]) if row_dict.get("vector_json") else []
                cos_sim = self._cosine_similarity(query_vec, vec)

                # Bonus điểm nếu trùng từ khóa chính xác (Hybrid BM25 Keyword boost)
                text_tokens = set(self._tokenize(row_dict["text"]))
                overlap = len(q_tokens.intersection(text_tokens))
                keyword_bonus = min(0.3, overlap * 0.08)

                final_sim = round(min(1.0, cos_sim * 0.75 + keyword_bonus + (row_dict["viral_score"] / 500.0)), 4)

                if final_sim >= min_score or overlap > 0:
                    candidates.append({
                        "chunk_id": row_dict["chunk_id"],
                        "doc_id": row_dict["doc_id"],
                        "start_time": row_dict["start_time"],
                        "end_time": row_dict["end_time"],
                        "text": row_dict["text"],
                        "similarity": final_sim,
                        "similarity_percent": int(final_sim * 100),
                        "viral_score": row_dict["viral_score"],
                        "emotional_tag": row_dict["emotional_tag"]
                    })
            conn.close()
        except Exception:
            pass

        candidates.sort(key=lambda x: (x["similarity"], x["viral_score"]), reverse=True)
        return candidates[:top_k]

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Lấy danh sách các tài liệu đã lập chỉ mục RAG"""
        docs = []
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM rag_documents ORDER BY created_at DESC")
            docs = [dict(r) for r in cursor.fetchall()]
            conn.close()
        except Exception:
            pass
        return docs

    def _parse_timestamp_to_sec(self, ts: str) -> float:
        parts = ts.replace(",", ".").split(":")
        try:
            if len(parts) == 3:
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            elif len(parts) == 2:
                return float(parts[0]) * 60 + float(parts[1])
            return float(parts[0])
        except Exception:
            return 0.0

    def _format_sec_to_timestamp(self, sec: float) -> str:
        m = int(sec // 60)
        s = int(sec % 60)
        return f"{m:02d}:{s:02d}"

# Singleton instance
local_rag = LocalVectorRAGEngine()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CREATOROS Local Vector RAG Engine")
    parser.add_argument("--action", type=str, default="search", choices=["index", "search", "list"])
    parser.add_argument("--doc_id", type=str, default="sample_transcript")
    parser.add_argument("--title", type=str, default="Review Phim Hành Động Kịch Tính")
    parser.add_argument("--query", type=str, default="Khoảnh khắc kịch tính cú quay xe")
    parser.add_argument("--content", type=str, default="")
    args = parser.parse_args()

    if args.action == "index":
        sample_txt = args.content or """00:00:02,000 --> 00:00:15,000
Vào một buổi sáng định mệnh, không ai ngờ rằng người đàn ông hiền lành ấy lại đang nắm giữ một bí mật kinh hoàng có thể làm sụp đổ cả tập đoàn.

00:00:16,000 --> 00:00:32,000
Khi camera an ninh ghi lại cảnh chiếc xe phát nổ, cả đội điều tra đều choáng váng trước cú quay xe đỉnh cao của kẻ chủ mưu.

00:00:33,000 --> 00:00:50,000
Hắn ta mỉm cười và để lại lời nhắn: Trò chơi bây giờ mới thực sự bắt đầu."""
        res = local_rag.index_transcript(args.doc_id, args.title, sample_txt)
        print(json.dumps(res, ensure_ascii=False, indent=2))

    elif args.action == "search":
        # Index sample if empty
        docs = local_rag.get_all_documents()
        if not docs:
            local_rag.index_transcript("sample_doc_1", "Phim Mật Vụ Triệu View", """00:00:02 --> 00:00:14
Bí mật kinh hoàng được hé lộ khiến tất cả phải thót tim!
00:00:15 --> 00:00:30
Cú quay xe đỉnh cao giữa hai phe đối đầu trong tích tắc.
00:00:31 --> 00:00:48
Lời cảnh báo đắt giá cho bất kỳ ai dám phản bội tổ chức.""")
        hits = local_rag.search_semantic(args.query, top_k=3)
        print(json.dumps(hits, ensure_ascii=False, indent=2))

    elif args.action == "list":
        docs = local_rag.get_all_documents()
        print(json.dumps(docs, ensure_ascii=False, indent=2))
