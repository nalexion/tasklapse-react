import React, { useState, useMemo } from 'react';
import { Archive, X, Trash2, Search, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { resolveIcon } from '../utils';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveModal({ isOpen, onClose }: ArchiveModalProps) {
  const { tasks, categories, deleteTask, clearArchivedTasks } = useAppContext();
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilterCat, setArchiveFilterCat] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

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

  const handleDeleteItem = async (id: string) => {
    if (deletingId === id) {
      await deleteTask(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(prev => prev === id ? null : prev);
      }, 3500);
    }
  };

  const handleClearAll = async () => {
    if (isConfirmingClearAll) {
      await clearArchivedTasks();
      setIsConfirmingClearAll(false);
    } else {
      setIsConfirmingClearAll(true);
      setTimeout(() => {
        setIsConfirmingClearAll(false);
      }, 3500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 flex justify-between items-center border-b border-slate-700/60 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Completed History & Archives
              </h3>
              <p className="text-xs text-slate-400">
                {archivedTasks.length} {archivedTasks.length === 1 ? 'archived item' : 'archived items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {archivedTasks.length > 0 && (
              <button
                onClick={handleClearAll}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                  isConfirmingClearAll 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 font-bold' 
                    : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-800/50'
                }`}
                title="Remove all archived records"
              >
                {isConfirmingClearAll ? 'Confirm Clear All?' : 'Clear All Archives'}
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search & Category Filter Row: responsive stacking on mobile */}
        <div className="p-3.5 sm:p-5 border-b border-slate-700/60 flex flex-col sm:flex-row gap-2.5 sm:gap-4 bg-slate-900/40">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search archive logs by title..." 
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 text-xs sm:text-sm rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-500" 
            />
          </div>
          <select 
            value={archiveFilterCat}
            onChange={e => setArchiveFilterCat(e.target.value)}
            className="w-full sm:w-48 bg-slate-900/80 border border-slate-700 text-xs sm:text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Archived Items List */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-900/20">
          {archivedTasks.length > 0 ? (
            archivedTasks.map(t => {
              let cat = categories.find(c => c.id === t.category);
              if (!cat) {
                cat = categories.find(c => c.name.toLowerCase() === t.category?.toLowerCase() || c.id.toLowerCase() === t.category?.toLowerCase());
              }
              const catName = cat?.name || t.category || 'N/A';
              const catColor = cat?.color || 'bg-slate-800 text-slate-300 border-slate-700/50';
              const catIcon = cat?.icon || '📁';
              const isDeletingThis = deletingId === t.id;

              return (
                <div key={t.id} className="bg-slate-800/30 border border-slate-700/60 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-800/50 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-medium border flex items-center gap-1.5 ${catColor}`}>
                        <span>{resolveIcon(catIcon)}</span>
                        {catName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        Target Start: {t.date}
                      </span>
                      {t.expiresDate && (
                        <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Expires: {t.expiresDate}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold line-through text-slate-300 mb-1">{t.name}</h4>
                    <p className={`text-xs sm:text-sm ${t.notes ? 'text-slate-400' : 'text-slate-600 italic'}`}>
                      {t.notes || 'No notes'}
                    </p>
                  </div>

                  {/* Actions & Timestamps */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-400 font-mono">
                      Archived: {t.archivedAt ? t.archivedAt.split('T')[0] : t.date}
                    </span>
                    <button 
                      onClick={() => handleDeleteItem(t.id)} 
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                        isDeletingThis
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 font-bold'
                          : 'bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border-rose-800/40'
                      }`}
                      title={isDeletingThis ? 'Click again to permanently delete' : 'Permanently Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingThis ? 'Confirm Delete?' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-12">
              <Archive className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>No completed items found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
