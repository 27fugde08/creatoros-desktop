import React, { useState } from "react";
import {
  Clapperboard,
  Sparkles,
  Play,
  Pause,
  Copy,
  Download,
  Star,
  Globe,
  Film,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  BookOpen,
  Gamepad2,
  Smartphone,
  Utensils
} from "lucide-react";
import { ReviewResult, ReviewAct } from "../types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";

export const ReviewTool: React.FC = () => {
  const [title, setTitle] = useState("Ký Sinh Trùng (Parasite) - Tuyệt Phẩm Bóc Trần Tầng Lớp");
  const [genre, setGenre] = useState("Phim ảnh / Điện ảnh");
  const [language, setLanguage] = useState("Tiếng Việt");
  const [tone, setTone] = useState("Kịch tính, Lôi cuốn");
  const [targetLength, setTargetLength] = useState("3 phút (Short Recap)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const samplePresets = [
    {
      title: "Solo Leveling (Tôi Thăng Cấp Một Mình)",
      genre: "Anime / Manhwa",
      language: "Tiếng Việt",
      tone: "Hào hứng, Hype cực đỉnh",
      length: "3 phút (Short Recap)",
    },
    {
      title: "iPhone 16 Pro Max Sau 6 Tháng Sử Dụng",
      genre: "Công nghệ / Đập hộp",
      language: "Tiếng Việt",
      tone: "Chuyên sâu, Thực tế khách quan",
      length: "5 phút (Full Review)",
    },
    {
      title: "Black Myth: Wukong - Hành Trình Đại Náo",
      genre: "Game / Gaming recap",
      language: "Tiếng Anh (English)",
      tone: "Kịch tính, Hùng tráng",
      length: "3 phút (Short Recap)",
    },
    {
      title: "Tâm Lý Học Về Tiền (Psychology of Money)",
      genre: "Sách & Phát triển bản thân",
      language: "Tiếng Việt",
      tone: "Trầm ấm, Triết lý sâu sắc",
      length: "3 phút (Short Recap)",
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    soundSynth.playSfx("whoosh");
    try {
      const response = await fetch(getApiUrl("/api/pipeline/auto-review"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: title,
          target_language: language === "Tiếng Việt" ? "vi" : "en",
          voice_type: tone,
          title,
          genre,
          targetLength,
        }),
      });

      if (!response.ok) {
        // Fallback to /api/ai/review if pipeline endpoint isn't active
        const fallbackRes = await fetch(getApiUrl("/api/ai/review"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, genre, language, tone, targetLength }),
        });
        if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.data) {
          setResult(fallbackData.data);
          soundSynth.playSfx("cash");
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
          return;
        }
      }

      const resData = await response.json();
      const outputData = resData.data || resData;
      if (outputData) {
        setResult(outputData);
        soundSynth.playSfx("cash");
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        throw new Error("Không nhận được dữ liệu từ AI Review.");
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi xử lý AI Review: ${e.message || "Không thể tạo review."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayFullScript = () => {
    if (!result) return;
    if (isPlaying) {
      soundSynth.stopSpeech();
      setIsPlaying(false);
      return;
    }
    const fullText = `${result.hook}. ${result.acts.map((a) => a.content).join(" ")} ${result.callToAction}`;
    setIsPlaying(true);
    soundSynth.speakText(fullText, {
      lang: language.includes("Anh") || language.includes("English") ? "en-US" : "vi-VN",
      rate: 1.05,
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleCopyScript = () => {
    if (!result) return;
    const fullText = `=== ${result.title} ===\n\n[HOOK 0-5S]\n${result.hook}\n\n${result.acts
      .map((a) => `[${a.actName} - ${a.duration}]\n${a.content}\n(Hình ảnh gợi ý: ${a.visualPrompt})\n`)
      .join("\n")}\n[ĐÁNH GIÁ: ${result.verdict.rating}]\nƯu điểm: ${result.verdict.pros.join(
      ", "
    )}\nNhược điểm: ${result.verdict.cons.join(", ")}\nKhán giả: ${
      result.verdict.targetAudience
    }\n\n[CALL TO ACTION]\n${result.callToAction}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    soundSynth.playSfx("pop");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Clapperboard className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Review & Recap Mọi Thể Loại Đa Ngôn Ngữ
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Tạo kịch bản tóm tắt, review phim, anime, game, công nghệ, sách, ẩm thực theo cấu trúc 3 hồi chuẩn Hollywood kèm giọng đọc đa ngôn ngữ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Hỗ trợ 12+ Ngôn Ngữ Quốc Tế
            </span>
          </div>
        </div>
      </div>

      {/* Preset Chooser */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium">Chủ đề mẫu:</span>
        {samplePresets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTitle(p.title);
              setGenre(p.genre);
              setLanguage(p.language);
              setTone(p.tone);
              setTargetLength(p.length);
              soundSynth.playSfx("pop");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-all"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-400" />
            Cấu Hình Bài Review
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tác phẩm / Sản phẩm / Chủ đề</label>
            <input
              id="input-review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Attack on Titan Season 4..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Thể loại</label>
              <select
                id="select-review-genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Phim ảnh / Điện ảnh">Phim ảnh / Điện ảnh</option>
                <option value="Anime / Manga / Manhwa">Anime / Manga / Manhwa</option>
                <option value="Công nghệ / Đập hộp">Công nghệ / Đập hộp</option>
                <option value="Game / Gaming recap">Game / Gaming recap</option>
                <option value="Sách & Phát triển bản thân">Sách & Phát triển bản thân</option>
                <option value="Ẩm thực & Du lịch">Ẩm thực & Du lịch</option>
                <option value="Xe cộ & Khoa học">Xe cộ & Khoa học</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ngôn ngữ đầu ra</label>
              <select
                id="select-review-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Tiếng Việt">Tiếng Việt (Vietnamese)</option>
                <option value="Tiếng Anh (English)">Tiếng Anh (English)</option>
                <option value="Tiếng Trung (Mandarin)">Tiếng Trung (中文)</option>
                <option value="Tiếng Hàn (Korean)">Tiếng Hàn (한국어)</option>
                <option value="Tiếng Nhật (Japanese)">Tiếng Nhật (日本語)</option>
                <option value="Tiếng Thái (Thai)">Tiếng Thái (ภาษาไทย)</option>
                <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha (Español)</option>
                <option value="Tiếng Pháp">Tiếng Pháp (Français)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Giọng điệu (Tone)</label>
              <select
                id="select-review-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Kịch tính, Lôi cuốn">Kịch tính, Lôi cuốn</option>
                <option value="Hài hước, Meme dính">Hài hước, Meme dính</option>
                <option value="Chuyên sâu, Phân tích">Chuyên sâu, Phân tích</option>
                <option value="Trầm ấm, Triết lý">Trầm ấm, Triết lý</option>
                <option value="Tóm tắt nhanh dồn dập">Tóm tắt nhanh dồn dập</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Thời lượng kịch bản</label>
              <select
                id="select-review-length"
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="60s (TikTok / Shorts)">60s (TikTok / Shorts)</option>
                <option value="3 phút (Short Recap)">3 phút (Short Recap)</option>
                <option value="5 phút (Full Review)">5 phút (Full Review)</option>
                <option value="10 phút (Chuyên sâu)">10 phút (Chuyên sâu)</option>
              </select>
            </div>
          </div>

          <button
            id="btn-generate-review"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI Đang Soạn Kịch Bản Review Chuẩn Hollywood...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo Kịch Bản Review & Đánh Giá Ngay</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-4">
          {!result ? (
            <div className="h-full min-h-[380px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <Clapperboard className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                Kịch bản review chưa được tạo
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Chọn chủ đề và bấm tạo kịch bản để AI xây dựng mạch truyện 3 hồi, lời bình giật gân và thang điểm đánh giá.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Chạy thử kịch bản Parasite
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{result.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
                      {result.language}
                    </span>
                    <span className="text-xs text-slate-400">
                      Điểm đánh giá: <strong className="text-amber-300">{result.verdict.rating}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handlePlayFullScript}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isPlaying
                        ? "bg-rose-500 text-white"
                        : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? "Dừng Đọc" : "Đọc Toàn Bộ"}</span>
                  </button>

                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Đã chép!" : "Sao Chép"}</span>
                  </button>
                </div>
              </div>

              {/* Hook Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hook Giữ Chân 5s Đầu:
                </div>
                <p className="text-xs font-semibold text-rose-100 italic leading-relaxed">
                  "{result.hook}"
                </p>
              </div>

              {/* 3 Acts Curve */}
              <div className="space-y-3">
                {result.acts.map((act, index) => (
                  <div key={index} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white">{act.actName}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950">
                        {act.duration}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{act.content}</p>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                      <strong className="text-indigo-400">Gợi ý hình ảnh:</strong> {act.visualPrompt}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verdict & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Ưu Điểm & Điểm Mạnh
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {result.verdict.pros.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    Tổng Kết & CTA
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Khán giả:</strong> {result.verdict.targetAudience}
                  </p>
                  <p className="text-xs text-indigo-300 italic pt-1 border-t border-slate-800">
                    "{result.callToAction}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
