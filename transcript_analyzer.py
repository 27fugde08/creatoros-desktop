#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CreatorOS - Video Transcript Highlight Analyzer
Thuật toán phân tích Transcript kết hợp Emotional Keywords, Speech Rate, và Audio Energy.
Tự động chấm điểm phân đoạn và gom nhóm tối ưu thành các Highlight dài 30s - 60s.
"""

import sys
import json
import math
from typing import List, Dict, Any, Tuple

# Danh sách từ khóa cảm xúc cao kèm trọng số mặc định (tiếng Việt)
EMOTIONAL_KEYWORDS = {
    # Cực kỳ giật gân, khẩn cấp (Trọng số 4.0 - 5.0)
    "khủng khiếp": 4.8,
    "kinh hoàng": 4.8,
    "nguy hiểm": 4.5,
    "cảnh báo": 4.5,
    "bí mật": 4.2,
    "sốc": 4.7,
    "không thể tin được": 4.9,
    "vạch trần": 4.6,
    "lừa đảo": 4.4,
    "phát hiện": 3.8,
    "bất ngờ": 3.9,
    
    # Thành công, cảm xúc tích cực mạnh (Trọng số 3.5 - 4.2)
    "tuyệt vời": 4.2,
    "xuất sắc": 4.0,
    "thành công": 3.8,
    "vui sướng": 3.7,
    "kỳ diệu": 4.0,
    "đỉnh cao": 4.1,
    "độc quyền": 4.3,
    
    # Bi kịch, nỗi đau, tiêu cực mạnh (Trọng số 3.5 - 4.5)
    "đau đớn": 4.2,
    "sai lầm": 4.1,
    "thất bại": 3.9,
    "tức giận": 4.0,
    "phẫn nộ": 4.3,
    "hối hận": 3.8,
    "khóc": 3.5,
    "mất mát": 3.9,
    
    # Từ kích thích tò mò (Trọng số 3.0 - 3.8)
    "lưu ý": 3.2,
    "sự thật": 3.7,
    "tại sao": 3.0,
    "lý do": 3.0,
    "nhất định": 3.3,
    "quyết định": 3.1,
    "hậu quả": 3.9,
    "bài học": 3.5
}

class TranscriptAnalyzer:
    def __init__(self, emotional_dict: Dict[str, float] = None):
        self.emotional_keywords = emotional_dict if emotional_dict else EMOTIONAL_KEYWORDS
        # Nhịp độ nói tối ưu cho video ngắn (Reels, TikTok) thường nằm trong khoảng 2.6 - 3.4 từ/giây
        self.optimal_wps_min = 2.6
        self.optimal_wps_max = 3.5

    def analyze_emotional_score(self, text: str) -> Tuple[float, List[str]]:
        """
        Tính điểm cảm xúc dựa trên số lượng và mức độ nghiêm trọng của từ khóa xuất hiện.
        """
        if not text:
            return 0.0, []
        
        text_lower = text.lower()
        score = 0.0
        matched_words = []
        
        for keyword, weight in self.emotional_keywords.items():
            # Đếm số lần xuất hiện của từ khóa
            count = text_lower.count(keyword)
            if count > 0:
                score += weight * count
                matched_words.append(f"{keyword} (x{count})")
        
        # Chuẩn hóa điểm cảm xúc về thang điểm tối đa 10
        normalized_score = min(score, 10.0)
        return round(normalized_score, 2), matched_words

    def analyze_speech_rate(self, text: str, duration: float) -> Tuple[float, float]:
        """
        Tính nhịp độ nói (Words Per Second - WPS) và cho điểm dựa trên độ lệch với nhịp độ tối ưu.
        """
        if duration <= 0 or not text:
            return 0.0, 0.0
        
        word_count = len(text.split())
        wps = word_count / duration
        
        # Tính điểm nhịp độ nói (Thang điểm 10)
        # Nếu nằm trong vùng tối ưu [2.6 - 3.5], điểm tối đa (10 điểm)
        # Nếu quá chậm (< 1.5) hoặc quá nhanh (> 5.0), điểm sẽ bị trừ dần
        if self.optimal_wps_min <= wps <= self.optimal_wps_max:
            score = 10.0
        elif wps < self.optimal_wps_min:
            # Chậm quá mức
            score = max(2.0, 10.0 - (self.optimal_wps_min - wps) * 4.0)
        else:
            # Nhanh quá mức (nói dồn dập, có thể kịch tính nhưng khó nghe)
            score = max(2.0, 10.0 - (wps - self.optimal_wps_max) * 3.0)
            
        return round(wps, 2), round(score, 2)

    def score_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chấm điểm từng phân đoạn dựa trên 3 tiêu chí chính:
        1. Emotional Keywords (40% trọng số)
        2. Speech Rate Score (30% trọng số)
        3. Audio Energy Peak (30% trọng số)
        """
        scored_segments = []
        
        for idx, seg in enumerate(segments):
            text = seg.get("text", "")
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)
            duration = end - start
            
            # 1. Điểm cảm xúc
            emo_score, matches = self.analyze_emotional_score(text)
            
            # 2. Điểm nhịp độ nói
            wps, rate_score = self.analyze_speech_rate(text, duration)
            
            # 3. Điểm biên độ âm thanh (Audio Energy Peak)
            # Nếu đầu vào không có audio_energy, ta sẽ tự tính toán một giá trị giả lập dựa trên
            # độ dài câu hoặc mặc định ở mức trung bình (5.0), hoặc dùng giá trị đầu vào.
            audio_energy = seg.get("audio_energy", 5.0) # Thang điểm 0 - 10
            
            # Tính điểm tổng hợp cho phân đoạn (Segment Score)
            final_score = (emo_score * 0.40) + (rate_score * 0.30) + (audio_energy * 0.30)
            
            scored_seg = {
                "id": seg.get("id", idx),
                "text": text,
                "start": round(start, 2),
                "end": round(end, 2),
                "duration": round(duration, 2),
                "wps": wps,
                "scores": {
                    "emotional": emo_score,
                    "speech_rate": rate_score,
                    "audio_energy": round(audio_energy, 2),
                    "final": round(final_score, 2)
                },
                "emotional_matches": matches
            }
            scored_segments.append(scored_seg)
            
        return scored_segments

    def group_highlights(self, scored_segments: List[Dict[str, Any]], 
                         min_duration: float = 30.0, 
                         max_duration: float = 60.0) -> List[Dict[str, Any]]:
        """
        Thuật toán gom nhóm (Grouping & Storytelling Cohort):
        Tự động tìm kiếm các chuỗi phân đoạn liên tiếp có tổng độ dài từ 30s đến 60s
        sao cho tổng điểm chất lượng và mạch truyện là tối ưu nhất.
        """
        highlights = []
        n = len(scored_segments)
        
        # Định nghĩa các cụm ứng viên hợp lệ
        candidates = []
        for i in range(n):
            for j in range(i, n):
                start_time = scored_segments[i]["start"]
                end_time = scored_segments[j]["end"]
                duration = end_time - start_time
                
                # Kiểm tra điều kiện thời gian tối thiểu và tối đa
                if min_duration <= duration <= max_duration:
                    sub_segs = scored_segments[i:j+1]
                    
                    # Tính điểm cơ bản của cụm (Trung bình cộng điểm các phân đoạn)
                    avg_score = sum(seg["scores"]["final"] for seg in sub_segs) / len(sub_segs)
                    
                    # Điểm cộng đỉnh điểm cảm xúc (Peak Emotion Bonus)
                    max_emo = max(seg["scores"]["emotional"] for seg in sub_segs)
                    
                    # Điểm mạch truyện liền mạch (Storytelling Cohesion Score):
                    # - Điểm trừ nếu câu cuối cùng bị cắt lửng lơ (ví dụ: kết thúc bằng các từ nối như "nhưng", "và", "bởi vì", "thì")
                    # - Điểm cộng nếu câu đầu tiên mở đầu bằng các trạng từ thu hút, hoặc câu cuối kết thúc trọn vẹn dấu chấm.
                    last_text = sub_segs[-1]["text"].strip().lower()
                    story_bonus = 0.0
                    
                    # Tránh cắt giữa chừng câu nói lửng lơ
                    truncated_words = ["nhưng", "và", "bởi vì", "thì", "là", "hoặc", "nếu", "tuy"]
                    if any(last_text.endswith(w) for w in truncated_words):
                        story_bonus -= 2.0 # Phạt nặng nếu cắt dở câu
                        
                    # Điểm cộng độ dài lý tưởng (Lý tưởng nhất là khoảng 40s - 50s cho video ngắn)
                    # Hàm Gauss hoặc Parabol phạt độ dài lệch xa khoảng trung vị 45s
                    length_penalty = -0.05 * abs(duration - 45.0)
                    
                    # Tính tổng điểm chất lượng của đoạn Highlight ứng viên
                    composite_score = avg_score + (max_emo * 0.15) + story_bonus + length_penalty
                    
                    candidates.append({
                        "start_index": i,
                        "end_index": j,
                        "start_time": start_time,
                        "end_time": end_time,
                        "duration": round(duration, 2),
                        "composite_score": round(composite_score, 2),
                        "segments_count": len(sub_segs),
                        "segment_ids": [seg["id"] for seg in sub_segs]
                    })
        
        # Sắp xếp các ứng viên highlight theo điểm số tổng hợp giảm dần
        candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        
        # Lọc các highlight không bị đè lên nhau quá nhiều (overlap threshold <= 20%)
        selected_candidates = []
        for cand in candidates:
            overlap = False
            for sel in selected_candidates:
                # Tính khoảng giao nhau của 2 đoạn thời gian
                overlap_start = max(cand["start_time"], sel["start_time"])
                overlap_end = min(cand["end_time"], sel["end_time"])
                
                if overlap_start < overlap_end:
                    overlap_duration = overlap_end - overlap_start
                    # Nếu tỷ lệ giao nhau vượt quá 20% thời lượng của bất kỳ đoạn nào, coi như bị chồng chéo
                    if (overlap_duration / cand["duration"] > 0.2) or (overlap_duration / sel["duration"] > 0.2):
                        overlap = True
                        break
            
            if not overlap:
                selected_candidates.append(cand)
                # Chỉ lấy tối đa 3-5 highlight chất lượng nhất để tránh loãng
                if len(selected_candidates) >= 5:
                    break
                    
        # Sắp xếp các highlight được chọn theo thứ tự thời gian xuất hiện trong video
        selected_candidates.sort(key=lambda x: x["start_time"])
        
        # Định dạng dữ liệu đầu ra đẹp đẽ
        for idx, hc in enumerate(selected_candidates):
            sub_segs = scored_segments[hc["start_index"] : hc["end_index"]+1]
            highlight_text = " ".join(seg["text"] for seg in sub_segs)
            
            # Trích xuất các trigger cảm xúc chính trong đoạn Highlight này
            all_matches = []
            for seg in sub_segs:
                all_matches.extend(seg["emotional_matches"])
            unique_triggers = list(set(all_matches))
            
            highlights.append({
                "highlight_id": idx + 1,
                "start": hc["start_time"],
                "end": hc["end_time"],
                "duration": hc["duration"],
                "score": hc["composite_score"],
                "text_summary": highlight_text[:120] + "..." if len(highlight_text) > 120 else highlight_text,
                "full_text": highlight_text,
                "triggers": unique_triggers,
                "segments": sub_segs
            })
            
        return highlights


