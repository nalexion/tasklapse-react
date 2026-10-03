import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, setDoc, Firestore } from 'firebase/firestore';
import { Task, CategoryDef } from '../../types';
import { ITaskRepository, BatchImportResult } from './ITaskRepository';

const DEFAULT_APP_ID = 'lifesync-cloud-tracker';
const BATCH_SIZE = 450;

/**
 * Concrete Task Repository for Cloud Synchronized Mode (persisted to Firestore with atomic batching).
 */
export class FirestoreRepository implements ITaskRepository {
  constructor(
    private db: Firestore,
    private uid: string
  ) {}

  private get itemsCol() {
    return collection(this.db, 'artifacts', DEFAULT_APP_ID, 'users', this.uid, 'items');
  }

  private itemDoc(id: string) {
    return doc(this.db, 'artifacts', DEFAULT_APP_ID, 'users', this.uid, 'items', id);
  }

  async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<Task> {
    const cleanedData: any = { ...taskData };
    if (!cleanedData.startDate) delete cleanedData.startDate;
    if (!cleanedData.expiresDate) delete cleanedData.expiresDate;

    const payload = {
      ...cleanedData,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(this.itemsCol, payload);
    return { ...payload, id: docRef.id } as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const cleanedUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    if (cleanedUpdates.startDate === '' || cleanedUpdates.startDate === undefined) {
      delete cleanedUpdates.startDate;
    }
    if (cleanedUpdates.expiresDate === '' || cleanedUpdates.expiresDate === undefined) {
      delete cleanedUpdates.expiresDate;
    }
    await updateDoc(this.itemDoc(id), cleanedUpdates);
  }

  async deleteTask(id: string): Promise<void> {
    await deleteDoc(this.itemDoc(id));
  }

  async clearArchivedTasks(archivedTasks: Task[]): Promise<void> {
    if (archivedTasks.length === 0) return;

    for (let i = 0; i < archivedTasks.length; i += BATCH_SIZE) {
      const chunk = archivedTasks.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(this.db);
      chunk.forEach(item => {
        batch.delete(this.itemDoc(item.id));
      });
      await batch.commit();
    }
  }

  async archiveRecurringTask(
    originalId: string,
    cloneRecord: Record<string, any>,
    nextDateStr: string
  ): Promise<void> {
    const batch = writeBatch(this.db);
    const cloneRef = doc(this.itemsCol);
    batch.set(cloneRef, cloneRecord);

    const originalRef = this.itemDoc(originalId);
    batch.update(originalRef, {
      date: nextDateStr,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
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
    let batch = writeBatch(this.db);
    let opCount = 0;

    // In replace mode, delete all existing user items in batched chunks
    if (mode === 'replace') {
      for (const item of currentTasks) {
        batch.delete(this.itemDoc(item.id));
        opCount++;
        if (opCount >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(this.db);
          opCount = 0;
        }
      }
    }

    // Determine tasks to write
    let tasksToInsert = sanitizedTasks;
    if (mode === 'merge') {
      const existingIds = new Set(currentTasks.map(t => t.id));
      tasksToInsert = sanitizedTasks.filter(t => !existingIds.has(t.id));
    }

    for (const task of tasksToInsert) {
      const { id: _ignoredId, ...taskPayload } = task;
      const cleanedPayload: any = { ...taskPayload };
      Object.keys(cleanedPayload).forEach(key => {
        if (cleanedPayload[key] === undefined) delete cleanedPayload[key];
      });

      const newDocRef = doc(this.itemsCol);
      batch.set(newDocRef, cleanedPayload);
      opCount++;
      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(this.db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    // Handle categories if present
    if (sanitizedCategories && sanitizedCategories.length > 0) {
      let finalCats = sanitizedCategories;
      if (mode === 'merge') {
        const existingCatIds = new Set(currentCategories.map(c => c.id));
        const newCats = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
        finalCats = [...currentCategories, ...newCats];
      }
      const catRef = doc(this.db, 'artifacts', DEFAULT_APP_ID, 'users', this.uid, 'settings', 'categories');
      await setDoc(catRef, { items: finalCats }, { merge: true });
    }

    return {
      tasksCount: tasksToInsert.length,
      categoriesCount: sanitizedCategories ? sanitizedCategories.length : 0
    };
  }
}
