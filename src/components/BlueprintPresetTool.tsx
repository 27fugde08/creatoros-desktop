import React, { useState, useEffect } from "react";
import {
  Layers,
  Star,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  FileCode2,
  Search,
  Filter,
  Sparkles,
  Sliders,
  Film,
  Mic,
  Clapperboard,
  GitBranch,
  ShieldCheck,
  Tag,
  Copy
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useToast } from "../context/ToastContext";
import { UserPresetItem, PresetCategory } from "../types";

export const BlueprintPresetTool: React.FC = () => {
  const { addToast } = useToast();
  const [presets, setPresets] = useState<UserPresetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for creating new preset
  const [formData, setFormData] = useState({
    name: "",
    category: "nostrike" as PresetCategory,
    description: "",
    tagsInput: "",
    configJson: "{\n  \"ratio\": \"4:5 Facebook\",\n  \"colorLUT\": \"Cinematic Warm\",\n  \"grain\": \"Medium 12%\"\n}"
  });

  useEffect(() => {
    fetchPresets();
  }, [selectedCategory]);

  const fetchPresets = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory === "all" ? "/api/presets" : `/api/presets?category=${selectedCategory}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPresets(json.data);
      }
    } catch (e) {
      console.warn("Could not fetch presets", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (preset: UserPresetItem) => {
    try {
      const updated = { ...preset, is_favorite: !preset.is_favorite };
      await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      setPresets(prev => prev.map(p => p.id === preset.id ? updated : p));
      soundSynth.playPop();
    } catch (e) {
      addToast("error", "Không thể cập nhật mục yêu thích");
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa preset này?")) return;
    try {
      await fetch(`/api/presets/${id}`, { method: "DELETE" });
      setPresets(prev => prev.filter(p => p.id !== id));
      soundSynth.playPop();
      addToast("info", "Đã xóa preset");
    } catch (e) {
      addToast("error", "Lỗi xóa preset");
    }
  };

  const handleExportBlueprint = async (preset: UserPresetItem) => {
    try {
      const res = await fetch(`/api/presets/export/${preset.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${preset.name.toLowerCase().replace(/\s+/g, "_")}.creatoros`;
        a.click();
        URL.revokeObjectURL(url);
        soundSynth.playSuccess();
        addToast("success", `Đã xuất Blueprint [${preset.name}] thành file .creatoros!`);
      }
    } catch (e) {
      addToast("error", "Lỗi xuất blueprint");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/presets/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blueprint_package: content })
        });
        const json = await res.json();
        if (json.success) {
          soundSynth.playSuccess();
          addToast("success", `Nhập thành công Blueprint [${json.data.name}]!`);
          fetchPresets();
        } else {
          soundSynth.playError();
          addToast("error", json.error || "Tệp .creatoros không hợp lệ");
        }
      } catch (err) {
        soundSynth.playError();
        addToast("error", "Không thể đọc định dạng file JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCreatePreset = async () => {
    if (!formData.name.trim()) {
      addToast("warning", "Vui lòng nhập tên Preset");
      return;
    }

    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(formData.configJson);
      } catch (err) {
        addToast("error", "JSON cấu hình không hợp lệ");
        return;
      }

      const tags = formData.tagsInput.split(",").map(t => t.trim()).filter(Boolean);

      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          config: parsedConfig,
          tags,
          is_favorite: true
        })
      });

      const json = await res.json();
      if (json.success) {
        soundSynth.playSuccess();
        addToast("success", "Đã tạo Preset mới thành công!");
        setIsCreateModalOpen(false);
        fetchPresets();
      }
    } catch (e) {
      addToast("error", "Lỗi tạo preset");
    }
  };

  const filteredPresets = presets.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "nostrike": return <Film className="w-4 h-4 text-amber-400" />;
      case "voice": return <Mic className="w-4 h-4 text-emerald-400" />;
      case "script": return <Clapperboard className="w-4 h-4 text-rose-400" />;
      case "workflow": return <GitBranch className="w-4 h-4 text-indigo-400" />;
      case "qc": return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      default: return <Sliders className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Quản Lý Blueprint & Preset Cục Bộ
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                SQLite WAL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Lưu trữ tham số màu sắc No-Strike, Voice profiles, kịch bản AI và sơ đồ DAG dưới dạng tệp mã hóa .creatoros
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Import */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-indigo-400" />
            Nhập .creatoros
            <input type="file" accept=".creatoros,.json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tạo Preset Mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: "all", label: "Tất Cả" },
            { id: "nostrike", label: "No-Strike LUT (4:5)", icon: Film },
            { id: "voice", label: "Local Voice TTS", icon: Mic },
            { id: "script", label: "AI Script/Hook", icon: Clapperboard },
            { id: "workflow", label: "Workflow DAGs", icon: GitBranch },
            { id: "qc", label: "QC Rules", icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm preset, tags..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="group relative p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg hover:shadow-indigo-500/5"
          >
            {/* Card Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getCategoryIcon(preset.category)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {preset.category}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFavorite(preset)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <Star className={`w-4 h-4 ${preset.is_favorite ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"}`} />
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                {preset.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description || "Chưa có mô tả cho cấu hình này."}
              </p>
            </div>

            {/* Config Parameter Preview Snippet */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-indigo-300 space-y-1">
              {Object.entries(preset.config || {}).slice(0, 3).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-slate-500">{k}:</span>
                  <span className="font-semibold text-slate-300 truncate max-w-[140px]">{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Tags list */}
            <div className="flex flex-wrap gap-1">
              {preset.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  soundSynth.playSuccess();
                  addToast("success", `Đã áp dụng cấu hình [${preset.name}]!`);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Áp dụng ngay
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExportBlueprint(preset)}
                  title="Xuất file .creatoros"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  <FileCode2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  title="Xóa preset"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tạo Preset Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Tạo Cấu Hình Preset Mới
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tên Preset</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Reels 4:5 Tone Ấm Sát Thủ"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phân Loại</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
                  >
                    <option value="nostrike">No-Strike Filter</option>
                    <option value="voice">Local Voice Profile</option>
                    <option value="script">AI Script Prompt</option>
                    <option value="workflow">Workflow DAG</option>
                    <option value="qc">QC Rule</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Thẻ Tags (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                    placeholder="facebook, 4:5, reels"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Mô Tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Mô tả tác dụng của cấu hình..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cấu Hình JSON (Config Object)</label>
                <textarea
                  value={formData.configJson}
                  onChange={(e) => setFormData({ ...formData, configJson: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePreset}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Lưu Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
