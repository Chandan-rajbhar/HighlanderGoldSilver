import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coins,
  DollarSign,
  ShoppingBag,
  Users,
  CheckCircle2,
  MessageSquareQuote,
  ArrowRight,
  BarChart3,
  Plus,
  CreditCard,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { StatusBadge } from '../components/ui/StatusBadge';

export const Dashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(() => dashboardService.getDashboardSummarySync());
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  // Format currency helper
  const formatCurrency = (val) => {
    return `$${Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const totalCategoryValuation = summary?.categoryBreakdown?.reduce((sum, c) => sum + (Number(c.value) || 0), 0) || 0;

  const hasCategoryData = Boolean(
    summary?.categoryBreakdown &&
    summary.categoryBreakdown.length > 0 &&
    summary.categoryBreakdown.some(c => (Number(c.value) || 0) > 0)
  );

  const CustomCategoryTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalVal = totalCategoryValuation || 1;
      const sharePct = ((Number(data.value || 0) / totalVal) * 100).toFixed(1);

      return (
        <div className="bg-[#0B2D52]/95 backdrop-blur-md border border-[#1E4B7A] rounded-xl p-3 shadow-[0_12px_28px_rgba(11,45,82,0.3)] text-white text-xs min-w-[190px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
            <span className="font-serif font-bold text-white tracking-wide text-xs truncate">
              {data.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D6AD43]/20 text-[#F5D061] border border-[#D6AD43]/30 shrink-0">
              {sharePct}% Share
            </span>
          </div>
          <div className="space-y-1.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Valuation:</span>
              <span className="font-mono font-bold text-white text-xs">
                ${Number(data.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Catalog Lots:</span>
              <span className="font-mono text-[#D8EBFA] text-xs font-semibold">
                {data.count || 0} {data.count === 1 ? 'lot' : 'lots'}
              </span>
            </div>
            {data.count > 0 && (
              <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1.5 border-t border-white/10">
                <span>Avg / Lot:</span>
                <span className="font-mono text-slate-300">
                  ${Number(data.value / data.count).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Exactly 5 KPI Cards in Single Row on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Catalog Items */}
        <div
          onClick={() => navigate('/products')}
          className="bg-white rounded-xl p-4 border border-[#E2EEF8] shadow-[0_2px_8px_rgba(11,45,82,0.03)] hover:shadow-[0_4px_16px_rgba(11,45,82,0.08)] hover:border-[#B5D5F5] transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[118px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-wider uppercase font-sans truncate">
                Total Catalog Items
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#0B2D52] font-sans tracking-tight leading-none truncate">
                {isLoading ? '—' : (summary?.totalItems ?? 0)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shrink-0 group-hover:bg-[#EAF3FA] transition-colors">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs gap-1.5">
            <span className="text-[11px] text-[#64748B] font-sans truncate">Physical lots in vault</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-[#F4F9FD] text-[#0B2D52] border border-[#D8EBFA]">
              Inventory
            </span>
          </div>
        </div>

        {/* KPI 2: Active Items */}
        <div
          onClick={() => navigate('/products')}
          className="bg-white rounded-xl p-4 border border-[#E2EEF8] shadow-[0_2px_8px_rgba(11,45,82,0.03)] hover:shadow-[0_4px_16px_rgba(11,45,82,0.08)] hover:border-[#B5D5F5] transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[118px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-wider uppercase font-sans truncate">
                Active Items
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#0B2D52] font-sans tracking-tight leading-none truncate">
                {isLoading ? '—' : (summary?.activeItems ?? 0)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-100/70 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs gap-1.5">
            <span className="text-[11px] text-[#64748B] font-sans truncate">Live on storefront</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-[#ECFDF5] text-emerald-700 border border-emerald-200">
              Available
            </span>
          </div>
        </div>

        {/* KPI 3: Inquiries */}
        <div
          onClick={() => navigate('/inquiries')}
          className="bg-white rounded-xl p-4 border border-[#E2EEF8] shadow-[0_2px_8px_rgba(11,45,82,0.03)] hover:shadow-[0_4px_16px_rgba(11,45,82,0.08)] hover:border-[#B5D5F5] transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[118px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-wider uppercase font-sans truncate">
                Inquiries
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#0B2D52] font-sans tracking-tight leading-none truncate">
                {isLoading ? '—' : (summary?.totalInquiries ?? 0)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shrink-0 group-hover:bg-[#EAF3FA] transition-colors">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs gap-1.5">
            <span className="text-[11px] text-[#64748B] font-sans truncate">Client inquiries</span>
            {summary?.newInquiries > 0 ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse">
                {summary.newInquiries} New
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-[#F4F9FD] text-[#64748B] border border-[#D8EBFA]">
                Inquiries
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Total Revenue */}
        <div
          onClick={() => navigate('/orders')}
          className="bg-white rounded-xl p-4 border border-[#E2EEF8] shadow-[0_2px_8px_rgba(11,45,82,0.03)] hover:shadow-[0_4px_16px_rgba(11,45,82,0.08)] hover:border-[#B5D5F5] transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[118px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-wider uppercase font-sans truncate">
                Total Revenue
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#0B2D52] font-sans tracking-tight leading-none truncate">
                {isLoading ? '—' : formatCurrency(summary?.totalRevenue ?? 0)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#FBE3B5] flex items-center justify-center text-[#D6AD43] shrink-0 group-hover:bg-[#FFF9ED] transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-mono text-[11px] font-bold text-emerald-600 shrink-0">+15% BP</span>
              <span className="text-[10px] text-[#64748B] font-sans truncate">Incl.</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-[#FFFDF7] text-[#C9A23A] border border-[#FBE3B5]">
              Settlements
            </span>
          </div>
        </div>

        {/* KPI 5: Total Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-white rounded-xl p-4 border border-[#E2EEF8] shadow-[0_2px_8px_rgba(11,45,82,0.03)] hover:shadow-[0_4px_16px_rgba(11,45,82,0.08)] hover:border-[#B5D5F5] transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[118px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-wider uppercase font-sans truncate">
                Total Customers
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#0B2D52] font-sans tracking-tight leading-none truncate">
                {isLoading ? '—' : (summary?.totalCustomers ?? 0)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shrink-0 group-hover:bg-[#EAF3FA] transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs gap-1.5">
            <span className="text-[11px] text-[#64748B] font-sans truncate">Collectors & VIPs</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 bg-[#F4F9FD] text-[#0B2D52] border border-[#D8EBFA]">
              Buyers
            </span>
          </div>
        </div>
      </div>

      {/* Stock Alert Warning if any items low/unavailable */}
      {summary?.lowStockItems > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold font-sans">Vault Stock Notice</p>
              <p className="text-xs text-amber-800">
                {summary.lowStockItems} lot item(s) are low stock or unavailable in the storefront catalog.
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold underline text-amber-900 hover:text-amber-950 shrink-0"
          >
            Review Catalog →
          </Link>
        </div>
      )}

      {/* Top Grid: Catalog Overview (Left) + Latest Inquiries (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* A. Catalog Overview / Valuation by Category */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-[#E2EEF8] shadow-[0_2px_10px_rgba(11,45,82,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B2D52] font-serif tracking-widest uppercase">
                  Catalog Valuation by Category
                </h3>
                <p className="text-xs text-[#64748B] font-sans mt-0.5">
                  Total inventory dollar value distributed across rare coin & bullion categories
                </p>
              </div>

              <Link
                to="/categories"
                className="text-xs font-semibold text-[#155A96] hover:text-[#0B2D52] flex items-center gap-1 transition-colors shrink-0"
              >
                View Categories <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Chart or Minimal Clean Empty State */}
            <div className="min-h-[220px] w-full flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="text-[#64748B] text-xs py-8">Loading analytics...</div>
              ) : hasCategoryData ? (
                <div className="w-full h-60 sm:h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary.categoryBreakdown}
                      margin={{ top: 12, right: 10, left: -10, bottom: 10 }}
                    >
                      <defs>
                        {/* Primary Highlander Mountain Blue to Deep Navy Gradient */}
                        <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1E6CB5" stopOpacity={0.95} />
                          <stop offset="45%" stopColor="#155A96" stopOpacity={0.92} />
                          <stop offset="100%" stopColor="#0B2D52" stopOpacity={0.98} />
                        </linearGradient>

                        {/* Interactive Hovered Luxury Gold Gradient */}
                        <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F5D061" stopOpacity={1} />
                          <stop offset="45%" stopColor="#D6AD43" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#B38B28" stopOpacity={0.98} />
                        </linearGradient>

                        {/* Soft Drop Shadow for depth */}
                        <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0B2D52" floodOpacity="0.12" />
                        </filter>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: '#E2EEF8' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }}
                        tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(21, 90, 150, 0.04)', rx: 8, ry: 8 }}
                        content={<CustomCategoryTooltip />}
                      />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 2, 2]}
                        maxBarSize={44}
                        isAnimationActive={true}
                        animationDuration={900}
                        animationEasing="ease-out"
                        onMouseEnter={(_, index) => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        {summary.categoryBreakdown.map((entry, index) => {
                          const isHovered = hoveredBarIndex === index;
                          const isAnyHovered = hoveredBarIndex !== null;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradientPrimary)'}
                              opacity={isAnyHovered && !isHovered ? 0.65 : 1}
                              filter="url(#barGlow)"
                              className="transition-all duration-200 cursor-pointer"
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-7 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shadow-xs">
                    <BarChart3 className="w-6 h-6 text-[#155A96]" />
                  </div>
                  <h4 className="font-serif font-bold text-[#0B2D52] text-sm mt-3">
                    No Inventory Valuations Logged
                  </h4>
                  <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed font-sans">
                    Add bullion, historic coinage, or mint proof sets into the catalog to start generating category metrics and live pricing charts.
                  </p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#D8EBFA] bg-white text-[#155A96] text-xs font-semibold hover:bg-[#F4F9FD] hover:border-[#155A96] transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-[#E2EEF8] mt-3 flex items-center justify-between text-[11px] text-[#64748B] font-sans">
            <span>Automatic real-time calculation via spot price feed</span>
            <span className="font-mono text-slate-500">Vault Status: Locked & Audited</span>
          </div>
        </div>

        {/* B. Latest Inquiries Section (Replaces Precious Metal Holdings) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-[#E2EEF8] shadow-[0_2px_10px_rgba(11,45,82,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F5F9]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0B2D52] font-serif tracking-widest uppercase">
                    Latest Inquiries
                  </h3>
                  {summary?.newInquiries > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse">
                      {summary.newInquiries} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] font-sans mt-0.5">
                  Collector requests & lot acquisition messages
                </p>
              </div>
              <Link
                to="/inquiries"
                className="text-xs font-semibold text-[#155A96] hover:text-[#0B2D52] flex items-center gap-1 transition-colors"
              >
                View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Inquiries List or Empty State */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[#64748B]">Loading inquiries...</div>
            ) : summary?.recentInquiries && summary.recentInquiries.length > 0 ? (
              <div className="space-y-2.5">
                {summary.recentInquiries.slice(0, 3).map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => navigate('/inquiries')}
                    className="p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F4F9FD] border border-[#E2EEF8] hover:border-[#B5D5F5] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-[#0B2D52] group-hover:text-[#155A96] truncate">
                            {inq.inquirer_name || 'Anonymous Collector'}
                          </span>
                          {inq.inquiry_type && (
                            <span className="text-[10px] text-[#64748B] bg-white px-1.5 py-0.2 rounded border border-[#E2EEF8] shrink-0 font-medium">
                              {inq.inquiry_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={inq.status || 'New'} className="text-[10px] py-0 px-2 shrink-0" />
                    </div>

                    <p className="text-xs text-[#64748B] line-clamp-1 font-sans">
                      {inq.lot_title
                        ? (inq.lot_number ? `Lot #${inq.lot_number}: ${inq.lot_title}` : inq.lot_title)
                        : (inq.message || 'General catalog inquiry')}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono mt-1.5 pt-1.5 border-t border-[#EDF2F7]">
                      <span className="truncate max-w-[140px]">{inq.email || 'Direct contact'}</span>
                      <span>
                        {inq.created_at ? new Date(inq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-7 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-xl bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shadow-xs">
                  <MessageSquareQuote className="w-5 h-5 text-[#155A96]" />
                </div>
                <h4 className="font-serif font-bold text-[#0B2D52] text-xs sm:text-sm mt-3">
                  No Inquiries Received Yet
                </h4>
                <p className="text-xs text-[#64748B] max-w-[260px] mt-1 leading-relaxed font-sans">
                  Collector inquiries and lot acquisition requests from the storefront will appear here instantly.
                </p>
                <Link
                  to="/inquiries"
                  className="mt-3.5 inline-flex items-center gap-1 text-xs font-semibold text-[#155A96] hover:text-[#0B2D52] transition-colors"
                >
                  View Inquiries Inbox <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-[#E2EEF8] mt-3 flex items-center justify-between text-[11px] text-[#64748B] font-sans">
            <span className="leading-tight">Live storefront collector inbox</span>
            <span className="font-semibold text-[#0B2D52] font-mono leading-tight">
              {summary?.totalInquiries > 0 ? `${summary.totalInquiries} Total Inquiries` : 'Inbox Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & fast action shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* C. Recent Orders & Settlements */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2EEF8] shadow-[0_2px_10px_rgba(11,45,82,0.03)] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-[#E2EEF8] flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B2D52] font-serif">
                  Recent Orders & Wire Settlements
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Latest acquisitions processed through PayPal & Bigfork Bank Wire
                </p>
              </div>
              <Link
                to="/orders"
                className="text-xs font-semibold text-[#155A96] hover:text-[#0B2D52] flex items-center gap-1 transition-colors"
              >
                All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {summary?.recentOrders && summary.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#F8FAFC] text-[11px] text-[#64748B] uppercase font-semibold border-b border-[#E2EEF8]">
                    <tr>
                      <th className="px-4 py-3">Order #</th>
                      <th className="px-4 py-3">Collector</th>
                      <th className="px-4 py-3">Settlement (incl. 15% BP)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EEF8]">
                    {summary.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F4F9FD]/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0B2D52]">
                          {ord.order_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {ord.customer_name}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#0B2D52]">
                          ${Number(ord.total_settlement).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ord.payment_status} />
                        </td>
                        <td className="px-4 py-3 text-right text-[#64748B] font-mono">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-9 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96] shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-[#0B2D52] text-xs sm:text-sm mt-2.5">
                  No Recent Orders Logged
                </h4>
                <p className="text-xs text-[#64748B] max-w-sm mt-1">
                  Acquisitions and wire settlements will appear here as orders are placed.
                </p>
                <Link
                  to="/orders"
                  className="mt-3 text-xs font-semibold text-[#155A96] hover:text-[#0B2D52] inline-flex items-center gap-1"
                >
                  View Order Ledger <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* D. Quick Actions / Storefront Control */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#E2EEF8] shadow-[0_2px_10px_rgba(11,45,82,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold font-serif tracking-widest uppercase text-[#0B2D52]">
                Storefront Quick Actions
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mb-3.5">
              Direct administrative shortcuts for cataloging and settlements.
            </p>

            <div className="space-y-2">
              <Link
                to="/products"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F4F9FD] border border-[#E2EEF8] hover:border-[#B5D5F5] transition-all text-xs font-semibold text-[#0B2D52] group"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#FFFDF7] border border-[#FBE3B5] flex items-center justify-center text-[#D6AD43]">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                  Catalog New Lot Item
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#155A96] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/orders"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F4F9FD] border border-[#E2EEF8] hover:border-[#B5D5F5] transition-all text-xs font-semibold text-[#0B2D52] group"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96]">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </span>
                  Record Bank Wire Settlement
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#155A96] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/customers"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F4F9FD] border border-[#E2EEF8] hover:border-[#B5D5F5] transition-all text-xs font-semibold text-[#0B2D52] group"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96]">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  Add Customer / User
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#155A96] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/payments"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F4F9FD] border border-[#E2EEF8] hover:border-[#B5D5F5] transition-all text-xs font-semibold text-[#0B2D52] group"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#F4F9FD] border border-[#D8EBFA] flex items-center justify-center text-[#155A96]">
                    <CreditCard className="w-3.5 h-3.5" />
                  </span>
                  Review Payments & Wire Ledger
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#155A96] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2EEF8] text-[11px] text-[#64748B] flex items-center justify-between mt-3 font-sans">
            <span>Highlander Storefront & Vault</span>
            <span className="text-[#D6AD43] font-semibold font-mono">Bigfork, MT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
