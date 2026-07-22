import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task } from '../types';

interface BoardColumnsProps {
  onEditTask: (id: string) => void;
  categoryFilter?: string;
}

export default function BoardColumns({ onEditTask, categoryFilter }: BoardColumnsProps) {
  const { tasks, searchQuery, archiveTask } = useAppContext();

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
    return active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, searchQuery, categoryFilter]);

  const calculateDaysLeft = (dateString: string) => {
    if (!dateString) return 0;
    
    // Fix for timezone-shifted dates: parse YYYY-MM-DD manually
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-6">
      {/* Days Column */}
        <div className="glass-panel rounded-xl flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30 rounded-t-xl">
            <h3 className="font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> DUE IN DAYS
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{days.length} Items</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {days.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center m-2 border-2 border-dashed border-slate-700/50 rounded-xl min-h-[400px] text-slate-500">
                <span className="text-sm font-medium">No items due</span>
              </div>
            ) : (
              days.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)
            )}
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
            {weeks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center m-2 border-2 border-dashed border-slate-700/50 rounded-xl min-h-[400px] text-slate-500">
                <span className="text-sm font-medium">No items due</span>
              </div>
            ) : (
              weeks.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)
            )}
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
            {months.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center m-2 border-2 border-dashed border-slate-700/50 rounded-xl min-h-[400px] text-slate-500">
                <span className="text-sm font-medium">No items due</span>
              </div>
            ) : (
              months.map(t => <TaskCard key={t.id} task={t} daysLeft={calculateDaysLeft(t.date)} onEdit={onEditTask} onArchive={archiveTask} />)
            )}
          </div>
        </div>
      </div>
  );
}
