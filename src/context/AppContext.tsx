import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '../config/firebase';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Task, WebhookData, CategoryDef } from '../types';

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'Personal', name: 'Personal', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: 'User' },
  { id: 'Household', name: 'Household', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: 'Home' },
  { id: 'Health', name: 'Health / Medical', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: 'Heart' },
  { id: 'Auto', name: 'Auto / Moto', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: 'Car' },
  { id: 'Subscriptions', name: 'Subscriptions', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: 'Repeat' },
  { id: 'Work', name: 'Work / Business', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: 'Briefcase' }
];

interface AppContextType {
  user: User | null;
  isGuest: boolean;
  tasks: Task[];
  categories: CategoryDef[];
  webhook: WebhookData;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  saveWebhook: (url: string) => Promise<void>;
  saveCategories: (newCategories: CategoryDef[]) => Promise<void>;
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
  const [webhook, setWebhook] = useState<WebhookData>({ url: '', lastStatus: 'None', lastTime: '--' });
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
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
    const newTask: Partial<Task> = {
      ...taskData,
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
    const payload = { ...updates, updatedAt: new Date().toISOString() };
    
    if (isGuest) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
    } else if (user) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', id);
      await updateDoc(ref, payload);
    }
  }, [isGuest, user]);

  const deleteTask = useCallback(async (id: string) => {
    if (isGuest) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: true, archivedAt: new Date().toISOString() } : t));
      // wait, delete task should completely remove it
      setTasks(prev => prev.filter(t => t.id !== id));
    } else if (user) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'items', id);
      await deleteDoc(ref);
    }
  }, [isGuest, user]);

  const archiveTask = useCallback(async (id: string) => {
    await updateTask(id, { archived: true, archivedAt: new Date().toISOString() });
  }, [updateTask]);

  const unarchiveTask = useCallback(async (id: string) => {
    await updateTask(id, { archived: false });
  }, [updateTask]);

  const saveWebhook = useCallback(async (url: string) => {
    if (isGuest) {
      alert("Settings require registration.");
      return;
    }
    if (user) {
      const newWebhook = { url, lastStatus: "Updated", lastTime: new Date().toLocaleString() };
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'webhook');
      await setDoc(ref, newWebhook, { merge: true });
      setWebhook(newWebhook);
    }
  }, [isGuest, user]);

  const saveCategories = useCallback(async (newCategories: CategoryDef[]) => {
    setCategories(newCategories);
    if (user && !isGuest) {
      const ref = doc(db, 'artifacts', DEFAULT_APP_ID, 'users', user.uid, 'settings', 'categories');
      await setDoc(ref, { items: newCategories }, { merge: true });
    }
  }, [isGuest, user]);

  return (
    <AppContext.Provider value={{
      user, isGuest, tasks, categories, webhook, loading,
      searchQuery, setSearchQuery,
      loginAsGuest, logout, addTask, updateTask, deleteTask, archiveTask, unarchiveTask, saveWebhook, saveCategories
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
