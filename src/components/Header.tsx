import React, { useState } from 'react';
import { Search, Archive, Settings, LogOut, Tags, Bell, X, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  onOpenTaskModal: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onOpenCategories: () => void;
  onOpenAbout: () => void;
  onSimulateAlarm: () => void;
  isSimulating: boolean;
}

export default function Header({ 
  onOpenArchive, 
  onOpenSettings, 
  onOpenCategories, 
  onOpenAbout,
  onSimulateAlarm, 
  isSimulating 
}: HeaderProps) {
  const { user, isGuest, searchQuery, setSearchQuery, logout } = useAppContext();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const userEmailTag = isGuest 
    ? 'Guest Mode' 
    : (user?.email || 'Cloud Account');
  
  const syncBadgeClass = isGuest
    ? 'text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded-full font-medium shrink-0'
    : 'text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium shrink-0';
  
  const syncBadgeText = isGuest ? 'Local Only' : 'Cloud Synced';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4 overflow-hidden">
        
        {/* Left: Logo & Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
          <img 
            src="/logo.svg" 
            alt="TaskLapse Logo" 
            className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-xl shadow-lg border border-slate-700 shrink-0" 
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide shrink-0">
                TaskLapse
              </h1>
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60 shrink-0">v2.9.9</span>
              {/* Only show wide pill badge on tablet/desktop to avoid mobile overlap */}
              <span className={`hidden md:inline-flex ${syncBadgeClass}`}>{syncBadgeText}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[70px] min-[360px]:max-w-[100px] sm:max-w-[160px] md:max-w-none flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isGuest ? 'bg-slate-400' : 'bg-emerald-400'}`}></span>
              <span className="truncate">{userEmailTag}</span>
            </p>
          </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          
          {/* Desktop Search */}
          <div className="relative hidden lg:block w-40 xl:w-56">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active tasks..." 
              className="w-full bg-slate-800/90 border border-slate-700 text-xs sm:text-sm rounded-lg pl-9 pr-7 py-1.5 sm:py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile/Tablet Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(prev => !prev)}
            className={`lg:hidden w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-lg transition-colors border shrink-0 ${
              isMobileSearchOpen || searchQuery 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' 
                : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
            title="Search items"
            aria-label="Toggle search input"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Simulate Daily Alarm Button */}
          <button 
            onClick={onSimulateAlarm}
            disabled={isSimulating}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 xl:w-auto xl:px-3 xl:py-2 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-lg font-bold transition-colors text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-400 disabled:opacity-70 whitespace-nowrap shrink-0"
            title="Simulate Daily Alarm"
          >
            <Bell className={`w-4 h-4 shrink-0 ${isSimulating ? 'animate-ping' : ''}`} />
            <span className="hidden xl:inline">{isSimulating ? 'Simulating...' : 'Simulate Alarm'}</span>
          </button>
          
          {/* Archives */}
          <button 
            onClick={onOpenArchive} 
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0" 
            title="Completed History & Archives"
          >
            <Archive className="w-4 h-4" />
          </button>
          
          {/* Categories */}
          <button 
            onClick={onOpenCategories} 
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0" 
            title="Manage Categories"
          >
            <Tags className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button 
            onClick={onOpenSettings} 
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0" 
            title="Settings, Webhooks & Offline Backups"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Support (Desktop & Tablet) */}
          <button 
            onClick={onOpenAbout} 
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0" 
            title="About & Support (support@tasklapse.app)"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
          </button>
          
          {/* Sign Out */}
          <button 
            onClick={logout} 
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 shrink-0" 
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Mobile/Tablet Search Row */}
      {isMobileSearchOpen && (
        <div className="lg:hidden px-3 sm:px-6 py-2 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active tasks..." 
              className="w-full bg-slate-800 border border-slate-700 text-xs sm:text-sm rounded-lg pl-9 pr-8 py-1.5 sm:py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsMobileSearchOpen(false)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg"
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
}
