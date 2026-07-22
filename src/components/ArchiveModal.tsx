import React, { useState, useMemo } from 'react';
import { Archive, X, RotateCcw, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveModal({ isOpen, onClose }: ArchiveModalProps) {
  const { tasks, categories, unarchiveTask, deleteTask } = useAppContext();
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilterCat, setArchiveFilterCat] = useState('All');

  const archivedTasks = useMemo(() => {
    let archived = tasks.filter(t => t.archived);
    if (archiveSearch) {
      const lowerSearch = archiveSearch.toLowerCase();
      archived = archived.filter(t => t.name.toLowerCase().includes(lowerSearch));
    }
    if (archiveFilterCat !== 'All') {
      archived = archived.filter(t => t.category === archiveFilterCat);
    }
    return archived.sort((a, b) => {
      const timeB = b.archivedAt ? new Date(b.archivedAt).getTime() : new Date(b.date).getTime();
      const timeA = a.archivedAt ? new Date(a.archivedAt).getTime() : new Date(a.date).getTime();
      return timeB - timeA;
    });
  }, [tasks, archiveSearch, archiveFilterCat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5" /> Completed History
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex gap-3">
          <input 
            type="text" 
            placeholder="Search archives..." 
            value={archiveSearch}
            onChange={e => setArchiveSearch(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" 
          />
          <select 
            value={archiveFilterCat}
            onChange={e => setArchiveFilterCat(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {archivedTasks.length > 0 ? (
            archivedTasks.map(t => (
              <div key={t.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center hover:bg-slate-800 transition-colors">
                <div>
                  <h4 className="font-medium line-through text-slate-400">{t.name}</h4>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-slate-500">Due: {t.date}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-indigo-400">
                      {(() => {
                        let cat = categories.find(c => c.id === t.category);
                        if (!cat) {
                          cat = categories.find(c => c.name.toLowerCase() === t.category?.toLowerCase() || c.id.toLowerCase() === t.category?.toLowerCase());
                        }
                        return cat?.name || t.category || 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => unarchiveTask(t.id)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" title="Restore">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => window.confirm('Permanently drop this log item?') && deleteTask(t.id)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" title="Delete Permanently">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No completed items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
