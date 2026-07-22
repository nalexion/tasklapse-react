import React, { useState, useEffect, useRef } from 'react';
import { Settings, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { webhook, saveWebhook, isGuest, user, logout, tasks } = useAppContext();
  const [url, setUrl] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(webhook.url || '');
      setTargetEmail(webhook.targetEmail || '');
    }
  }, [isOpen, webhook]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isGuest) {
      alert("Settings require registration.");
      return;
    }
    await saveWebhook(url.trim(), targetEmail.trim());
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

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasklapse_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          // Store directly in local storage as local fallback, and tell user to refresh
          // If cloud mode is needed, we would need a more robust import that uploads
          // but replacing local storage is a simple first step for offline/import.
          if (isGuest) {
             localStorage.setItem('tasklapse_local_items', JSON.stringify(importedData));
             alert("Import successful. Reloading application.");
             window.location.reload();
          } else {
             alert("Importing directly to cloud is not fully supported in this flow yet. Please import in Guest mode.");
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error parsing backup file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> System Settings & Storage Drivers
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-6 overflow-y-auto">          
          <div>
            <label className="block text-sm font-bold text-white mb-2">Incoming Webhook Endpoint</label>
            <input 
              type="url" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm mb-4" 
              placeholder="https://hook.make.com/..." 
            />

            <label className="block text-sm font-bold text-white mb-2">Simulated Target Email</label>
            <input 
              type="email" 
              value={targetEmail}
              onChange={e => setTargetEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" 
              placeholder="user@example.com" 
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Telemetry</h4>
            <div className="bg-slate-900 border border-slate-800 rounded p-3 text-xs font-mono text-slate-400">
                <div className="flex justify-between items-center mb-1">
                    <span>Status:</span> 
                    <span className={webhook.lastStatus === "Success 200" ? "text-emerald-400" : (webhook.lastStatus === 'Delivery Failed' || webhook.lastStatus === 'Delivery Error' ? "text-rose-400" : "text-amber-400")}>
                      {webhook.lastStatus || 'Awaiting dispatch'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span>Last Ping:</span> 
                    <span className="text-slate-500">{webhook.lastTime || '--'}</span>
                </div>
            </div>
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
               <button onClick={handleExportBackup} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors border border-slate-700">
                 Export Backup
               </button>
               <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
               <button onClick={handleImportClick} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors border border-slate-700">
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
        </div>

        <div className="p-5 border-t border-slate-700 shrink-0 flex justify-end gap-3 bg-slate-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
}
