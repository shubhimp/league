import React, { useState } from 'react';
import { X, Server, Wifi, Check, Copy, RefreshCw, Database } from 'lucide-react';
import { hackApi } from '../services/hackApi';
import { InfrastructureHealth } from '../types';

interface NestSettingsModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export const NestSettingsModal: React.FC<NestSettingsModalProps> = ({ onClose, onSaved }) => {
  const [apiUrl, setApiUrl] = useState(hackApi.getApiUrl() || '');
  const [testing, setTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<InfrastructureHealth | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setHealthResult(null);

    hackApi.setApiUrl(apiUrl.trim() || null);
    const health = await hackApi.checkClusterHealth();
    setHealthResult(health);
    setTesting(false);
  };

  const handleSave = () => {
    hackApi.setApiUrl(apiUrl.trim() || null);
    onSaved();
    onClose();
  };

  const handleSwitchToLocal = () => {
    setApiUrl('');
    hackApi.setApiUrl(null);
    onSaved();
    onClose();
  };

  const copyCommand = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 text-xs">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-nerdLime" />
            <span className="text-sm font-bold uppercase tracking-tight">
              Nerds Room Cloud & Backend Configuration
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Backend API Endpoint</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Connect this platform directly to your self-hosted event API or database server. Leave blank to run entirely in the built-in fast offline client sandbox.
            </p>
          </div>

          {/* Input & Test */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">API Server URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g. https://api.nerdsroom.org or http://localhost:8080"
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-nerdBlue' : ''}`} />
                <span>Test Ping</span>
              </button>
            </div>
          </div>

          {/* Ping Diagnostic */}
          {healthResult && (
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                healthResult.status === 'online'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1 font-bold">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" />
                  <span>{healthResult.status === 'online' ? 'BACKEND CONNECTED & SYNCHRONIZED' : 'ENDPOINT UNREACHABLE'}</span>
                </span>
                {healthResult.latencyMs && (
                  <span className="text-emerald-700 font-mono font-bold">Ping: {healthResult.latencyMs} ms</span>
                )}
              </div>
              <div className="text-[11px] text-slate-600">
                {healthResult.platform} • {healthResult.memory ? `RAM: ${healthResult.memory.usedMb}MB / ${healthResult.memory.totalMb}MB` : 'Ready'}
              </div>
            </div>
          )}

          {/* Self-Host Backend Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <span className="font-bold text-slate-900 block text-xs">🚀 Standalone Server Deployment:</span>
            
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">1. Start the event server:</span>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-800">
                <code>cd server && npm install && npm start</code>
                <button onClick={() => copyCommand('cd server && npm install && npm start', 'start')} className="text-slate-400 hover:text-nerdBlue">
                  {copied === 'start' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">2. Or deploy with PM2 / Docker:</span>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-800">
                <code>pm2 start ecosystem.config.cjs</code>
                <button onClick={() => copyCommand('pm2 start ecosystem.config.cjs', 'pm2')} className="text-slate-400 hover:text-nerdBlue">
                  {copied === 'pm2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleSwitchToLocal}
              className="text-slate-400 hover:text-slate-700 text-[11px] font-bold underline"
            >
              Reset to Local Sandbox
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold shadow-md transition-all"
              >
                Save Config
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
