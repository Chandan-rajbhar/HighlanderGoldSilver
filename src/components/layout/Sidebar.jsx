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
  ExternalLink,
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
          label: 'Customer Inquiries',
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

      {/* Sidebar Aside - Highlander Brand-Inspired Blue Glassmorphism */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col text-slate-100 border-r border-[#D8EBFA]/20 transition-all duration-300 ease-in-out shadow-[4px_0_24px_-2px_rgba(11,45,82,0.28)] overflow-hidden backdrop-blur-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64 w-72'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0B2B4E 0%, #114275 32%, #165A96 68%, #0D3560 100%)'
        }}
      >
        {/* Subtle Frosted-Glass Depth & Soft Atmospheric Glow Layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Soft Icy-Blue Light Highlight at Top-Right */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#1685D4]/20 blur-3xl" />
          
          {/* Soft Mountain Blue Glow in Center */}
          <div className="absolute top-1/3 -left-12 w-52 h-52 rounded-full bg-[#2072BD]/20 blur-3xl" />
          
          {/* Gentle Lower Icy Sheen */}
          <div className="absolute bottom-20 -right-10 w-40 h-40 rounded-full bg-[#D8EBFA]/15 blur-2xl" />
          
          {/* Translucent Frosted Glass Sheen Overlay */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[1px]" />
        </div>

        {/* Brand Header with Mountain Logo */}
        <div className="relative z-10 pt-6 pb-5 px-4 flex flex-col items-center justify-center border-b border-white/10 bg-white/[0.03] backdrop-blur-xs shrink-0">
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
            className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation list */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={group.group || groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D8EBFA]/75 font-sans">
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
                          ? 'bg-white/15 text-white font-semibold shadow-[0_2px_12px_rgba(22,133,212,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#D6AD43]/75 backdrop-blur-xs'
                          : 'text-slate-200 hover:bg-white/[0.12] hover:text-white border border-transparent'
                      }`
                    }
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
                        isCurrentActive ? 'text-[#F5B52E] drop-shadow-[0_0_6px_rgba(245,181,46,0.6)]' : 'text-slate-300 group-hover:text-white'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                    )}

                    {!isCollapsed && isCurrentActive && (
                      <span className="w-2 h-2 rounded-full bg-[#F5B52E] shadow-[0_0_6px_rgba(245,181,46,0.8)] shrink-0 ml-auto" />
                    )}

                    {!isCollapsed && !isCurrentActive && item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.badgeColor || 'bg-white/15 text-slate-100 border border-white/20'
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

        {/* Admin User Footer with subtle glass styling */}
        <div className="relative z-10 p-3.5 border-t border-white/10 bg-[#071E38]/60 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#0F2D52] border border-[#D6AD43]/70 flex items-center justify-center text-[#F5B52E] font-bold text-xs shrink-0 font-serif shadow-xs">
              AM
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate font-sans">
                  {adminUser?.name || 'Alexander MacLeod'}
                </span>
                <span className="text-[10px] text-slate-300 truncate font-sans">
                  {adminUser?.role || 'Senior Numismatist & Vault Director'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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

export default Sidebar;
