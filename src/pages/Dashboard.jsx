import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Coins, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Layers,
  CreditCard,
  AlertTriangle,
  ArrowRight, 
  TrendingUp, 
  Plus, 
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { useSpotPrices } from '../context/SpotPriceContext';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { spots, refreshPrices, lastUpdated } = useSpotPrices();

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

  return (
    <div className="space-y-6">
      {/* Live Precious Metals Spot Reference Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] border border-[#FBE3B5] flex items-center justify-center text-[#F5B52E] shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#F5B52E]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-[#0F1E32] font-serif tracking-wider">
                LIVE PRECIOUS METALS SPOT BENCHMARK
              </h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Benchmark pricing for physical numismatics & bullion • Last tick:{' '}
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Spot Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Gold */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFDF7] border border-[#FBE3B5] shadow-xs">
            <div className="w-2 h-2 rounded-full bg-[#F5B52E]" />
            <span className="text-xs font-semibold text-slate-500">Gold</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">
              ${spots.gold.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 font-mono">
              {spots.gold.changePct}
            </span>
          </div>

          {/* Silver */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Silver</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">
              ${spots.silver.price.toFixed(2)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 font-mono">
              {spots.silver.changePct}
            </span>
          </div>

          {/* Platinum */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F7FF] border border-indigo-100 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-slate-500">Platinum</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">
              ${spots.platinum.price.toFixed(2)}
            </span>
            <span className="text-[11px] font-semibold text-rose-500 font-mono">
              {spots.platinum.changePct}
            </span>
          </div>

          <button
            onClick={refreshPrices}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            title="Refresh spot benchmark"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Catalog Items */}
        <KpiCard
          title="TOTAL CATALOG ITEMS"
          value={isLoading ? '...' : summary?.totalItems || 0}
          subtitle="Physical lots in vault"
          icon={Coins}
          badgeText="Inventory"
          onClick={() => navigate('/products')}
        />

        {/* 2. Active Items */}
        <KpiCard
          title="ACTIVE ITEMS"
          value={isLoading ? '...' : summary?.activeItems || 0}
          subtitle="Live on storefront"
          icon={CheckCircle2}
          badgeText="Available"
          onClick={() => navigate('/products')}
        />

        {/* 3. Total Categories */}
        <KpiCard
          title="TOTAL CATEGORIES"
          value={isLoading ? '...' : summary?.totalCategories || 0}
          subtitle="Gold, Silver & Numismatics"
          icon={Layers}
          badgeText="Collections"
          onClick={() => navigate('/categories')}
        />

        {/* 4. Total Customers */}
        <KpiCard
          title="TOTAL CUSTOMERS"
          value={isLoading ? '...' : summary?.totalCustomers || 0}
          subtitle="Storefront collectors & VIPs"
          icon={Users}
          badgeText="Buyers"
          onClick={() => navigate('/customers')}
        />

        {/* 5. Total Orders */}
        <KpiCard
          title="TOTAL ORDERS"
          value={isLoading ? '...' : summary?.totalOrders || 0}
          subtitle="Recorded acquisitions"
          icon={ShoppingBag}
          badgeText="Settlements"
          onClick={() => navigate('/orders')}
        />

        {/* 6. Total Revenue */}
        <KpiCard
          title="TOTAL REVENUE"
          value={isLoading ? '...' : summary?.totalRevenue || 0}
          isCurrency={true}
          subtitle="Incl. 15% Buyer's Premium"
          icon={DollarSign}
          trend="+15% BP"
          trendPositive={true}
          onClick={() => navigate('/orders')}
        />

        {/* 7. Pending Payments */}
        <KpiCard
          title="PENDING PAYMENTS"
          value={isLoading ? '...' : summary?.pendingPayments || 0}
          subtitle="Awaiting wire / gateway"
          icon={CreditCard}
          badgeText={summary?.pendingPayments > 0 ? `${summary.pendingPayments} Pending` : 'All Settled'}
          onClick={() => navigate('/payments')}
        />

        {/* 8. Low Stock Items */}
        <KpiCard
          title="LOW STOCK ITEMS"
          value={isLoading ? '...' : summary?.lowStockItems || 0}
          subtitle="Unavailable or 1 remaining"
          icon={AlertTriangle}
          badgeText={summary?.lowStockItems > 0 ? 'Review' : 'Stocked'}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Stock Alert Warning if any items low/unavailable */}
      {summary?.lowStockItems > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold font-serif">Vault Stock Notice</p>
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

      {/* Charts / Valuation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Valuation Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#0F1E32] font-serif uppercase tracking-widest">
                  CATALOG VALUATION BY CATEGORY
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Total inventory dollar value distributed across rare coin & bullion categories
                </p>
              </div>
              <Link
                to="/categories"
                className="text-xs font-semibold text-[#D4AF37] hover:text-[#B58D27] flex items-center gap-1 transition-colors"
              >
                View Categories <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Empty State / Valuation Chart */}
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-4">
              {isLoading ? (
                <div className="text-slate-400 text-xs">Loading analytics...</div>
              ) : summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && summary.categoryBreakdown.some(c => c.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.categoryBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      interval={0}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Catalog Value']}
                      contentStyle={{
                        backgroundColor: '#0F1E32',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        border: '1px solid #334155',
                      }}
                    />
                    <Bar dataKey="value" fill="#F5B52E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF9ED] border border-[#FBE3B5] flex items-center justify-center text-[#F5B52E] shadow-xs">
                    <BarChart3 className="w-7 h-7 text-[#F5B52E]" />
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm sm:text-base mt-3">
                    No Inventory Valuations Logged
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed font-sans">
                    Add bullion, historic coinage, or mint proof sets into the catalog to start generating category metrics and live pricing charts.
                  </p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#FBE3B5] bg-white text-[#D4AF37] text-xs font-bold hover:bg-[#FFF9ED] transition-colors shadow-xs cursor-pointer"
                  >
                    + Add New Item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-200/80 mt-2 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>Automatic real-time calculation via spot price feed</span>
            <span className="font-mono">Vault Status: Locked & Audited</span>
          </div>
        </div>

        {/* Precious Metal Holdings Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F1E32] font-serif tracking-widest uppercase">
              PRECIOUS METAL HOLDINGS
            </h3>
            <p className="text-xs text-slate-400 mb-3 font-sans mt-0.5">
              Lot distribution by metal composition
            </p>

            {/* Circular Gauge / Donut Ring */}
            <div className="h-44 w-full flex items-center justify-center relative">
              <div className="relative w-36 h-36 rounded-full border-[10px] border-[#F1F5F9] flex items-center justify-center">
                {/* Active indicator dot at 9 o'clock */}
                <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F5B52E] border-2 border-white shadow-xs" />
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                    0
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-1">
                    TOTAL TROY OZ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Rows */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
            <div className="p-2 rounded-xl bg-[#FFFDF7] border border-[#FEF3C7]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5B52E]" />
                <span className="text-slate-800 font-medium text-xs">Gold (.9999 Fine)</span>
              </div>
              <span className="font-mono text-slate-900 font-bold text-xs">0.00 oz</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-800 font-medium text-xs">Silver (.999 Fine)</span>
              </div>
              <span className="font-mono text-slate-900 font-bold text-xs">0.00 oz</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F5F7FF] border border-indigo-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className="text-slate-800 font-medium text-xs">Platinum / Other</span>
              </div>
              <span className="font-mono text-slate-900 font-bold text-xs">0.00 oz</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-slate-200/80 mt-3 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span className="max-w-[130px] leading-tight">Weights verified by assay certificates</span>
            <span className="font-semibold text-slate-800 leading-tight">100% Unallocated</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders & Settlements */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F1E32] font-serif">
                Recent Orders & Wire Settlements
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest acquisitions processed through PayPal & Bigfork Bank Wire
              </p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-[#D4AF37] hover:text-[#B58D27] flex items-center gap-1 transition-colors"
            >
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#F8FAFC] text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Collector</th>
                  <th className="px-4 py-3">Settlement (incl. 15% BP)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {(summary?.recentOrders || []).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {ord.customer_name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ${Number(ord.total_settlement).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ord.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Administrative Shortcuts */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#0F1E32] to-[#1E293B] rounded-2xl p-5 text-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#F5B52E]" />
              <h3 className="text-sm font-bold font-serif tracking-wide text-white">
                Storefront Control Center
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Direct access to numismatic cataloging, client settlements, and storefront parameters for Highlander Gold & Silver.
            </p>

            <div className="space-y-2">
              <Link
                to="/products"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#F5B52E]" />
                  Catalog New Lot Item
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/orders"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#F5B52E]" />
                  Record Bank Wire Settlement
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/customers"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F5B52E]" />
                  Add Customer / User
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/payments"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#F5B52E]" />
                  Review Payments & Wire Ledger
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between mt-4">
            <span>Highlander Storefront & Vault</span>
            <span className="text-[#F5B52E] font-mono">Bigfork, MT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
