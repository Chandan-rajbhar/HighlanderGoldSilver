import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-aubergine-surface border border-aubergine-border flex items-center justify-center text-aubergine mb-4">
        <LayoutDashboard className="w-8 h-8 text-gold" />
      </div>
      <h2 className="text-2xl font-bold font-serif text-slate-900">404 — Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        The requested administrative console section does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-serif uppercase tracking-wider rounded-xl shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-gold" />
        Return to Dashboard Overview
      </Link>
    </div>
  );
};

