import React, { useState, useMemo } from 'react';
import { Archive, X, Trash2, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { resolveIcon } from '../utils';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveModal({ isOpen, onClose }: ArchiveModalProps) {
  const { tasks, categories, deleteTask } = useAppContext();
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
      <div className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">
              <Archive className="w-5 h-5" />
            </div>
            Completed History & Archives
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-5 pb-5 border-b border-slate-700 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search archive logs by title..." 
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-sm rounded-lg pl-9 pr-3 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" 
            />
          </div>
          <select 
            value={archiveFilterCat}
            onChange={e => setArchiveFilterCat(e.target.value)}
            className="w-48 bg-slate-900/50 border border-slate-700 text-sm rounded-lg px-3 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-900/20">
          {archivedTasks.length > 0 ? (
            archivedTasks.map(t => {
              let cat = categories.find(c => c.id === t.category);
              if (!cat) {
                cat = categories.find(c => c.name.toLowerCase() === t.category?.toLowerCase() || c.id.toLowerCase() === t.category?.toLowerCase());
              }
              const catName = cat?.name || t.category || 'N/A';
              const catColor = cat?.color || 'bg-slate-800 text-slate-300 border-slate-700/50';
              const catIcon = cat?.icon || '📁';

              return (
                <div key={t.id} className="bg-slate-800/20 border border-slate-700/60 p-4 rounded-xl flex justify-between items-start hover:bg-slate-800/40 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2.5">
                      <span className={`text-[11px] px-2 py-1 rounded font-medium border flex items-center gap-1.5 ${catColor}`}>
                        <span>{resolveIcon(catIcon)}</span>
                        {catName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Original Expiry: {t.date}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold line-through text-slate-300 mb-1">{t.name}</h4>
                    <p className={`text-sm ${t.notes ? 'text-slate-400' : 'text-slate-600 italic'}`}>
                      {t.notes || 'No notes'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between ml-4 shrink-0 h-full gap-4">
                    <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-400 font-mono">
                      Archived: {t.archivedAt ? t.archivedAt.split('T')[0] : t.date}
                    </div>
                    <button 
                      onClick={() => window.confirm('Permanently drop this log item?') && deleteTask(t.id)} 
                      className="text-[11px] text-rose-500 hover:text-rose-400 font-semibold transition-colors mt-2"
                    >
                      Delete Record
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-12">No completed items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
