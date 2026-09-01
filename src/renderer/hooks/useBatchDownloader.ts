import { useState, useCallback, useEffect } from "react";
import { useQueue } from "../context/QueueContext";
import { DownloadQueueItem } from "../../shared/types";
import { soundSynth } from "../utils/audioUtils";

const QUEUE_STORAGE_KEY = "creator_batch_downloader_queue_v1";

/**
 * Kiểm tra cú pháp URL (URL Syntax Validation)
 * Hỗ trợ TikTok, Douyin, YouTube, Facebook, Kuaishou, Instagram
 */
export const validateUrlSyntax = (url: string): { isValid: boolean; platform: string; reason?: string } => {
  const trimmed = url.trim();
  if (!trimmed) return { isValid: false, platform: "unknown", reason: "URL trống" };

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("tiktok.com") || host.includes("vt.tiktok.com")) {
      return { isValid: true, platform: "tiktok" };
    }
    if (host.includes("douyin.com") || host.includes("iesdouyin.com")) {
      return { isValid: true, platform: "douyin" };
    }
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return { isValid: true, platform: "youtube" };
    }
    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.gg")) {
      return { isValid: true, platform: "facebook" };
    }
    if (host.includes("instagram.com")) {
      return { isValid: true, platform: "instagram" };
    }
    if (host.includes("kuaishou.com") || host.includes("gifshow.com")) {
      return { isValid: true, platform: "kuaishou" };
    }

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { isValid: true, platform: "generic" };
    }

    return { isValid: false, platform: "unknown", reason: "Giao thức không hợp lệ (cần http:// hoặc https://)" };
  } catch (e) {
    return { isValid: false, platform: "unknown", reason: "Cú pháp URL không hợp lệ" };
  }
};

