import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  isCurrency = false,
  badgeText,
  onClick,
  className = ''
}) => {
  const isGreenBadge = badgeText === 'Available' || badgeText === 'All Settled';

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[145px] ${
        onClick ? 'cursor-pointer hover:border-[#F5B52E]/60' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl sm:text-[28px] font-bold text-slate-900 font-sans tracking-tight leading-none">
            {isCurrency && typeof value === 'number'
              ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : value}
          </h3>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-50/80 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/70">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-2">
        <div className="flex items-center gap-1.5">
          {trend && (
            <span
              className={`inline-flex items-center font-bold text-xs gap-0.5 ${
                trendPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trendPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400 text-xs font-sans">{subtitle}</span>}
        </div>

        {badgeText && (
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
            isGreenBadge
              ? 'bg-[#ECFDF5] text-emerald-700 border-emerald-200/90'
              : 'bg-[#FFF9ED] text-[#C9A23A] border border-[#FBE3B5]'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
