import React, { useState, useEffect } from 'react';
import { Mail, Rocket } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function IntegrationPanel() {
  const { webhook, saveWebhook, isGuest } = useAppContext();
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    setUrl(webhook.url || '');
    setSecret(webhook.secret || '');
  }, [webhook.url, webhook.secret]);

  const handleSave = async () => {
    if (isGuest) {
      return;
    }
    await saveWebhook(url.trim(), secret.trim());
  };

  const statusColor = (webhook.lastStatus && (webhook.lastStatus.includes('200') || webhook.lastStatus.includes('Success'))) ? 'text-emerald-400' : 'text-amber-400';
  const statusBorder = (webhook.lastStatus && (webhook.lastStatus.includes('200') || webhook.lastStatus.includes('Success'))) ? 'border-emerald-500/30' : 'border-amber-500/30';
  const statusBg = (webhook.lastStatus && (webhook.lastStatus.includes('200') || webhook.lastStatus.includes('Success'))) ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Email Notifications Logs */}
      <div className="glass-panel rounded-xl p-6 flex flex-col border border-slate-700/50">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Triggered Email Notifications</h3>
              <p className="text-sm text-slate-400">Preview of automated warning emails</p>
            </div>
          </div>
          <button className="text-sm text-slate-400 hover:text-white transition-colors">
            Clear Logs
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-slate-500">
          <Mail className="w-12 h-12 mb-3 opacity-20" />
          <p>No email alerts triggered today.</p>
        </div>
      </div>

      {/* Cloud Integrations */}
      <div className="glass-panel rounded-xl p-6 flex flex-col border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🚀</span>
          <h3 className="font-bold text-white text-lg flex items-center gap-3">
            Cloud Notification Integrations
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Cloud Active</span>
          </h3>
        </div>
        
        <p className="text-sm text-slate-300 mb-6">
          Set up a Make/Zapier webhook to turn these simulation logs into actual emails directly inside your personal mailbox.
        </p>

        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Incoming Webhook Endpoint</label>
            <input 
              type="url" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" 
              placeholder="https://hook.eu1.make.com/..." 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-white mb-2">Webhook Authentication Secret</label>
            <input 
              type="password" 
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm font-mono tracking-widest" 
              placeholder="••••••••••••••••••••" 
            />
          </div>

          <div className={`border ${statusBorder} rounded-lg p-4 mt-4`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LAST PIPELINE DELIVERY STATUS</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${statusBorder} ${statusBg} ${statusColor} font-bold`}>
                {webhook.lastStatus?.toUpperCase() || 'SUCCESS (200)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Trigger: expiration_alert</span>
              <span className="text-slate-300 font-mono">{webhook.lastTime || '11:00:03 AM'}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-between items-center mt-4">
          <span className="text-sm text-indigo-400 font-medium">Status: Firestore live synchronization active</span>
          <button 
            onClick={handleSave} 
            disabled={isGuest}
            className={`px-6 py-2 text-sm font-bold rounded-lg shadow-md transition-colors ${
              isGuest 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isGuest ? 'Requires Account' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
