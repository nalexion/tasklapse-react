import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '../config/firebase';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Task, WebhookData, CategoryDef, BackupData } from '../types';

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'Personal', name: 'Personal', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👤' },
  { id: 'Household', name: 'Household', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: '🏠' },
  { id: 'Health', name: 'Health / Medical', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '❤️' },
  { id: 'Auto', name: 'Auto / Moto', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '🚗' },
  { id: 'Subscriptions', name: 'Subscriptions', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '💳' },
  { id: 'Work', name: 'Work / Business', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '💼' }
];

interface AppContextType {
  user: User | null;
  isGuest: boolean;
  tasks: Task[];
  categories: CategoryDef[];
  webhook: WebhookData;
  triggeredLogs: any[];
  setTriggeredLogs: (logs: any[]) => void;
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

const LOCAL_STORAGE_KEY = 'tasklapse_local_items';
const LOCAL_CATEGORIES_KEY = 'tasklapse_local_categories';
const DEFAULT_APP_ID = 'lifesync-cloud-tracker';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES);
  const [webhook, setWebhook] = useState<WebhookData>({ url: '', secret: '', lastStatus: 'None', lastTime: '--' });
  const [triggeredLogs, setTriggeredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Save local tasks effect
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isGuest]);

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, isGuest]);

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
        snapshot.forEach(doc => {
          cloudTasks.push({ id: doc.id, ...doc.data() } as Task);
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
      } catch (e) {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }

    const localCatData = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (localCatData) {
      try {
        setCategories(JSON.parse(localCatData));
      } catch (e) {
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
    const cleanedData: any = { ...taskData };
    if (!cleanedData.startDate) {
      delete cleanedData.startDate;
    }
    if (!cleanedData.expiresDate) {
      delete cleanedData.expiresDate;
    }
    const newTask: Partial<Task> = {
      ...cleanedData,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isGuest) {
      const localTask = { ...newTask, id: crypto.randomUUID() } as Task;
      setTasks(prev => [...prev, localTask]);
    } else if (user) {
      const ref = collection(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items');
      await addDoc(ref, newTask);
    }
  }, [isGuest, user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const cleanedUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    if (cleanedUpdates.startDate === '' || cleanedUpdates.startDate === undefined) {
      delete cleanedUpdates.startDate;
    }
    if (cleanedUpdates.expiresDate === '' || cleanedUpdates.expiresDate === undefined) {
      delete cleanedUpdates.expiresDate;
    }
    
    if (isGuest) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...cleanedUpdates } : t));
    } else if (user) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', id);
      await updateDoc(ref, cleanedUpdates);
    }
  }, [isGuest, user]);

  const deleteTask = useCallback(async (id: string) => {
    if (isGuest) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else if (user) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', id);
      await deleteDoc(ref);
    }
  }, [isGuest, user]);

  const clearArchivedTasks = useCallback(async () => {
    if (isGuest) {
      setTasks(prev => prev.filter(t => !t.archived));
    } else if (user) {
      const toDelete = tasks.filter(t => t.archived);
      for (const item of toDelete) {
        const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', item.id);
        await deleteDoc(ref);
      }
    }
  }, [isGuest, user, tasks]);

  const archiveTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const validRecurrences = ['Every Week', 'Every 1 Month', 'Every 3 Months', 'Every 6 Months', 'Every 1 Year', 'Every 2 Years'];
    if (task.recurrence && validRecurrences.includes(task.recurrence)) {
      // Check if task has an expiresDate and has already reached or passed it
      if (task.expiresDate && task.date >= task.expiresDate) {
        // Expiration date reached: do NOT regenerate another cycle
        await updateTask(id, { archived: true, archivedAt: new Date().toISOString() });
        return;
      }

      // Roll original forward
      const dateParts = task.date.split('-');
      let dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Also calculate new start date if task had one
      let newStartDateStr: string | undefined = undefined;
      let startDateObj: Date | null = null;
      if (task.startDate) {
        const startParts = task.startDate.split('-');
        startDateObj = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
      }

      // Keep rolling forward until it is no longer overdue
      do {
        if (task.recurrence === 'Every Week') dateObj.setDate(dateObj.getDate() + 7);
        else if (task.recurrence === 'Every 1 Month') dateObj.setMonth(dateObj.getMonth() + 1);
        else if (task.recurrence === 'Every 3 Months') dateObj.setMonth(dateObj.getMonth() + 3);
        else if (task.recurrence === 'Every 6 Months') dateObj.setMonth(dateObj.getMonth() + 6);
        else if (task.recurrence === 'Every 1 Year') dateObj.setFullYear(dateObj.getFullYear() + 1);
        else if (task.recurrence === 'Every 2 Years') dateObj.setFullYear(dateObj.getFullYear() + 2);
        else break;
      } while (dateObj < now);
      
      const newDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      // If the next calculated date exceeds expiresDate, the task expires and must not regenerate
      if (task.expiresDate && newDateStr > task.expiresDate) {
        await updateTask(id, { archived: true, archivedAt: new Date().toISOString() });
        return;
      }
      
      // 1. Add clone of completed cycle to archive
      const { id: _oldId, ...cloneData } = task;
      const cloneRecord: any = { 
        ...cloneData, 
        archived: true, 
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Strip any undefined fields to prevent Firestore addDoc errors
      Object.keys(cloneRecord).forEach(key => {
        if (cloneRecord[key] === undefined) delete cloneRecord[key];
      });

      if (isGuest) {
        setTasks(prev => [...prev, { ...cloneRecord, id: crypto.randomUUID() } as Task]);
      } else if (user) {
        const ref = collection(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items');
        await addDoc(ref, cloneRecord);
      }

      // 2. Roll original task forward
      await updateTask(id, { 
        date: newDateStr, 
        updatedAt: new Date().toISOString() 
      });
    } else {
      await updateTask(id, { archived: true, archivedAt: new Date().toISOString() });
    }
  }, [tasks, updateTask, isGuest, user]);

  const unarchiveTask = useCallback(async (id: string) => {
    await updateTask(id, { archived: false });
  }, [updateTask]);

  const saveWebhook = useCallback(async (url: string, targetEmail?: string, secret?: string) => {
    if (isGuest) {
      return;
    }
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
      version: '2.9.7',
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
        // Legacy backup format (array of tasks)
        rawTasks = rawInput;
      } else if (rawInput && typeof rawInput === 'object') {
        if (Array.isArray(rawInput.tasks)) {
          rawTasks = rawInput.tasks;
        }
        if (Array.isArray(rawInput.categories)) {
          rawCategories = rawInput.categories;
        }
      } else {
        throw new Error("Invalid backup format. Expected a JSON backup file or tasks array.");
      }

      if (rawTasks.length === 0 && rawCategories.length === 0) {
        throw new Error("No tasks or categories found in the provided backup file.");
      }

      // Sanitize tasks
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

      // Sanitize categories
      let sanitizedCategories: CategoryDef[] = [];
      if (rawCategories.length > 0) {
        sanitizedCategories = rawCategories.map((c: any) => ({
          id: c.id || crypto.randomUUID(),
          name: String(c.name || 'Custom'),
          color: String(c.color || 'bg-slate-500/20 text-slate-300 border-slate-500/30'),
          icon: String(c.icon || '📁')
        }));
      }

      if (isGuest) {
        let finalTasks = sanitizedTasks;
        if (mode === 'merge') {
          const existingIds = new Set(tasks.map(t => t.id));
          const newTasks = sanitizedTasks.filter(t => !existingIds.has(t.id));
          finalTasks = [...tasks, ...newTasks];
        }
        setTasks(finalTasks);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalTasks));

        if (sanitizedCategories.length > 0) {
          let finalCategories = sanitizedCategories;
          if (mode === 'merge') {
            const existingCatIds = new Set(categories.map(c => c.id));
            const newCats = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
            finalCategories = [...categories, ...newCats];
          }
          setCategories(finalCategories);
          localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(finalCategories));
        }

        return {
          success: true,
          tasksCount: sanitizedTasks.length,
          categoriesCount: sanitizedCategories.length,
          message: `Successfully imported ${sanitizedTasks.length} task(s)${sanitizedCategories.length ? ` and ${sanitizedCategories.length} categories` : ''} into offline storage.`
        };
      } else if (user) {
        const itemsCol = collection(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items');

        if (mode === 'replace') {
          for (const item of tasks) {
            const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', item.id);
            await deleteDoc(ref);
          }
        }

        for (const task of sanitizedTasks) {
          const { id: _ignoredId, ...taskPayload } = task;
          const cleanedPayload: any = { ...taskPayload };
          Object.keys(cleanedPayload).forEach(key => {
            if (cleanedPayload[key] === undefined) delete cleanedPayload[key];
          });
          await addDoc(itemsCol, cleanedPayload);
        }

        if (sanitizedCategories.length > 0) {
          let finalCats = sanitizedCategories;
          if (mode === 'merge') {
            const existingCatIds = new Set(categories.map(c => c.id));
            const newCats = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
            finalCats = [...categories, ...newCats];
          }
          await saveCategories(finalCats);
        }

        return {
          success: true,
          tasksCount: sanitizedTasks.length,
          categoriesCount: sanitizedCategories.length,
          message: `Successfully uploaded ${sanitizedTasks.length} task(s) to your cloud account.`
        };
      }

      return { success: false, tasksCount: 0, categoriesCount: 0, message: "Storage session unavailable." };
    } catch (err: any) {
      console.error("Backup import error:", err);
      return {
        success: false,
        tasksCount: 0,
        categoriesCount: 0,
        message: err.message || "Failed to parse and import backup file."
      };
    }
  }, [isGuest, user, tasks, categories, saveCategories]);

  return (
    <AppContext.Provider value={{
      user, isGuest, tasks, categories, webhook, triggeredLogs, setTriggeredLogs, loading,
      searchQuery, setSearchQuery,
      loginAsGuest, logout, addTask, updateTask, deleteTask, clearArchivedTasks, archiveTask, unarchiveTask, saveWebhook, saveCategories, updateTelemetry,
      exportBackupJSON, downloadBackupFile, importBackupData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
