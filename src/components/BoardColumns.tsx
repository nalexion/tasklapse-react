import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import TaskCard from './TaskCard';
import { Task } from '../types';
import { calculateDaysFromToday, isFutureDate } from '../utils';

interface BoardColumnsProps {
  onEditTask: (id: string) => void;
  categoryFilter?: string;
}

export default function BoardColumns({ onEditTask, categoryFilter }: BoardColumnsProps) {
  const { tasks, searchQuery, archiveTask } = useAppContext();

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
    return active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, searchQuery, categoryFilter]);

  const { days, weeks, months } = useMemo(() => {
    const res = { days: [] as Task[], weeks: [] as Task[], months: [] as Task[] };
    activeTasks.forEach(t => {
      const dl = getDaysLeft(t);
      if (dl <= 7) {
        res.days.push(t);
      } else if (dl <= 31) {
        res.weeks.push(t);
      } else {
        res.months.push(t);
      }
    });
    return res;
  }, [activeTasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start mt-6">
      {/* Days Column */}
      <div className="glass-panel rounded-xl flex flex-col h-full min-h-[420px] sm:min-h-[500px] border border-slate-700/60 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/40 rounded-t-xl">
          <h3 className="font-bold text-rose-400 text-sm sm:text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> DUE IN DAYS
          </h3>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-medium">
            {days.length} {days.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          {days.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl min-h-[300px] text-slate-500 text-center">
              <span className="text-sm font-medium">No urgent items due in days</span>
              <p className="text-xs text-slate-600 mt-1">Items due within 7 days appear here</p>
            </div>
          ) : (
            days.map(t => (
              <TaskCard 
                key={t.id} 
                task={t} 
                daysLeft={getDaysLeft(t)} 
                onEdit={onEditTask} 
                onArchive={archiveTask} 
              />
            ))
          )}
        </div>
      </div>

      {/* Weeks Column */}
      <div className="glass-panel rounded-xl flex flex-col h-full min-h-[420px] sm:min-h-[500px] border border-slate-700/60 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/40 rounded-t-xl">
          <h3 className="font-bold text-amber-400 text-sm sm:text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> DUE IN WEEKS
          </h3>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-medium">
            {weeks.length} {weeks.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          {weeks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl min-h-[300px] text-slate-500 text-center">
              <span className="text-sm font-medium">No items due in weeks</span>
              <p className="text-xs text-slate-600 mt-1">Items due between 8 and 31 days appear here</p>
            </div>
          ) : (
            weeks.map(t => (
              <TaskCard 
                key={t.id} 
                task={t} 
                daysLeft={getDaysLeft(t)} 
                onEdit={onEditTask} 
                onArchive={archiveTask} 
              />
            ))
          )}
        </div>
      </div>

      {/* Months Column */}
      <div className="glass-panel rounded-xl flex flex-col h-full min-h-[420px] sm:min-h-[500px] border border-slate-700/60 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/40 rounded-t-xl">
          <h3 className="font-bold text-emerald-400 text-sm sm:text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> DUE IN MONTHS
          </h3>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-medium">
            {months.length} {months.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          {months.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl min-h-[300px] text-slate-500 text-center">
              <span className="text-sm font-medium">No items due in months</span>
              <p className="text-xs text-slate-600 mt-1">Long-term and future scheduled items appear here</p>
            </div>
          ) : (
            months.map(t => (
              <TaskCard 
                key={t.id} 
                task={t} 
                daysLeft={getDaysLeft(t)} 
                onEdit={onEditTask} 
                onArchive={archiveTask} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
