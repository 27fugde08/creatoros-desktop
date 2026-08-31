import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  CheckCircle2,
  GitBranch,
  Network,
  Activity,
  Layers,
  Scissors,
  Clapperboard,
  Languages,
  Film,
  Mic,
  Smartphone,
  Share2,
  LayoutDashboard,
  Code2,
  KeyRound,
  Download,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  FolderGit2,
  Sliders,
  ChevronRight,
  FileText
} from "lucide-react";
import { ActiveTab } from "../types";
import { soundSynth } from "../utils/audioUtils";

interface UserGuideToolProps {
  onNavigateToTab?: (tab: ActiveTab) => void;
}

interface GuideSection {
  id: string;
  title: string;
  category: "quickstart" | "core" | "features" | "system" | "faq";
  categoryLabel: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
  relatedTab?: ActiveTab;
  keywords: string[];
}

export const UserGuideTool: React.FC<UserGuideToolProps> = ({ onNavigateToTab }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>("quickstart-overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const copyToClipboard = (text: string, snippetId: string) => {
    soundSynth.playSfx("pop");
    navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleJumpToTool = (tab: ActiveTab) => {
    soundSynth.playSfx("pop");
    if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
  };

  const SECTIONS: GuideSection[] = useMemo(() => [
    {
      id: "quickstart-overview",
      title: "1. Tổng Quan CREATOROS PRO v5.0",
      category: "quickstart",
      categoryLabel: "Bắt Đầu Nhanh",
      icon: Zap,
      summary: "Kiến trúc Offline-First, tăng tốc GPU cá nhân, không tốn chi phí Cloud API.",
      keywords: ["tổng quan", "kiến trúc", "offline", "gpu", "v5.0", "giới thiệu"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed text-sm">
            <strong>CREATOROS PRO v5.0 Next-Gen</strong> là hệ điều hành phần mềm máy trạm máy tính để bàn (All-in-One Desktop OS) dành riêng cho các nhà sáng tạo nội dung, Agency sản xuất video ngắn (TikTok, YouTube Shorts, Reels) và các studio MMO quy mô lớn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" /> 100% Offline-First
              </div>
              <p className="text-xs text-slate-400">Không gửi dữ liệu ra máy chủ ngoài, bảo mật tuyệt đối bí mật bản quyền nội dung.</p>
            </div>
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
                <Network className="w-4 h-4" /> Cụm Render Mạng LAN
              </div>
              <p className="text-xs text-slate-400">Tận dụng GPU máy trạm rảnh rỗi trong phòng để tăng tốc xuất video gấp 3 - 5 lần.</p>
            </div>
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                <Activity className="w-4 h-4" /> Local AI Lip-Sync
              </div>
              <p className="text-xs text-slate-400">Đồng bộ chuyển động môi Wav2Lip với 68 Face Landmarks qua NVIDIA TensorRT.</p>
            </div>
          </div>

          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Phím Tắt Tìm Kiếm Toàn Cục</h4>
            <p className="text-xs text-slate-300">
              Nhấn tổ hợp phím <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-indigo-300 font-mono text-[11px]">Ctrl + K</kbd> (hoặc <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-indigo-300 font-mono text-[11px]">⌘ + K</kbd>) tại bất kỳ màn hình nào để mở thanh tìm kiếm thông minh và nhảy tới công cụ bạn cần.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "quickstart-drm",
      title: "2. Kích Hoạt Bản Quyền Offline (DRM)",
      category: "quickstart",
      categoryLabel: "Bắt Đầu Nhanh",
      icon: KeyRound,
      summary: "Tạo Hardware Fingerprint định danh máy tính và xác thực license không cần Internet.",
      keywords: ["bản quyền", "license", "drm", "hardware id", "fingerprint", "kích hoạt", "key"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            CREATOROS áp dụng cơ chế xác thực bản quyền máy trạm offline, liên kết trực tiếp với mã định danh phần cứng máy tính:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
            <li>Nhấp vào nút <strong>Bản Quyền</strong> trên thanh Navbar góc phải.</li>
            <li>Hệ thống tự động đọc <em>CPU Model, Mainboard BIOS UUID, MAC Address và GPU Serial</em> để sinh chuỗi <strong>Hardware ID</strong> duy nhất.</li>
            <li>Nhập License Key được cấp phát theo định dạng: <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">CREATOROS-PRO-XXXX-YYYY-ZZZZ-WWWW</code>.</li>
            <li>Nhấn <strong>Xác Thực & Kích Hoạt Offline</strong>. Thông tin bản quyền sẽ được lưu vào cơ sở dữ liệu SQLite WAL cục bộ.</li>
          </ol>
        </div>
      )
    },
    {
      id: "core-workflow-builder",
      title: "3. Visual Workflow Builder (DAG & AI Copilot)",
      category: "core",
      categoryLabel: "Tính Năng Cốt Lõi",
      icon: GitBranch,
      relatedTab: "workflow",
      summary: "Kéo thả DAG, sắp xếp Topological Kahn, AI chuyển ngôn ngữ tự nhiên thành sơ đồ pipeline.",
      keywords: ["workflow", "builder", "dag", "topological", "kahn", "llm", "kéo thả", "copilot"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Trình xây dựng luồng xử lý đồ họa trực quan (Visual DAG Canvas) cho phép bạn kết nối các node xử lý video, âm thanh, AI theo thứ tự tùy biến:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Kéo Thả & Nối Dependency Giữa Các Node</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nối Output của node <em>Input Video</em> sang node <em>Voiceover TTS</em>, tiếp tục sang <em>Wav2Lip ONNX</em> và kết thúc tại <em>Render No-Strike 9:16</em>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Trình Biên Dịch Topological Kahn's Algorithm</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tự động kiểm tra tính hợp lệ và loại trừ hoàn toàn các đường nối vòng lặp (Cycle Rejection), đảm bảo quá trình render không bị treo vô tận.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Local LLM Intent Copilot</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhập câu lệnh tự nhiên (e.g. <em>"Tạo video lồng tiếng kèm đồng bộ khẩu hình lipsync ONNX và render no-strike 9:16"</em>), AI sẽ tự động sinh sơ đồ DAG sẵn sàng chạy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "core-lan-cluster",
      title: "4. Cụm Render Mạng Cục Bộ LAN Cluster",
      category: "core",
      categoryLabel: "Tính Năng Cốt Lõi",
      icon: Network,
      relatedTab: "lan-cluster",
      summary: "Tự động phát hiện máy trạm nội bộ, chia chunk 30s và ghép nối FFmpeg concat siêu tốc.",
      keywords: ["lan", "cluster", "máy trạm", "render", "chunk", "gpu", "phân tán", "tốc độ"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Biến tất cả máy tính trong văn phòng của bạn thành một siêu máy trạm phân tán:
          </p>

          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-2">
            <div className="text-indigo-400">// Nguyên lý hoạt động của Cụm Render LAN v5.0:</div>
            <div>1. Master quét dải IP nội bộ và nhận thông số GPU Worker (VRAM, CUDA, Speed Factor).</div>
            <div>2. Video dài 5-30 phút được chia thành các Chunks (mặc định 30 giây/chunk).</div>
            <div>3. Các Chunks được dispatch song song sang các Worker Nodes.</div>
            <div>4. Khi hoàn thành, Master chạy lệnh FFmpeg Concat không làm suy hao chất lượng:</div>
            <div className="bg-slate-900 p-2.5 rounded text-emerald-400 border border-slate-800 flex items-center justify-between">
              <span>ffmpeg -f concat -safe 0 -i manifest.txt -c copy output_master.mp4</span>
              <button
                onClick={() => copyToClipboard("ffmpeg -f concat -safe 0 -i manifest.txt -c copy output_master.mp4", "ffmpeg-concat")}
                className="text-slate-400 hover:text-white p-1"
              >
                {copiedSnippet === "ffmpeg-concat" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "core-lipsync",
      title: "5. Local AI Lip-Sync Studio (Khẩu Hình)",
      category: "core",
      categoryLabel: "Tính Năng Cốt Lõi",
      icon: Activity,
      relatedTab: "lipsync",
      summary: "Đồng bộ chuyển động môi nhân vật theo giọng đọc qua NVIDIA TensorRT / ONNX.",
      keywords: ["lipsync", "khẩu hình", "khớp môi", "wav2lip", "tensorrt", "onnx", "avatar"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Tạo chuyển động môi tự nhiên 94% cho nhân vật, avatar hoặc MC ảo mà không cần gửi video lên đám mây:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-indigo-300">TensorRT Acceleration</span>
              <p className="text-slate-400">Tối ưu hóa nhân Tensor Core cho tốc độ render đạt 60-80 FPS trên card RTX.</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-emerald-300">68 Face Landmarks Tracking</span>
              <p className="text-slate-400">Định vị chính xác khóe môi, cằm và hàm dưới giúp chuyển động mềm mại không đơ cứng.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "features-editing",
      title: "6. Bộ Công Cụ Video Viral & Khử Bản Quyền",
      category: "features",
      categoryLabel: "Video & Editing",
      icon: Film,
      relatedTab: "semi-edit",
      summary: "Highlight, Recap phim, Dịch thuật Whisper 1-click và Semi-Edit No-Strike Content ID.",
      keywords: ["highlight", "recap", "dịch video", "semi edit", "no strike", "bản quyền", "reels"],
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="text-sm">
            Quy trình sản xuất hàng loạt video ngắn chuẩn định dạng 9:16 Shorts/Reels/TikTok:
          </p>

          <ul className="space-y-2.5">
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <strong className="text-indigo-300">AI Highlight & Script:</strong> Tự động tìm đoạn kịch tính nhất, tạo tiêu đề giật tít Hook 3 giây đầu và sinh phụ đề Auto-Caption.
            </li>
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <strong className="text-cyan-300">Dịch Thuật Video 1-Click:</strong> Bóc tách dải giọng nói nhân vật bằng <em>Demucs</em>, dịch ngữ cảnh và lồng tiếng lại giữ nguyên nhạc nền gốc.
            </li>
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <strong className="text-amber-300">Semi-Edit No-Strike:</strong> Tự động lật khung hình (Micro-Flip), thay đổi quang phổ màu 3% và điều chỉnh tốc độ 1.02x để vượt qua kiểm duyệt bản quyền tự động.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "features-voice-comic",
      title: "7. Voice Local 0đ & AI Comic Đồng Bộ",
      category: "features",
      categoryLabel: "Audio & Comic",
      icon: Mic,
      relatedTab: "voice-local",
      summary: "Tổng hợp giọng đọc offline miễn phí 0đ và tạo video truyện tranh giữ nguyên mặt nhân vật.",
      keywords: ["voice local", "tts", "miễn phí", "comic", "manga", "nhân vật", "đồng bộ"],
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-sm">
            Tối ưu hóa sản xuất nội dung tự động không tốn chi phí thuê diễn viên lồng tiếng hay họa sĩ:
          </p>
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
            <h5 className="font-semibold text-emerald-400">Voice Local Miễn Phí 0đ</h5>
            <p className="text-slate-400">Hỗ trợ đa dạng tông giọng (Nam trầm, Nữ truyền cảm, Review phim) chạy trực tiếp trên GPU máy bạn, xuất file WAV tức thì.</p>
          </div>
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
            <h5 className="font-semibold text-purple-400">Truyện AI Đồng Bộ 100% (Consistent Manga)</h5>
            <p className="text-slate-400">Khóa khuôn mặt nhân vật qua hạt giống Seed Character và tạo chuyển cảnh camera 2.5D Pan/Zoom sinh động.</p>
          </div>
        </div>
      )
    },
    {
      id: "system-api-ota",
      title: "8. REST API, Webhooks & Cập Nhật Bản Vá OTA",
      category: "system",
      categoryLabel: "Hệ Thống & Lập Trình",
      icon: Code2,
      relatedTab: "api-docs",
      summary: "Kết nối n8n/Python tự động hóa và nâng cấp bản vá an toàn qua chữ ký số SHA-256.",
      keywords: ["api", "rest", "swagger", "webhook", "ota", "update", "sha256"],
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Dành cho lập trình viên và studio muốn tích hợp CREATOROS vào hệ sinh thái tự động hóa:
          </p>

          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-xs space-y-2">
            <div className="text-slate-400">// Gửi lệnh render qua REST API Endpoint:</div>
            <div className="bg-slate-900 p-2.5 rounded text-indigo-300 border border-slate-800 flex items-center justify-between">
              <span>POST http://localhost:3000/api/render/start</span>
              <button
                onClick={() => copyToClipboard('curl -X POST http://localhost:3000/api/render/start -H "Content-Type: application/json" -d \'{"job_id": "job_01"}\'', "curl-api")}
                className="text-slate-400 hover:text-white p-1"
              >
                {copiedSnippet === "curl-api" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">Đăng ký Webhook URL để nhận callback ngay khi video hoàn thành.</p>
          </div>
        </div>
      )
    },
    {
      id: "faq-troubleshooting",
      title: "9. Xử Lý Sự Cố & Câu Hỏi Thường Gặp (FAQs)",
      category: "faq",
      categoryLabel: "Hỗ Trợ & Khắc Phục",
      icon: HelpCircle,
      summary: "Bảng tra cứu lỗi thường gặp: CUDA OOM, mất kết nối LAN, lệch khẩu hình, v.v.",
      keywords: ["faq", "sự cố", "lỗi", "cuda oom", "troubleshooting", "khắc phục"],
      content: (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <h5 className="font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Lỗi CUDA Out of Memory (OOM)
            </h5>
            <p className="text-slate-300">
              <strong>Khắc phục:</strong> Giảm thời lượng mỗi đoạn phân đoạn (Chunk Duration) từ 30s xuống 15s trong tab LAN Cluster, hoặc đóng các ứng dụng đồ họa khác đang chiếm VRAM.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <h5 className="font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Không phát hiện được máy trạm Worker trong mạng LAN
            </h5>
            <p className="text-slate-300">
              <strong>Khắc phục:</strong> Đảm bảo các máy trạm đang kết nối cùng một mạng Wifi/LAN nội bộ và mở cổng 3000 trên Windows Defender Firewall.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <h5 className="font-semibold text-blue-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Khẩu hình Lip-Sync nói chưa khớp với âm thanh
            </h5>
            <p className="text-slate-300">
              <strong>Khắc phục:</strong> Cắt bỏ đoạn im lặng (silence) ở 0.5s đầu file âm thanh trước khi đưa vào LipSync Studio để điểm mốc âm thanh và hình ảnh bắt đầu đồng thời.
            </p>
          </div>
        </div>
      )
    }
  ], [copiedSnippet]);

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SECTIONS.filter(sec => {
      const matchCat = activeCategoryFilter === "all" || sec.category === activeCategoryFilter;
      const matchText = !q || sec.title.toLowerCase().includes(q) || sec.summary.toLowerCase().includes(q) || sec.keywords.some(k => k.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [SECTIONS, searchQuery, activeCategoryFilter]);

  const activeSection = useMemo(() => {
    return SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];
  }, [SECTIONS, activeSectionId]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Tài Liệu Hướng Dẫn Sử Dụng
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v5.0 Complete
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Sổ tay hướng dẫn toàn diện từ cơ bản đến nâng cao cho toàn bộ tính năng CREATOROS PRO.
              </p>
            </div>
          </div>
        </div>

        {/* Search bar inside docs */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="docs-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm trong tài liệu..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Main Content Layout: Sidebar Index + Content Viewer */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-[#0F172A]/50 flex flex-col shrink-0 overflow-hidden">
          {/* Category Filter Pills */}
          <div className="p-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {[
              { id: "all", label: "Tất Cả" },
              { id: "quickstart", label: "Bắt Đầu" },
              { id: "core", label: "Cốt Lõi" },
              { id: "features", label: "Tính Năng" },
              { id: "faq", label: "FAQs" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setActiveCategoryFilter(cat.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  activeCategoryFilter === cat.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Section List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    id={`doc-nav-${section.id}`}
                    onClick={() => {
                      soundSynth.playSfx("pop");
                      setActiveSectionId(section.id);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                        : "hover:bg-slate-800/60 border border-transparent text-slate-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 transition ${
                        isActive
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs truncate">
                          {section.title}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition ${isActive ? "text-indigo-400" : "text-slate-600"}`} />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {section.summary}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Không tìm thấy chuyên mục phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* Right Documentation Viewer */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#0B0F19]">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header of Section */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {activeSection.categoryLabel}
                  </span>
                  {activeSection.relatedTab && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      Module: {activeSection.relatedTab}
                    </span>
                  )}
                </div>

                {activeSection.relatedTab && (
                  <button
                    onClick={() => handleJumpToTool(activeSection.relatedTab!)}
                    className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    <span>Mở Công Cụ Này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight mt-3">
                {activeSection.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeSection.summary}
              </p>
            </div>

            {/* Main Section Body */}
            <div className="space-y-4">
              {activeSection.content}
            </div>

            {/* Footer tips */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Tài liệu tự động cập nhật theo CREATOROS PRO v5.0</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono">SQLite WAL • Offline-First</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