# --- KHU VỰC CHẠY THỬ NGHIỆM / DEMO ---
def generate_mock_transcript() -> List[Dict[str, Any]]:
    """
    Tự sinh dữ liệu Transcript mô phỏng dài khoảng 3 phút có kèm thông số âm lượng.
    """
    return [
        {"id": 1, "start": 0.0, "end": 6.5, "text": "Chào mừng các bạn đã quay trở lại với CreatorOS, nơi chia sẻ giải pháp tự động hóa video.", "audio_energy": 5.2},
        {"id": 2, "start": 6.5, "end": 12.0, "text": "Hôm nay tôi sẽ bật mí một bí mật cực kỳ khủng khiếp mà các nhà làm phim ngắn giấu bạn.", "audio_energy": 8.5},
        {"id": 3, "start": 12.0, "end": 18.5, "text": "Có một sai lầm rất lớn khiến kênh của bạn không thể tăng view, đó là nhịp độ nói quá đều đều.", "audio_energy": 4.1},
        {"id": 4, "start": 18.5, "end": 25.0, "text": "Nghe thật sốc đúng không? Nhưng đây hoàn toàn là sự thật dựa trên phân tích thuật toán.", "audio_energy": 7.8},
        {"id": 5, "start": 25.0, "end": 32.2, "text": "Nếu bạn muốn đột phá thành công, hãy lưu ý cảnh báo nguy hiểm sau đây để tránh mất kênh oan uổng.", "audio_energy": 9.1},
        {"id": 6, "start": 32.2, "end": 39.0, "text": "Bước đầu tiên là phải lựa chọn âm thanh có biên độ dao động mạnh mẽ tại các điểm nhấn kịch tính.", "audio_energy": 6.0},
        {"id": 7, "start": 39.0, "end": 45.5, "text": "Điều này kích thích não bộ người xem và giữ chân họ lâu hơn đến không thể tin được.", "audio_energy": 8.0},
        {"id": 8, "start": 45.5, "end": 52.0, "text": "Tôi đã thử nghiệm thành công trên mười kênh vệ tinh và đạt kết quả tuyệt vời chỉ trong một tuần.", "audio_energy": 8.2},
        {"id": 9, "start": 52.0, "end": 58.5, "text": "Họ đã bất ngờ tột độ khi thấy lượng tương tác tăng vọt lên đỉnh cao chưa từng có.", "audio_energy": 7.5},
        {"id": 10, "start": 58.5, "end": 65.0, "text": "Bí quyết chính là nhịp nói dồn dập ở các giây thứ mười lăm đến ba mươi.", "audio_energy": 5.5},
        {"id": 11, "start": 65.0, "end": 71.2, "text": "Tuy nhiên, rất nhiều người mắc sai lầm nghiêm trọng khi lạm dụng nhạc nền quá to.", "audio_energy": 3.8},
        {"id": 12, "start": 71.2, "end": 78.0, "text": "Đây là một thất bại đau đớn mà tôi khuyên bạn nên tránh bằng mọi giá.", "audio_energy": 8.6},
        {"id": 13, "start": 78.0, "end": 84.5, "text": "Hãy tập trung vào giọng đọc rõ ràng và nhấn nhá đúng lúc để tạo cảm giác hồi hộp.", "audio_energy": 5.0},
        {"id": 14, "start": 84.5, "end": 91.0, "text": "Đừng quên đăng ký kênh và tải ngay CreatorOS Desktop để tối ưu hóa quy trình dựng video nhé.", "audio_energy": 6.5},
        {"id": 15, "start": 91.0, "end": 97.5, "text": "Cảm ơn các bạn và hẹn gặp lại trong các bài học tiếp theo.", "audio_energy": 4.5}
    ]

