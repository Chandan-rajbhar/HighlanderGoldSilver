import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coins, 
  Layers, 
  ShoppingBag, 
  CreditCard,
  Users,
  MessageSquareQuote, 
  Settings,
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen,
  inquiriesCount = 1
}) => {
  const location = useLocation();
  const { adminUser } = useAuth();

  const navGroups = [
    {
      group: 'STOREFRONT MANAGEMENT',
      items: [
        {
          to: '/',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          badge: null
        },
        {
          to: '/inventory',
          alternateTo: '/products',
          label: 'Product Catalog',
          icon: Coins,
          badge: '10'
        },
        {
          to: '/categories',
          label: 'Categories & Metals',
          icon: Layers,
          badge: null
        },
        {
          to: '/orders',
          label: 'Orders',
          icon: ShoppingBag,
          badge: null
        },
        {
          to: '/inquiries',
          label: 'Inquiries & Buyb...',
          icon: MessageSquareQuote,
          badge: inquiriesCount > 0 ? `${inquiriesCount} new` : null,
          badgeColor: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
        }
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        {
          to: '/customers',
          label: 'Users',
          icon: Users,
          badge: null
        },
        {
          to: '/payments',
          label: 'Payments',
          icon: CreditCard,
          badge: null
        }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        {
          to: '/settings',
          label: 'Settings',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Aside - Deep Navy Blue Canvas */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B1B30] bg-gradient-to-b from-[#0F223A] via-[#0B1B30] to-[#071322] text-slate-200 border-r border-[#1B324E] transition-all duration-300 ease-in-out shadow-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64 w-72'
        }`}
      >
        {/* Brand Header with New Mountain Logo */}
        <div className="pt-6 pb-5 px-4 flex flex-col items-center justify-center border-b border-white/10 bg-white/[0.02] relative">
          <Link to="/" className="flex flex-col items-center text-center group w-full">
            {!isCollapsed ? (
              <div className="flex flex-col items-center w-full px-2">
                {/* Horizontal Mountain Brand Logo */}
                <img
                  src="/assets/brand/highlander_dashboard_logo.png"
                  alt="Highlander Gold & Silver"
                  className="w-full max-w-[200px] h-auto object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/brand/highlander_crest_favicon.png";
                  }}
                />

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-mono text-[#E5C365] tracking-wider shadow-xs backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span>ADMIN CONSOLE • BIGFORK</span>
                </div>
              </div>
            ) : (
              /* Collapsed view crest icon */
              <div className="w-11 h-11 rounded-xl bg-white/10 p-2 border border-[#C9A23A]/50 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/assets/brand/highlander_crest_favicon.png"
                  alt="Highlander Gold & Silver"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={group.group || groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                  {group.group}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isCurrentActive = location.pathname === item.to || 
                  (item.alternateTo && location.pathname === item.alternateTo);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={() =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${
                        isCurrentActive
                          ? 'bg-[#152B47] text-white font-semibold shadow-xs border border-[#C9A23A]/70'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                      }`
                    }
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
                        isCurrentActive ? 'text-[#F5B52E]' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                    )}

                    {!isCollapsed && isCurrentActive && (
                      <span className="w-2 h-2 rounded-full bg-[#F5B52E] shrink-0 ml-auto shadow-xs" />
                    )}

                    {!isCollapsed && !isCurrentActive && item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.badgeColor || 'bg-white/15 text-slate-200 border border-white/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}


        </div>

        {/* Admin User Footer on Navy Sidebar */}
        <div className="p-3.5 border-t border-white/10 bg-[#06111E]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#12263F] border border-[#C9A23A]/70 flex items-center justify-center text-[#F5B52E] font-bold text-xs shrink-0 font-sans shadow-xs">
              AM
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate font-sans">
                  {adminUser?.name || 'Alexander MacLeod'}
                </span>
                <span className="text-[10px] text-slate-400 truncate font-sans">
                  {adminUser?.role || 'Senior Numismatist & Vault Director'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
