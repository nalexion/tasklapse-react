import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Download, Upload, HelpCircle, Shield, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
}

export default function SettingsModal({ isOpen, onClose, onOpenAbout }: SettingsModalProps) {
  const { 
    webhook, 
    saveWebhook, 
    isGuest, 
    user, 
    logout, 
    tasks, 
    categories, 
    downloadBackupFile, 
    importBackupData 
  } = useAppContext();

  const [url, setUrl] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(webhook.url || '');
      setTargetEmail(webhook.targetEmail || '');
      setImportStatus(null);
    }
  }, [isOpen, webhook]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isGuest) {
      alert("Configuring webhooks requires cloud registration.");
      return;
    }
    await saveWebhook(url.trim(), targetEmail.trim());
    onClose();
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect cloud sync? You will be returned to Guest mode.")) {
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

  const handleImportClick = () => {
    setImportStatus(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsedJSON = JSON.parse(rawContent);
        
        const result = await importBackupData(parsedJSON, importMode);
        if (result.success) {
          setImportStatus({
            type: 'success',
            message: result.message
          });
        } else {
          setImportStatus({
            type: 'error',
            message: result.message
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err.message || "Failed to parse JSON backup file."
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setIsImporting(false);
      setImportStatus({ type: 'error', message: "Failed to read file from disk." });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/60 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> System Settings & Offline Backups
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">          
          
          {/* Section 1: Offline Backup & Restore (Prominent) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Data Backup & Offline Export
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                {tasks.length} items • {categories.length} categories
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Export your full task history and custom categories to a standalone JSON file. You can restore this file anytime to maintain an offline backup or transfer data between devices.
            </p>

            {importStatus && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {importStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* Import Mode Selector */}
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span className="text-slate-400">Import Mode:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'merge'} 
                    onChange={() => setImportMode('merge')} 
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                  />
                  <span>Merge with current</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'replace'} 
                    onChange={() => setImportMode('replace')} 
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                  />
                  <span>Replace all</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button 
                type="button"
                onClick={downloadBackupFile}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                title="Download JSON backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <input 
                type="file" 
                accept=".json,application/json" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                className="hidden" 
              />
              
              <button 
                type="button"
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
                title="Upload JSON backup"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isImporting ? 'Importing...' : 'Import JSON Backup'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Support & Developer Help */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Need Help or Have a Feature Request?
              </h4>
              <p className="text-xs text-slate-400 truncate">
                Official contact: <span className="text-indigo-300 font-mono">support@tasklapse.app</span>
              </p>
            </div>
            {onOpenAbout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAbout();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium whitespace-nowrap transition-colors"
              >
                About & Guide
              </button>
            )}
          </div>

          {/* Section 3: Webhook Configurations */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Automated Notification Webhook
            </h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Incoming Webhook Endpoint</label>
              <input 
                type="url" 
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs sm:text-sm" 
                placeholder="https://hook.make.com/..." 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Target Email</label>
              <input 
                type="email" 
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs sm:text-sm" 
                placeholder="user@example.com" 
              />
            </div>

            {/* Delivery Telemetry */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400">
              <div className="flex justify-between items-center mb-1">
                <span>Last Telemetry Status:</span> 
                <span className={webhook.lastStatus === "Success 200" ? "text-emerald-400 font-bold" : (webhook.lastStatus === 'Delivery Failed' || webhook.lastStatus === 'Delivery Error' ? "text-rose-400 font-bold" : "text-amber-400")}>
                  {webhook.lastStatus || 'Awaiting dispatch'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Evaluation:</span> 
                <span className="text-slate-500">{webhook.lastTime || '--'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Account Diagnostics & Data Management */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Active Storage Driver:</div>
              <div>{isGuest ? 'Offline Local Storage (Guest)' : `Firebase Cloud Synced (${user?.email || 'Active'})`}</div>
              <div className="text-[11px] text-slate-500 font-mono break-all">UID: {user?.uid || 'guest_local_instance'}</div>
            </div>

            {!isGuest ? (
              <button 
                type="button"
                onClick={handleDisconnect} 
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                Disconnect Cloud Sync
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleDeleteData} 
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Delete Offline Local Storage Data
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-700 shrink-0 flex justify-end gap-2.5 bg-slate-800/60">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
