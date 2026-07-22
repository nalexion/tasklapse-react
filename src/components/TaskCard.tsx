import React from 'react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContext';
import { resolveIcon } from '../utils';

interface TaskCardProps {
  task: Task;
  daysLeft: number | string;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function TaskCard({ task, daysLeft, onEdit, onArchive }: TaskCardProps) {
  const { categories, deleteTask } = useAppContext();
  
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  let categoryDef = categories.find(c => c.id === task.category);
  
  if (!categoryDef) {
    // Fallback: Try to match by name or case-insensitive ID to support legacy or malformed records
    categoryDef = categories.find(c => 
      c.name.toLowerCase() === task.category?.toLowerCase() || 
      c.id.toLowerCase() === task.category?.toLowerCase()
    );
  }

  const categoryColor = categoryDef?.color || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  const categoryName = categoryDef?.name || task.category || 'Personal';
  const categoryIcon = categoryDef?.icon || '⚪';

  let urgencyClass = 'bg-slate-800 border-slate-700';
  let textClass = 'text-slate-300';
  let displayDaysLeft = '';

  const numDaysLeft = typeof daysLeft === 'number' ? daysLeft : parseInt(daysLeft as string, 10);

  if (numDaysLeft < 0) {
    urgencyClass = 'bg-red-900/30 border-red-500/50';
    textClass = 'text-red-400 font-bold';
    displayDaysLeft = `Expired (${Math.abs(numDaysLeft)}d ago)`;
  } else if (numDaysLeft <= 1) {
    urgencyClass = 'bg-rose-900/20 border-rose-500/30';
    textClass = 'text-rose-400 font-bold';
    displayDaysLeft = `${numDaysLeft}d left`;
  } else if (numDaysLeft <= 7) {
    urgencyClass = 'bg-slate-800 border-slate-700';
    textClass = 'text-amber-400';
    displayDaysLeft = `${numDaysLeft}d left`;
  } else if (numDaysLeft <= 31) {
    textClass = 'text-amber-400';
    displayDaysLeft = `${numDaysLeft}d left`;
  } else {
    textClass = 'text-emerald-400';
    displayDaysLeft = `${numDaysLeft}d left`;
  }

  return (
    <div className={`${urgencyClass} border rounded-xl p-4 transition-all hover:border-slate-500 group relative`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${categoryColor} font-medium`}>
          <span>{resolveIcon(categoryIcon)}</span> {categoryName}
        </span>
        <span className={`text-xs ${textClass} bg-slate-900/50 px-2 py-1 rounded`}>
          {displayDaysLeft}
        </span>
      </div>
      <h4 className="font-bold text-white mb-1 truncate" title={task.name}>{task.name}</h4>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
        {task.notes || <i className="text-slate-600">No notes</i>}
      </p>
      <div className="flex gap-2 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(task.id)} 
          className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded"
        >
          Edit
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
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            isConfirmingDelete 
              ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
              : 'bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
          }`}
        >
          {isConfirmingDelete ? 'Confirm?' : 'Delete'}
        </button>
        <button 
          onClick={() => onArchive(task.id)} 
          className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
        >
          Check Off
        </button>
      </div>
    </div>
  );
}
