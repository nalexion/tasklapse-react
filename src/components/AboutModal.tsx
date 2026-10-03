import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Mail, 
  Copy, 
  Check, 
  Download, 
  Lightbulb, 
  Bug, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  Repeat,
  Bell
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export default function AboutModal({ isOpen, onClose, onOpenSettings }: AboutModalProps) {
  const { downloadBackupFile, tasks, categories } = useAppContext();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'support@tasklapse.app';

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const bugEmailLink = `mailto:${supportEmail}?subject=${encodeURIComponent('[Bug Report] TaskLapse v2.9.9')}&body=${encodeURIComponent(
    'Please describe the issue:\n\nSteps to reproduce:\n1. \n2. \n\nExpected behavior:\n\nDevice / Browser:\n'
  )}`;

  const featureEmailLink = `mailto:${supportEmail}?subject=${encodeURIComponent('[Feature Request] TaskLapse')}&body=${encodeURIComponent(
    'Describe the feature or improvement you would like to see:\n\nWhy would this be useful?\n'
  )}`;

  const generalEmailLink = `mailto:${supportEmail}?subject=${encodeURIComponent('[Support] TaskLapse Help')}`;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">About & Support</h3>
                <span className="text-[10px] sm:text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 font-semibold">
                  v2.9.9
                </span>
              </div>
              <p className="text-xs text-slate-400">Help center, feature requests, and developer contact</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Mission & Overview */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <img 
              src="/logo.svg" 
              alt="TaskLapse Logo" 
              className="w-12 h-12 rounded-xl border border-slate-700 shadow-md shrink-0 object-cover" 
            />
            <div className="text-xs sm:text-sm text-slate-300 space-y-1">
              <h4 className="font-bold text-white text-sm sm:text-base">TaskLapse Engine</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                TaskLapse is an intuitive, local-first expiration, renewal, and milestone tracking engine. It organizes commitments into dynamic urgency columns, handles recurrent lifecycles, and triggers automated email notification webhooks.
              </p>
            </div>
          </div>

          {/* Support & Contact Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Direct Support & Feature Inquiries
                </h4>
                <p className="text-xs text-slate-300">
                  Encountering an issue or have an idea to make TaskLapse better? Reach out anytime!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 select-all">
                  {supportEmail}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Action Email Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <a 
                href={bugEmailLink}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Report a Bug</span>
              </a>

              <a 
                href={featureEmailLink}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Request a Feature</span>
              </a>

              <a 
                href={generalEmailLink}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>General Inquiry</span>
              </a>
            </div>
          </div>

          {/* Quick Offline Backup Assurance Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Offline Data Backup & Portability
              </h5>
              <p className="text-xs text-slate-400">
                You have {tasks.length} item(s) across {categories.length} categories. Always keep an offline copy of your records.
              </p>
            </div>
            <button
              onClick={downloadBackupFile}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-600 flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Offline JSON</span>
            </button>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-xs sm:text-sm uppercase tracking-wider">
              Quick Reference & Guide
            </h4>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Target Start Date vs Expires Date:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  <strong>Target Start Date</strong> is the baseline date for an item (renewal cycle start or active date). Future-dated items stay safely buffered. <strong>Expires Date</strong> is an optional final cutoff date; once reached, recurrent tasks will not regenerate another cycle.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                  Checking Off Recurring Items:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  When you check off a recurring item, a historical snapshot is added to your Archives, and the active task automatically rolls forward to its next period (e.g. Weekly, Monthly, Yearly).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  Automated Webhooks & Real Email Warnings:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Configure your Make.com or Zapier webhook endpoint in Settings or the Integration Panel. When the daily simulation matches items due in 30d, 7d, or 1d, it delivers automated webhook payloads to dispatch real email notifications.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500">
            TaskLapse • Local-First & Cloud-Synced
          </span>
          <div className="flex gap-2">
            {onOpenSettings && (
              <button 
                onClick={() => { onClose(); onOpenSettings(); }}
                className="px-3 py-1.5 text-xs text-indigo-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Open Settings
              </button>
            )}
            <button 
              onClick={onClose} 
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
