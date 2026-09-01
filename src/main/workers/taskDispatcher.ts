import { executeScrapeTask, executeBatchDownloadTask } from './handlers/downloadHandler';
import { executeDubbingTask } from './handlers/dubbingHandler';
import { executeRenderTask } from './handlers/renderHandler';

export type TaskProgressCallback = (progress: number, message?: string) => void;
export type TaskHandlerFunction<TPayload = any, TResult = any> = (
  payload: TPayload,
  onProgress?: TaskProgressCallback
) => Promise<TResult>;

class TaskDispatcher {
  private registry: Map<string, TaskHandlerFunction>;

  constructor() {
    this.registry = new Map<string, TaskHandlerFunction>();
    this.registerDefaultHandlers();
  }

  /**
   * Register default system task handlers into Registry Map
   */
  private registerDefaultHandlers(): void {
    this.register('scrape-videos', executeScrapeTask);
    this.register('download-videos', executeBatchDownloadTask);
    this.register('process-dubbing', executeDubbingTask);
    this.register('render-video', executeRenderTask);
    console.log('[Task Dispatcher] 🚀 Đã đăng ký tất cả các Handlers mặc định vào Registry Map.');
  }

  /**
   * Register a new task handler dynamically
   * @param taskName Name of the task
   * @param handler Handler function executing the task logic
   */
  public register<TPayload = any, TResult = any>(
    taskName: string,
    handler: TaskHandlerFunction<TPayload, TResult>
  ): void {
    if (!taskName || typeof taskName !== 'string') {
      throw new Error('[Task Dispatcher] Task name phải là chuỗi hợp lệ.');
    }
    this.registry.set(taskName, handler);
    console.log(`[Task Dispatcher] 📌 Đã đăng ký Handler cho tác vụ: '${taskName}'`);
  }

  /**
   * Check if a task handler exists in Registry
   * @param taskName Task name to check
   */
  public hasHandler(taskName: string): boolean {
    return this.registry.has(taskName);
  }

  /**
   * Dispatch and execute task via registered handler
   * @param taskName Name of the task to run
   * @param payload Input data payload
   * @param onProgress Real-time progress callback
   */
  public async dispatch<TPayload = any, TResult = any>(
    taskName: string,
    payload: TPayload,
    onProgress?: TaskProgressCallback
  ): Promise<TResult> {
    console.log(`[Task Dispatcher] ⚡ Kích hoạt tác vụ: '${taskName}'`);

    const handler = this.registry.get(taskName);
    if (!handler) {
      const errMsg = `[Task Dispatcher] ❌ Không tìm thấy Handler phù hợp cho tác vụ: '${taskName}'`;
      console.error(errMsg);
      throw new Error(errMsg);
    }

    try {
      if (onProgress) onProgress(0, `Bắt đầu khởi chạy tác vụ ${taskName}...`);
      const result = await handler(payload, onProgress);
      console.log(`[Task Dispatcher] ✅ Tác vụ '${taskName}' đã hoàn thành thành công.`);
      return result as TResult;
    } catch (error: any) {
      console.error(`[Task Dispatcher] ❌ Thất bại khi thực thi tác vụ '${taskName}':`, error.message || error);
      throw error;
    }
  }

  /**
   * List all registered task names
   */
  public getRegisteredTasks(): string[] {
    return Array.from(this.registry.keys());
  }
}

export const taskDispatcher = new TaskDispatcher();
export default taskDispatcher;
