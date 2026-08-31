import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  GitBranch,
  Network,
  Activity,
  Layers,
  Scissors,
  Clapperboard,
  Languages,
  Film,
  Mic,
  BookOpen,
  Download,
  Smartphone,
  Share2,
  LayoutDashboard,
  Code2,
  Sparkles,
  Zap,
  ListOrdered,
  KeyRound,
  Volume2,
  ArrowRight,
  CornerDownLeft,
  CheckCircle2
} from "lucide-react";
import { ActiveTab } from "../types";
import { soundSynth } from "../utils/audioUtils";

export interface SearchItem {
  id: string;
  title: string;
  category: "tool" | "workflow" | "action";
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
  tabTarget?: ActiveTab;
  actionId?: "open-queue" | "open-ota" | "open-license" | "toggle-sound";
  badge?: string;
  badgeColor?: string;
  keywords: string[];
}

interface GlobalSearchBarProps {
  activeTab: string;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQueue?: () => void;
  onOpenOtaModal?: () => void;
  onOpenLicenseModal?: () => void;
  onToggleSound?: () => void;
}

const SEARCH_DATABASE: SearchItem[] = [
  // TOOLS & MODULES
  {
    id: "tool-workflow",
    title: "Visual Workflow Builder",
    category: "tool",
    categoryLabel: "Công Cụ Chính",
    description: "Kéo thả DAG & Topological, thiết kế quy trình render với Local LLM Copilot",
    icon: GitBranch,
    tabTarget: "workflow",
    badge: "PRO v5.0",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keywords: ["workflow", "builder", "dag", "topological", "node", "graph", "llm", "kéo thả", "tự động", "pipeline"]
  },
  {
    id: "tool-lan-cluster",
    title: "Cụm Render LAN Cluster",
    category: "tool",
    categoryLabel: "Công Cụ Chính",
    description: "Master-Worker & Chunk Segments, phân phối GPU máy trạm nội bộ tăng tốc render",
    icon: Network,
    tabTarget: "lan-cluster",
    badge: "v5.0 Next",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    keywords: ["lan", "cluster", "cụm", "máy trạm", "render", "distributed", "chunk", "gpu", "phân tán", "tăng tốc"]
  },
  {
    id: "tool-lipsync",
    title: "Local AI Lip-Sync Studio",
    category: "tool",
    categoryLabel: "Công Cụ Chính",
    description: "Khẩu hình miệng ONNX / TensorRT, đồng bộ khớp môi Wav2Lip với 68 Face Landmarks",
    icon: Activity,
    tabTarget: "lipsync",
    badge: "v5.0 Next",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keywords: ["lipsync", "khẩu hình", "môi", "wav2lip", "onnx", "tensorrt", "đồng bộ", "face", "avatar", "khớp miệng"]
  },
  {
    id: "tool-presets",
    title: "Quản Lý Blueprint & Presets",
    category: "tool",
    categoryLabel: "Công Cụ Chính",
    description: "SQLite WAL .creatoros, lưu trữ mẫu cấu hình render và xuất nhập pipeline",
    icon: Layers,
    tabTarget: "presets",
    badge: "Offline",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    keywords: ["preset", "blueprint", "mẫu", "sqlite", "wal", "lưu trữ", "template", "cấu hình"]
  },
  {
    id: "tool-orchestrator",
    title: "Unified Pipeline DAG",
    category: "tool",
    categoryLabel: "Công Cụ Chính",
    description: "Master State Machine & NVMe, giám sát luồng tiến trình tổng thể hệ thống",
    icon: GitBranch,
    tabTarget: "orchestrator",
    badge: "GTX 1660S",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keywords: ["orchestrator", "state machine", "unified", "tiến trình", "nvme", "điều phối", "master"]
  },
  {
    id: "tool-highlight",
    title: "AI Highlight & Script",
    category: "tool",
    categoryLabel: "Video & Editing",
    description: "Tìm cảnh hay nhất, tạo kịch bản tự động, cắt video viral chuẩn định dạng",
    icon: Scissors,
    tabTarget: "highlight",
    badge: "Viral 98%",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    keywords: ["highlight", "cắt", "script", "kịch bản", "viral", "cảnh hay", "short", "reels", "tiktok"]
  },
  {
    id: "tool-review",
    title: "AI Review & Recap Phim",
    category: "tool",
    categoryLabel: "Video & Editing",
    description: "Tóm tắt phim điện ảnh, anime, truyện tranh đa ngôn ngữ với thuyết minh AI",
    icon: Clapperboard,
    tabTarget: "review",
    keywords: ["review", "recap", "phim", "tóm tắt", "anime", "thuyết minh", "lồng tiếng", "nội dung"]
  },
  {
    id: "tool-translate",
    title: "Dịch Thuật Video (1-Click)",
    category: "tool",
    categoryLabel: "Video & Editing",
    description: "Bỏ video ngoại ngữ vào là tự động phiên dịch, ghép phụ đề Whisper SRT và voiceover",
    icon: Languages,
    tabTarget: "translate",
    badge: "Auto Dub",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    keywords: ["translate", "dịch", "phụ đề", "subtitle", "srt", "whisper", "lồng tiếng", "dub", "ngoại ngữ"]
  },
  {
    id: "tool-semi-edit",
    title: "Edit Bán Content YouTube & No-Strike",
    category: "tool",
    categoryLabel: "Video & Editing",
    description: "Split-screen, khử bản quyền No-Strike, lật video, overlay filter, render 9:16 / 16:9",
    icon: Film,
    tabTarget: "semi-edit",
    badge: "No-Strike",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    keywords: ["semi edit", "bán content", "no strike", "bản quyền", "split screen", "youtube", "lật video", "overlay"]
  },
  {
    id: "tool-voice-local",
    title: "Voice Local Miễn Phí 0đ",
    category: "tool",
    categoryLabel: "Audio & Giọng Đọc",
    description: "Tổng hợp giọng đọc offline không tốn API key, hỗ trợ đa ngôn ngữ và voice clone",
    icon: Mic,
    tabTarget: "voice-local",
    badge: "0đ Free",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keywords: ["voice", "tts", "giọng đọc", "lồng tiếng", "offline", "miễn phí", "voice clone", "âm thanh"]
  },
  {
    id: "tool-ai-comic",
    title: "Truyện AI Đồng Bộ 100%",
    category: "tool",
    categoryLabel: "Sáng Tạo Comic",
    description: "Giữ nguyên khuôn mặt và trang phục nhân vật truyện tranh qua từng khung hình",
    icon: BookOpen,
    tabTarget: "ai-comic",
    badge: "Consistent",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    keywords: ["comic", "manga", "manhwa", "truyện tranh", "character", "nhân vật", "đồng bộ", "khuôn mặt"]
  },
  {
    id: "tool-seo-suite",
    title: "SEO Suite & Thumbnail Creator",
    category: "tool",
    categoryLabel: "SEO & Tăng Trưởng",
    description: "Tối ưu tiêu đề, mô tả, thẻ tag, phân tích đối thủ và thiết kế ảnh bìa thumbnail CTR 18%",
    icon: Search,
    tabTarget: "seo-suite",
    badge: "CTR 18%",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keywords: ["seo", "thumbnail", "tiêu đề", "tag", "ctr", "tối ưu", "phân tích", "kênh", "từ khóa"]
  },
  {
    id: "tool-batch-downloader",
    title: "Download Hàng Loạt Đa Nền Tảng",
    category: "tool",
    categoryLabel: "Tiện Ích",
    description: "Tải video tốc độ cao không watermark từ Douyin, TikTok, YouTube, Facebook, Kuaishou",
    icon: Download,
    tabTarget: "batch-downloader",
    badge: "Turbo",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    keywords: ["download", "tải video", "douyin", "tiktok", "youtube", "facebook", "watermark", "hàng loạt"]
  },
  {
    id: "tool-phone-farm",
    title: "Điều Khiển Phone Farm ADB",
    category: "tool",
    categoryLabel: "Automation",
    description: "Quản lý dàn điện thoại thật nuôi nick, auto lướt xem video, bypass xác minh",
    icon: Smartphone,
    tabTarget: "phone-farm",
    badge: "BETA",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    keywords: ["phone farm", "adb", "điện thoại", "nuôi nick", "tương tác", "auto lướt", "automation"]
  },
  {
    id: "tool-fb-suite",
    title: "Facebook Reels Publisher Suite",
    category: "tool",
    categoryLabel: "Automation",
    description: "Tự động trích xuất, đóng dấu bản quyền và đăng bài hàng loạt lên nhiều Fanpage Reels",
    icon: Share2,
    tabTarget: "fb-suite",
    keywords: ["facebook", "reels", "đăng bài", "fanpage", "auto post", "reup", "token"]
  },
  {
    id: "tool-dashboard",
    title: "Dashboard Quản Trị Đa Kênh",
    category: "tool",
    categoryLabel: "Quản Trị",
    description: "Bảng tổng quan doanh thu, RPM, sản lượng video và trạng thái hệ thống máy trạm",
    icon: LayoutDashboard,
    tabTarget: "dashboard",
    keywords: ["dashboard", "doanh thu", "rpm", "thống kê", "sản lượng", "tổng quan", "báo cáo"]
  },
  {
    id: "tool-api-docs",
    title: "REST API & Webhooks Engine",
    category: "tool",
    categoryLabel: "Lập Trình",
    description: "Tài liệu tương tác Swagger, mã lệnh cURL, Python SDK và cấu hình Webhook IPC",
    icon: Code2,
    tabTarget: "api-docs",
    badge: "REST 4.8",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keywords: ["api", "rest", "swagger", "webhook", "curl", "python", "lập trình", "endpoints"]
  },
  {
    id: "tool-user-guide",
    title: "Hướng Dẫn Sử Dụng & Sổ Tay v5.0",
    category: "tool",
    categoryLabel: "Tài Liệu",
    description: "Cẩm nang hướng dẫn toàn diện CREATOROS PRO, xử lý lỗi CUDA OOM, LAN Cluster và FAQs",
    icon: BookOpen,
    tabTarget: "user-guide",
    badge: "DOCS v5.0",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keywords: ["doc", "hướng dẫn", "guide", "user guide", "sử dụng", "sổ tay", "faq", "lỗi", "troubleshooting", "cẩm nang"]
  },

  // TASK WORKFLOWS & USE CASES
  {
    id: "wf-reels-nostrike",
    title: "Quy trình Tạo Reels 9:16 Khử Bản Quyền No-Strike",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Tự động crop dọc 9:16, chèn video background split-screen, đảo màu và lật frame",
    icon: Film,
    tabTarget: "semi-edit",
    badge: "Kịch Bản",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    keywords: ["quy trình", "kịch bản", "reels", "9:16", "khử bản quyền", "no strike", "split screen", "lật hình"]
  },
  {
    id: "wf-lipsync-dub",
    title: "Quy trình Đồng Bộ Khẩu Hình Môi (Lip-Sync Dubbing)",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Kết hợp giọng đọc TTS Tiếng Việt và tái tạo chuyển động cơ môi nhân vật bằng Wav2Lip",
    icon: Activity,
    tabTarget: "lipsync",
    badge: "Kịch Bản",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keywords: ["quy trình", "kịch bản", "khẩu hình", "lipsync", "lồng tiếng", "wav2lip", "khớp môi", "onnx"]
  },
  {
    id: "wf-lan-distributed-render",
    title: "Quy trình Render Phân Tán Cụm LAN 3 Máy Trạm",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Chia nhỏ video 10-30 phút thành các Chunks 30s và phân phối sang các GPU LAN",
    icon: Network,
    tabTarget: "lan-cluster",
    badge: "Kịch Bản",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    keywords: ["quy trình", "kịch bản", "render lan", "cụm", "chia chunk", "tăng tốc", "phân tán", "mạng nội bộ"]
  },
  {
    id: "wf-ai-recap-movie",
    title: "Quy trình Tóm Tắt & Thuyết Minh Phim Tự Động",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Trích xuất timeline, sinh kịch bản tóm tắt nội dung và render giọng đọc kịch tính",
    icon: Clapperboard,
    tabTarget: "review",
    badge: "Kịch Bản",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keywords: ["quy trình", "kịch bản", "tóm tắt phim", "recap", "thuyết minh", "ai review", "timeline"]
  },
  {
    id: "wf-comic-manga-series",
    title: "Quy trình Tạo Video Truyện Tranh Manga 4:5 Consistent",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Giữ khuôn mặt nhân vật cố định, chuyển cảnh hiệu ứng camera pan/zoom và lồng nhạc nền",
    icon: BookOpen,
    tabTarget: "ai-comic",
    badge: "Kịch Bản",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    keywords: ["quy trình", "kịch bản", "manga", "truyện tranh", "comic", "consistent", "nhân vật", "pan zoom"]
  },
  {
    id: "wf-auto-sub-dub",
    title: "Quy trình Dịch Tự Động & Lồng Tiếng Video Nước Ngoài",
    category: "workflow",
    categoryLabel: "Kịch Bản Workflow",
    description: "Tách giọng bằng Demucs, dịch qua LLM ngữ cảnh tự nhiên và ghép giọng đọc tiếng Việt",
    icon: Languages,
    tabTarget: "translate",
    badge: "Kịch Bản",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    keywords: ["quy trình", "kịch bản", "dịch tự động", "demucs", "lồng tiếng", "auto sub", "whisper", "phụ đề"]
  },

  // QUICK ACTIONS
  {
    id: "act-open-queue",
    title: "Mở Hàng Đợi Tác Vụ Nền (Task Queue)",
    category: "action",
    categoryLabel: "Thao Tác Nhanh",
    description: "Xem và quản lý các công việc đang render, phân bổ tài nguyên GPU và lịch sử hoàn thành",
    icon: ListOrdered,
    actionId: "open-queue",
    badge: "Hệ Thống",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keywords: ["hàng đợi", "queue", "tác vụ", "render", "tiến độ", "danh sách", "quản lý job"]
  },
  {
    id: "act-check-ota",
    title: "Kiểm Tra Cập Nhật Bản Vá OTA v4.8.5",
    category: "action",
    categoryLabel: "Thao Tác Nhanh",
    description: "Xác thực chữ ký số SHA-256 và cập nhật phiên bản phần mềm không cần cài lại",
    icon: Download,
    actionId: "open-ota",
    badge: "Hệ Thống",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    keywords: ["cập nhật", "ota", "update", "phiên bản", "patch", "nâng cấp", "chữ ký số"]
  },
  {
    id: "act-license-drm",
    title: "Quản Lý Bản Quyền & Hardware Fingerprint",
    category: "action",
    categoryLabel: "Thao Tác Nhanh",
    description: "Tra cứu mã máy Hardware ID, gia hạn gói PRO và kiểm tra trạng thái kích hoạt DRM",
    icon: KeyRound,
    actionId: "open-license",
    badge: "Bản Quyền",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    keywords: ["bản quyền", "license", "key", "drm", "fingerprint", "kích hoạt", "hardware id", "pro"]
  },
  {
    id: "act-toggle-sound",
    title: "Bật / Tắt Hiệu Ứng Âm Thanh (SFX Synth)",
    category: "action",
    categoryLabel: "Thao Tác Nhanh",
    description: "Điều chỉnh phản hồi âm thanh tương tác click, hoàn thành render và cảnh báo",
    icon: Volume2,
    actionId: "toggle-sound",
    badge: "Cài Đặt",
    badgeColor: "bg-slate-700 text-slate-300",
    keywords: ["âm thanh", "sound", "sfx", "bật tắt", "synth", "hiệu ứng", "audio"]
  }
];

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenQueue,
  onOpenOtaModal,
  onOpenLicenseModal,
  onToggleSound
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        soundSynth.playSfx("pop");
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered search results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return top recommended tools & workflows when query is empty
      return SEARCH_DATABASE.slice(0, 8);
    }

    return SEARCH_DATABASE.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      const matchCategory = item.categoryLabel.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchKeywords || matchCategory;
    });
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleSelectItem = (item: SearchItem) => {
    soundSynth.playSfx("pop");
    setIsOpen(false);
    setQuery("");

    if (item.category === "tool" || item.category === "workflow") {
      if (item.tabTarget) {
        onSelectTab(item.tabTarget);
      }
    } else if (item.category === "action") {
      switch (item.actionId) {
        case "open-queue":
          if (onOpenQueue) onOpenQueue();
          break;
        case "open-ota":
          if (onOpenOtaModal) onOpenOtaModal();
          break;
        case "open-license":
          if (onOpenLicenseModal) onOpenLicenseModal();
          break;
        case "toggle-sound":
          if (onToggleSound) onToggleSound();
          break;
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
      {/* Search Input Box */}
      <div
        className={`flex items-center gap-2 bg-slate-900/90 border rounded-xl px-3 py-1.5 transition-all duration-200 ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-950 shadow-lg shadow-indigo-950/40"
            : "border-slate-700/80 hover:border-slate-600 bg-slate-900/60"
        }`}
      >
        <Search className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? "text-indigo-400" : "text-slate-400"}`} />
        
        <input
          ref={inputRef}
          type="text"
          id="global-navbar-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Tìm công cụ, kịch bản, workflow..."
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Shortcut Badge */}
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded select-none shrink-0">
          <span>⌘</span>
          <span>K</span>
        </div>
      </div>

      {/* Search Dropdown Palette */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header info */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
            <span className="font-medium">
              {query ? `Kết quả tìm kiếm (${filteredItems.length})` : "Gợi ý công cụ & quy trình phổ biến"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              Dùng phím ↑ ↓ để chọn, ↵ để mở
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                const isCurrentlyActive = item.tabTarget && activeTab === item.tabTarget;

                return (
                  <button
                    key={item.id}
                    id={`search-item-${item.id}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all duration-150 ${
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                        : "hover:bg-slate-800/70 border border-transparent text-slate-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-xs text-slate-100 truncate">
                            {item.title}
                          </span>
                          {isCurrentlyActive && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium shrink-0">
                              Đang mở
                            </span>
                          )}
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              item.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-medium text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          {item.categoryLabel}
                        </span>
                        {item.keywords.slice(0, 3).map((kw, kIdx) => (
                          <span key={kIdx} className="text-[9px] text-slate-500 font-mono">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="self-center shrink-0 text-slate-500">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          <span>Mở</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 px-4 text-center">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-300">
                  Không tìm thấy công cụ hoặc kịch bản cho "{query}"
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Thử tìm kiếm với các từ khóa: <em>reels</em>, <em>lipsync</em>, <em>lan cluster</em>, <em>dịch video</em>, <em>tts</em>, hoặc <em>bản quyền</em>.
                </p>
              </div>
            )}
          </div>

          {/* Quick Categories Bar */}
          <div className="px-3.5 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Phím tắt nhanh:</span>
              <button
                onClick={() => setQuery("reels")}
                className="hover:text-indigo-300 transition"
              >
                Reels
              </button>
              <span>•</span>
              <button
                onClick={() => setQuery("lipsync")}
                className="hover:text-indigo-300 transition"
              >
                Lip-Sync
              </button>
              <span>•</span>
              <button
                onClick={() => setQuery("lan")}
                className="hover:text-indigo-300 transition"
              >
                LAN Cluster
              </button>
              <span>•</span>
              <button
                onClick={() => setQuery("voice")}
                className="hover:text-indigo-300 transition"
              >
                Voice 0đ
              </button>
            </div>

            <span className="text-slate-500 font-mono">CREATOROS v5.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
