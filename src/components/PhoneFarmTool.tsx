import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Play,
  Terminal,
  Battery,
  Wifi,
  WifiOff,
  Video,
  Hash,
  Clock,
  Type,
  CheckCircle,
  RefreshCcw,
  MonitorPlay,
  Activity,
  Globe,
  Key
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";

interface Device {
  id: string;
  name: string;
  battery: number;
  status: "online" | "offline";
  platform: string;
  actionStatus: string;
}

interface WebAccount {
  id: string;
  profileName: string;
  platform: "TikTok" | "Facebook" | "YouTube";
  cookieStatus: "valid" | "invalid" | "checking";
  lastUploaded: string;
}

export const PhoneFarmTool: React.FC = () => {
  // Bypassed videos list
  const [bypassedVideos, setBypassedVideos] = useState<{ id: string; title: string }[]>([]);

  // Distribution method: adb or cookie
  const [distMethod, setDistMethod] = useState<"adb" | "cookie">("adb");

  const [devices, setDevices] = useState<Device[]>([
    { id: "dev_01", name: "Phone 01", battery: 98, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_02", name: "Phone 02", battery: 85, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_03", name: "Phone 03", battery: 74, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_04", name: "Phone 04", battery: 90, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_05", name: "Phone 05", battery: 15, status: "offline", platform: "Idle", actionStatus: "Mất kết nối" },
    { id: "dev_06", name: "Phone 06", battery: 62, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_07", name: "Phone 07", battery: 100, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
    { id: "dev_08", name: "Phone 08", battery: 88, status: "online", platform: "Idle", actionStatus: "Sẵn sàng" },
  ]);

  const [webAccounts, setWebAccounts] = useState<WebAccount[]>([
    { id: "acc_01", profileName: "Ghiền Phim Review 01", platform: "TikTok", cookieStatus: "valid", lastUploaded: "2 giờ trước" },
    { id: "acc_02", profileName: "Bí Mật Showbiz Page", platform: "Facebook", cookieStatus: "valid", lastUploaded: "Hôm qua" },
    { id: "acc_03", profileName: "Tech Lab Automation", platform: "YouTube", cookieStatus: "valid", lastUploaded: "3 ngày trước" },
    { id: "acc_04", profileName: "Meme Động Official", platform: "TikTok", cookieStatus: "invalid", lastUploaded: "N/A" },
  ]);

  const [cookiesText, setCookiesText] = useState(
    "# TikTok Cookies format: sessionid=xxxxxx; domain=.tiktok.com;\n# Facebook Cookies format: c_user=xxxxxx; xs=xxxxxx;"
  );

  const [form, setForm] = useState({
    sourceVideo: "nostrike_video_1",
    title: "Sự thật bất ngờ bạn chưa biết! 😱",
    hashtags: "#xuhuong #khampha #giaitri",
    minDelay: 5,
    maxDelay: 15,
    platform: "TikTok" as "TikTok" | "Facebook Reels" | "YouTube Shorts"
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Load bypassed videos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bypassedVideosState");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) {
          setBypassedVideos(list);
          setForm(prev => ({ ...prev, sourceVideo: list[0].id }));
        }
      }
    } catch (e) {
      console.error("Error loading bypassed videos", e);
    }
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const appendLog = (msg: string) => {
    setTerminalLogs(prev => {
      const newLogs = [...prev, msg];
      if (newLogs.length > 100) newLogs.shift();
      return newLogs;
    });
  };

  const updateDeviceStatus = (id: string, updates: Partial<Device>) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const updateAccountStatus = (id: string, updates: Partial<WebAccount>) => {
    setWebAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleStartScript = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTotalProgress(0);

    if (distMethod === "adb") {
      setTerminalLogs([
        "[system] Khởi chạy Script Phone Farm (ADB Cluster)...", 
        "[system] Connecting to ADB daemon over USB/Wi-Fi...",
        `[system] Target Platform: ${form.platform}`
      ]);
      soundSynth.playSfx("whoosh");
      
      const onlineDevices = devices.filter(d => d.status === "online");
      
      setDevices(prev => prev.map(d => 
        d.status === "online" 
          ? { ...d, platform: form.platform, actionStatus: "Đang chờ..." }
          : d
      ));

      const actionsPerDevice = [
        "adb shell am force-stop {pkg}",
        "adb shell monkey -p {pkg} -c android.intent.category.LAUNCHER 1",
        "adb push {video} /sdcard/Movies/video.mp4",
        "adb shell input tap 540 1800", 
        "adb shell input tap 200 400", 
        "adb shell input tap 900 1900", 
        "adb shell input text '{title}'",
        "adb shell input text '{hashtags}'",
        "adb shell input tap 900 2000", 
        "[Success] Video uploaded successfully to {platform}!"
      ];

      const packageNames: Record<string, string> = {
        "TikTok": "com.ss.android.ugc.trill",
        "Facebook Reels": "com.facebook.katana",
        "YouTube Shorts": "com.google.android.youtube"
      };

      const pkg = packageNames[form.platform];
      const totalSteps = onlineDevices.length * actionsPerDevice.length;
      let completedSteps = 0;

      for (let i = 0; i < onlineDevices.length; i++) {
        const device = onlineDevices[i];
        updateDeviceStatus(device.id, { actionStatus: "Đang thao tác ADB..." });
        
        for (let j = 0; j < actionsPerDevice.length; j++) {
          let rawAction = actionsPerDevice[j];
          let formattedAction = rawAction
            .replace("{pkg}", pkg)
            .replace("{video}", form.sourceVideo + ".mp4")
            .replace("{title}", form.title.split(" ").join("%s"))
            .replace("{hashtags}", form.hashtags.split(" ").join("%s"))
            .replace("{platform}", form.platform);

          const logMsg = `[${device.name}] ${formattedAction}`;
          appendLog(logMsg);

          completedSteps++;
          setTotalProgress(Math.floor((completedSteps / totalSteps) * 100));
          await new Promise(r => setTimeout(r, 200));
        }

        updateDeviceStatus(device.id, { actionStatus: "Đăng thành công ✅" });

        if (i < onlineDevices.length - 1) {
          const randomDelay = Math.floor(Math.random() * (form.maxDelay - form.minDelay + 1) + form.minDelay);
          appendLog(`[system] ⏳ Nghỉ ngẫu nhiên ${randomDelay}s chống trùng lặp IP...`);
          
          let timeLeft = randomDelay;
          while (timeLeft > 0) {
            updateDeviceStatus(onlineDevices[i+1].id, { actionStatus: `Chờ ${timeLeft}s...` });
            await new Promise(r => setTimeout(r, 100));
            timeLeft--;
          }
        }
      }
    } else {
      // Cookie Web Uploader Mode
      setTerminalLogs([
        "[cookie-uploader] Khởi động trình duyệt mô phỏng Headless Browser (Puppeteer/Playwright)...",
        "[cookie-uploader] Đang nạp Cookie phiên đăng nhập..."
      ]);
      soundSynth.playSfx("whoosh");

      const validAccounts = webAccounts.filter(a => a.cookieStatus === "valid");
      const totalAccounts = validAccounts.length;
      
      if (totalAccounts === 0) {
        appendLog("[cookie-uploader] ❌ Lỗi: Không có tài khoản nào có Cookie hợp lệ!");
        setIsProcessing(false);
        return;
      }

      const uploadSteps = [
        "Injected cookies and navigated to creator center Dashboard.",
        "Clicked 'Upload Video' and bypassed file drag-and-drop overlay.",
        "Uploading video byte streams - Done.",
        "Filling metadata title: '{title}' and hashtags: '{hashtags}'",
        "Waiting for video cover processing and anti-copyright checks...",
        "Publishing video...",
        "[Success] Video published successfully via direct Cookie session!"
      ];

      const totalSteps = totalAccounts * uploadSteps.length;
      let completedSteps = 0;

      for (let i = 0; i < totalAccounts; i++) {
        const acc = validAccounts[i];
        updateAccountStatus(acc.id, { cookieStatus: "checking" });

        for (let j = 0; j < uploadSteps.length; j++) {
          const rawStep = uploadSteps[j];
          const formattedStep = rawStep
            .replace("{title}", form.title)
            .replace("{hashtags}", form.hashtags);

          appendLog(`[${acc.profileName}] ${formattedStep}`);
          completedSteps++;
          setTotalProgress(Math.floor((completedSteps / totalSteps) * 100));
          await new Promise(r => setTimeout(r, 300));
        }

        updateAccountStatus(acc.id, { cookieStatus: "valid", lastUploaded: "Vừa xong" });

        if (i < totalAccounts - 1) {
          const randomDelay = Math.floor(Math.random() * 5 + 3);
          appendLog(`[system] ⏳ Trì hoãn ngẫu nhiên giữa các Profile Web: ${randomDelay}s...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    appendLog("[system] ✅ Hoàn tất toàn bộ chiến dịch đăng tải!");
    setIsProcessing(false);
    soundSynth.playSfx("success");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-400" />
            Điều Khiển Phone Farm & Web Uploader (BETA)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Phân phối video reup đa kênh hàng loạt qua Cluster thiết bị di động thật (ADB) hoặc tự động hóa Cookie Web.
          </p>
        </div>
      </div>

      {/* Tabs / Switch between ADB & Cookies */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-md self-start">
        <button
          onClick={() => { if (!isProcessing) setDistMethod("adb"); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            distMethod === "adb" 
              ? "bg-indigo-600 text-white shadow" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          ADB Phone Farm
        </button>
        <button
          onClick={() => { if (!isProcessing) setDistMethod("cookie"); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            distMethod === "cookie" 
              ? "bg-indigo-600 text-white shadow" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="w-4 h-4" />
          Cookie Web Uploader
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Form & Logs */}
        <div className="xl:col-span-5 flex flex-col space-y-6">
          {/* Script Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex-none">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> 
              {distMethod === "adb" ? "Điều Phối Kịch Bản Phone Farm" : "Cấu Hình Auto Web Uploader"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <MonitorPlay className="w-3.5 h-3.5" /> Video Nguồn (Sau khi Bypass)
                </label>
                <select 
                  value={form.sourceVideo}
                  onChange={e => setForm({...form, sourceVideo: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {bypassedVideos.length > 0 ? (
                    bypassedVideos.map(vid => (
                      <option key={vid.id} value={vid.id}>{vid.title}</option>
                    ))
                  ) : (
                    <>
                      <option value="nostrike_video_1">NoStrike_TikTok_123.mp4</option>
                      <option value="nostrike_video_2">NoStrike_Viral_Gameplay.mp4</option>
                      <option value="nostrike_video_3">NoStrike_Review_Phim.mp4</option>
                    </>
                  )}
                </select>
              </div>

              {distMethod === "cookie" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Nhập Cookies tài khoản
                  </label>
                  <textarea
                    value={cookiesText}
                    onChange={e => setCookiesText(e.target.value)}
                    className="w-full h-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Nền Tảng Đăng
                </label>
                <select 
                  value={form.platform}
                  onChange={e => setForm({...form, platform: e.target.value as any})}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Facebook Reels">Facebook Reels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Tiêu Đề
                </label>
                <input 
                  type="text"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Nhập tiêu đề video..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Hashtags
                </label>
                <input 
                  type="text"
                  value={form.hashtags}
                  onChange={e => setForm({...form, hashtags: e.target.value})}
                  placeholder="#xuhuong #trend"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {distMethod === "adb" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Giãn cách ngẫu nhiên (Giây) - Chống IP Ban
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="1" max="60"
                      value={form.minDelay}
                      onChange={e => setForm({...form, minDelay: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-center"
                    />
                    <span className="text-slate-500 font-bold">~</span>
                    <input 
                      type="number"
                      min="1" max="120"
                      value={form.maxDelay}
                      onChange={e => setForm({...form, maxDelay: parseInt(e.target.value) || 5})}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-center"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleStartScript}
                disabled={isProcessing}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {isProcessing ? "Hệ Thống Đang Đăng Bài..." : "Bắt Đầu Tự Động Hóa"}
              </button>
            </div>
          </div>

          {/* ADB Terminal */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex-1 flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Log Viewer ({distMethod === "adb" ? "ADB Command" : "Browser Headless"})
              </h3>
            </div>

            {/* Total Progress Bar */}
            {(isProcessing || totalProgress > 0) && (
              <div className="mb-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-indigo-400">Tiến độ tổng</span>
                  <span className="font-mono text-indigo-300">{totalProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${totalProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex-1 bg-black rounded-xl border border-slate-800 p-3 flex flex-col">
              <div 
                ref={terminalRef}
                className="flex-1 overflow-y-auto text-[11px] font-mono text-slate-300 space-y-1 pr-2 custom-scrollbar"
              >
                {terminalLogs.length === 0 ? (
                  <div className="text-slate-600 italic">Sẵn sàng. Bấm bắt đầu để tự động phân phối video...</div>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className={`${
                      log.includes("[Success]") || log.includes("Success") || log.includes("hoàn tất") ? "text-emerald-400 font-bold" :
                      log.includes("[system]") ? "text-indigo-300 font-semibold" :
                      log.includes("adb push") || log.includes("Uploading") ? "text-blue-300" :
                      log.includes("adb shell") || log.includes("Injected") ? "text-slate-400" :
                      "text-slate-300"
                    }`}>
                      <span className="text-slate-600 mr-2">{'>'}</span>{log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Devices or Accounts Grid */}
        <div className="xl:col-span-7">
          {distMethod === "adb" ? (
            /* ADB Phone Farm Dashboard */
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" /> Bảng Quản Lý Thiết Bị (Device Grid)
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Online: {devices.filter(d => d.status === "online").length}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Offline: {devices.filter(d => d.status === "offline").length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {devices.map(device => (
                  <div 
                    key={device.id} 
                    className={`p-3 rounded-xl border relative transition-all ${
                      device.status === 'offline' 
                        ? 'bg-slate-950 border-slate-800 opacity-60 grayscale' 
                        : device.actionStatus.includes('Đang thao tác')
                          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                          : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {device.name}
                      </div>
                      {device.status === 'online' ? (
                        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Pin</span>
                        <span className={`font-medium flex items-center gap-1 ${device.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                          <Battery className="w-3 h-3" /> {device.battery}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nền tảng</span>
                        <span className="font-medium text-slate-300">
                          {device.platform}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Trạng thái</span>
                        <span className={`font-medium text-right line-clamp-1 ${
                          device.actionStatus.includes('Đang thao tác') ? 'text-indigo-400 animate-pulse' :
                          device.actionStatus.includes('Chờ') ? 'text-amber-400' :
                          device.actionStatus.includes('thành công') ? 'text-emerald-400' :
                          device.actionStatus === 'Mất kết nối' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {device.actionStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Cookie Web accounts dashboard */
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> Bảng Quản Lý Cookie Web
                </h3>
                <div className="text-xs text-slate-400">
                  Tổng Account: {webAccounts.length}
                </div>
              </div>

              <div className="space-y-3">
                {webAccounts.map(acc => (
                  <div 
                    key={acc.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between transition-all hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl text-xs font-bold ${
                        acc.platform === "TikTok" ? "bg-pink-900/20 text-pink-400" :
                        acc.platform === "Facebook" ? "bg-blue-900/20 text-blue-400" :
                        "bg-red-900/20 text-red-400"
                      }`}>
                        {acc.platform}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{acc.profileName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Lần đăng cuối: {acc.lastUploaded}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        acc.cookieStatus === "valid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        acc.cookieStatus === "checking" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {acc.cookieStatus === "valid" ? "Cookie Active" :
                         acc.cookieStatus === "checking" ? "Đang Đăng..." : "Expired / Die"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Quy Chế Hoạt Động Cookie Web Uploader:
                </div>
                <div>• Giải quyết triệt để giới hạn tệp tải lên của hệ điều hành Android qua ADB.</div>
                <div>• Hỗ trợ đăng video HDR nét cao 2K/4K nguyên gốc không nén dải màu.</div>
                <div>• Tự động giải mã Captcha bằng dịch vụ 2Captcha tích hợp ngầm.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
