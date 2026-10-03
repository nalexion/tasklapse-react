import React, { useState } from 'react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContext';
import { resolveIcon, calculateDaysFromToday, isFutureDate } from '../utils';
import { Clock, Check, Edit3, Trash2, Repeat } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  daysLeft: number;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function TaskCard({ task, daysLeft, onEdit, onArchive }: TaskCardProps) {
  const { categories, deleteTask } = useAppContext();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  let categoryDef = categories.find(c => c.id === task.category);
  
  if (!categoryDef) {
    categoryDef = categories.find(c => 
      c.name.toLowerCase() === task.category?.toLowerCase() || 
      c.id.toLowerCase() === task.category?.toLowerCase()
    );
  }

  const categoryColor = categoryDef?.color || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  const categoryName = categoryDef?.name || task.category || 'Personal';
  const categoryIcon = categoryDef?.icon || '⚪';

  const isFutureStart = isFutureDate(task.date);

  let urgencyClass = 'bg-slate-800/80 border-slate-700/80';
  let badgeClass = 'bg-slate-900/60 text-slate-300 border-slate-700/60';
  let statusBadgeText = '';

  if (task.expiresDate) {
    const expDays = calculateDaysFromToday(task.expiresDate);
    if (expDays < 0) {
      urgencyClass = 'bg-red-950/20 border-red-500/50 hover:border-red-400';
      badgeClass = 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
      statusBadgeText = `Expired (${Math.abs(expDays)}d ago)`;
    } else if (expDays === 0) {
      urgencyClass = 'bg-rose-950/30 border-rose-500/60 hover:border-rose-400 animate-pulse';
      badgeClass = 'bg-rose-500/30 text-rose-300 border-rose-500/50 font-bold';
      statusBadgeText = 'Expires Today';
    } else if (expDays <= 1) {
      urgencyClass = 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400';
      badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold';
      statusBadgeText = '1d left (Tomorrow)';
    } else if (expDays <= 7) {
      urgencyClass = 'bg-slate-800/90 border-amber-500/40 hover:border-amber-400';
      badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold';
      statusBadgeText = `${expDays}d left`;
    } else {
      urgencyClass = 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600';
      badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium';
      statusBadgeText = `${expDays}d left`;
    }
  } else if (isFutureStart) {
    urgencyClass = 'bg-slate-800/90 border-sky-500/40 hover:border-sky-400 shadow-sm shadow-sky-500/5';
    badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold';
    statusBadgeText = `Starts in ${daysLeft}d`;
  } else if (daysLeft < 0) {
    urgencyClass = 'bg-red-950/20 border-red-500/50 hover:border-red-400';
    badgeClass = 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
    statusBadgeText = `Active (${Math.abs(daysLeft)}d ago)`;
  } else if (daysLeft === 0) {
    urgencyClass = 'bg-rose-950/30 border-rose-500/60 hover:border-rose-400';
    badgeClass = 'bg-rose-500/30 text-rose-300 border-rose-500/50 font-bold';
    statusBadgeText = 'Starts Today';
  } else if (daysLeft <= 7) {
    urgencyClass = 'bg-slate-800/90 border-amber-500/40 hover:border-amber-400';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold';
    statusBadgeText = `${daysLeft}d left`;
  } else {
    urgencyClass = 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600';
    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium';
    statusBadgeText = `${daysLeft}d left`;
  }

  const hasRecurrence = Boolean(task.recurrence && task.recurrence !== 'Does not repeat');
  const hasExpiresDate = Boolean(task.expiresDate);

  return (
    <div className={`${urgencyClass} border rounded-xl p-3.5 sm:p-4 transition-all hover:shadow-lg group relative flex flex-col justify-between`}>
      <div>
        {/* Top Badges: Category & Status */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 ${categoryColor} font-medium max-w-[150px] truncate`}>
            <span>{resolveIcon(categoryIcon)}</span>
            <span className="truncate">{categoryName}</span>
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded border ${badgeClass} shrink-0 whitespace-nowrap`}>
            {statusBadgeText}
          </span>
        </div>

        {/* Task Name */}
        <h4 className="font-bold text-white text-sm sm:text-base mb-2 line-clamp-2 leading-snug" title={task.name}>
          {task.name}
        </h4>

        {/* Recurrence & Expires details box - Target Start Date removed as requested */}
        {(hasRecurrence || hasExpiresDate) && (
          <div className="space-y-1.5 mb-2.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 text-xs">
            {hasRecurrence && (
              <div className="flex items-center justify-between text-indigo-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recurs:</span>
                </span>
                <span className="font-medium text-slate-200">{task.recurrence}</span>
              </div>
            )}
            {hasExpiresDate && (
              <div className={`flex items-center justify-between text-amber-300 ${hasRecurrence ? 'pt-1 border-t border-slate-800/70' : ''}`}>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires:</span>
                </span>
                <span className="font-mono text-amber-300">{task.expiresDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {task.notes ? (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {task.notes}
          </p>
        ) : (
          <p className="text-xs text-slate-600 italic mb-3">
            No notes added
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-1.5 justify-end pt-2 border-t border-slate-800/80 opacity-100 lg:opacity-90 lg:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(task.id)} 
          className="text-xs px-2.5 py-1 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1"
          title="Edit Item"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit</span>
        </button>
        
        <button 
          onClick={() => {
            if (isConfirmingDelete) {
              deleteTask(task.id);
            } else {
              setIsConfirmingDelete(true);
              setTimeout(() => setIsConfirmingDelete(false), 3000);
            }
          }} 
          className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
            isConfirmingDelete 
              ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 font-bold' 
              : 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border-rose-800/40'
          }`}
          title={isConfirmingDelete ? 'Click to confirm deletion' : 'Delete item'}
        >
          <Trash2 className="w-3 h-3" />
          <span>{isConfirmingDelete ? 'Confirm?' : 'Delete'}</span>
        </button>
        
        <button 
          onClick={() => onArchive(task.id)} 
          className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20 font-medium"
          title="Complete / Check Off"
        >
          <Check className="w-3 h-3" />
          <span>Check Off</span>
        </button>
      </div>
    </div>
  );
}
