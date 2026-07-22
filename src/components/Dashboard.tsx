import React, { useState } from 'react';
import Header from './Header';
import BoardColumns from './BoardColumns';
import TaskModal from './TaskModal';
import ArchiveModal from './ArchiveModal';
import SettingsModal from './SettingsModal';
import CategoriesModal from './CategoriesModal';
import IntegrationPanel from './IntegrationPanel';
import StatsRow from './StatsRow';
import { useAppContext } from '../context/AppContext';
import { Bell } from 'lucide-react';
import { resolveIcon } from '../utils';

export default function Dashboard() {
  const { categories, webhook } = useAppContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [taskIdToEdit, setTaskIdToEdit] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleOpenTaskModal = (id?: string) => {
    setTaskIdToEdit(id || null);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskIdToEdit(null);
  };

  const handleSimulateAlarm = async () => {
    setIsSimulating(true);
    // Mock simulation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSimulating(false);
    
    if (webhook?.url) {
      alert(`Simulation payload dispatched to target email/webhook: ${webhook.url}`);
    } else {
      alert(`Simulation completed. No target email or webhook is configured in Settings.`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onOpenTaskModal={() => handleOpenTaskModal()} 
        onOpenArchive={() => setIsArchiveModalOpen(true)} 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <StatsRow categoryFilter={activeCategoryFilter} />
        
        {/* Category Filters & Simulate Button */}
        <div className="glass-panel p-2 rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-700/50 overflow-hidden">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
              <button 
                 onClick={() => setActiveCategoryFilter('All')}
                 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategoryFilter(cat.id)}
                   className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeCategoryFilter === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                 >
                   <span>{resolveIcon(cat.icon)}</span> {cat.name}
                 </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleSimulateAlarm}
            disabled={isSimulating}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap shrink-0 transition-all disabled:opacity-70 border border-amber-400"
          >
            <Bell className={`w-4 h-4 ${isSimulating ? 'animate-ping' : ''}`} />
            <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate Daily Alarm Check'}</span>
            <span className="sm:hidden">{isSimulating ? 'Simulating...' : 'Simulate Alarm'}</span>
          </button>
        </div>

        <BoardColumns onEditTask={handleOpenTaskModal} categoryFilter={activeCategoryFilter} />
        
        <IntegrationPanel />
      </main>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={handleCloseTaskModal} 
        taskIdToEdit={taskIdToEdit} 
      />
      
      <ArchiveModal 
        isOpen={isArchiveModalOpen} 
        onClose={() => setIsArchiveModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </div>
  );
}
