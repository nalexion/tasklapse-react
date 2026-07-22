import React, { useState, useEffect } from 'react';
import { Webhook, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { webhook, saveWebhook, isGuest } = useAppContext();
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

  const statusClass = webhook.lastStatus === 'Success 200' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5" /> Outbound Webhooks
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">Configure webhooks for daily alert triggers.</p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Webhook URL</label>
            <input 
              type="url" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" 
              placeholder="https://hook.make.com/..." 
            />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Telemetry</h4>
            <div className="bg-slate-900 border border-slate-800 rounded p-3 text-xs font-mono text-slate-400">
              <div className="flex justify-between items-center mb-1">
                <span>Status:</span> 
                <span className={statusClass}>{webhook.lastStatus || "Awaiting dispatch"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Ping:</span> 
                <span className="text-slate-500">{webhook.lastTime || "--"}</span>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
              Save URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
