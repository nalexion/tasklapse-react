import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task } from '../types';

interface BoardColumnsProps {
  onEditTask: (id: string) => void;
}

export default function BoardColumns({ onEditTask }: BoardColumnsProps) {
  const { tasks, searchQuery, archiveTask } = useAppContext();

  const activeTasks = useMemo(() => {
    let active = tasks.filter(t => !t.archived);
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      active = active.filter(t => 
        t.name.toLowerCase().includes(lowerQuery) || 
        (t.notes && t.notes.toLowerCase().includes(lowerQuery))
      );
    }
    return active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, searchQuery]);

  const calculateDaysLeft = (dateString: string) => {
    const due = new Date(dateString);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const { days, weeks, months } = useMemo(() => {
    const res = { days: [] as Task[], weeks: [] as Task[], months: [] as Task[] };
    activeTasks.forEach(t => {
      const dl = calculateDaysLeft(t.date);
      if (dl <= 14) res.days.push(t);
      else if (dl <= 45) res.weeks.push(t);
      else res.months.push(t);
    });
    return res;
  }, [activeTasks]);

  return (
    <>
      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Total Tracked</p>
            <p className="text-2xl font-bold text-white">{activeTasks.length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-rose-500/30">
          <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Due in Days</p>
            <p className="text-2xl font-bold text-rose-400">{days.length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-amber-500/30">
          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Due in Weeks</p>
            <p className="text-2xl font-bold text-amber-400">{weeks.length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-emerald-500/30">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Due in Months</p>
            <p className="text-2xl font-bold text-emerald-400">{months.length}</p>
          </div>
        </div>
      </div>

      {/* BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Days Column */}
        <div className="glass-panel rounded-xl flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30 rounded-t-xl">
            <h3 className="font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> DUE IN DAYS
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{days.length} Items</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {days.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)}
          </div>
        </div>

        {/* Weeks Column */}
        <div className="glass-panel rounded-xl flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30 rounded-t-xl">
            <h3 className="font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> DUE IN WEEKS
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{weeks.length} Items</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {weeks.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)}
          </div>
        </div>

        {/* Months Column */}
        <div className="glass-panel rounded-xl flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30 rounded-t-xl">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> DUE IN MONTHS
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{months.length} Items</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {months.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)}
          </div>
        </div>
      </div>
    </>
  );
}
