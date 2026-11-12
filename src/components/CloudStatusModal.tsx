import React, { useEffect, useState } from 'react';
import { X, Database, Cloud, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { SUPABASE_URL, CLOUDINARY_CLOUD_NAME, hackApi } from '../services/hackApi';
import { InfrastructureHealth } from '../types';

interface CloudStatusModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const CloudStatusModal: React.FC<CloudStatusModalProps> = ({ onClose, onRefreshData }) => {
  const [health, setHealth] = useState<InfrastructureHealth | null>(null);
  const [checking, setChecking] = useState(true);

  const runCheck = async () => {
    setChecking(true);
    const result = await hackApi.checkClusterHealth();
    setHealth(result);
    setChecking(false);
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-nerdLime" />
            <span className="text-sm font-black uppercase tracking-tight">
              Infrastructure & Cloud Diagnostics
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Production Stack Status</h3>
              <p className="text-[11px] text-slate-500">
                100% Serverless architecture running on Supabase + Vercel + Cloudinary CDN.
              </p>
            </div>
            <button
              type="button"
              onClick={runCheck}
              disabled={checking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-nerdBlue' : ''}`} />
              <span>Re-test</span>
            </button>
          </div>

          {/* 1. Supabase PostgreSQL */}
          <div className={`p-4 rounded-2xl border ${
            health?.schemaReady
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Supabase PostgreSQL & Auth</span>
              </span>
              {checking ? (
                <span className="text-[11px] text-slate-500">Checking...</span>
              ) : health?.schemaReady ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" /> TABLES SYNCED ({health.latencyMs}ms)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-black">
                  <AlertTriangle className="w-3.5 h-3.5" /> SCHEMA PENDING
                </span>
              )}
            </div>
            <div className="text-[11px] opacity-80 font-mono truncate mb-2">
              {SUPABASE_URL}
            </div>
            {!checking && !health?.schemaReady && (
              <div className="bg-white/80 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-amber-200">
                <p className="font-semibold text-amber-950">
                  Supabase is connected, but <code className="font-mono font-bold">league_events</code> hasn't been created yet. Local cache is active until you run the SQL file.
                </p>
                <a
                  href="https://supabase.com/dashboard/project/zjlatiflzqssrnzvsmhv/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-nerdBlue font-bold hover:underline"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* 2. Cloudinary Media CDN */}
          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-nerdBlue" />
                <span>Cloudinary Image CDN</span>
              </span>
              <span className={`text-[11px] font-black ${health?.cloudinaryConfigured ? 'text-emerald-700' : 'text-blue-700'}`}>
                {health?.cloudinaryConfigured ? '● SIGNED UPLOADS LIVE' : '● CLOUD CONNECTED (ADD SECRET FOR DIRECT UPLOAD)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono">
              Cloud Name: <strong>{CLOUDINARY_CLOUD_NAME}</strong> • Auto WebP/AVIF (`f_auto,q_auto`)
            </div>
          </div>

          {/* 3. Vercel Domain & Security */}
          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-nerdBlue" />
                <span>Vercel Edge & Master Security Gate</span>
              </span>
              <span className="text-[11px] font-black text-emerald-700">● SERVERLESS</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Domain: <strong>league.nerdsroom.org</strong> • Dynamic Lu.ma OpenGraph & Server Auth Gate Active
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onRefreshData();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold shadow-md transition-all"
            >
              Sync & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
