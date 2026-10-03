import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { auth, db } from '../config/firebase';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { Task, WebhookData, CategoryDef, BackupData } from '../types';
import { RecurrenceEngine } from '../services/recurrence/RecurrenceEngine';
import { ITaskRepository } from '../services/storage/ITaskRepository';
import { LocalStorageRepository, LOCAL_STORAGE_KEY, LOCAL_CATEGORIES_KEY } from '../services/storage/LocalStorageRepository';
import { FirestoreRepository } from '../services/storage/FirestoreRepository';
import { UIProvider, useUIContext } from './UIContext';

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'Personal', name: 'Personal', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👤' },
  { id: 'Household', name: 'Household', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: '🏠' },
  { id: 'Health', name: 'Health / Medical', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '❤️' },
  { id: 'Auto', name: 'Auto / Moto', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '🚗' },
  { id: 'Subscriptions', name: 'Subscriptions', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '💳' },
  { id: 'Work', name: 'Work / Business', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '💼' }
];

export interface AppContextType {
  user: User | null;
  isGuest: boolean;
  tasks: Task[];
  categories: CategoryDef[];
  webhook: WebhookData;
  triggeredLogs: any[];
  setTriggeredLogs: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearArchivedTasks: () => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  saveWebhook: (url: string, targetEmail?: string, secret?: string) => Promise<void>;
  saveCategories: (newCategories: CategoryDef[]) => Promise<void>;
  updateTelemetry: (status: string) => Promise<void>;
  exportBackupJSON: () => BackupData;
  downloadBackupFile: () => void;
  importBackupData: (data: any, mode?: 'replace' | 'merge') => Promise<{ success: boolean; tasksCount: number; categoriesCount: number; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const DEFAULT_APP_ID = 'lifesync-cloud-tracker';

const AppProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { searchQuery, setSearchQuery, triggeredLogs, setTriggeredLogs } = useUIContext();

  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES);
  const [webhook, setWebhook] = useState<WebhookData>({ url: '', secret: '', lastStatus: 'None', lastTime: '--' });
  const [loading, setLoading] = useState(true);

  // Repository abstraction (DIP)
  const storageRepo: ITaskRepository = useMemo(() => {
    if (isGuest) {
      return new LocalStorageRepository();
    }
    if (user) {
      return new FirestoreRepository(db, user.uid);
    }
    return new LocalStorageRepository();
  }, [isGuest, user]);

  // Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        setLoading(false);
      } else {
        setUser(null);
        if (!isGuest) {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [isGuest]);

  // Cloud Sync Observer
  useEffect(() => {
    let unsubscribeTasks: (() => void) | undefined;

    if (user && !isGuest) {
      const ref = collection(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items');
      unsubscribeTasks = onSnapshot(ref, (snapshot) => {
        const cloudTasks: Task[] = [];
        snapshot.forEach(docSnap => {
          cloudTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        setTasks(cloudTasks);
      }, (error) => {
        console.error("Snapshot synchronization break:", error);
      });

      // Load Settings
      const settingsRef = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'webhook');
      getDoc(settingsRef).then(snap => {
        if (snap.exists()) {
          setWebhook(snap.data() as WebhookData);
        }
      }).catch(e => console.error("Settings load catch:", e));

      // Load Categories
      const categoriesRef = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'categories');
      getDoc(categoriesRef).then(snap => {
        if (snap.exists() && snap.data().items) {
          setCategories(snap.data().items);
        }
      }).catch(e => console.error("Categories load catch:", e));
    }

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [user, isGuest]);

  const loginAsGuest = useCallback(() => {
    setIsGuest(true);
    setUser(null);
    setWebhook({ url: '', secret: '', lastStatus: 'None', lastTime: '--' });

    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        setTasks(JSON.parse(localData));
      } catch {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }

    const localCatData = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (localCatData) {
      try {
        setCategories(JSON.parse(localCatData));
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    setIsGuest(false);
    setUser(null);
    setTasks([]);
    setCategories(DEFAULT_CATEGORIES);
    setWebhook({ url: '', secret: '', lastStatus: 'None', lastTime: '--' });
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
    const created = await storageRepo.addTask(taskData);
    if (isGuest) {
      setTasks(prev => [...prev, created]);
    }
  }, [storageRepo, isGuest]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await storageRepo.updateTask(id, updates);
    if (isGuest) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));
    }
  }, [storageRepo, isGuest]);

  const deleteTask = useCallback(async (id: string) => {
    await storageRepo.deleteTask(id);
    if (isGuest) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }, [storageRepo, isGuest]);

  const clearArchivedTasks = useCallback(async () => {
    const archivedTasks = tasks.filter(t => t.archived);
    await storageRepo.clearArchivedTasks(archivedTasks);
    if (isGuest) {
      setTasks(prev => prev.filter(t => !t.archived));
    }
  }, [storageRepo, isGuest, tasks]);

  const archiveTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.recurrence && RecurrenceEngine.isValidRecurrence(task.recurrence)) {
      const { cloneRecord, nextDateStr, isExpired } = RecurrenceEngine.rollForwardTask(task);

      if (isExpired) {
        await storageRepo.archiveSingleTask(id);
        if (isGuest) {
          setTasks(prev => prev.map(t => (t.id === id ? { ...t, archived: true, archivedAt: new Date().toISOString() } : t)));
        }
        return;
      }

      await storageRepo.archiveRecurringTask(id, cloneRecord, nextDateStr);
      if (isGuest) {
        setTasks(prev => {
          const updated = prev.map(t => (t.id === id ? { ...t, date: nextDateStr, updatedAt: new Date().toISOString() } : t));
          return [...updated, { ...cloneRecord, id: crypto.randomUUID() } as Task];
        });
      }
    } else {
      await storageRepo.archiveSingleTask(id);
      if (isGuest) {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, archived: true, archivedAt: new Date().toISOString() } : t)));
      }
    }
  }, [tasks, storageRepo, isGuest]);

  const unarchiveTask = useCallback(async (id: string) => {
    await updateTask(id, { archived: false });
  }, [updateTask]);

  const saveWebhook = useCallback(async (url: string, targetEmail?: string, secret?: string) => {
    if (isGuest) return;
    if (user) {
      const currentSecret = secret !== undefined ? secret : webhook.secret;
      const currentEmail = targetEmail !== undefined ? targetEmail : webhook.targetEmail;
      const newWebhook = { url, targetEmail: currentEmail, secret: currentSecret || '', lastStatus: "Updated", lastTime: new Date().toLocaleString() };
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'webhook');
      await setDoc(ref, newWebhook, { merge: true });
      setWebhook(prev => ({ ...prev, ...newWebhook }));
    }
  }, [isGuest, user, webhook.secret, webhook.targetEmail]);

  const saveCategories = useCallback(async (newCategories: CategoryDef[]) => {
    setCategories(newCategories);
    if (user && !isGuest) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'categories');
      await setDoc(ref, { items: newCategories }, { merge: true });
    }
  }, [isGuest, user]);

  const updateTelemetry = useCallback(async (status: string) => {
    const time = new Date().toLocaleString();
    const updates = { lastStatus: status, lastTime: time };
    setWebhook(prev => ({ ...prev, ...updates }));
    if (!isGuest && user) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'webhook');
      await setDoc(ref, updates, { merge: true });
    }
  }, [isGuest, user]);

  const exportBackupJSON = useCallback((): BackupData => {
    return {
      app: 'TaskLapse',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      tasksCount: tasks.length,
      categoriesCount: categories.length,
      tasks: tasks,
      categories: categories
    };
  }, [tasks, categories]);

  const downloadBackupFile = useCallback(() => {
    const backupObj = exportBackupJSON();
    const dataStr = JSON.stringify(backupObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasklapse_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, [exportBackupJSON]);

  const importBackupData = useCallback(async (
    rawInput: any,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{ success: boolean; tasksCount: number; categoriesCount: number; message: string }> => {
    try {
      let rawTasks: any[] = [];
      let rawCategories: any[] = [];

      if (Array.isArray(rawInput)) {
        rawTasks = rawInput;
      } else if (rawInput && typeof rawInput === 'object') {
        if (Array.isArray(rawInput.tasks)) rawTasks = rawInput.tasks;
        if (Array.isArray(rawInput.categories)) rawCategories = rawInput.categories;
      } else {
        throw new Error("Invalid backup format. Expected a JSON backup file or tasks array.");
      }

      if (rawTasks.length === 0 && rawCategories.length === 0) {
        throw new Error("No tasks or categories found in the provided backup file.");
      }

      const sanitizedTasks: Task[] = rawTasks.map((t: any) => ({
        id: t.id || crypto.randomUUID(),
        name: String(t.name || 'Untitled Item'),
        date: String(t.date || t.startDate || new Date().toISOString().split('T')[0]),
        expiresDate: t.expiresDate ? String(t.expiresDate) : undefined,
        startDate: t.startDate ? String(t.startDate) : undefined,
        category: String(t.category || 'Personal'),
        notes: String(t.notes || ''),
        recurrence: String(t.recurrence || 'Does not repeat'),
        alerts: t.alerts || { thirtyDays: false, sevenDays: true, oneDay: true },
        archived: Boolean(t.archived),
        archivedAt: t.archivedAt ? String(t.archivedAt) : undefined,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      let sanitizedCategories: CategoryDef[] = [];
      if (rawCategories.length > 0) {
        sanitizedCategories = rawCategories.map((c: any) => ({
          id: c.id || crypto.randomUUID(),
          name: String(c.name || 'Custom'),
          color: String(c.color || 'bg-slate-500/20 text-slate-300 border-slate-500/30'),
          icon: String(c.icon || '📁')
        }));
      }

      const result = await storageRepo.batchImport(
        tasks,
        sanitizedTasks,
        mode,
        sanitizedCategories,
        categories
      );

      if (isGuest) {
        let finalTasks = sanitizedTasks;
        if (mode === 'merge') {
          const existingIds = new Set(tasks.map(t => t.id));
          const newTasks = sanitizedTasks.filter(t => !existingIds.has(t.id));
          finalTasks = [...tasks, ...newTasks];
        }
        setTasks(finalTasks);

        if (sanitizedCategories.length > 0) {
          let finalCategories = sanitizedCategories;
          if (mode === 'merge') {
            const existingCatIds = new Set(categories.map(c => c.id));
            const newCats = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
            finalCategories = [...categories, ...newCats];
          }
          setCategories(finalCategories);
        }
      }

      return {
        success: true,
        tasksCount: result.tasksCount,
        categoriesCount: result.categoriesCount,
        message: mode === 'replace'
          ? `Successfully replaced ${result.tasksCount} item(s) in an atomic repository transaction.`
          : `Successfully merged ${result.tasksCount} item(s) into repository.`
      };
    } catch (err: any) {
      console.error("Backup import error:", err);
      return {
        success: false,
        tasksCount: 0,
        categoriesCount: 0,
        message: err.message || "Failed to parse and import backup file."
      };
    }
  }, [tasks, categories, storageRepo, isGuest]);

  return (
    <AppContext.Provider value={{
      user, isGuest, tasks, categories, webhook, triggeredLogs, setTriggeredLogs, loading,
      searchQuery, setSearchQuery,
      loginAsGuest, logout, addTask, updateTask, deleteTask, clearArchivedTasks, archiveTask, unarchiveTask,
      saveWebhook, saveCategories, updateTelemetry,
      exportBackupJSON, downloadBackupFile, importBackupData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </UIProvider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
