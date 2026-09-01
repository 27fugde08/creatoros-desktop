import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  Lock,
  Play,
  Pause,
  Copy,
  Download,
  Volume2,
  CheckCircle,
  Eye,
  Sliders,
  UserCheck,
  Zap,
  Image as ImageIcon,
  Terminal,
  Loader2,
  Share2
} from "lucide-react";
import { ComicStoryResult, ComicPanel, CharacterDNA } from "../../shared/types";
import { soundSynth } from "../utils/audioUtils";
import { getApiUrl } from "../utils/apiClient";
import confetti from "canvas-confetti";
import { io } from "socket.io-client";

export const AiComicTool: React.FC = () => {
  const [characterName, setCharacterName] = useState("Lâm Phong");
  const [storyIdea, setStoryIdea] = useState(
    "Sau 3 năm bị gia tộc coi thường, nhân vật chính thức tử thần kiếm thượng cổ và đánh bại thiên tài số 1 trong đại hội võ thuật."
  );
  const [genre, setGenre] = useState("Tu tiên / Huyền huyễn Manhwa");
  const [artStyle, setArtStyle] = useState("Webtoon Hàn Quốc Hiện Đại (Solo Leveling Style)");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Sẵn sàng");
  const [result, setResult] = useState<ComicStoryResult | null>(null);
  const [playingPanelIndex, setPlayingPanelIndex] = useState<number | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[system] Comic Pipeline Engine sẵn sàng.",
    "[info] Khóa DNA FaceID 100% nhất quán hình thể, đầu ra chuẩn tỉ lệ 9:16 Webtoon dọc."
  ]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const samplePresets = [
    {
      name: "Lâm Phong",
      idea: "Thức tỉnh kiếm đạo vô song sau khi bị phế bỏ tu vi, trả thù những kẻ phản bội.",
      genre: "Tu tiên / Huyền huyễn Manhwa",
      art: "Webtoon Hàn Quốc Hiện Đại (Solo Leveling Style)",
    },
    {
      name: "Aria Shadow",
      idea: "Nữ sát thủ thời hiện đại xuyên không về vương triều phép thuật trở thành nữ bá tước quyền lực.",
      genre: "Xuyên không / Cung đấu ma pháp",
      art: "Otome Manga Romance / Shoujo",
    },
    {
      name: "Kenjiro",
      idea: "Chàng trai bình thường nhận được hệ thống game thủ thực tế ảo, cày cấp độ giải cứu thế giới.",
      genre: "Hệ thống / Game Shonen",
      art: "Shonen Anime High Octane",
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);
    setStatusText("Bắt đầu khởi tạo...");
    setTerminalLogs([
      "[system] Khởi chạy Comic Character Consistency Pipeline...",
      `[params] Nhân vật: ${characterName} | Thể loại: ${genre} | Phong cách nét vẽ: ${artStyle}`
    ]);
    soundSynth.playSfx("whoosh");

    const isElectron = typeof window !== "undefined" && (window as any).electronAPI;

    if (isElectron) {
      const electronAPI = (window as any).electronAPI;

      electronAPI.onRenderStageUpdate((stage: string) => {
        setStatusText(stage);
      });

      electronAPI.onRenderProgress((prog: number) => {
        setProgress(prog);
      });

      electronAPI.onRenderLog((logMsg: string) => {
        setTerminalLogs(prev => [...prev, logMsg]);
      });

      electronAPI.onRenderComplete((resData: any) => {
        setLoading(false);
        setProgress(100);
        setStatusText("Hoàn tất!");
        setResult(resData);
        soundSynth.playSfx("success");
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 },
        });
        electronAPI.removeRenderListeners();
      });

      electronAPI.onRenderError((err: string) => {
        setLoading(false);
        setStatusText("Lỗi dựng truyện!");
        setTerminalLogs(prev => [...prev, `[error] Thất bại: ${err}`]);
        soundSynth.playSfx("boom");
        electronAPI.removeRenderListeners();
      });

      electronAPI.renderVideo({
        isComic: true,
        characterName,
        storyIdea,
        genre,
        artStyle
      });

    } else {
      // Connect to Live WebSocket Socket.io server
      const socketURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const socket = io(socketURL);
      socketRef.current = socket;

      socket.on("connect", () => {
        setTerminalLogs(prev => [...prev, "[socket] Thiết lập kênh WebSocket truyền dữ liệu thời gian thực..."]);

        fetch(getApiUrl("/api/ai/comic-story"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyIdea,
            genre,
            characterName,
            artStyle,
          }),
        })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data) {
            setResult(resData.data);
            soundSynth.playSfx("success");
            confetti({
              particleCount: 50,
              spread: 80,
              origin: { y: 0.6 },
            });
          } else {
            setTerminalLogs(prev => [...prev, "[error] Máy chủ báo lỗi khi dàn dựng kịch bản."]);
            soundSynth.playSfx("boom");
          }
          setLoading(false);
          socket.disconnect();
        })
        .catch(err => {
          setTerminalLogs(prev => [...prev, `[error] Kết nối API thất bại: ${err.message}`]);
          setLoading(false);
          soundSynth.playSfx("boom");
          socket.disconnect();
        });
      });

      socket.on("comic_progress", (data: { progress?: number; status?: string; log?: string }) => {
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.status) {
          setStatusText(data.status);
        }
        if (data.log) {
          setTerminalLogs(prev => [...prev, data.log!]);
        }
      });

      socket.on("connect_error", (err) => {
        setTerminalLogs(prev => [...prev, `[socket_error] Thất bại: ${err.message}`]);
        setLoading(false);
        soundSynth.playSfx("boom");
      });
    }
  };

  const handlePlayPanelSpeech = (panel: ComicPanel, index: number) => {
    if (playingPanelIndex === index) {
      soundSynth.stopSpeech();
      setPlayingPanelIndex(null);
      return;
    }
    soundSynth.stopSpeech();
    setPlayingPanelIndex(index);
    soundSynth.speakText(`${panel.dialogue}`, {
      lang: "vi-VN",
      rate: 1.05,
      onEnd: () => setPlayingPanelIndex(null),
    });
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    soundSynth.playSfx("pop");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950/80 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Tool Truyện AI Đồng Bộ Nhân Vật 100% (Comic & Manga)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Khóa chặt DNA nhân vật <strong>(Khuôn mặt, màu mắt, kiểu tóc, trang phục & Seed ID)</strong> xuyên suốt mọi khung truyện, tự động chia panel và dàn dựng kịch bản Webtoon chuyên nghiệp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              100% Face & Seed Consistency
            </span>
          </div>
        </div>
      </div>

      {/* Preset Chooser */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium">Nhân vật mẫu:</span>
        {samplePresets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCharacterName(p.name);
              setStoryIdea(p.idea);
              setGenre(p.genre);
              setArtStyle(p.art);
              soundSynth.playSfx("pop");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {p.name} ({p.genre.split("/")[0]})
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Thiết Lập Nhân Vật & Cốt Truyện
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tên nhân vật chính</label>
              <input
                id="input-comic-char-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="VD: Lâm Phong, Tiêu Viêm..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tóm tắt ý tưởng cốt truyện</label>
              <textarea
                id="input-comic-idea"
                rows={4}
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                placeholder="Nhập nội dung tập truyện cần dựng..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Thể loại truyện</label>
                <select
                  id="select-comic-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Tu tiên / Huyền huyễn Manhwa">Tu Tiên / Huyền Huyễn</option>
                  <option value="Webtoon Đô Thị Hiện Đại">Webtoon Đô Thị</option>
                  <option value="Xuyên Không Trùng Sinh">Xuyên Không Trùng Sinh</option>
                  <option value="Manga Shonen Hành Động">Manga Shonen Hành Động</option>
                  <option value="Trinh Thám / Huyền Bí Noir">Trinh Thám Huyền Bí</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Phong cách vẽ (Art Style)</label>
                <select
                  id="select-comic-art"
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Webtoon Hàn Quốc Hiện Đại (Solo Leveling Style)">Solo Leveling Webtoon</option>
                  <option value="Japanese Anime Shonen 4K">Japanese Shonen 4K</option>
                  <option value="Cổ Trang 3D Donghua">Cổ Trang 3D Donghua</option>
                  <option value="Cyberpunk Neon Comic">Cyberpunk Neon Comic</option>
                </select>
              </div>
            </div>

            {/* Progress indicators */}
            {loading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    {statusText}
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-rose-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            id="btn-generate-comic"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Đang Khóa DNA & Dựng Panel...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span>Tạo Tập Truyện AI Đồng Bộ 100%</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Showcase */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Real-time Logs Terminal */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-lg flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Comic Consistency Logs
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <div
              ref={terminalRef}
              className="font-mono text-[10px] space-y-1 text-slate-300 overflow-y-auto max-h-[100px]"
            >
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.startsWith("[error]") ? (
                    <span className="text-rose-400">{log}</span>
                  ) : log.startsWith("[success]") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith("[system]") ? (
                    <span className="text-purple-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!result ? (
            <div className="min-h-[300px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
              <BookOpen className="w-12 h-12 text-purple-400/50 mb-3" />
              <h3 className="text-sm font-bold text-slate-200 mb-1">
                Chưa có dữ liệu truyện tranh
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Nhập kịch bản để AI Comic Engine chia khung, tự động tạo mã hạt giống, đồng bộ hóa 100% khuôn mặt nhân vật.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Chạy thử truyện {characterName}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Character DNA Sheet Locker */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-950 border border-purple-500/40 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                      <Lock className="w-4 h-4" />
                    </span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Khóa DNA Nhân Vật: {result.characterDNA.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    Seed #{result.characterDNA.consistentSeed}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Đặc điểm nhận diện:</strong> {result.characterDNA.appearance}
                </p>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-purple-300 flex items-center justify-between">
                  <span className="truncate">Prompt Key: {result.characterDNA.seedPromptKey}</span>
                  <button
                    onClick={() => handleCopyPrompt(result.characterDNA.seedPromptKey)}
                    className="text-xs text-slate-400 hover:text-white shrink-0 ml-2 font-sans font-semibold cursor-pointer"
                  >
                    Sao Chép Key
                  </button>
                </div>
              </div>

              {/* Panels Showcase */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Phân Cảnh Webtoon: {result.storyTitle}</span>
                  <span className="text-slate-500">Màn hình xem trước panel</span>
                </div>

                {result.panels.map((panel, idx) => {
                  // Determine a deterministic placeholder image based on the panel key
                  const imageSeed = result.characterDNA.consistentSeed + idx;
                  const imageUrl = `https://picsum.photos/seed/${imageSeed}/600/350`;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-purple-500/40 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                            #{panel.panelNumber}
                          </span>
                          <span className="text-xs text-slate-200 font-medium max-w-md truncate">
                            {panel.sceneDescription}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-black text-xs">
                          {panel.soundEffect}
                        </span>
                      </div>

                      {/* Webtoon Consistent Character Panel Illustration Preview */}
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group">
                        <img
                          src={imageUrl}
                          alt={`Panel ${panel.panelNumber} Visual`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-purple-300 border border-purple-500/30">
                          {artStyle.split(" ")[0]} • Seed Locked
                        </div>
                      </div>

                      {/* Speech Bubble Box */}
                      <div className="p-3 rounded-xl bg-white text-slate-900 font-bold text-xs relative shadow-md">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">
                          Lời thoại bóng chat (Speech Bubble):
                        </div>
                        <div className="text-sm italic">"{panel.dialogue}"</div>
                      </div>

                      {/* Visual Prompt for Generation */}
                      <div className="p-2.5 rounded-lg bg-slate-950 text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2 border border-slate-850">
                        <span className="truncate">
                          <strong className="text-indigo-400">Prompt:</strong> {panel.visualPrompt}
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(panel.visualPrompt)}
                          className="text-xs text-indigo-300 hover:text-indigo-100 shrink-0 font-sans font-semibold cursor-pointer"
                        >
                          Sao chép
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handlePlayPanelSpeech(panel, idx)}
                          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{playingPanelIndex === idx ? "Dừng đọc" : "Đọc thử lời thoại"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
