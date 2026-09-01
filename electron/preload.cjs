console.log('[Preload] Preload script loaded successfully.');

const { contextBridge, ipcRenderer } = require('electron');

const electronBridge = {
  // Native File & Directory Dialogs
  selectDirectory: (defaultPath) => {
    console.log('[IPC Send] select-directory-dialog');
    return ipcRenderer.invoke('select-directory-dialog', defaultPath);
  },
  selectFolder: (defaultPath) => {
    console.log('[IPC Send] select-directory-dialog');
    return ipcRenderer.invoke('select-directory-dialog', defaultPath);
  },

  // JSON-RPC 2.0 Enterprise IPC
  invokeJsonRpc: (method, params) => {
    console.log(`[IPC Send] json-rpc-invoke: ${method}`);
    return ipcRenderer.invoke('json-rpc-invoke', { method, params });
  },

  // Unified On-Demand Task Runner Channel
  runTask: (taskName, taskPayload) => {
    console.log(`[IPC Send] run-task: ${taskName}`);
    return ipcRenderer.invoke('run-task', { taskName, taskPayload });
  },

  // Batch Downloader & Scraper Services
  scrapeVideos: (payload) => {
    console.log(`[IPC Send] scrape-videos: ${payload?.urls?.length || 0} URLs`);
    return ipcRenderer.invoke('scrape-videos', payload);
  },
  downloadVideos: (videos) => {
    console.log(`[IPC Send] download-videos: ${videos?.length || 0} videos`);
    return ipcRenderer.invoke('download-videos', videos);
  },

  // Queue Services
  addToQueue: (payload) => {
    console.log(`[IPC Send] add-to-queue: ${payload?.taskId}`);
    return ipcRenderer.invoke('add-to-queue', payload);
  },
  cancelTask: (taskId) => {
    console.log(`[IPC Send] cancel-task: ${taskId}`);
    return ipcRenderer.invoke('cancel-task', taskId);
  },

  // Dubbing & FFmpeg Services
  processDubbing: (payload) => {
    console.log(`[IPC Send] process-dubbing`);
    return ipcRenderer.invoke('process-dubbing', payload);
  },
  renderVideoAsync: (payload) => {
    console.log(`[IPC Send] render-video`);
    return ipcRenderer.invoke('render-video', payload);
  },

  // Legacy / Single Render
  renderVideo: (config) => {
    console.log(`[IPC Send] render-video (legacy)`);
    ipcRenderer.send('render-video', config);
  },
  cancelRender: () => {
    console.log(`[IPC Send] cancel-render (legacy)`);
    ipcRenderer.send('cancel-render');
  },
  
  // Unified Pipeline Orchestrator (DAG & Master State Machine)
  startPipeline: (config) => {
    console.log(`[IPC Send] orchestrator-start`);
    ipcRenderer.send('orchestrator-start', config);
  },
  resumePipeline: (pipelineId) => {
    console.log(`[IPC Send] orchestrator-resume`);
    ipcRenderer.send('orchestrator-resume', { pipelineId });
  },
  pausePipeline: (pipelineId) => {
    console.log(`[IPC Send] orchestrator-pause`);
    ipcRenderer.send('orchestrator-pause', { pipelineId });
  },
  getHardwareTelemetry: () => {
    ipcRenderer.send('hardware-query');
  },
  cleanNvmeCache: () => {
    console.log(`[IPC Send] nvme-cache-clean`);
    ipcRenderer.send('nvme-cache-clean');
  },
  emptyVramCache: () => {
    console.log(`[IPC Send] vram-cache-empty`);
    ipcRenderer.send('vram-cache-empty');
  },
  
  // RAG & QC Agent
  validateQc: (payload) => {
    console.log(`[IPC Send] qc-validate`);
    ipcRenderer.send('qc-validate', payload);
  },
  queryRag: (payload) => {
    console.log(`[IPC Send] rag-query`);
    ipcRenderer.send('rag-query', payload);
  },

  // Event Listeners
  onRenderLog: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] render-log`);
      callback(value);
    };
    ipcRenderer.on('render-log', listener);
    return () => ipcRenderer.removeListener('render-log', listener);
  },
  onRenderProgress: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('render-progress', listener);
    return () => ipcRenderer.removeListener('render-progress', listener);
  },
  onRenderComplete: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] render-complete`);
      callback(value);
    };
    ipcRenderer.on('render-complete', listener);
    return () => ipcRenderer.removeListener('render-complete', listener);
  },
  onRenderError: (callback) => {
    const listener = (event, value) => {
      console.error(`[IPC Event Receive] render-error`);
      callback(value);
    };
    ipcRenderer.on('render-error', listener);
    return () => ipcRenderer.removeListener('render-error', listener);
  },
  onRenderStageUpdate: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('render-stage-update', listener);
    return () => ipcRenderer.removeListener('render-stage-update', listener);
  },
  onHardwareMetrics: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('hardware-metrics', listener);
    return () => ipcRenderer.removeListener('hardware-metrics', listener);
  },
  onPipelineUpdate: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] pipeline-update`);
      callback(value);
    };
    ipcRenderer.on('pipeline-update', listener);
    return () => ipcRenderer.removeListener('pipeline-update', listener);
  },
  onHealingIncident: (callback) => {
    const listener = (event, value) => {
      console.warn(`[IPC Event Receive] healing-incident`);
      callback(value);
    };
    ipcRenderer.on('healing-incident', listener);
    return () => ipcRenderer.removeListener('healing-incident', listener);
  },
  onQcReport: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] qc-report`);
      callback(value);
    };
    ipcRenderer.on('qc-report', listener);
    return () => ipcRenderer.removeListener('qc-report', listener);
  },
  onWsBridgeStatus: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] ws-bridge-status`);
      callback(value);
    };
    ipcRenderer.on('ws-bridge-status', listener);
    return () => ipcRenderer.removeListener('ws-bridge-status', listener);
  },
  onQueueUpdate: (callback) => {
    const listener = (event, value) => {
      console.log(`[IPC Event Receive] queue-update`);
      callback(value);
    };
    ipcRenderer.on('queue-update', listener);
    return () => ipcRenderer.removeListener('queue-update', listener);
  }
};

// Expose both electronAPI and api for flexible cross-component compatibility
contextBridge.exposeInMainWorld('electronAPI', electronBridge);
contextBridge.exposeInMainWorld('api', electronBridge);
