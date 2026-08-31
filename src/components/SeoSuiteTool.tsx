import React, { useState, useRef } from "react";
import {
  Search,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  BarChart3,
  Copy,
  Download,
  Flame,
  CheckCircle,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign,
  Tag,
  FileText
} from "lucide-react";
import { SeoResult, ChannelAuditResult } from "../types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";

export const SeoSuiteTool: React.FC = () => {
  const [subTab, setSubTab] = useState<"seo" | "thumbnail" | "audit">("seo");

  // SEO Tab States
  const [keyword, setKeyword] = useState("Kiếm tiền YouTube Shorts tự động hóa AI");
  const [niche, setNiche] = useState("YouTube Shorts / TikTok Tech & Money");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Thumbnail Studio States
  const [thumbText, setThumbText] = useState("ĐỪNG LÀM SAI!");
  const [thumbSubText, setThumbSubText] = useState("Mẹo bí mật 2026");
  const [thumbBgColor, setThumbBgColor] = useState("bg-gradient-to-r from-red-600 to-amber-600");
  const [thumbEmoji, setThumbEmoji] = useState("😱");
  const [thumbBadge, setThumbBadge] = useState("100% HIỆU QUẢ");
  const canvasThumbRef = useRef<HTMLDivElement | null>(null);

  // Channel Audit States
  const [channelName, setChannelName] = useState("Tech Lab & AI Automation VN");
  const [channelNiche, setChannelNiche] = useState("Shorts / Reels Automation");
  const [subscribers, setSubscribers] = useState("45,000");
  const [avgViews, setAvgViews] = useState("32,000");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<ChannelAuditResult | null>(null);

  // Handle SEO Generation
  const handleGenerateSeo = async () => {
    setSeoLoading(true);
    soundSynth.playSfx("whoosh");
    try {
      const res = await fetch(getApiUrl("/api/ai/seo-metadata"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, niche, targetLang: "Tiếng Việt" }),
      });

      if (!res.ok) {
        const fallbackRes = await fetch(getApiUrl("/api/ai/seo-suite"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, niche, targetLang: "Tiếng Việt" }),
        });
        if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.data) {
          setSeoResult(fallbackData.data);
          soundSynth.playSfx("cash");
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
          return;
        }
      }

      const data = await res.json();
      const outputData = data.data || data;
      if (outputData) {
        setSeoResult(outputData);
        soundSynth.playSfx("cash");
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } else {
        throw new Error("Không nhận được dữ liệu SEO.");
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi xử lý SEO Suite: ${e.message || "Không thể tạo SEO metadata."}`);
    } finally {
      setSeoLoading(false);
    }
  };

  // Handle Channel Audit
  const handleGenerateAudit = async () => {
    setAuditLoading(true);
    soundSynth.playSfx("whoosh");
    try {
      const res = await fetch(getApiUrl("/api/ai/channel-audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName, topic: channelNiche, subscribers, avgViews }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAuditResult(data.data);
        soundSynth.playSfx("cash");
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  const copyText = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    soundSynth.playSfx("pop");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Search className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Bộ Tool Viết Nội Dung, SEO, Thumbnail & Phân Tích Kênh
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Tối ưu hóa tiêu đề giật CTR cao, bài viết chuẩn SEO, thiết kế Thumbnail bắt mắt và phân tích điểm nghẽn giữ chân người xem kênh chuyên sâu.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => {
                setSubTab("seo");
                soundSynth.playSfx("pop");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === "seo"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              SEO & Tiêu Đề
            </button>
            <button
              onClick={() => {
                setSubTab("thumbnail");
                soundSynth.playSfx("pop");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === "thumbnail"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Thumbnail Studio
            </button>
            <button
              onClick={() => {
                setSubTab("audit");
                soundSynth.playSfx("pop");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === "audit"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Phân Tích Kênh
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: SEO & NỘI DUNG */}
      {subTab === "seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Từ Khóa & Chủ Đề
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Từ khóa chính</label>
              <input
                id="input-seo-keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="VD: Kiếm tiền YouTube không lộ mặt..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Niche / Lĩnh vực</label>
              <select
                id="select-seo-niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="YouTube Shorts / TikTok Tech & Money">Công nghệ & Kiếm tiền Online</option>
                <option value="Review Phim & Giải Trí">Review Phim & Điện Ảnh</option>
                <option value="Sức Khỏe & Thể Dục">Sức Khỏe & Thể Dục</option>
                <option value="Học Tiếng Anh / Giáo Dục">Giáo Dục & Ngoại Ngữ</option>
                <option value="Gaming & Esports">Gaming & Esports</option>
              </select>
            </div>

            <button
              id="btn-generate-seo"
              disabled={seoLoading}
              onClick={handleGenerateSeo}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {seoLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Đang Phân Tích CTR & Tối Ưu SEO...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Tiêu Đề Viral & Bộ Thẻ SEO</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {!seoResult ? (
              <div className="h-full min-h-[380px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
                <Search className="w-12 h-12 text-indigo-400/50 mb-3" />
                <h3 className="text-base font-bold text-slate-200 mb-1">
                  Chưa có dữ liệu SEO
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Bấm tạo tiêu đề để xem danh sách tiêu đề dự đoán CTR cao nhất kèm thẻ tag SEO chuẩn thuật toán.
                </p>
                <button
                  onClick={handleGenerateSeo}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  Tạo thử bộ SEO mẫu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Titles */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Top 5 Tiêu Đề Có CTR Dự Đoán Cao Nhất:
                  </div>
                  {seoResult.viralTitles.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                            CTR ~{t.ctrEstimate}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {t.hookType}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-relaxed">{t.title}</h4>
                      </div>
                      <button
                        onClick={() => copyText(t.title, idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0"
                      >
                        {copiedIndex === idx ? "Đã chép!" : "Sao chép"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Description & Tags */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Mô Tả Chuẩn SEO (Description):
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {seoResult.optimizedDescription}
                  </p>

                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                    <Tag className="w-3.5 h-3.5" />
                    Thẻ Tag & Hashtag Đã Xếp Hạng:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {seoResult.rankedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-mono text-xs border border-indigo-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: THUMBNAIL STUDIO */}
      {subTab === "thumbnail" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Thiết Kế Thumbnail Giật Gân
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tiêu đề lớn trên Thumbnail</label>
              <input
                id="input-thumb-main"
                type="text"
                value={thumbText}
                onChange={(e) => setThumbText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Chữ phụ / Điểm nhấn</label>
              <input
                id="input-thumb-sub"
                type="text"
                value={thumbSubText}
                onChange={(e) => setThumbSubText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Biểu cảm / Icon</label>
                <select
                  id="select-thumb-emoji"
                  value={thumbEmoji}
                  onChange={(e) => setThumbEmoji(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="😱">😱 Kinh ngạc / Shock</option>
                  <option value="🔥">🔥 Hot / Cảnh báo</option>
                  <option value="🤫">🤫 Bí mật / Cấm nói</option>
                  <option value="🤯">🤯 Nổ não / Khó tin</option>
                  <option value="💰">💰 Tiền bạc / Giàu có</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Badge huy hiệu</label>
                <input
                  type="text"
                  value={thumbBadge}
                  onChange={(e) => setThumbBadge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Gam màu nền</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setThumbBgColor("bg-gradient-to-r from-red-600 via-rose-600 to-amber-600")}
                  className="h-8 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 border border-white/20"
                />
                <button
                  onClick={() => setThumbBgColor("bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900")}
                  className="h-8 rounded-lg bg-gradient-to-r from-indigo-900 to-purple-900 border border-white/20"
                />
                <button
                  onClick={() => setThumbBgColor("bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-900")}
                  className="h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-900 border border-white/20"
                />
              </div>
            </div>
          </div>

          {/* Canvas Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Khung Xem Trước Thumbnail (16:9 4K):
            </div>

            <div
              ref={canvasThumbRef}
              className={`w-full aspect-video rounded-2xl ${thumbBgColor} border-4 border-yellow-400/80 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between select-none`}
            >
              {/* Badge top-left */}
              <div className="self-start px-3 py-1 rounded-lg bg-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg">
                {thumbBadge}
              </div>

              {/* Center Shock Expression & Massive text */}
              <div className="space-y-1 z-10">
                <div className="text-3xl sm:text-5xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] tracking-tight uppercase leading-none">
                  {thumbText}
                </div>
                <div className="text-lg sm:text-2xl font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {thumbSubText}
                </div>
              </div>

              {/* Big Emoji Right */}
              <div className="absolute right-4 bottom-2 text-6xl sm:text-8xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] animate-pulse">
                {thumbEmoji}
              </div>

              {/* Arrow Indicator */}
              <div className="self-end px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase shadow-md flex items-center gap-1">
                <span>XEM NGAY</span>
                <span>👉</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  soundSynth.playSfx("success");
                  confetti({ particleCount: 30, spread: 50 });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File Ảnh Thumbnail PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CHANNEL AUDIT */}
      {subTab === "audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Thông Tin Kênh Phân Tích
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tên kênh / URL</label>
              <input
                id="input-audit-channel"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Lượng Người Đăng Ký</label>
                <input
                  type="text"
                  value={subscribers}
                  onChange={(e) => setSubscribers(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Lượt View Trung Bình</label>
                <input
                  type="text"
                  value={avgViews}
                  onChange={(e) => setAvgViews(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                />
              </div>
            </div>

            <button
              id="btn-generate-audit"
              disabled={auditLoading}
              onClick={handleGenerateAudit}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {auditLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Đang Phân Tích Điểm Nghẽn & RPM...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Phân Tích Kênh & Lộ Trình 30 Ngày</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {!auditResult ? (
              <div className="h-full min-h-[380px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
                <BarChart3 className="w-12 h-12 text-indigo-400/50 mb-3" />
                <h3 className="text-base font-bold text-slate-200 mb-1">
                  Chưa có bản Audit kênh
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Bấm phân tích để xem điểm rơi giữ chân người xem, dự toán RPM US/VN và lộ trình tăng trưởng 30 ngày.
                </p>
                <button
                  onClick={handleGenerateAudit}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  Chạy thử Audit mẫu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score & Retention */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-emerald-400 uppercase">Điểm Sức Khỏe Kênh</div>
                    <div className="text-2xl font-black text-white">{auditResult.healthScore}/100</div>
                    <div className="text-xs text-slate-400">
                      Tỉ lệ xem trung bình: <strong>{auditResult.retentionAnalysis.avgWatchPercentage}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-amber-400 uppercase">Ước Tính Doanh Thu (RPM)</div>
                    <div className="text-sm font-bold text-white">{auditResult.monetizationRPM.estimatedRPM}</div>
                    <div className="text-xs text-slate-400">{auditResult.monetizationRPM.potentialMonthlyRevenue}</div>
                  </div>
                </div>

                {/* 30 Days Roadmap */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Lộ Trình Tăng Trưởng Đột Phá 30 Ngày:
                  </div>
                  <div className="space-y-2">
                    {auditResult.actionRoadmap30Days.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold shrink-0">
                          {item.week}
                        </span>
                        <span className="text-slate-200">{item.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
