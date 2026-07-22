import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { webhook, saveWebhook, isGuest, user, logout } = useAppContext();
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(webhook.url || '');
    }
  }, [isOpen, webhook]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isGuest) {
      alert("Settings require registration.");
      return;
    }
    await saveWebhook(url.trim());
    onClose();
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect cloud sync? You will be logged out.")) {
      logout();
      onClose();
    }
  };
  
  const handleDeleteData = () => {
    if (window.confirm("Delete all local data? This action cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> System Settings & Storage Drivers
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          
          <div>
            <label className="block text-sm font-bold text-white mb-2">Simulated Target Email</label>
            <input 
              type="email" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" 
              placeholder="user@example.com" 
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
             <h4 className="text-sm font-bold text-white mb-2">Account Diagnostics</h4>
             <div className="text-xs text-slate-400">
               Active Database UID:<br/>
               <span className="text-indigo-400 break-all">{user?.uid || 'guest_local_storage'}</span>
             </div>
          </div>
          
          <div>
             <h4 className="text-sm font-bold text-white mb-2">Data Backups & Migrations</h4>
             <div className="flex gap-3">
               <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors border border-slate-700">
                 Export Backup
               </button>
               <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors border border-slate-700">
                 Import Backup
               </button>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
             <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
               ☁️ Cloud Integration Active
             </h4>
             <button onClick={handleDisconnect} className="w-full mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors border border-slate-700">
               Disconnect Cloud Sync
             </button>
          </div>

          <div className="pt-2">
            <button onClick={handleDeleteData} className="text-sm font-bold text-rose-500 hover:text-rose-400 transition-colors">
              Delete Storage Data
            </button>
          </div>
          
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
              Save Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
