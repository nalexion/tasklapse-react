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
        }
      } else {
        setName('');
        setCategory(categories[0]?.id || 'Personal');
        setDate('');
        setNotes('');
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
        await updateTask(taskIdToEdit, { name: trimmedName, date, category, notes: notes.trim() });
      } else {
        await addTask({ name: trimmedName, date, category, notes: notes.trim() });
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Item Name</label>
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Expiration / Due Date</label>
            <input 
              type="date" 
              required 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none [color-scheme:dark]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes (Optional)</label>
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
