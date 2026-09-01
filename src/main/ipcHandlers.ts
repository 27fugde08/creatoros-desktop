import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import queueManager from './services/queueManager';
import taskDispatcher from './workers/taskDispatcher';
import { VideoProcessOptions, VideoProcessResult } from './services/videoWorker';
import { DubbingRequestData, DubbingProcessResult } from './services/dubbingService';

// Generic type for IPC handler
type IpcHandler<T = any> = (event: IpcMainInvokeEvent, ...args: any[]) => Promise<T>;

interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  stack?: string;
}

/**
 * Send real-time progress & log updates back to Renderer Window via IPC
 */
const notifyProgress = (event: IpcMainInvokeEvent, progress: number, message?: string): void => {
  if (event.sender && !event.sender.isDestroyed()) {
    event.sender.send('task-progress', { progress, message });
    event.sender.send('render-progress', progress);
    if (message) {
      event.sender.send('render-log', message);
    }
  }
};

const safeIpcHandler = <T>(channel: string, handler: IpcHandler<T>): void => {
  // Remove existing handler to avoid memory leak if setupIpcHandlers is called multiple times
  ipcMain.removeHandler(channel);
  
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]): Promise<IpcResponse<T> | any> => {
    console.log(`[Main Receive] IPC Request received on channel: ${channel}`);
    try {
      const result = await handler(event, ...args);
      console.log(`[IPC Response] Successfully processed ${channel}`);
      return result;
    } catch (err: any) {
      console.error(`[IPC Response] Error in channel handler ${channel}:`, err);
      return {
        success: false,
        error: err.message || 'Unknown IPC processing error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };
    }
  });
};

export function setupIpcHandlers(): void {
  // 1. Scrape Videos Task Handler
  safeIpcHandler("scrape-videos", async (event: IpcMainInvokeEvent, payload: { urls: string[], cookie?: string, proxy?: string }) => {
    console.log(`[IPC Handlers] Dispatching 'scrape-videos' via TaskDispatcher...`);
    return await taskDispatcher.dispatch('scrape-videos', payload, (progress, message) => {
      notifyProgress(event, progress, message);
    });
  });

  // 2. FFmpeg Video Render Task Handler
  safeIpcHandler("render-video", async (event: IpcMainInvokeEvent, payload: VideoProcessOptions): Promise<VideoProcessResult> => {
    console.log("[IPC Handlers] Dispatching 'render-video' via TaskDispatcher...");
    return await taskDispatcher.dispatch('render-video', payload, (progress, message) => {
      notifyProgress(event, progress, message);
    });
  });

  // 3. AI Dubbing & TTS Task Handler
  safeIpcHandler("process-dubbing", async (event: IpcMainInvokeEvent, payload: DubbingRequestData): Promise<DubbingProcessResult> => {
    console.log("[IPC Handlers] Dispatching 'process-dubbing' via TaskDispatcher...");
    return await taskDispatcher.dispatch('process-dubbing', payload, (progress, message) => {
      notifyProgress(event, progress, message);
    });
  });

  // 4. Batch Video Download Task Handler
  safeIpcHandler('download-videos', async (event: IpcMainInvokeEvent, payload: any) => {
    console.log("[IPC Handlers] Dispatching 'download-videos' via TaskDispatcher...");
    const videosPayload = Array.isArray(payload) ? { videos: payload } : payload;
    return await taskDispatcher.dispatch('download-videos', videosPayload, (progress, message) => {
      notifyProgress(event, progress, message);
    });
  });

  // 5. Unified On-Demand Task Runner Handler ('run-task')
  safeIpcHandler("run-task", async (event: IpcMainInvokeEvent, payload: { taskName: string; taskPayload: any }) => {
    console.log(`[IPC Handlers] On-Demand 'run-task' invoked: ${payload?.taskName}`);
    if (!payload || !payload.taskName) {
      throw new Error("Payload 'run-task' không hợp lệ: Thiếu taskName.");
    }
    return await taskDispatcher.dispatch(payload.taskName, payload.taskPayload, (progress, message) => {
      notifyProgress(event, progress, message);
    });
  });

  // Handle queue updates to all windows safely
  const onQueueUpdate = (snapshot: any) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents) {
        win.webContents.send("queue-update", snapshot);
      }
    });
  };

  // Remove listener to prevent memory leaks if setupIpcHandlers is invoked again
  queueManager.removeAllListeners("update");
  queueManager.on("update", onQueueUpdate);

  safeIpcHandler("add-to-queue", async (_event: IpcMainInvokeEvent, { taskId, metadata }: { taskId: string; metadata: any }) => {
    console.log(`[Worker Process] Enqueuing task ${taskId}`);
    if (!taskId) {
      throw new Error('Task ID is required to enqueue');
    }
    return queueManager.enqueue(taskId, async (onProgress: (progress: number) => void) => {
      console.log(`[QueueManager] Executing task: ${taskId}`);
      onProgress(100);
    }, metadata || {});
  });

  safeIpcHandler("cancel-task", async (_event: IpcMainInvokeEvent, taskId: string) => {
    console.log(`[Worker Process] Cancelling task ${taskId}`);
    if (!taskId) {
      throw new Error('Task ID is required to cancel task');
    }
    return queueManager.cancelTask(taskId);
  });
}

export default setupIpcHandlers;

