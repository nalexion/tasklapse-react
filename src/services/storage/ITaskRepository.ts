import { Task, CategoryDef } from '../../types';

export interface BatchImportResult {
  tasksCount: number;
  categoriesCount: number;
}

/**
 * Storage Repository Interface (DIP / Repository Pattern).
 * Decouples domain logic and UI from concrete storage technologies (LocalStorage, Firestore).
 */
export interface ITaskRepository {
  /**
   * Appends a new active task to storage.
   */
  addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<Task>;

  /**
   * Updates fields on an existing task.
   */
  updateTask(id: string, updates: Partial<Task>): Promise<void>;

  /**
   * Permanently deletes a single task by ID.
   */
  deleteTask(id: string): Promise<void>;

  /**
   * Deletes all archived tasks in bulk.
   */
  clearArchivedTasks(archivedTasks: Task[]): Promise<void>;

  /**
   * Atomically records an archived cycle clone and rolls the original task forward.
   */
  archiveRecurringTask(
    originalId: string,
    cloneRecord: Record<string, any>,
    nextDateStr: string
  ): Promise<void>;

  /**
   * Archives a single non-recurring or expired task.
   */
  archiveSingleTask(id: string): Promise<void>;

  /**
   * Executes a bulk backup import (replace or merge).
   */
  batchImport(
    currentTasks: Task[],
    sanitizedTasks: Task[],
    mode: 'replace' | 'merge',
    sanitizedCategories?: CategoryDef[],
    currentCategories?: CategoryDef[]
  ): Promise<BatchImportResult>;
}
