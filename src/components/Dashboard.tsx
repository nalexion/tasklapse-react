import React, { useState, useRef } from 'react';
import Header from './Header';
import BoardColumns from './BoardColumns';
import TaskModal from './TaskModal';
import ArchiveModal from './ArchiveModal';
import SettingsModal from './SettingsModal';
import CategoriesModal from './CategoriesModal';
import AboutModal from './AboutModal';
import IntegrationPanel from './IntegrationPanel';
import StatsRow from './StatsRow';
import { useAppContext } from '../context/AppContext';
import { resolveIcon, getTaskDaysLeft, isFutureDate, APP_VERSION } from '../utils';
import { TriggeredAlertLog } from '../types';
import { HelpCircle, Download, CheckCircle, AlertTriangle, Info, X, Settings } from 'lucide-react';

interface SimulationBannerState {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  showSettingsAction?: boolean;
}

export default function Dashboard() {
  const { tasks, categories, webhook, updateTelemetry, isGuest, setTriggeredLogs, downloadBackupFile } = useAppContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [taskIdToEdit, setTaskIdToEdit] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationBanner, setSimulationBanner] = useState<SimulationBannerState | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const showSimulationBanner = (banner: SimulationBannerState) => {
    setSimulationBanner(banner);
  };

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
    setSimulationBanner(null);
    // Simulation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSimulating(false);

    let activeTriggers = 0;
    const triggeredItems: TriggeredAlertLog[] = [];
    
    tasks.filter(t => !t.archived).forEach(task => {
      // Items that have a Target Start Date in the future have not started yet;
      // skip them so they don't trigger premature expiration warnings!
      if (isFutureDate(task.date)) {
        return;
      }

      // If task has an Expires Date, alarms trigger based on Expires Date; otherwise based on task.date
      const daysLeft = getTaskDaysLeft(task);
      let isTriggered = false;
      
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
          startDate: task.date,
          expiresDate: task.expiresDate || null,
          notes: task.notes || "",
          category: task.category || "Personal"
        });
      }
    });

    if (activeTriggers === 0) {
      setTriggeredLogs([]);
      showSimulationBanner({
        type: 'info',
        title: 'Alarm System Check Complete',
        message: 'All active items are in healthy condition. No notification webhooks triggered today.'
      });
    } else {
      setTriggeredLogs(triggeredItems);
      if (webhook?.url) {
        try {
          let successCount = 0;
          let lastStatus = 200;
          
          for (const item of triggeredItems) {
            const payload = { 
              event: "tasklapse_alerts", 
              item: item.item,
              daysRemaining: item.daysRemaining,
              targetStartDate: item.startDate,
              expiresDate: item.expiresDate,
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
            showSimulationBanner({
              type: 'success',
              title: 'Simulation Payload Dispatched',
              message: `Delivered ${activeTriggers} alert notification(s) to webhook endpoint (${webhook.url}).`
            });
          } else if (successCount > 0) {
            updateTelemetry("Partial Delivery");
            showSimulationBanner({
              type: 'warning',
              title: 'Simulation Partially Delivered',
              message: `${successCount} of ${activeTriggers} alert payloads were delivered to ${webhook.url}.`
            });
          } else {
            updateTelemetry("Delivery Failed");
            showSimulationBanner({
              type: 'error',
              title: 'Webhook Delivery Failed',
              message: `Target webhook responded with HTTP ${lastStatus}. Check your endpoint configuration.`
            });
          }
        } catch {
          updateTelemetry("Delivery Error");
          showSimulationBanner({
            type: 'error',
            title: 'Network Dispatch Error',
            message: 'Failed to dispatch simulation payload due to a network or CORS error.'
          });
        }
      } else {
        showSimulationBanner({
          type: 'warning',
          title: `Simulation Matched ${activeTriggers} Item(s)`,
          message: 'Alert logs were generated below, but no target webhook URL is configured in Settings.',
          showSettingsAction: true
        });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      <Header 
        onOpenTaskModal={() => handleOpenTaskModal()} 
        onOpenArchive={() => setIsArchiveModalOpen(true)} 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onSimulateAlarm={handleSimulateAlarm}
        isSimulating={isSimulating}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {simulationBanner && (
          <div className={`mb-5 p-3.5 sm:p-4 rounded-xl border flex items-start justify-between gap-3 shadow-lg transition-all ${
            simulationBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : simulationBanner.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : simulationBanner.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
          }`}>
            <div className="flex items-start gap-3 min-w-0">
              {simulationBanner.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {simulationBanner.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {simulationBanner.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {simulationBanner.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
              <div className="text-xs sm:text-sm space-y-0.5">
                <div className="font-bold text-white">{simulationBanner.title}</div>
                <p className="text-slate-300 leading-relaxed">{simulationBanner.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {simulationBanner.showSettingsAction && (
                <button
                  type="button"
                  onClick={() => {
                    setSimulationBanner(null);
                    setIsSettingsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSimulationBanner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <StatsRow 
          categoryFilter={activeCategoryFilter} 
          onOpenTaskModal={() => handleOpenTaskModal()} 
        />
        
        {/* Category Filters Bar */}
        <div className="glass-panel p-2 rounded-xl mb-6 flex items-center justify-between gap-2 border-slate-700/50">
          <div className="flex-1 overflow-hidden">
            <div 
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide cursor-grab active:cursor-grabbing touch-pan-x" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
              
              <button 
                 onClick={(e) => handleCategoryClick('All', e)}
                 className={`shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                   activeCategoryFilter === 'All' 
                     ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                     : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                 }`}
              >
                All Categories
              </button>

              {categories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={(e) => handleCategoryClick(cat.id, e)}
                   className={`shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                     activeCategoryFilter === cat.id 
                       ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                       : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                   }`}
                 >
                   <span>{resolveIcon(cat.icon)}</span>
                   <span>{cat.name}</span>
                 </button>
              ))}
            </div>
          </div>
        </div>

        <BoardColumns onEditTask={handleOpenTaskModal} categoryFilter={activeCategoryFilter} />
        
        <IntegrationPanel />

        {/* Global Footer with Support Link & Quick Backup Action */}
        <footer className="mt-12 pt-6 pb-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">TaskLapse v{APP_VERSION}</span>
            <span>•</span>
            <button 
              onClick={() => setIsAboutModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>About & Support (support@tasklapse.app)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadBackupFile}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors hover:underline"
              title="Download offline JSON copy of your tasks"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Offline JSON Backup</span>
            </button>
          </div>
        </footer>
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
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />
    </div>
  );
}
