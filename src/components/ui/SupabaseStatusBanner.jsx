import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

export const SupabaseStatusBanner = () => {
  const isConfigured = isSupabaseConfigured();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const envSample = `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-public-key`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    toast.success('Sample environment variables copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border p-4 text-xs transition-all ${
        isConfigured
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/80 border-amber-200/90 text-amber-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {isConfigured
                  ? 'Supabase Database: Live Connected'
                  : 'Supabase Architecture: Ready for Connection'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConfigured
                    ? 'bg-emerald-200/70 text-emerald-800'
                    : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {isConfigured ? 'Connected' : 'Offline / Dev Mode'}
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              {isConfigured
                ? 'All queries are running against your Supabase tables with server-side range pagination and column egress optimization.'
                : 'Using local database persistence for Highlander Gold & Silver. Add your VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY whenever ready.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isConfigured && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 font-medium transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Hide Setup' : 'How to Connect'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && !isConfigured && (
        <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-2">
          <p className="text-slate-700">
            <strong>3 Easy Steps to Connect Supabase:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 ml-1">
            <li>
              Run the SQL migration located at <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]">src/lib/schema.sql</code> in your Supabase SQL Editor.
            </li>
            <li>
              Copy the environment template below into your root <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> file.
            </li>
            <li>
              Restart the dev server (<code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]">npm run dev</code>). The dashboard automatically connects with zero code changes!
            </li>
          </ol>

          <div className="relative mt-2 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px]">
            <pre className="overflow-x-auto">{envSample}</pre>
            <button
              onClick={copyEnv}
              className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

