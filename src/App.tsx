import React, { useState, useEffect, Suspense, lazy } from "react";
import { ActiveTab, LicenseStatus } from "./types";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { QueueProvider } from "./context/QueueContext";
import { ToastProvider } from "./context/ToastContext";
import { GlobalTaskQueueModal } from "./components/GlobalTaskQueueModal";
import { ActivationModal } from "./components/ActivationModal";
import { OtaUpdateModal } from "./components/OtaUpdateModal";
import { AnimatePresence, motion } from "framer-motion";
import { SkeletonFallback } from "./components/SkeletonFallback";

// Lazy Load All Tools for Code Splitting
const WorkflowBuilderTool = lazy(() => import("./components/WorkflowBuilderTool").then(module => ({ default: module.WorkflowBuilderTool })));
const LanClusterTool = lazy(() => import("./components/LanClusterTool").then(module => ({ default: module.LanClusterTool })));
const LipSyncStudioTool = lazy(() => import("./components/LipSyncStudioTool").then(module => ({ default: module.LipSyncStudioTool })));
const BlueprintPresetTool = lazy(() => import("./components/BlueprintPresetTool").then(module => ({ default: module.BlueprintPresetTool })));
const OrchestratorTool = lazy(() => import("./components/OrchestratorTool").then(module => ({ default: module.OrchestratorTool })));
const HighlightTool = lazy(() => import("./components/HighlightTool").then(module => ({ default: module.HighlightTool })));
const ReviewTool = lazy(() => import("./components/ReviewTool").then(module => ({ default: module.ReviewTool })));
const TranslateVideoTool = lazy(() => import("./components/TranslateVideoTool").then(module => ({ default: module.TranslateVideoTool })));
const SemiContentTool = lazy(() => import("./components/SemiContentTool").then(module => ({ default: module.SemiContentTool })));
const LocalVoiceTool = lazy(() => import("./components/LocalVoiceTool").then(module => ({ default: module.LocalVoiceTool })));
const SeoSuiteTool = lazy(() => import("./components/SeoSuiteTool").then(module => ({ default: module.SeoSuiteTool })));
const BatchDownloaderTool = lazy(() => import("./components/BatchDownloaderTool").then(module => ({ default: module.BatchDownloaderTool })));
const AiComicTool = lazy(() => import("./components/AiComicTool").then(module => ({ default: module.AiComicTool })));
const PhoneFarmTool = lazy(() => import("./components/PhoneFarmTool").then(module => ({ default: module.PhoneFarmTool })));
const FbSuiteTool = lazy(() => import("./components/FbSuiteTool").then(module => ({ default: module.FbSuiteTool })));
const DashboardTool = lazy(() => import("./components/DashboardTool").then(module => ({ default: module.DashboardTool })));
const ApiDocsTool = lazy(() => import("./components/ApiDocsTool").then(module => ({ default: module.ApiDocsTool })));
const UserGuideTool = lazy(() => import("./components/UserGuideTool").then(module => ({ default: module.UserGuideTool })));

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("workflow");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isOtaModalOpen, setIsOtaModalOpen] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>({
    is_activated: true,
    tier: "PRO_V48",
    license_key: "CR-PRO_V48-A93F2B1C-LIFETIME-8E99FA12",
    fingerprint_bound: "CR-F89A-4B21-9CE3-77F1",
    owner_name: "Thanh Đắc Lộc (Principal Studio)",
    issued_at: Date.now() - 86400000 * 30,
    expires_at: 0,
    max_nvenc_streams: 2,
    features: {
      unlimited_dag: true,
      demucs_gpu_isolation: true,
      local_voice_cloning: true,
      no_strike_matrix: true,
      batch_fb_phone_farm: true,
      ota_priority_updates: true
    }
  });

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const res = await fetch("/api/license/status");
      const json = await res.json();
      if (json.success && json.data) {
        setLicenseStatus(json.data);
      }
    } catch (e) {
      console.warn("Could not fetch license status", e);
    }
  };

  const renderActiveTool = () => {
    switch (activeTab) {
      case "workflow":
        return <WorkflowBuilderTool />;
      case "lan-cluster":
        return <LanClusterTool />;
      case "lipsync":
        return <LipSyncStudioTool />;
      case "presets":
        return <BlueprintPresetTool />;
      case "orchestrator":
        return <OrchestratorTool />;
      case "highlight":
        return <HighlightTool />;
      case "review":
        return <ReviewTool />;
      case "translate":
        return <TranslateVideoTool />;
      case "semi-edit":
        return <SemiContentTool />;
      case "voice-local":
        return <LocalVoiceTool />;
      case "seo-suite":
        return <SeoSuiteTool />;
      case "batch-downloader":
        return <BatchDownloaderTool />;
      case "ai-comic":
        return <AiComicTool />;
      case "phone-farm":
        return <PhoneFarmTool />;
      case "fb-suite":
        return <FbSuiteTool />;
      case "dashboard":
        return <DashboardTool />;
      case "api-docs":
        return <ApiDocsTool />;
      case "user-guide":
        return <UserGuideTool onNavigateToTab={(tab) => setActiveTab(tab)} />;
      default:
        return <WorkflowBuilderTool />;
    }
  };

  return (
    <ToastProvider>
      <QueueProvider>
        <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
          {/* Top Navbar */}
          <Navbar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
            onOpenOtaModal={() => setIsOtaModalOpen(true)}
            licenseTier={licenseStatus?.tier || "PRO v4.8"}
          />

          {/* Main Container */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Sidebar */}
            <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Main Content Workspace */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0F172A]">
              <div className="max-w-7xl mx-auto h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <Suspense fallback={<SkeletonFallback />}>
                      {renderActiveTool()}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>

          {/* Global Task Queue Modal Drawer */}
          <GlobalTaskQueueModal />

          {/* DRM License Activation Modal */}
          <ActivationModal
            isOpen={isLicenseModalOpen}
            onClose={() => setIsLicenseModalOpen(false)}
            licenseStatus={licenseStatus}
            onLicenseUpdated={(newLic) => setLicenseStatus(newLic)}
          />

          {/* OTA Secure Update Modal */}
          <OtaUpdateModal
            isOpen={isOtaModalOpen}
            onClose={() => setIsOtaModalOpen(false)}
          />
        </div>
      </QueueProvider>
    </ToastProvider>
  );
}
