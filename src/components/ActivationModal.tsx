import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  Cpu,
  HardDrive,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  Layers,
  Zap,
  Flame,
  X,
  Server
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";
import { useToast } from "../context/ToastContext";
import { LicenseStatus, HardwareFingerprint } from "../types";

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseStatus: LicenseStatus | null;
  onLicenseUpdated: (newStatus: LicenseStatus) => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  licenseStatus,
  onLicenseUpdated
}) => {
  const { addToast } = useToast();
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [ownerNameInput, setOwnerNameInput] = useState("Creator VIP");
  const [fingerprint, setFingerprint] = useState<HardwareFingerprint | null>(null);
  const [copiedFp, setCopiedFp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFingerprint();
    }
  }, [isOpen]);

  const fetchFingerprint = async () => {
    try {
      const res = await fetch("/api/license/fingerprint");
      const json = await res.json();
      if (json.success) {
        setFingerprint(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch fingerprint, using offline fallback", e);
      setFingerprint({
        machine_guid: "OFFLINE_MACHINE_GUID_A98F",
        cpu_model: "Intel Core i7-13700K (16 Cores)",
        disk_serial_hash: "DISK_9A8B7C",
        mac_hash: "MAC_5E4D3C",
        fingerprint_code: "CR-F89A-4B21-9CE3-77F1",
        os_platform: "Windows_11_x64",
        generated_at: Date.now()
      });
    }
  };

  if (!isOpen) return null;

  const handleCopyFingerprint = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint.fingerprint_code);
    setCopiedFp(true);
    soundSynth.playPop();
    addToast("info", "Đã sao chép mã máy Fingerprint vào Clipboard");
    setTimeout(() => setCopiedFp(false), 2000);
  };

  const handleActivate = async () => {
    if (!licenseKeyInput.trim()) {
      addToast("warning", "Vui lòng nhập License Key");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: licenseKeyInput.trim(),
          owner_name: ownerNameInput.trim() || "Licensed Creator"
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        onLicenseUpdated(data.data);
        soundSynth.playSuccess();
        addToast("success", `Kích hoạt thành công gói ${data.data.tier}!`);
        onClose();
      } else {
        soundSynth.playError();
        addToast("error", data.message || "License Key không hợp lệ");
      }
    } catch (e: any) {
      soundSynth.playError();
      addToast("error", "Lỗi kết nối xác thực bản quyền");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy kích hoạt bản quyền trên thiết bị này?")) return;
    try {
      const res = await fetch("/api/license/deactivate", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        soundSynth.playPop();
        addToast("info", "Đã hủy kích hoạt bản quyền");
        if (licenseStatus) {
          onLicenseUpdated({
            ...licenseStatus,
            is_activated: false,
            tier: "COMMUNITY"
          });
        }
      }
    } catch (e) {
      addToast("error", "Không thể hủy kích hoạt");
    }
  };

  const isPro = licenseStatus?.is_activated && licenseStatus.tier !== "COMMUNITY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Quản Lý Bản Quyền & DRM Offline
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  PRO v4.8
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Xác thực mã máy phần cứng (Hardware Fingerprint) không cần kết nối mạng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Hardware Fingerprint Box */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                MÃ PHẦN CỨNG THIẾT BỊ (MACHINE FINGERPRINT)
              </span>
              <button
                onClick={handleCopyFingerprint}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
              >
                {copiedFp ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFp ? "Đã chép" : "Sao chép mã máy"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-indigo-300 font-bold tracking-wider select-all">
              <span>{fingerprint?.fingerprint_code || "CR-F89A-4B21-9CE3-77F1"}</span>
              <span className="text-xs font-normal text-slate-500">Bảo mật SHA256</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">CPU: {fingerprint?.cpu_model || "Intel Core i7"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">Disk ID: {fingerprint?.disk_serial_hash || "SSD NVMe 1TB"}</span>
              </div>
            </div>
          </div>

          {/* Current Status Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Trạng Thái Bản Quyền</span>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isPro ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-700/50 text-slate-300"
                  }`}>
                    {isPro ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    {licenseStatus?.tier || "COMMUNITY"}
                  </span>
                  {isPro && (
                    <span className="text-xs text-slate-400">
                      Sở hữu: <strong className="text-slate-200">{licenseStatus?.owner_name}</strong>
                    </span>
                  )}
                </div>
              </div>

              {isPro && (
                <button
                  onClick={handleDeactivate}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                >
                  Hủy kích hoạt
                </button>
              )}
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Visual Workflow Builder DAG</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Demucs Stem Isolation GPU</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Render NVENC 4:5 Facebook Reels</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Local Voice TTS Offline (Nam Minh)</span>
              </div>
            </div>
          </div>

          {/* License Activation Form */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              NHẬP LICENSE KEY MỚI
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="VD: CR-PRO_V48-A93F2B1C-LIFETIME-8E99FA12"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Key mẫu thử nhanh: <code className="text-indigo-300 cursor-pointer hover:underline" onClick={() => setLicenseKeyInput("CR-PRO_V48-ENTERPRISE-LIFETIME-VIP")}>CR-PRO_V48-ENTERPRISE-LIFETIME-VIP</code></span>
                <span className="text-slate-500">Mã hóa SHA256 Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleActivate}
            disabled={isLoading || !licenseKeyInput.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Xác Thực & Mở Khóa PRO
          </button>
        </div>
      </div>
    </div>
  );
};
