import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Calculator, DollarSign, Scale, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { useSpotPrices } from '../context/SpotPriceContext';
import { useToast } from '../context/ToastContext';

const PRESETS = [
  { name: 'Morgan / Peace Silver Dollar (90% Silver)', metal: 'silver', weightOz: 0.7734 },
  { name: 'Pre-1933 $20 Saint-Gaudens / Liberty (90% Gold)', metal: 'gold', weightOz: 0.9675 },
  { name: '10 oz .999 Fine Silver Bar (Scottsdale Stacker)', metal: 'silver', weightOz: 10.0 },
  { name: '1 oz .999 Fine Gold Bullion Round', metal: 'gold', weightOz: 1.0 },
  { name: '1 oz .999 Fine Silver Eagle / Round', metal: 'silver', weightOz: 1.0 },
  { name: '90% Silver Half Dollar (Walkers, Franklins, 1964 Kennedy)', metal: 'silver', weightOz: 0.3617 },
];

export const SpotPrices = () => {
  const { spots, refreshPrices, lastUpdated } = useSpotPrices();
  const { toast } = useToast();

  const [selectedMetal, setSelectedMetal] = useState('gold');
  const [weight, setWeight] = useState(1);
  const [purity, setPurity] = useState(100); // 100% fine

  const handleRefresh = () => {
    refreshPrices();
    toast.success('Precious metal market benchmark refreshed!');
  };

  const applyPreset = (preset) => {
    setSelectedMetal(preset.metal);
    setWeight(preset.weightOz);
    setPurity(100);
  };

  const currentSpotPrice = spots[selectedMetal]?.price || 0;
  const calculatedMeltValue = (weight * (purity / 100)) * currentSpotPrice;
  const numismaticValueWith15PctPremium = calculatedMeltValue * 1.15;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Precious Metals Spot Benchmark & Melt Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time physical bullion spot reference and numismatic melt evaluation tool.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gold" />
          Update Live Benchmark
        </button>
      </div>

      {/* Spot Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gold */}
        <div className="bg-white rounded-2xl p-5 border border-gold-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-gold-surface text-gold-dark text-xs font-bold uppercase tracking-wider font-mono">
              XAU / USD
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-600 font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {spots.gold.changePct}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-medium">Fine Gold Spot (1 Troy Oz)</span>
            <span className="text-3xl font-bold font-mono text-slate-900 mt-1 block">
              ${spots.gold.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>24h Range</span>
            <span className="font-mono text-slate-700">
              ${spots.gold.low24h.toFixed(1)} – ${spots.gold.high24h.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Silver */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider font-mono">
              XAG / USD
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-600 font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {spots.silver.changePct}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-medium">Fine Silver Spot (1 Troy Oz)</span>
            <span className="text-3xl font-bold font-mono text-slate-900 mt-1 block">
              ${spots.silver.price.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>24h Range</span>
            <span className="font-mono text-slate-700">
              ${spots.silver.low24h.toFixed(2)} – ${spots.silver.high24h.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Platinum */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider font-mono">
              XPT / USD
            </span>
            <span className="flex items-center text-xs font-semibold text-rose-500 font-mono">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {spots.platinum.changePct}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-medium">Fine Platinum Spot (1 Troy Oz)</span>
            <span className="text-3xl font-bold font-mono text-slate-900 mt-1 block">
              ${spots.platinum.price.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>24h Range</span>
            <span className="font-mono text-slate-700">
              ${spots.platinum.low24h.toFixed(2)} – ${spots.platinum.high24h.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Numismatic Melt & Premium Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-aubergine">
            <Calculator className="w-5 h-5 text-gold" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Bullion & Numismatic Melt Value Calculator
            </h3>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Common Presets & Coin Standards
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-gold/50 hover:bg-slate-50 transition-colors text-xs text-slate-800"
                >
                  <span className="font-semibold block">{p.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {p.weightOz} oz {p.metal}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Metal Type
              </label>
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="gold">Gold (AU)</option>
                <option value="silver">Silver (AG)</option>
                <option value="platinum">Platinum (PT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Troy Ounces
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fineness / Purity (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={purity}
                onChange={(e) => setPurity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Calculation Result Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-aubergine-dark to-aubergine rounded-2xl p-6 text-white shadow-elevated flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gold uppercase tracking-widest font-mono">
              Highlander Melt Valuation
            </span>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-300 block">Raw Intrinsic Metal Value</span>
                <span className="text-3xl font-bold font-mono text-white mt-1 block">
                  ${calculatedMeltValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-aubergine-light/70 border border-aubergine-muted">
                <span className="text-xs text-gold font-semibold block">
                  With 15% Highlander Buyer's Premium
                </span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                  ${numismaticValueWith15PctPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              Note: Rare certified numismatics (such as MS-65 Morgan dollars or Ultra Cameo proof patterns) trade at significant collector premiums over melt value.
            </p>
          </div>

          <div className="pt-4 border-t border-aubergine-light text-[11px] text-slate-400 flex items-center justify-between">
            <span>Highlander Gold & Silver</span>
            <span className="font-mono text-gold">Bigfork, MT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

