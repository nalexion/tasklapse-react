import React, { useState, useRef } from 'react';
import Header from './Header';
import BoardColumns from './BoardColumns';
import TaskModal from './TaskModal';
import ArchiveModal from './ArchiveModal';
import SettingsModal from './SettingsModal';
import CategoriesModal from './CategoriesModal';
import IntegrationPanel from './IntegrationPanel';
import StatsRow from './StatsRow';
import { useAppContext } from '../context/AppContext';
import { Bell, Plus } from 'lucide-react';
import { resolveIcon } from '../utils';

export default function Dashboard() {
  const { tasks, categories, webhook, updateTelemetry, isGuest } = useAppContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [taskIdToEdit, setTaskIdToEdit] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [isSimulating, setIsSimulating] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    setDragMoved(true);
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryClick = (id: string, e: React.MouseEvent) => {
    if (dragMoved) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    setActiveCategoryFilter(id);
  };

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
    
    const calculateDaysLeft = (dateString: string) => {
      const due = new Date(dateString); 
      const now = new Date();
      due.setHours(0, 0, 0, 0); 
      now.setHours(0, 0, 0, 0);
      return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    let activeTriggers = 0;
    const triggeredItems: any[] = [];
    tasks.filter(t => !t.archived).forEach(task => {
      const daysLeft = calculateDaysLeft(task.date);
      let isTriggered = false;
      
      // Default fallback if alerts are missing for backward compatibility
      const alerts = task.alerts || { thirtyDays: false, sevenDays: true, oneDay: true };

      if (daysLeft === 0) {
        isTriggered = true; // Trigger on the exact day of expiry
      } else if (daysLeft === 1 && alerts.oneDay) {
        isTriggered = true;
      } else if (daysLeft === 7 && alerts.sevenDays) {
        isTriggered = true;
      } else if (daysLeft === 30 && alerts.thirtyDays) {
        isTriggered = true;
      }

      if (isTriggered) {
        activeTriggers++;
        triggeredItems.push({
          item: task.name,
          daysRemaining: daysLeft,
          expiryDate: task.date,
          notes: task.notes || "",
          category: task.category || "Personal"
        });
      }
    });

    if (activeTriggers === 0) {
      alert("Alarm System Check\nAll active items are in healthy condition. No notification webhooks triggered today.");
    } else if (webhook?.url) {
      try {
        let successCount = 0;
        let lastStatus = 200;
        
        for (const item of triggeredItems) {
          const payload = { 
            event: "tasklapse_alerts", 
            item: item.item,
            daysRemaining: item.daysRemaining,
            expiryDate: item.expiryDate,
            notes: item.notes,
            category: item.category,
            driverMode: isGuest ? "local_storage" : "cloud_sync",
            user: webhook.targetEmail || "unknown",
            auth_secret: webhook.secret || "none",
            timestamp: new Date().toISOString()
          };
          
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            successCount++;
          } else {
            lastStatus = response.status;
          }
        }

        if (successCount === activeTriggers) {
          updateTelemetry("Success 200");
          alert(`Simulation payload dispatched to target email/webhook: ${webhook.url}\n\n${activeTriggers} items matched alert criteria.`);
        } else if (successCount > 0) {
          updateTelemetry("Partial Delivery");
          alert(`Simulation partially delivered. ${successCount}/${activeTriggers} items sent successfully.`);
        } else {
          updateTelemetry("Delivery Failed");
          alert(`Simulation failed to deliver to target webhook: HTTP ${lastStatus}`);
        }
      } catch (err) {
        updateTelemetry("Delivery Error");
        alert(`Simulation failed to dispatch payload due to a network error.`);
      }
    } else {
      alert(`Simulation completed. No target email or webhook is configured in Settings.\n\n${activeTriggers} items would have triggered an alert.`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onOpenTaskModal={() => handleOpenTaskModal()} 
        onOpenArchive={() => setIsArchiveModalOpen(true)} 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
        onSimulateAlarm={handleSimulateAlarm}
        isSimulating={isSimulating}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <StatsRow categoryFilter={activeCategoryFilter} onOpenTaskModal={() => handleOpenTaskModal()} />
        
        {/* Category Filters & Simulate Button */}
        <div className="glass-panel p-2 rounded-xl mb-6 flex items-center justify-between gap-4 border-slate-700/50">
          <div className="flex-1 overflow-hidden">
            <div 
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide cursor-grab active:cursor-grabbing" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
              <button 
                 onClick={(e) => handleCategoryClick('All', e)}
                 className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={(e) => handleCategoryClick(cat.id, e)}
                   className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeCategoryFilter === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                 >
                   <span>{resolveIcon(cat.icon)}</span> {cat.name}
                 </button>
              ))}
            </div>
          </div>
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
