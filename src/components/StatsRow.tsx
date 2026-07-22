import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface StatsRowProps {
  categoryFilter?: string;
}

export default function StatsRow({ categoryFilter }: StatsRowProps) {
  const { tasks, searchQuery } = useAppContext();

  const calculateDaysLeft = (dateString: string) => {
    if (!dateString) return 0;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const now = new Date();
      due.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    const due = new Date(dateString);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      const dl = calculateDaysLeft(t.date);
      if (dl <= 14) res.days++;
      else if (dl <= 45) res.weeks++;
      else res.months++;
    });
    return res;
  }, [activeTasks]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-center border-slate-700/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Total Tracked</p>
            <p className="text-3xl font-bold text-white leading-none">{activeTasks.length}</p>
          </div>
        </div>
      </div>
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-center border-rose-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Due in Days</p>
            <p className="text-3xl font-bold text-rose-400 leading-none">{days}</p>
          </div>
        </div>
      </div>
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-center border-amber-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Due in Weeks</p>
            <p className="text-3xl font-bold text-amber-400 leading-none">{weeks}</p>
          </div>
        </div>
      </div>
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-center border-emerald-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Due in Months</p>
            <p className="text-3xl font-bold text-emerald-400 leading-none">{months}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
