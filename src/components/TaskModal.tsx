import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskIdToEdit: string | null;
}

export default function TaskModal({ isOpen, onClose, taskIdToEdit }: TaskModalProps) {
  const { tasks, categories, addTask, updateTask } = useAppContext();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState('Does not repeat');
  const [alerts, setAlerts] = useState({ thirtyDays: false, sevenDays: true, oneDay: true });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (taskIdToEdit) {
        const task = tasks.find(t => t.id === taskIdToEdit);
        if (task) {
          setName(task.name);
          
          let matchedCatId = task.category;
          const exactMatch = categories.find(c => c.id === task.category);
          if (!exactMatch) {
            const fuzzyMatch = categories.find(c => c.name.toLowerCase() === task.category?.toLowerCase() || c.id.toLowerCase() === task.category?.toLowerCase());
            if (fuzzyMatch) matchedCatId = fuzzyMatch.id;
          }

          setCategory(matchedCatId || (categories[0]?.id || 'Personal'));
          setDate(task.date);
          setNotes(task.notes || '');
          setRecurrence(task.recurrence || 'Does not repeat');
          if (task.alerts) {
            setAlerts(task.alerts);
          } else {
            setAlerts({ thirtyDays: false, sevenDays: true, oneDay: true });
          }
        }
      } else {
        setName('');
        setCategory(categories[0]?.id || 'Personal');
        setDate('');
        setNotes('');
        setRecurrence('Does not repeat');
        setAlerts({ thirtyDays: false, sevenDays: true, oneDay: true });
      }
      setError('');
    }
  }, [isOpen, taskIdToEdit, tasks, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Date structural mismatch (YYYY-MM-DD template required).");
      return;
    }
    setError('');

    try {
      if (taskIdToEdit) {
        await updateTask(taskIdToEdit, { name: trimmedName, date, category, notes: notes.trim(), recurrence, alerts });
      } else {
        await addTask({ name: trimmedName, date, category, notes: notes.trim(), recurrence, alerts });
      }
      onClose();
    } catch (err: any) {
      console.error("Save failure logs:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-bold text-white">{taskIdToEdit ? 'Edit Tracked Item' : 'Track New Item'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Item / Task Name <span className="text-red-400">*</span></label>
            <input 
              type="text" 
              required 
              minLength={2} 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" 
              placeholder="e.g., Driver's License" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category <span className="text-red-400">*</span></label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Expiry Date <span className="text-red-400">*</span></label>
              <input 
                type="date" 
                required 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none [color-scheme:dark]" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Does this repeat / recur?</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none mb-1"
            >
              <option value="Does not repeat">Does not repeat</option>
              <option value="Every Week">Every Week</option>
              <option value="Every 1 Month">Every 1 Month</option>
              <option value="Every 3 Months">Every 3 Months</option>
              <option value="Every 6 Months">Every 6 Months</option>
              <option value="Every 1 Year">Every 1 Year</option>
              <option value="Every 2 Years">Every 2 Years</option>
            </select>
            <p className="text-xs text-slate-500">Once complete, document archives into history.</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-white mb-2">When should we email you alerts?</label>
            <div className="flex items-center gap-6 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input 
                  type="checkbox" 
                  checked={alerts.thirtyDays} 
                  onChange={e => setAlerts(prev => ({ ...prev, thirtyDays: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" 
                />
                30d out
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input 
                  type="checkbox" 
                  checked={alerts.sevenDays} 
                  onChange={e => setAlerts(prev => ({ ...prev, sevenDays: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" 
                />
                7d out
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input 
                  type="checkbox" 
                  checked={alerts.oneDay} 
                  onChange={e => setAlerts(prev => ({ ...prev, oneDay: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" 
                />
                1 day or less
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Details / Notes</label>
            <textarea 
              rows={2} 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none" 
              placeholder="Details..."
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
