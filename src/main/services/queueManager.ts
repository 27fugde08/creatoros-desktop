import { EventEmitter } from 'events';

// Mocking GlobalTask for TypeScript since the original uses a dynamic require
// In a real scenario, you'd import this from your database module
const GlobalTask = {
  upsert: async (data: any) => console.log('Mock upsert', data),
  update: async (data: any, condition?: any) => console.log('Mock update', data, condition),
  findOne: async (condition: any) => null as any,
  findAll: async (condition: any) => [] as any[]
};

export type TaskFunction = (onProgress: (progress: number) => void) => Promise<void>;

export interface TaskMetadata {
  type?: string;
  title?: string;
  [key: string]: any;
}

export interface TaskSnapshot {
  taskId: string;
  status: string;
  progress: number;
  metadata: {
    title: string;
  };
}

class QueueManager extends EventEmitter {
  private concurrency: number;
  private runningCount: number;
  private taskRegistry: Map<string, TaskFunction>;

  constructor(concurrency: number = 1) {
    super();
    this.concurrency = concurrency;
    this.runningCount = 0;
    this.taskRegistry = new Map<string, TaskFunction>();
  }

  /**
   * Enqueue a new task
   * @param taskId Unique identifier for the task
   * @param taskFn Async function to execute the task
   * @param metadata Task metadata
   * @returns The taskId
   */
  public async enqueue(taskId: string, taskFn: TaskFunction, metadata: TaskMetadata): Promise<string> {
    this.taskRegistry.set(taskId, taskFn);
    
    try {
      await GlobalTask.upsert({
        id: taskId,
        type: metadata.type || "generic",
        title: metadata.title || "Unknown",
        status: "queued",
        progress: 0,
        createdAt: Date.now()
      });
      
      this.emit("update", await this.getSnapshot());
      this.process();
    } catch (error) {
      console.error(`[QueueManager] Error enqueuing task ${taskId}:`, error);
      throw error;
    }

    return taskId;
  }

  /**
   * Cancel a task
   * @param taskId Unique identifier for the task
   */
  public async cancelTask(taskId: string): Promise<void> {
    if (this.taskRegistry.has(taskId)) {
      this.taskRegistry.delete(taskId);
    }
    
    try {
      await GlobalTask.update({ status: "failed", error: "Cancelled by user" }, { where: { id: taskId } });
      this.emit("update", await this.getSnapshot());
    } catch (error) {
      console.error(`[QueueManager] Error cancelling task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Process the queue
   */
  private async process(): Promise<void> {
    if (this.runningCount >= this.concurrency) return;

    let taskRecord;
    try {
      taskRecord = await GlobalTask.findOne({ 
        where: { status: "queued" },
        order: [["createdAt", "ASC"]]
      });
    } catch (error) {
      console.error('[QueueManager] Error fetching next task:', error);
      return;
    }

    if (!taskRecord) return;

    this.runningCount++;
    
    try {
      await taskRecord.update({ status: "processing" });
      this.emit("update", await this.getSnapshot());

      const taskFn = this.taskRegistry.get(taskRecord.id);

      if (taskFn) {
        await taskFn(async (progress: number) => {
           await taskRecord.update({ progress });
           this.emit("update", await this.getSnapshot());
        });
        await taskRecord.update({ status: "completed", progress: 100, completedAt: Date.now() });
      } else {
        await taskRecord.update({ status: "failed", error: "Task function lost (App restart)" });
      }
    } catch (err: any) {
      console.error(`[QueueManager] Task execution failed for ${taskRecord.id}:`, err);
      await taskRecord.update({ status: "failed", error: err.message || 'Unknown error' });
    } finally {
      this.taskRegistry.delete(taskRecord.id); // Clean up registry
      this.runningCount--;
      this.emit("update", await this.getSnapshot());
      // Process next task
      this.process();
    }
  }

  /**
   * Get current state of all tasks
   * @returns Array of task snapshots
   */
  public async getSnapshot(): Promise<TaskSnapshot[]> {
    try {
      const tasks = await GlobalTask.findAll({ 
        order: [["createdAt", "ASC"]]
      });
      
      return tasks.map((t: any) => ({
        taskId: t.id,
        status: t.status,
        progress: t.progress,
        metadata: { title: t.title }
      }));
    } catch (error) {
      console.error('[QueueManager] Error getting snapshot:', error);
      return [];
    }
  }
}

export default new QueueManager(1);
