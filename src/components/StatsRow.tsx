import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, Clock, CheckCircle, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateDaysFromToday, isFutureDate } from '../utils';
import { Task } from '../types';

interface StatsRowProps {
  categoryFilter?: string;
  onOpenTaskModal: () => void;
}

export default function StatsRow({ categoryFilter, onOpenTaskModal }: StatsRowProps) {
  const { tasks, searchQuery } = useAppContext();

  const getDaysLeft = (t: Task): number => {
    if (t.expiresDate) return calculateDaysFromToday(t.expiresDate);
    return calculateDaysFromToday(t.date);
  };

  const activeTasks = useMemo(() => {
    let active = tasks.filter(t => !t.archived);
    if (categoryFilter && categoryFilter !== 'All') {
      active = active.filter(t => t.category === categoryFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      active = active.filter(t => 
        t.name.toLowerCase().includes(lowerQuery) || 
        (t.notes && t.notes.toLowerCase().includes(lowerQuery))
      );
    }
    return active;
  }, [tasks, searchQuery, categoryFilter]);

  const { days, weeks, months } = useMemo(() => {
    const res = { days: 0, weeks: 0, months: 0 };
    activeTasks.forEach(t => {
      const dl = getDaysLeft(t);
      if (dl <= 7) {
        res.days++;
      } else if (dl <= 31) {
        res.weeks++;
      } else {
        res.months++;
      }
    });
    return res;
  }, [activeTasks]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
      {/* Action: Track New */}
      <button 
        onClick={onOpenTaskModal}
        className="col-span-2 sm:col-span-1 glass-panel p-3 sm:p-4 rounded-xl flex items-center justify-between sm:justify-start border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400 transition-all text-left group shadow-lg shadow-indigo-500/5 cursor-pointer"
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 group-hover:scale-110 transition-transform shadow-inner">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-indigo-300/80 font-bold tracking-widest uppercase mb-0.5 truncate">Action</p>
            <p className="text-base sm:text-lg font-bold text-white leading-tight group-hover:text-indigo-200 transition-colors truncate">Track New</p>
          </div>
        </div>
        <span className="sm:hidden text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-medium">
          + Add
        </span>
      </button>

      {/* Total Tracked */}
      <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-col justify-center border-slate-700/50 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5 truncate">Total Tracked</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-none">{activeTasks.length}</p>
          </div>
        </div>
      </div>

      {/* Due in Days */}
      <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-col justify-center border-rose-500/30 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5 truncate">Due in Days</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-400 leading-none">{days}</p>
          </div>
        </div>
      </div>

      {/* Due in Weeks */}
      <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-col justify-center border-amber-500/30 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5 truncate">Due in Weeks</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400 leading-none">{weeks}</p>
          </div>
        </div>
      </div>

      {/* Due in Months */}
      <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-col justify-center border-emerald-500/30 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5 truncate">Due in Months</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 leading-none">{months}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
