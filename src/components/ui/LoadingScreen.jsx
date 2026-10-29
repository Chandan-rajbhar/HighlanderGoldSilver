import React from 'react';

export const LoadingScreen = ({ 
  fullScreen = true, 
  title = 'Highlander Gold & Silver',
  message = 'Authenticating Secure Depository Console...' 
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm'
    : 'min-h-[450px] w-full flex flex-col items-center justify-center py-16 bg-transparent';

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="relative flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
        
        {/* Luxury Rotating Highlander Emblem */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Subtle Outer Glow */}
          <div className="absolute w-20 h-20 rounded-full bg-[#C9A23A]/10 blur-xl animate-pulse" />
          
          {/* Outer Spin Ring */}
          <div className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-[#C9A23A] border-r-[#C9A23A]/40 animate-spin" />
          
          {/* Center Logo Crest */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/assets/brand/highlander_crest_favicon.png"
              alt="Highlander"
              className="w-7 h-7 object-contain drop-shadow-xs"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
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