export const useBatchDownloader = () => {
  const { addTask } = useQueue();
  const [bulkUrls, setBulkUrls] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Real-time Progress & Status State
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("Sẵn sàng nhận tác vụ");
  const [completedItems, setCompletedItems] = useState<number>(0);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[system] Multi-Platform Bulk Downloader Engine (MVVM Architecture) sẵn sàng.",
    "[info] Chế độ kiểm tra cú pháp URL & quét đa luồng đã được kích hoạt."
  ]);

  // Load persistent queue state from storage
  const [queue, setQueue] = useState<DownloadQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("[Downloader ViewModel] Failed to load saved queue history:", e);
    }
    return [];
  });
  
  // Advanced Config Settings
  const [cookie, setCookie] = useState("");
  const [proxy, setProxy] = useState("direct");
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [extractMp3, setExtractMp3] = useState(false);

  // Sync Queue to LocalStorage Data Layer
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("[Downloader ViewModel] Failed to persist queue state:", e);
    }
  }, [queue]);

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-99), `[${time}] ${message}`]);
  }, []);

  // Listen to IPC / WS real-time progress events
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    const removeLogListener = window.electronAPI.onRenderLog?.((logMsg: string) => {
      addLog(logMsg);
    });

    const removeProgressListener = window.electronAPI.onRenderProgress?.((pct: number) => {
      setProgressPercent(pct);
    });

    return () => {
      if (removeLogListener) removeLogListener();
      if (removeProgressListener) removeProgressListener();
    };
  }, [addLog]);

  // Handle URL Validation & Scan Trigger (View -> ViewModel)
  const handleScanLinks = useCallback(async () => {
    const rawLines = bulkUrls.split("\n").map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      addLog("[error] Vui lòng nhập ít nhất một URL.");
      return;
    }

    setIsScanning(true);
    setProgressPercent(10);
    setCurrentStep("Đang phân tích và kiểm tra cú pháp URL...");
    addLog(`[process] Tiếp nhận ${rawLines.length} URL từ View. Đang phân tích cú pháp...`);

    const validUrls: string[] = [];
    const invalidLines: { url: string; reason: string }[] = [];

    rawLines.forEach((line) => {
      const validation = validateUrlSyntax(line);
      if (validation.isValid) {
        validUrls.push(line);
      } else {
        invalidLines.push({ url: line, reason: validation.reason || "Cú pháp không hợp lệ" });
      }
    });

    if (invalidLines.length > 0) {
      invalidLines.forEach((inv) => {
        addLog(`[warn] URL bị bỏ qua: ${inv.url} (${inv.reason})`);
      });
    }

    if (validUrls.length === 0) {
      addLog("[error] Không tìm thấy URL hợp lệ nào để quét.");
      setIsScanning(false);
      setProgressPercent(0);
      setCurrentStep("Không có URL hợp lệ");
      return;
    }

    addLog(`[info] Đã tìm thấy ${validUrls.length} URL hợp lệ. Gửi request đến scraper...`);
    setCurrentStep(`Đang bóc tách dữ liệu cho ${validUrls.length} liên kết...`);
    setProgressPercent(30);

    try {
      const response = await window.electronAPI.scrapeVideos({
        urls: validUrls,
        cookie: cookie.trim() || undefined,
        proxy: proxy !== "direct" ? proxy : undefined
      });

      if (!response || !Array.isArray(response)) {
        throw new Error("Dữ liệu bóc tách không đúng định dạng từ backend.");
      }

      addLog(`[success] Bóc tách thành công thông tin cho ${response.length} video.`);
      soundSynth.playSfx("success");

      const newQueueItems: DownloadQueueItem[] = response.map((data: any, idx) => {
        const val = validateUrlSyntax(data.url || validUrls[idx] || "");
        return {
          id: `scraped_${Date.now()}_${idx}`,
          url: data.url || validUrls[idx],
          platform: (data.platform || val.platform || "unknown") as any,
          title: data.title || data.url || `Video ${idx + 1}`,
          thumbnail: data.thumbnail || "",
          duration: data.duration || "00:00",
          resolution: data.resolution || "1080p",
          fileSize: data.fileSize || "0 MB",
          progress: 0,
          status: data.error ? "error" : "pending",
          speed: "0 KB/s",
          errorLogs: data.error ? [data.error] : []
        };
      });

      setQueue(prev => [...prev, ...newQueueItems]);
      // Auto select newly scraped items
      setSelectedIds(prev => {
        const next = new Set(prev);
        newQueueItems.forEach(item => next.add(item.id));
        return next;
      });
      setProgressPercent(100);
      setCurrentStep(`Quét hoàn tất ${newQueueItems.length} mục.`);
    } catch (err: any) {
      console.error("[Downloader ViewModel Error] handleScanLinks failed:", err);
      addLog(`[error] Lỗi bóc tách liên kết: ${err.message || "Lỗi không xác định"}`);
      setProgressPercent(0);
      setCurrentStep("Lỗi bóc tách");
    } finally {
      setIsScanning(false);
    }
  }, [bulkUrls, cookie, proxy, addLog]);

  const handleStopScanning = useCallback(() => {
    setIsScanning(false);
    setIsProcessing(false);
    setProgressPercent(0);
    setCurrentStep("Đã dừng tác vụ bởi người dùng");
    addLog("[warn] Đã gửi lệnh dừng quá trình quét/tải xuống.");
  }, [addLog]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      addLog("[warn] Vui lòng chọn ít nhất một video trong danh sách chờ để tải.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setCompletedItems(0);
    const total = selectedIds.size;
    setCurrentStep(`Khởi chạy luồng tải xuống cho ${total} video...`);
    addLog(`[info] Bắt đầu tải ${total} video đã chọn (Xóa watermark: ${removeWatermark ? "Bật" : "Tắt"}, MP3: ${extractMp3 ? "Bật" : "Tắt"})...`);

    try {
      const videosToDownload = queue
        .filter(q => selectedIds.has(q.id))
        .map(q => ({ id: q.id, url: q.url, title: q.title }));

      // Update UI queue status to processing
      setQueue(prev => prev.map(item => {
        if (selectedIds.has(item.id)) {
          return { ...item, status: "downloading", progress: 10 };
        }
        return item;
      }));

      const response = await window.electronAPI.downloadVideos(videosToDownload);

      if (Array.isArray(response)) {
        let successCount = 0;
        setQueue(prev => prev.map(item => {
          const dlResult = response.find((r: any) => r.id === item.id);
          if (dlResult) {
            const isOk = dlResult.status === "success";
            if (isOk) successCount++;
            return {
              ...item,
              status: isOk ? "completed" : "error",
              progress: isOk ? 100 : item.progress,
              errorLogs: dlResult.error ? [...(item.errorLogs || []), dlResult.error] : item.errorLogs
            };
          }
          return item;
        }));

        setCompletedItems(successCount);
        setProgressPercent(100);
        setCurrentStep(`Hoàn tất tải xuống ${successCount}/${total} video.`);
        addLog(`[success] Tiến trình tải hoàn tất! Thành công: ${successCount}/${total}.`);
        soundSynth.playSfx("success");
      }
    } catch (err: any) {
      console.error("[Downloader ViewModel Error] handleDownloadSelected failed:", err);
      addLog(`[error] Lỗi tiến trình tải xuống: ${err.message || "Lỗi không xác định"}`);
      setProgressPercent(0);
      setCurrentStep("Lỗi trong quá trình tải xuống");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, queue, removeWatermark, extractMp3, addLog]);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    setSelectedIds(new Set());
    setProgressPercent(0);
    setCompletedItems(0);
    setCurrentStep("Sẵn sàng nhận tác vụ");
    addLog("[info] Đã xóa toàn bộ danh sách hàng đợi.");
    soundSynth.playSfx("pop");
  }, [addLog]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === queue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map(i => i.id)));
    }
  }, [selectedIds, queue]);

  const clearLogs = useCallback(() => setTerminalLogs([]), []);

  return {
    bulkUrls, setBulkUrls,
    isProcessing,
    isScanning,
    progressPercent,
    currentStep,
    completedItems,
    totalItems: queue.length,
    selectedIds,
    terminalLogs,
    queue,
    cookie, setCookie,
    proxy, setProxy,
    removeWatermark, setRemoveWatermark,
    extractMp3, setExtractMp3,
    handleScanLinks,
    handleStopScanning,
    handleDownloadSelected,
    handleClearQueue,
    toggleSelect,
    selectAll,
    clearLogs
  };
};

