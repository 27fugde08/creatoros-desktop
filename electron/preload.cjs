const { contextBridge, ipcRenderer } = require('electron');

const electronBridge = {
  // Native File & Directory Dialogs
  selectDirectory: (defaultPath) => ipcRenderer.invoke('select-directory-dialog', defaultPath),
  selectFolder: (defaultPath) => ipcRenderer.invoke('select-directory-dialog', defaultPath),

  // JSON-RPC 2.0 Enterprise IPC
  invokeJsonRpc: (method, params) => ipcRenderer.invoke('json-rpc-invoke', { method, params }),

  // Legacy / Single Render
  renderVideo: (config) => ipcRenderer.send('render-video', config),
  cancelRender: () => ipcRenderer.send('cancel-render'),
  
  // Unified Pipeline Orchestrator (DAG & Master State Machine)
  startPipeline: (config) => ipcRenderer.send('orchestrator-start', config),
  resumePipeline: (pipelineId) => ipcRenderer.send('orchestrator-resume', { pipelineId }),
  pausePipeline: (pipelineId) => ipcRenderer.send('orchestrator-pause', { pipelineId }),
  getHardwareTelemetry: () => ipcRenderer.send('hardware-query'),
  cleanNvmeCache: () => ipcRenderer.send('nvme-cache-clean'),
  emptyVramCache: () => ipcRenderer.send('vram-cache-empty'),
  
  // RAG & QC Agent
  validateQc: (payload) => ipcRenderer.send('qc-validate', payload),
  queryRag: (payload) => ipcRenderer.send('rag-query', payload),

  // Event Listeners
  onRenderLog: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('render-log', listener);
    return () => ipcRenderer.removeListener('render-log', listener);
  },
  onRenderProgress: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('render-progress', listener);
    return () => ipcRenderer.removeListener('render-progress', listener);
  },
  onRenderComplete: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('render-complete', listener);
    return () => ipcRenderer.removeListener('render-complete', listener);
  },
  onRenderError: (callback) => {
    const listener = (event, value) => callback(value);
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
    const listener = (event, value) => callback(value);
    ipcRenderer.on('pipeline-update', listener);
    return () => ipcRenderer.removeListener('pipeline-update', listener);
  },
  onHealingIncident: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('healing-incident', listener);
    return () => ipcRenderer.removeListener('healing-incident', listener);
  },
  onQcReport: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('qc-report', listener);
    return () => ipcRenderer.removeListener('qc-report', listener);
  },
  onWsBridgeStatus: (callback) => {
    const listener = (event, value) => callback(value);
    ipcRenderer.on('ws-bridge-status', listener);
    return () => ipcRenderer.removeListener('ws-bridge-status', listener);
  }
};

// Expose both electronAPI and api for flexible cross-component compatibility
contextBridge.exposeInMainWorld('electronAPI', electronBridge);
contextBridge.exposeInMainWorld('api', electronBridge);
