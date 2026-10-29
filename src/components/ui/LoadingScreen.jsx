import React from 'react';

export const LoadingScreen = ({ 
  fullScreen = true, 
  title = 'Highlander Gold & Silver',
  message = 'Authenticating Secure Depository Console...' 
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm'
    : 'min-h-[400px] w-full flex flex-col items-center justify-center py-16 bg-transparent';

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="relative flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
        
        {/* Professional Luxury Loader Spinner - Pure Loader Without Any Logo */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Subtle Golden Glow */}
          <div className="absolute w-20 h-20 rounded-full bg-[#C9A23A]/15 blur-xl animate-pulse" />
          
          {/* Outer Main Spinner Ring */}
          <div className="w-14 h-14 rounded-full border-[3px] border-slate-200 border-t-[#C9A23A] border-r-[#C9A23A]/50 animate-spin" />
          
          {/* Inner Counter-Spin Accent Ring */}
          <div 
            className="absolute w-8 h-8 rounded-full border-[2px] border-transparent border-t-[#0B2B4E] border-b-[#0B2B4E]/40 animate-spin" 
            style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} 
          />
        </div>

        {/* Brand Details */}
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#071A35] font-sans">
          {title}
        </h2>
        
        <p className="mt-1 text-[11px] text-slate-400 font-medium">
          {message}
        </p>

        {/* Sleek Golden Progress Shimmer */}
        <div className="mt-4 w-36 h-1 bg-slate-100 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#C9A23A] to-transparent rounded-full animate-shimmer-progress" />
        </div>
      </div>
    </div>
  );
};
