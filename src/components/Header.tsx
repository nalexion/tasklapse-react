import React from 'react';
import { Search, PlusCircle, Archive, Settings, LogOut, Tags, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  onOpenTaskModal: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onOpenCategories: () => void;
  onSimulateAlarm: () => void;
  isSimulating: boolean;
}

export default function Header({ onOpenTaskModal, onOpenArchive, onOpenSettings, onOpenCategories, onSimulateAlarm, isSimulating }: HeaderProps) {
  const { user, isGuest, searchQuery, setSearchQuery, logout } = useAppContext();

  const userEmailTag = isGuest 
    ? 'Logged in: Guest User' 
    : `Logged in: ${user?.email || 'Google Account Connected'}`;
  
    const syncBadgeClass = isGuest
      ? 'text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded-full font-normal'
      : 'text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-normal';
    
    const syncBadgeText = isGuest ? 'Local Only' : 'Cloud Synced';
  
    return (
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Logo & Branding */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.svg" 
              alt="TaskLapse Logo" 
              className="w-10 h-10 object-cover rounded-xl shadow-lg border border-slate-700" 
            />
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                TaskLapse <span className="text-slate-500 text-xs font-normal align-middle">v2.7.10</span>
                <span className={syncBadgeClass}>{syncBadgeText}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400">{userEmailTag}</p>
            </div>
          </div>
  
          {/* Right: Search & Actions */}
          <div className="flex items-center space-x-3">
            {/* Global Search */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active tasks..." 
                className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500" 
              />
            </div>

          <button 
            onClick={onSimulateAlarm}
            disabled={isSimulating}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-amber-950 px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-400 disabled:opacity-70 whitespace-nowrap"
          >
            <Bell className={`w-4 h-4 ${isSimulating ? 'animate-ping' : ''}`} />
            <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate Daily Alarm'}</span>
          </button>
          
          <button 
            onClick={onOpenArchive} 
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700" 
            title="Archives"
          >
            <Archive className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onOpenCategories} 
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700" 
            title="Manage Categories"
          >
            <Tags className="w-5 h-5" />
          </button>

          <button 
            onClick={onOpenSettings} 
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700" 
            title="Settings & Webhooks"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={logout} 
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ml-2" 
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
