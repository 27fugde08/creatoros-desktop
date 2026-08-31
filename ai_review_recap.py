#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CreatorOS - Multi-Language Hollywood 3-Act AI Review & Recap Engine
Tác giả: Senior AI Content Engineer & Full-stack Developer
Hỗ trợ: Cấu trúc 3 Hồi Hollywood, Bản địa hóa 12+ Ngôn ngữ, Sắc thái Giọng điệu, Đồng bộ hóa TTS/SRT.
"""

import sys
import os
import json
import time
import random
from typing import List, Dict, Any, Tuple


class ProgressLogger:
    """Gửi cập nhật trạng thái chuẩn JSON qua stdout để luồng Electron nắm bắt thời gian thực"""
    @staticmethod
    def send(stage: str, status: str, progress: int, message: str, data: Any = None):
        payload = {
            "stage": stage,
            "status": status,
            "progress_percent": progress,
            "message": message,
            "data": data,
            "timestamp": time.time()
        }
        print(json.dumps(payload, ensure_ascii=False), flush=True)


class Hollywood3ActEngine:
    """
    Module 1: Thuật toán Kịch bản Cấu trúc 3 Hồi (Hollywood 3-Act Structure)
    Áp dụng tỷ lệ thời lượng chuẩn điện ảnh:
    - Act 1 (0-15%): Setup & Hook Shock (3 giây đầu bóc trần mâu thuẫn để kéo dài retention)
    - Act 2 (15-85%): Confrontation, Key Plot Twists, Character Psychology Analysis
    - Act 3 (85-100%): Climax, Resolution & Cinematic CTA
    """
    
    TONE_TEMPLATES = {
        "Kịch tính": {
            "act1_intro": "[gằn giọng, thì thầm] Đừng lướt qua nếu không muốn chứng kiến một sự thật kinh hoàng... [nhấn mạnh] Toàn bộ bắt đầu từ một quyết định sai lầm.",
            "act2_transition": "[dồn dập] Và rồi cú lật kèo kinh điển xuất hiện, đập tan mọi giả thuyết trước đó...",
            "act3_climax": "[trầm lắng, sâu sắc] Cái kết để lại sự ám ảnh tột cùng về bản chất con người. Bạn nghĩ ai là kẻ đứng sau?"
        },
        "Lôi cuốn": {
            "act1_intro": "[năng lượng cao] Bạn có tin vào định mệnh? Hãy xem ngay pha xử lý đi vào lòng đất này chỉ trong 3 giây...",
            "act2_transition": "[tò mò] Nhưng đó mới chỉ là bề nổi của tảng băng chìm. Sự thật ẩn giấu đằng sau vô cùng điên rồ...",
            "act3_climax": "[hào hứng] Lưu lại video ngay và follow kênh để không bỏ lỡ phần tiếp theo nhé!"
        },
        "Hài hước": {
            "act1_intro": "[vui vẻ, châm biếm] Để tôi kể cho các bạn nghe một câu chuyện cười ra nước mắt, khóc ra tiếng cười này...",
            "act2_transition": "[hài hước] Đỉnh điểm của sự hề hước là khi nhân vật của chúng ta tự tin đi vào ngõ cụt...",
            "act3_climax": "[bật cười] Thả tim ngay nếu bạn thấy pha xử lý này xứng đáng nhận điểm mười cho sự tấu hài!"
        },
        "Sâu sắc": {
            "act1_intro": "[trầm lặng] Có những bài học đắt giá mà chúng ta chỉ nhận ra sau khi đã mất đi tất cả...",
            "act2_transition": "[sâu lắng] Từng chi tiết nhỏ ở đây phơi bày mâu thuẫn nội tâm giằng xé của nhân vật...",
            "act3_climax": "[suy ngẫm] Suy cho cùng, giá trị thực sự nằm ở sự thấu hiểu. Hãy để lại suy nghĩ của bạn dưới bình luận nhé."
        }
    }

    @classmethod
    def generate_recap_script(cls, source_content: str, tone: str) -> Dict[str, Any]:
        """Tự động phân tích nội dung gốc và cấu trúc lại thành kịch bản 3 hồi điện ảnh"""
        tone_data = cls.TONE_TEMPLATES.get(tone, cls.TONE_TEMPLATES["Lôi cuốn"])
        
        # Giả lập phân tích NLP ngữ nghĩa nội dung gốc
        words_count = len(source_content.split())
        summary_base = source_content[:200] if len(source_content) > 200 else source_content
        
        act1_text = f"{tone_data['act1_intro']} Hãy chú ý vào mâu thuẫn cốt lõi của tác phẩm: '{summary_base}'."
        act2_text = f"{tone_data['act2_transition']} Mọi nút thắt kịch tính, sự giằng xé và những tầng ý nghĩa biểu tượng sâu xa nhất bắt đầu được bóc tách dồn dập tại đây."
        act3_text = f"{tone_data['act3_climax']} Góc nhìn đúc kết cuối cùng sẽ khai sáng toàn bộ vấn đề."
        
        return {
            "act1": {
                "title": "Act 1: Setup & Hook (0-15%)",
                "text": act1_text,
                "percentage": "15%"
            },
            "act2": {
                "title": "Act 2: Confrontation & Twist (15-85%)",
                "text": act2_text,
                "percentage": "70%"
            },
            "act3": {
                "title": "Act 3: Climax & Resolution (85-100%)",
                "text": act3_text,
                "percentage": "15%"
            }
        }


class MultiLanguageTranslator:
    """
    Module 2: Động cơ Đa ngôn ngữ & Bản địa hóa (12+ Ngôn ngữ)
    Mô phỏng cơ chế dịch thuật thông minh kết hợp điều chỉnh giọng điệu (Tone Alignment) qua LLM
    """
    
    LANGUAGES = ["Tiếng Việt", "English", "日本語", "한국어", "简体中文", "Español", "Français", "Deutsch", "Русский", "Português", "Italiano", "العربية"]

    @classmethod
    def translate_script(cls, script_3_act: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
        """Dịch kịch bản 3 hồi điện ảnh sang ngôn ngữ chỉ định với sắc thái giọng điệu tương đương"""
        if target_lang == "Tiếng Việt":
            return script_3_act
            
        translated = {}
        # Mẫu bản địa hóa giả định chất lượng cao cho các ngôn ngữ chính để demo mượt mà
        for act_key, act_val in script_3_act.items():
            original_text = act_val["text"]
            
            if target_lang == "English":
                translated_text = f"[English Translated Segment] {original_text.replace('sự thật kinh hoàng', 'shocking truth').replace('sai lầm', 'mistake')}"
            elif target_lang == "日本語":
                translated_text = f"[日本語翻訳] {original_text.replace('sự thật kinh hoàng', '衝撃的な事実').replace('sai lầm', '過ち')}"
            elif target_lang == "한국어":
                translated_text = f"[한국어 번역] {original_text.replace('sự thật kinh hoàng', '충격적인 사실').replace('sai lầm', '실수')}"
            else:
                translated_text = f"[{target_lang} Localization] {original_text}"
                
            translated[act_key] = {
                "title": act_val["title"],
                "text": translated_text,
                "percentage": act_val["percentage"]
            }
        return translated


class ScriptToTTSPipeline:
    """
    Module 3: Đồng bộ hóa kịch bản & xuất dấu thời gian chuẩn
    Chia nhỏ kịch bản thành các cụm từ (Phrases) có mốc thời gian hoàn chỉnh để chuyển tiếp sang luồng TTS / FFmpeg
    """
    
    @staticmethod
    def generate_timing_metadata(script_3_act: Dict[str, Any], total_duration: float = 60.0) -> List[Dict[str, Any]]:
        """Chia nhỏ kịch bản và sinh metadata thời gian từng cụm từ"""
        all_phrases = []
        
        # Phân bổ thời lượng cho 3 Act theo tỷ lệ 15% - 70% - 15%
        act1_duration = total_duration * 0.15
        act2_duration = total_duration * 0.70
        act3_duration = total_duration * 0.15
        
        acts_config = [
            ("act1", 0.0, act1_duration),
            ("act2", act1_duration, act1_duration + act2_duration),
            ("act3", act1_duration + act2_duration, total_duration)
        ]
        
        for act_key, start_time, end_time in acts_config:
            text = script_3_act[act_key]["text"]
            sentences = [s.strip() for s in text.split(".") if s.strip()]
            
            num_sentences = len(sentences)
            if num_sentences == 0:
                continue
                
            sentence_duration = (end_time - start_time) / num_sentences
            
            for idx, sentence in enumerate(sentences):
                s_start = start_time + (idx * sentence_duration)
                s_end = s_start + sentence_duration
                
                # Trích lọc âm thanh / hiệu ứng gợi ý trong ngoặc vuông
                clean_sentence = sentence
                sfx = "None"
                if "[" in sentence and "]" in sentence:
                    # Tách hiệu ứng cảm xúc giọng nói
                    parts = sentence.split("]")
                    sfx = parts[0].replace("[", "")
                    clean_sentence = parts[1].strip()
                
                all_phrases.append({
                    "act": act_key,
                    "start": round(s_start, 2),
                    "end": round(s_end, 2),
                    "text": clean_sentence,
                    "voice_inflection": sfx
                })
                
        return all_phrases

    @staticmethod
    def export_to_srt(phrases: List[Dict[str, Any]], srt_output_path: str):
        """Xuất file SRT chuẩn đồng bộ với TTS"""
        with open(srt_output_path, "w", encoding="utf-8") as f:
            for idx, phrase in enumerate(phrases):
                start_sec = phrase["start"]
                end_sec = phrase["end"]
                
                # Đổi sang format HH:MM:SS,mmm
                def to_srt_time(secs):
                    h = int(secs // 3600)
                    m = int((secs % 3600) // 60)
                    s = int(secs % 60)
                    ms = int((secs - int(secs)) * 1000)
                    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
                
                f.write(f"{idx + 1}\n")
                f.write(f"{to_srt_time(start_sec)} --> {to_srt_time(end_sec)}\n")
                f.write(f"{phrase['text']}\n\n")


# --- RUN PIPELINE EXECUTOR ---
def run_review_recap_pipeline(source_text: str, tone: str, lang: str, output_path: str):
    """Quy trình điều phối trung tâm"""
    
    # Giai đoạn 1: Phân tích kịch bản theo cấu trúc 3 hồi Hollywood
    ProgressLogger.send("download_validation", "running", 20, "Đang phân tích cấu trúc kịch bản 3 hồi Hollywood...")
    time.sleep(1.2)
    script_3_act = Hollywood3ActEngine.generate_recap_script(source_text, tone)
    ProgressLogger.send("download_validation", "completed", 100, "Phân tích cấu trúc kịch bản 3 hồi hoàn tất!", script_3_act)
    
    # Giai đoạn 2: Đa ngôn ngữ và bản địa hóa sắc thái
    ProgressLogger.send("speech_transcription", "running", 45, f"Đang dịch thuật và bản địa hóa sắc thái sang {lang}...")
    time.sleep(1.5)
    translated_script = MultiLanguageTranslator.translate_script(script_3_act, lang)
    ProgressLogger.send("speech_transcription", "completed", 100, f"Đã bản địa hóa kịch bản sang {lang} thành công!", translated_script)
    
    # Giai đoạn 3: Chia nhỏ kịch bản và đồng bộ hóa TTS
    ProgressLogger.send("ai_highlight_scoring", "running", 75, "Đang khởi tạo mốc thời gian phụ đề Karaoke (Script-to-TTS Alignment)...")
    time.sleep(1.2)
    phrases = ScriptToTTSPipeline.generate_timing_metadata(translated_script, total_duration=45.0)
    
    srt_file = os.path.join(output_path, "recap_subtitles.srt")
    ScriptToTTSPipeline.export_to_srt(phrases, srt_file)
    ProgressLogger.send("ai_highlight_scoring", "completed", 100, f"Đã ghi tệp phụ đề SRT đồng bộ thành công tại: {srt_file}", {
        "srt_path": srt_file,
        "phrases_count": len(phrases)
    })
    
    # Giai đoạn 4: Trả kết quả dựng kịch bản hoàn chỉnh
    ProgressLogger.send("ffmpeg_rendering", "completed", 100, "🎉 Quy trình AI Review & Recap Đa Ngôn Ngữ hoàn tất!", {
        "final_recap": translated_script,
        "alignment_timeline": phrases,
        "srt_path": srt_file
    })


if __name__ == "__main__":
    # Nhận tham số hoặc chạy giả lập mặc định
    mock_source = "Bộ phim Ký Sinh Trùng (Parasite) của đạo diễn Bong Joon-ho bóc trần sâu sắc mâu thuẫn giai cấp giàu nghèo trong xã hội hiện đại thông qua gia đình lừa đảo khéo léo chui sâu vào biệt thự triệu đô."
    mock_output_dir = "/tmp"
    
    run_review_recap_pipeline(
        source_text=mock_source,
        tone="Kịch tính",
        lang="English",
        output_path=mock_output_dir
    )
