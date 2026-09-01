import React, { useState, useEffect } from "react";
import {
  Code2,
  Terminal,
  Play,
  Copy,
  CheckCircle,
  Sparkles,
  Server,
  Zap,
  Check,
  RefreshCw,
  Globe,
  Sliders,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Cpu
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { BACKEND_BASE_URL, getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";

interface EndpointDef {
  id: string;
  name: string;
  category: "AI Generation" | "Media & Downloader" | "Voice & Audio" | "Phone Farm & ADB" | "Commercial Suite" | "System";
  method: "POST" | "GET";
  path: string;
  summary: string;
  defaultBody?: any;
  queryParams?: Array<{ name: string; type: string; desc: string }>;
}

const API_ENDPOINTS: EndpointDef[] = [
  {
    id: "ai_highlight",
    name: "AI Highlight & Voice Script",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/highlight",
    summary: "Tìm phân cảnh đắt giá nhất từ nội dung thô và viết lời bình viral theo phong cách mong muốn.",
    defaultBody: {
      videoTitle: "Bí Mật Của Người Giàu Nhất Hành Tinh",
      videoTopic: "Tài chính & Đột phá tư duy",
      targetDuration: "60s",
      style: "Hype/Shocking"
    }
  },
  {
    id: "ai_review",
    name: "AI Review & Recap Đa Ngôn Ngữ",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/review",
    summary: "Biên kịch review phim, anime, manga, game theo các hồi kịch tính có kèm visual prompts.",
    defaultBody: {
      title: "Interstellar (Hố Đen Tử Thần)",
      genre: "Phim khoa học viễn tưởng",
      language: "Tiếng Việt",
      tone: "Kịch tính, Lôi cuốn",
      targetLength: "3 phút (Short Recap)"
    }
  },
  {
    id: "ai_translate",
    name: "AI Dịch Thuật & Dubbing Subtitles",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/translate-video",
    summary: "Dịch phụ đề video sang tiếng Việt/Anh chuẩn văn phong Shorts và xuất chuỗi .SRT chuẩn.",
    defaultBody: {
      sourceText: "Today I will show you the greatest automation hack for content creators that saves 10 hours weekly.",
      sourceLang: "Tiếng Anh",
      targetLang: "Tiếng Việt",
      style: "Tự nhiên, Văn phong Shorts"
    }
  },
  {
    id: "ai_semi_content",
    name: "AI Edit Bán Content YTB",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/semi-content",
    summary: "Lập cấu hình render split-screen, pitch shift âm thanh +3%, và visual filters bypass bản quyền.",
    defaultBody: {
      topic: "10 Sự Thật Rùng Rợn Dưới Đáy Đại Dương",
      overlayType: "GTA5 / Subway Surfers Gameplay",
      narrationTone: "Kể chuyện ly kỳ",
      splitRatio: "50/50"
    }
  },
  {
    id: "ai_seo_suite",
    name: "AI SEO, Content & Thumbnail Prompt",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/seo-suite",
    summary: "Tạo 5 tiêu đề CTR > 15%, mô tả chuẩn SEO, thẻ tag xếp hạng và prompt ảnh Midjourney/Flux.",
    defaultBody: {
      keyword: "Cách Làm Shorts Triệu View 2026",
      niche: "YouTube Shorts / TikTok",
      targetLang: "Tiếng Việt"
    }
  },
  {
    id: "ai_comic_story",
    name: "AI Comic Character Consistency",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/comic-story",
    summary: "Thiết kế phân cảnh truyện tranh AI với DNA đồng bộ nhân vật 100% qua mọi khung hình.",
    defaultBody: {
      storyIdea: "Thức tỉnh năng lực điều khiển sấm sét bảo vệ thành phố",
      genre: "Manhwa / Hiện đại",
      characterName: "Lâm Phong",
      artStyle: "Webtoon Hàn Quốc hiện đại"
    }
  },
  {
    id: "ai_hooks",
    name: "AI 3-Giây Viral Hook Generator",
    category: "AI Generation",
    method: "POST",
    path: "/api/ai/video-hooks",
    summary: "Tạo danh sách các câu hook 3 giây mở đầu giữ chân 95% người xem trên TikTok/Reels.",
    defaultBody: {
      topic: "Bí quyết kiếm 1000$ đầu tiên từ Affiliate",
      audience: "Người mới bắt đầu",
      count: 3
    }
  },
  {
    id: "batch_downloader",
    name: "Batch Downloader & Media Extractor",
    category: "Media & Downloader",
    method: "POST",
    path: "/api/batch-downloader/parse",
    summary: "Phân tích và bóc tách link video gốc sạch không logo, tách nhạc MP3 tốc độ cao.",
    defaultBody: {
      urls: [
        "https://www.tiktok.com/@creator/video/739102938491823",
        "https://www.douyin.com/video/729183920194827",
        "https://www.youtube.com/shorts/kx89WqLa021"
      ],
      removeWatermark: true,
      platform: "auto"
    }
  },
  {
    id: "voice_synthesize",
    name: "Voiceover TTS & SSML Synthesizer",
    category: "Voice & Audio",
    method: "POST",
    path: "/api/voice/synthesize",
    summary: "Chuẩn hóa kịch bản, thêm nhãn ngắt nghỉ SSML và điều chế tần số giọng đọc.",
    defaultBody: {
      text: "Chào mừng các bạn đã quay trở lại với kênh! Hôm nay chúng ta sẽ cùng khám phá một bí quyết cực kỳ tuyệt vời.",
      language: "vi-VN",
      voiceGender: "male",
      emotion: "Hào hứng",
      rate: 1.05,
      pitch: 1.0,
      bgmDucking: true
    }
  },
  {
    id: "phone_farm_execute",
    name: "Phone Farm ADB Script Dispatcher",
    category: "Phone Farm & ADB",
    method: "POST",
    path: "/api/phone-farm/execute",
    summary: "Gửi lệnh ADB đa luồng tới cluster điện thoại thật để nuôi kênh, đổi proxy và đăng video.",
    defaultBody: {
      deviceIds: ["all"],
      action: "warm_up_algorithm",
      appTarget: "tiktok",
      durationMinutes: 30
    }
  },
  {
    id: "phone_farm_devices",
    name: "Phone Farm Cluster Health Query",
    category: "Phone Farm & ADB",
    method: "GET",
    path: "/api/phone-farm/devices",
    summary: "Lấy trạng thái trực tiếp của toàn bộ thiết bị trong Phone Farm, pin, nhiệt độ, IP proxy."
  },
  {
    id: "workflow_compile",
    name: "DAG Workflow Topological Compiler",
    category: "Commercial Suite",
    method: "POST",
    path: "/api/workflow/compile",
    summary: "Kiểm tra chu trình lặp vô tận (Cycle Rejection) và biên dịch sơ đồ DAG thành các Stage song song.",
    defaultBody: {
      workflow_id: "auto_dubbing_dag_v1",
      nodes: [
        { id: "node_1", type: "INPUT_NODE", label: "Video Ingest" },
        { id: "node_2", type: "DEMUCS_ISOLATION", label: "Demucs Vocal Split" },
        { id: "node_3", type: "WHISPER_TRANSCRIBE", label: "Whisper Subtitles" },
        { id: "node_4", type: "RENDER_NOSTRIKE", label: "No-Strike 2K Render" }
      ],
      edges: [
        { id: "e1", sourceNodeId: "node_1", targetNodeId: "node_2" },
        { id: "e2", sourceNodeId: "node_2", targetNodeId: "node_3" },
        { id: "e3", sourceNodeId: "node_3", targetNodeId: "node_4" }
      ]
    }
  },
  {
    id: "license_status",
    name: "DRM Hardware Fingerprint & License Status",
    category: "Commercial Suite",
    method: "GET",
    path: "/api/license/status",
    summary: "Lấy chữ ký phần cứng máy tính và trạng thái bản quyền ngoại tuyến."
  },
  {
    id: "license_activate",
    name: "DRM Offline License Activation",
    category: "Commercial Suite",
    method: "POST",
    path: "/api/license/activate",
    summary: "Kích hoạt bản quyền offline bằng License Key chứa chữ ký HMAC-SHA256.",
    defaultBody: {
      license_key: "CR-PRO_V48-A93F2B1C-LIFETIME-8E99FA12",
      owner: "Studio Master"
    }
  },
  {
    id: "presets_list",
    name: "Blueprint & Preset Manager (SQLite WAL)",
    category: "Commercial Suite",
    method: "GET",
    path: "/api/presets",
    summary: "Lấy danh sách Preset bộ lọc No-Strike, Voiceover, và Workflow từ database SQLite."
  },
  {
    id: "ota_check",
    name: "Secure OTA Update Check",
    category: "Commercial Suite",
    method: "GET",
    path: "/api/ota/check",
    summary: "Kiểm tra phiên bản mới, tệp cập nhật và chữ ký băm SHA-256 an toàn."
  },
  {
    id: "rate_limit_status",
    name: "Rate Limiting & Quota Metrics",
    category: "System",
    method: "GET",
    path: "/api/rate-limit/status",
    summary: "Truy vấn hạn mức gọi API, số lượt còn lại, thời gian reset và trạng thái bảo vệ chi phí."
  },
  {
    id: "system_health",
    name: "Server Health & AI Status",
    category: "System",
    method: "GET",
    path: "/api/health",
    summary: "Kiểm tra kết nối backend server và trạng thái kích hoạt của Gemini AI Engine."
  }
];

export const ApiDocsTool: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(API_ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(API_ENDPOINTS[0].defaultBody || {}, null, 2)
  );
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "node" | "python" | "php">("curl");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseDurationMs, setResponseDurationMs] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<{ [key: string]: string }>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Rate limit live monitoring state
  const [rateLimitData, setRateLimitData] = useState<any>(null);
  const [isRefreshingQuota, setIsRefreshingQuota] = useState(false);

  const fetchRateLimitMetrics = async () => {
    try {
      setIsRefreshingQuota(true);
      const res = await fetch(getApiUrl("/api/rate-limit/status"));
      if (res.ok) {
        const data = await res.json();
        setRateLimitData(data);
      }
    } catch (e) {
      console.error("Failed to fetch rate limit metrics", e);
    } finally {
      setIsRefreshingQuota(false);
    }
  };

  useEffect(() => {
    fetchRateLimitMetrics();
    const interval = setInterval(fetchRateLimitMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync body when selecting endpoint
  const handleSelectEndpoint = (ep: EndpointDef) => {
    soundSynth.playSfx("pop");
    setSelectedEndpoint(ep);
    setRequestBodyText(JSON.stringify(ep.defaultBody || {}, null, 2));
    setResponseResult(null);
    setResponseStatus(null);
    setResponseDurationMs(null);
  };

  // Run live API request
  const handleExecuteRequest = async () => {
    setIsLoading(true);
    soundSynth.playSfx("pop");
    const startTime = performance.now();
    setResponseHeaders({});

    try {
      let options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (selectedEndpoint.method === "POST" && requestBodyText.trim()) {
        try {
          const parsed = JSON.parse(requestBodyText);
          options.body = JSON.stringify(parsed);
        } catch (e: any) {
          setIsLoading(false);
          setResponseStatus(400);
          setResponseResult({ error: `Cú pháp JSON không hợp lệ: ${e.message}` });
          return;
        }
      }

      const res = await fetch(getApiUrl(selectedEndpoint.path), options);
      const duration = Math.round(performance.now() - startTime);
      setResponseDurationMs(duration);
      setResponseStatus(res.status);

      // Extract Rate Limit Headers
      const headersMap: { [key: string]: string } = {};
      const limit = res.headers.get("x-ratelimit-limit");
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      const category = res.headers.get("x-ratelimit-category");
      const retryAfter = res.headers.get("retry-after");

      if (limit) headersMap["X-RateLimit-Limit"] = limit;
      if (remaining) headersMap["X-RateLimit-Remaining"] = remaining;
      if (reset) headersMap["X-RateLimit-Reset"] = reset;
      if (category) headersMap["X-RateLimit-Category"] = category;
      if (retryAfter) headersMap["Retry-After"] = `${retryAfter}s`;
      setResponseHeaders(headersMap);

      const json = await res.json();
      setResponseResult(json);
      if (res.status === 429) {
        soundSynth.playSfx("boom");
      } else {
        soundSynth.playSfx("success");
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }

      // Refresh rate limit quota status live
      fetchRateLimitMetrics();
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      setResponseDurationMs(duration);
      setResponseStatus(500);
      setResponseResult({ error: err.message || "Lỗi kết nối máy chủ" });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate code snippet
  const generateCodeSnippet = () => {
    const fullUrl = `${BACKEND_BASE_URL}${selectedEndpoint.path.startsWith("/") ? selectedEndpoint.path : `/${selectedEndpoint.path}`}`;
    const bodyObj = selectedEndpoint.defaultBody;
    const bodyStr = JSON.stringify(bodyObj, null, 2);

    if (selectedLanguage === "curl") {
      if (selectedEndpoint.method === "GET") {
        return `curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"`;
      }
      return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(bodyObj)}'`;
    }

    if (selectedLanguage === "node") {
      if (selectedEndpoint.method === "GET") {
        return `// Node.js (Fetch API)
async function callApi() {
  const response = await fetch("${fullUrl}", {
    method: "GET",
    headers: { "Accept": "application/json" }
  });
  const data = await response.json();
  console.log("Kết quả:", data);
}

callApi();`;
      }
      return `// Node.js (Fetch API)
async function callApi() {
  const payload = ${bodyStr};

  const response = await fetch("${fullUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log("Kết quả:", data);
}

callApi();`;
    }

    if (selectedLanguage === "python") {
      if (selectedEndpoint.method === "GET") {
        return `# Python 3 (requests)
import requests

url = "${fullUrl}"
response = requests.get(url)
print(response.json())`;
      }
      return `# Python 3 (requests)
import requests
import json

url = "${fullUrl}"
payload = ${JSON.stringify(bodyObj, null, 4)}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print("Status Code:", response.status_code)
print("Response:", response.json())`;
    }

    if (selectedLanguage === "php") {
      if (selectedEndpoint.method === "GET") {
        return `<?php
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "${fullUrl}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET => true,
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
      }
      return `<?php
$payload = json_encode(${JSON.stringify(bodyObj, null, 2)});

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "${fullUrl}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
    }

    return "";
  };

  const categories = ["all", "AI Generation", "Media & Downloader", "Voice & Audio", "Phone Farm & ADB", "System"];

  const filteredEndpoints = selectedCategory === "all"
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter(ep => ep.category === selectedCategory);

  const copyToClipboard = (text: string, isSnippet: boolean) => {
    navigator.clipboard.writeText(text);
    soundSynth.playSfx("pop");
    if (isSnippet) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Code2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                HỆ THỐNG REST API & WEBHOOK ENGINE
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v4.8 ACTIVE
                </span>
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl">
              Cung cấp bộ API chuẩn REST cho phép kết nối mọi tính năng của Creator Studio AI với n8n, Make.com, Python script, bot Telegram, và hệ thống tự động hóa ngoại vi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs">
              <Server className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Cổng Dịch Vụ</p>
                <p className="font-mono font-bold text-white">:3000 / api</p>
              </div>
            </div>

            <button
              onClick={() => {
                soundSynth.playSfx("pop");
                window.open("/api/docs/endpoints", "_blank");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              JSON Specs
            </button>
          </div>
        </div>
      </div>

      {/* Rate Limiting & Cost Guard Active Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                HỆ THỐNG RATE LIMITING & BẢO VỆ CHI PHÍ TÀI NGUYÊN (ACTIVE)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Sliding Window 60s
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                IP Client: <span className="font-mono text-indigo-300 font-bold">{rateLimitData?.clientIp || "127.0.0.1"}</span> • Tự động chặn spam, ngăn chặn cạn kiệt Token Gemini & chống quá tải Server.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRateLimitMetrics}
            disabled={isRefreshingQuota}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuota ? "animate-spin text-indigo-400" : ""}`} />
            Làm mới Quota
          </button>
        </div>

        {/* 5 Tier Visual Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {rateLimitData?.tiers?.map((t: any) => {
            const isHighUsage = t.percentUsed > 80;
            const isMediumUsage = t.percentUsed > 50;
            return (
              <div
                key={t.category}
                className={`p-3 rounded-xl border transition-all ${
                  isHighUsage
                    ? "bg-rose-950/30 border-rose-800/60"
                    : isMediumUsage
                    ? "bg-amber-950/20 border-amber-800/40"
                    : "bg-slate-950/60 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span className="truncate">{t.label}</span>
                  <span className="font-mono text-indigo-400">{t.consumed}/{t.limit}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighUsage
                        ? "bg-rose-500"
                        : isMediumUsage
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.max(4, t.percentUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Còn lại: <strong className="text-white font-mono">{t.remaining}</strong></span>
                  <span>{t.resetSeconds > 0 ? `Reset ${t.resetSeconds}s` : "Sẵn sàng"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              soundSynth.playSfx("pop");
              setSelectedCategory(cat);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
            }`}
          >
            {cat === "all" ? "Tất Cả Endpoints (12)" : cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Endpoint Explorer & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Danh Sách Endpoints</span>
              <span className="font-mono text-indigo-400">{filteredEndpoints.length} APIs</span>
            </h3>

            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/50 shadow-inner"
                        : "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ep.method === "POST"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">{ep.category}</span>
                    </div>

                    <p className={`text-xs font-bold mt-1 truncate ${isSelected ? "text-indigo-300" : "text-slate-200"}`}>
                      {ep.name}
                    </p>

                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {ep.path}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Webhook & SDK Hint Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Zap className="w-4 h-4 text-indigo-400" />
              Tích Hợp Tự Động Hóa Ngoại Vi
            </div>
            <p className="text-slate-400 leading-relaxed">
              Bạn có thể gọi trực tiếp endpoint từ Python hoặc n8n Webhook node. Các tác vụ nặng tự động cân bằng tải và bảo vệ chống quá tải.
            </p>
          </div>
        </div>

        {/* Right Column: Live Playground & Code Generator */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Endpoint Header */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                    selectedEndpoint.method === "POST"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-bold text-white">{selectedEndpoint.path}</span>
              </div>

              <button
                id="btn-execute-api"
                onClick={handleExecuteRequest}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang Gửi Request...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Gửi Request (Test Live)
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-300">{selectedEndpoint.summary}</p>
          </div>

          {/* Request Body Editor (for POST requests) */}
          {selectedEndpoint.method === "POST" && (
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Request Body (JSON Payload)
                </label>
                <button
                  onClick={() => {
                    soundSynth.playSfx("pop");
                    setRequestBodyText(JSON.stringify(selectedEndpoint.defaultBody || {}, null, 2));
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  Khôi phục mẫu mặc định
                </button>
              </div>

              <textarea
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                rows={7}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
              />
            </div>
          )}

          {/* Response Inspector */}
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Response Output
                </h4>
                {responseStatus !== null && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    STATUS: {responseStatus}
                  </span>
                )}
                {responseDurationMs !== null && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ⏱️ {responseDurationMs} ms
                  </span>
                )}
              </div>

              {responseResult && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseResult, null, 2), false)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Response Headers (Rate Limit Inspection) */}
            {Object.keys(responseHeaders).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400 font-sans font-semibold pr-1">Headers:</span>
                {Object.entries(responseHeaders).map(([key, val]) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-indigo-300"
                  >
                    <span className="text-slate-400">{key}:</span> {val}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 max-h-80 overflow-y-auto font-mono text-xs">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Đang xử lý trên máy chủ...</span>
                </div>
              ) : responseResult ? (
                <pre className="text-emerald-300 whitespace-pre-wrap">
                  {JSON.stringify(responseResult, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-600 italic py-4 text-center">
                  Nhấn nút "Gửi Request (Test Live)" ở trên để kiểm tra phản hồi từ API.
                </p>
              )}
            </div>
          </div>

          {/* Multi-Language Code Snippets */}
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Code Snippet Tích Hợp
                </h4>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(["curl", "node", "python", "php"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      soundSynth.playSfx("pop");
                      setSelectedLanguage(lang);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                      selectedLanguage === lang
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-indigo-200 overflow-x-auto">
              <button
                onClick={() => copyToClipboard(generateCodeSnippet(), true)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Copy code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre className="whitespace-pre overflow-x-auto pr-8">
                {generateCodeSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