def main():
    import sys
    import io
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    print("=" * 70)
    print("CREATOROS: CHẠY THỬ THUẬT TOÁN PHÂN TÍCH TRANSCRIPT VIDEO")
    print("=" * 70)
    
    # Khởi tạo bộ phân tích
    analyzer = TranscriptAnalyzer()
    
    # 1. Sinh dữ liệu mẫu
    segments = generate_mock_transcript()
    print(f"[*] Đã nạp thành công {len(segments)} phân đoạn transcript mô phỏng.")
    
    # 2. Chấm điểm từng phân đoạn (Segment Scoring)
    print("\n[+] Đang thực hiện chấm điểm phân đoạn (Emotional, Rate, Audio)...")
    scored_segs = analyzer.score_segments(segments)
    
    # In kết quả chấm điểm phân đoạn mẫu
    print(f"{'ID':<4} | {'Thời gian':<12} | {'Nhịp (WPS)':<10} | {'Điểm C.Xúc':<10} | {'Điểm Tổng':<10} | {'Từ khóa khớp'}")
    print("-" * 85)
    for seg in scored_segs[:6]:
        time_str = f"{seg['start']:.1f}s-{seg['end']:.1f}s"
        matches_str = ", ".join(seg["emotional_matches"]) if seg["emotional_matches"] else "Không có"
        print(f"{seg['id']:<4} | {time_str:<12} | {seg['wps']:<10.2f} | {seg['scores']['emotional']:<10.2f} | {seg['scores']['final']:<10.2f} | {matches_str}")
    print("... (và các phân đoạn tiếp theo)")
    
    # 3. Gom nhóm Highlight tối ưu (30s - 60s)
    print("\n[+] Đang chạy thuật toán gom nhóm Highlights (Thời lượng tối ưu 30s - 60s)...")
    highlights = analyzer.group_highlights(scored_segs, min_duration=30.0, max_duration=60.0)
    
    # In kết quả các đoạn Highlight được chọn
    print("\n" + "=" * 70)
    print(f"DANH SÁCH HIGHLIGHT TỐI ƯU ĐƯỢC TRÍCH XUẤT (Tổng số: {len(highlights)})")
    print("=" * 70)
    
    for hl in highlights:
        print(f"\n🎬 [HIGHLIGHT #{hl['highlight_id']}]")
        print(f"   - Thời lượng : {hl['start']:.1f}s đến {hl['end']:.1f}s ({hl['duration']:.1f} giây)")
        print(f"   - Điểm chất lượng: {hl['score']:.2f} / 10.0")
        print(f"   - Triggers cảm xúc: {', '.join(hl['triggers']) if hl['triggers'] else 'Không có'}")
        print(f"   - Nội dung tóm lược: \"{hl['text_summary']}\"")
        print(f"   - Chi tiết các câu ({len(hl['segments'])} câu):")
        for s in hl['segments']:
            print(f"     [{s['start']:.1f}s-{s['end']:.1f}s] (Điểm: {s['scores']['final']:.2f}): {s['text']}")
            
    print("\n" + "=" * 70)
    print("[Success] Hoàn tất quá trình phân tích và gom nhóm Highlight.")
    print("=" * 70)

if __name__ == "__main__":
    main()
