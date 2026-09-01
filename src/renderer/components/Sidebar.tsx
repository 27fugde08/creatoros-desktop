import React from "react";
import {
  Scissors,
  Clapperboard,
  Languages,
  Film,
  Mic,
  Search,
  Download,
  BookOpen,
  Smartphone,
  Share2,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Bot,
  ListOrdered,
  RefreshCw,
  Code2,
  GitBranch,
  Layers,
  Network,
  Activity
} from "lucide-react";
import { ActiveTab } from "../../shared/types";
import { soundSynth } from "../utils/audioUtils";
import { useQueue } from "../context/QueueContext";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { stats, toggleQueue, isQueueOpen } = useQueue();

  const navGroups: NavGroup[] = [
    {
      groupTitle: "COMMERCIAL & ORCHESTRATION",
      items: [
        {
          id: "workflow",
          label: "Visual Workflow Builder",
          sublabel: "Kéo thả DAG & Topological",
          icon: GitBranch,
          badge: "PRO v5.0",
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        },
        {
          id: "lan-cluster",
          label: "Cụm Render LAN Cluster",
          sublabel: "Master-Worker & Chunk Segments",
          icon: Network,
          badge: "v5.0 Next",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        },
        {
          id: "lipsync",
          label: "Local AI Lip-Sync Studio",
          sublabel: "TensorRT & ONNX Khẩu Hình",
          icon: Activity,
          badge: "v5.0 Next",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        },
        {
          id: "presets",
          label: "Quản Lý Blueprint & Presets",
          sublabel: "SQLite WAL .creatoros",
          icon: Layers,
          badge: "Offline",
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        },
        {
          id: "orchestrator",
          label: "Unified Pipeline DAG",
          sublabel: "Master State Machine & NVMe",
          icon: GitBranch,
          badge: "GTX 1660S",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        },
      ],
    },
    {
      groupTitle: "VIDEO & EDITING AI",
      items: [
        {
          id: "highlight",
          label: "AI Highlight & Script",
          sublabel: "Tìm cảnh hay & tự viết lời",
          icon: Scissors,
          badge: "Viral 98%",
          badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        },
        {
          id: "review",
          label: "AI Review & Recap",
          sublabel: "Mọi chủ đề đa ngôn ngữ",
          icon: Clapperboard,
        },
        {
          id: "translate",
          label: "Dịch Thuật Video (1-Click)",
          sublabel: "Bỏ video vào là DONE",
          icon: Languages,
          badge: "Auto Dub",
          badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        },
        {
          id: "semi-edit",
          label: "Edit Bán Content YTB",
          sublabel: "Split-screen, khử bản quyền",
          icon: Film,
          badge: "No-Strike",
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        },
      ],
    },
    {
      groupTitle: "AUDIO & SÁNG TẠO",
      items: [
        {
          id: "voice-local",
          label: "Voice Local Không Tốn Phí",
          sublabel: "All ngôn ngữ chạy 0đ",
          icon: Mic,
          badge: "Miễn phí",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        },
        {
          id: "ai-comic",
          label: "Truyện AI Đồng Bộ 100%",
          sublabel: "Giữ nguyên khuôn mặt nhân vật",
          icon: BookOpen,
          badge: "Consistent",
          badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        },
      ],
    },
    {
      groupTitle: "SEO & KÊNH CHUYÊN SÂU",
      items: [
        {
          id: "seo-suite",
          label: "Viết Nội Dung & SEO, Thumbnail",
          sublabel: "Phân tích kênh chuyên sâu",
          icon: Search,
          badge: "CTR 18%",
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        },
        {
          id: "batch-downloader",
          label: "Download Hàng Loạt",
          sublabel: "Tốc độ video/s đa nền tảng",
          icon: Download,
          badge: "Turbo",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        },
      ],
    },
    {
      groupTitle: "AUTOMATION & QUẢN TRỊ",
      items: [
        {
          id: "phone-farm",
          label: "Điều Khiển Phone Beta",
          sublabel: "Nuôi nick, sync ADB, bypass",
          icon: Smartphone,
          badge: "BETA",
          badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        },
        {
          id: "fb-suite",
          label: "Bộ Tool Facebook Reels",
          sublabel: "Highlight, dịch, reup, đăng bài",
          icon: Share2,
        },
        {
          id: "dashboard",
          label: "Dash Quản Trị Đa Nền Tảng",
          sublabel: "Doanh thu, RPM, bot pipeline",
          icon: LayoutDashboard,
        },
        {
          id: "api-docs",
          label: "REST API & Webhooks",
          sublabel: "Swagger test, cURL, Python SDK",
          icon: Code2,
          badge: "REST 4.8",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        },
        {
          id: "user-guide",
          label: "Hướng Dẫn Sử Dụng",
          sublabel: "Sổ tay v5.0, FAQs & Tips",
          icon: BookOpen,
          badge: "DOCS",
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0F172A] flex flex-col p-4 gap-2 h-[calc(100vh-4rem)] select-none shrink-0 overflow-y-auto">
      <div className="space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">
              {group.groupTitle}
            </p>
            <nav className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => {
                      soundSynth.playSfx("pop");
                      onSelectTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border border-indigo-500/20 font-medium shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:shadow-md hover:border-slate-700/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? "text-indigo-400 scale-110" : "text-slate-400 group-hover:text-slate-200 group-hover:scale-110"}`} />
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {item.label}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
                          item.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Task Queue Real-time Quick Trigger Widget in Sidebar */}
      <div className="mt-auto space-y-2 pt-2">
        <button
          id="btn-sidebar-task-queue"
          onClick={toggleQueue}
          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            isQueueOpen || stats.processing > 0
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              {stats.processing > 0 ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ListOrdered className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                Task Queue
                {stats.processing > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {stats.processing} đang chạy • {stats.completed} xong
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        {/* Local Storage Meter widget */}
        <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800/60">
          <p className="text-[11px] font-semibold mb-1 text-slate-300">Local NVMe Cache</p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-3/4"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
            <span>750GB / 1TB</span>
            <span className="text-emerald-400 font-medium">Turbo OK</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
