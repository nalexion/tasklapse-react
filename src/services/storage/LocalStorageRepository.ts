import { Task, CategoryDef } from '../../types';
import { ITaskRepository, BatchImportResult } from './ITaskRepository';

export const LOCAL_STORAGE_KEY = 'tasklapse_local_items';
export const LOCAL_CATEGORIES_KEY = 'tasklapse_local_categories';
export const LOCAL_WEBHOOK_KEY = 'tasklapse_local_webhook';

/**
 * Concrete Task Repository for Offline Guest Mode (persisted to LocalStorage).
 */
export class LocalStorageRepository implements ITaskRepository {
  private getStoredTasks(): Task[] {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveStoredTasks(tasks: Task[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }

  async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const tasks = this.getStoredTasks();
    const updated = [...tasks, newTask];
    this.saveStoredTasks(updated);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const tasks = this.getStoredTasks();
    const nowIso = new Date().toISOString();
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const merged: Task = { ...t, ...updates, updatedAt: nowIso };
      if ('startDate' in updates && (updates.startDate === '' || updates.startDate === undefined)) {
        delete merged.startDate;
      }
      if ('expiresDate' in updates && (updates.expiresDate === '' || updates.expiresDate === undefined)) {
        delete merged.expiresDate;
      }
      return merged;
    });
    this.saveStoredTasks(updated);
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.getStoredTasks();
    const updated = tasks.filter(t => t.id !== id);
    this.saveStoredTasks(updated);
  }

  async clearArchivedTasks(): Promise<void> {
    const tasks = this.getStoredTasks();
    const updated = tasks.filter(t => !t.archived);
    this.saveStoredTasks(updated);
  }

  async archiveRecurringTask(
    originalId: string,
    cloneRecord: Record<string, unknown>,
    nextDateStr: string,
    anchorStartDate?: string
  ): Promise<Task> {
    const tasks = this.getStoredTasks();
    const updatedOriginals = tasks.map(t =>
      t.id === originalId
        ? {
            ...t,
            date: nextDateStr,
            startDate: anchorStartDate || t.startDate || t.date,
            updatedAt: new Date().toISOString()
          }
        : t
    );
    const archiveClone: Task = {
      ...cloneRecord,
      id: crypto.randomUUID()
    } as Task;
    this.saveStoredTasks([...updatedOriginals, archiveClone]);
    return archiveClone;
  }

  async archiveSingleTask(id: string): Promise<void> {
    await this.updateTask(id, {
      archived: true,
      archivedAt: new Date().toISOString()
    });
  }

  async batchImport(
    currentTasks: Task[],
    sanitizedTasks: Task[],
    mode: 'replace' | 'merge',
    sanitizedCategories?: CategoryDef[],
    currentCategories: CategoryDef[] = []
  ): Promise<BatchImportResult> {
    let finalTasks = sanitizedTasks;
    if (mode === 'merge') {
      const existingIds = new Set(currentTasks.map(t => t.id));
      const newTasks = sanitizedTasks.filter(t => !existingIds.has(t.id));
      finalTasks = [...currentTasks, ...newTasks];
    }
    this.saveStoredTasks(finalTasks);

    if (sanitizedCategories && sanitizedCategories.length > 0) {
      let finalCategories = sanitizedCategories;
      if (mode === 'merge') {
        const existingCatIds = new Set(currentCategories.map(c => c.id));
        const newCats = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
        finalCategories = [...currentCategories, ...newCats];
      }
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(finalCategories));
    }

    return {
      tasksCount: sanitizedTasks.length,
      categoriesCount: sanitizedCategories ? sanitizedCategories.length : 0
    };
  }
}
