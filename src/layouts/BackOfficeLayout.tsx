import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, Users, UserCircle,
  BarChart3, Settings, Menu, X, LogOut, Bell,
  Building2, ChevronDown, MessageSquare, Package, Tag,
  TrendingUp, Box, ShoppingCart, ShoppingBag, FileCheck,
  Truck, ClipboardList, Award, RefreshCw, User,
  Wallet,
  ArrowRightLeft,
  Warehouse,
  Archive,
  // ==================== Alaa change for service type ====================
  Briefcase,
  // ====================================================================
  Sparkles,
  Keyboard,
} from 'lucide-react';
import { useTranslation }        from 'react-i18next';
import { useAuth }               from '../hooks/useAuth';
import { usePurchaseAlerts }     from '@/hooks/usePurchaseAlerts';
import { useKeyboardShortcuts }  from '@/hooks/useKeyboardShortcuts';
import { useSidebarScroll }      from '@/hooks/useSidebarScroll';
import AlertsPanel               from '@/components/purchases/AlertsPanel';
import KeyboardShortcutsHelp     from '@/components/KeyboardShortcutsHelp';
import LanguageSwitcher          from '@/components/LanguageSwitcher';
import GlobalSearch              from '@/components/GlobalSearch';
import GlobalAIAssistant         from '@/components/GlobalAIAssistant';
import { PresenceProvider }      from '../context/PresenceContext';
import { getAssetUrl }           from '@/config/api.config';
import { useAIAccess }           from '../hooks/useAIAccess';

export default function BackOfficeLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [stockMenuOpen,     setStockMenuOpen]      = useState(false);
  const [salesMenuOpen,     setSalesMenuOpen]      = useState(false);
  const [purchasesMenuOpen, setPurchasesMenuOpen]  = useState(false);
  const [alertsPanelOpen,   setAlertsPanelOpen]    = useState(false);
  const [userMenuOpen,      setUserMenuOpen]       = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen]  = useState(false);
  ////treasury////////
  const [treasuryMenuOpen, setTreasuryMenuOpen] = useState(false);
  ////treasury////////

  const location   = useLocation();
  const { user, logout } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  // Refs to maintain sidebar scroll position
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  
  // Use custom hook to preserve sidebar scroll position
  useSidebarScroll();

  // Alertes non lues (DB)
  const { data: alerts = [] } = usePurchaseAlerts(businessId);
  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

  // Activer les raccourcis clavier
  useKeyboardShortcuts();

  // Fermer le panel alertes si clic en dehors
  const alertsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsPanelOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navigation traduite — recalculée quand la langue change
  const navigation = [
    { name: t('nav.dashboard'), href: '/app/dashboard', icon: LayoutDashboard },
    {
      name: t('nav.sales'), href: '/app/sales', icon: ShoppingCart,
      subItems: [
        { name: t('nav.dashboard'),  href: '/app/sales/dashboard',          icon: LayoutDashboard },
        { name: t('nav.clients'),    href: '/app/sales/clients',            icon: Users           },
        { name: t('nav.quotes'),     href: '/app/sales/quotes',             icon: FileCheck       },
        { name: t('nav.orders'),     href: '/app/sales/orders',             icon: ClipboardList   },
        { name: t('nav.deliveries'), href: '/app/sales/delivery-notes',     icon: Truck           },
        { name: t('nav.invoices'),   href: '/app/sales/invoices',           icon: FileText        },
        { name: 'Factures récurrentes', href: '/app/sales/recurring-invoices', icon: RefreshCw    },
      ],
    },
    {
      name: t('nav.purchases'), href: '/app/purchases', icon: ShoppingBag,
      subItems: [
        { name: t('nav.dashboard'),        href: '/app/purchases/dashboard',        icon: LayoutDashboard },
        { name: t('nav.suppliers'),        href: '/app/purchases/suppliers',        icon: Building2       },
        { name: t('nav.supplierOrders'),   href: '/app/purchases/orders',           icon: ClipboardList   },
        { name: t('nav.goodsReceipts'),    href: '/app/purchases/goods-receipts',   icon: Truck           },
        { name: t('nav.supplierInvoices'), href: '/app/purchases/invoices',         icon: FileText        },
        { name: t('nav.supplierIntelligence'),  href: '/app/purchases/supplier-intelligence', icon: Award           },
        // AI Feature - Only for Premium users
        ...(!aiLoading && hasAIAccess ? [{ name: 'Recommandations IA',      href: '/app/purchases/ml-predictions',   icon: Sparkles        }] : []),
      ],
    },
    {
      name: t('nav.stock'), href: '/app/stock', icon: Package,
      subItems: [
        { name: t('nav.overview'),    href: '/app/stock',            icon: LayoutDashboard },
        { name: t('nav.products'),    href: '/app/stock/products',   icon: Box             },
        // ==================== Alaa change for service type ====================
        { name: t('nav.services'),    href: '/app/stock/services',   icon: Briefcase       },
        { name: t('nav.serviceCategories'), href: '/app/stock/service-categories', icon: Tag },
        { name: t('nav.productCategories'), href: '/app/stock/categories', icon: Tag },
        // ====================================================================
        { name: t('nav.movements'),   href: '/app/stock/movements',  icon: TrendingUp      },
        { name: t('nav.warehouses'),  href: '/app/warehouses',       icon: Warehouse       },
        // Only show Archive to BUSINESS_OWNER and BUSINESS_ADMIN
        ...(user?.role === 'BUSINESS_OWNER' || user?.role === 'BUSINESS_ADMIN' 
          ? [{ name: t('nav.archive', { defaultValue: 'Archive' }), href: '/app/stock/archive', icon: Archive }] 
          : []),
      ],
    },
    {
      name: t('treasury'),
      href: '/app/treasury',
      icon: Wallet,
      subItems: [
        { name: 'Accounts', href: '/app/treasury/accounts', icon: Building2 },
        { name: 'Invoices', href: '/app/treasury/invoices', icon: FileText },
        { name: 'Expenses to Pay', href: '/app/treasury/expenses', icon: Receipt },
        { name: 'Salary to Pay', href: '/app/treasury/salaries', icon: Users },
        { name: 'Transactions', href: '/app/treasury/transactions', icon: ArrowRightLeft },
        { name: 'Recurring Invoices', href: '/app/treasury/recurring-invoices', icon: RefreshCw },
      ],
    },
    // Hide Team section for TEAM_MEMBER role
    ...(user?.role !== 'TEAM_MEMBER' ? [{ name: t('nav.team'), href: '/app/team', icon: UserCircle }] : []),
    { name: t('nav.collaboration'), href: '/app/collaboration', icon: MessageSquare },
    { name: t('nav.reports'),       href: '/app/reports',       icon: BarChart3     },
    { name: t('nav.settings'),      href: '/app/settings',      icon: Settings      },
  ];

  const isStockActive     = location.pathname.startsWith('/app/stock');
  const isSalesActive     = location.pathname.startsWith('/app/sales');
  const isPurchasesActive = location.pathname.startsWith('/app/purchases');
  //////////////treasury////////////////
  const isTreasuryActive = location.pathname.startsWith('/app/treasury');
  ///////////////treasury////////////////

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const getUserFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Utilisateur';
  };

  const getRoleLabel = (role: string) => {
    // Return the role as-is from the enum
    return role || 'TEAM_MEMBER';
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/app/settings');
  };

  // ── Sous-menu générique ───────────────────────────────────────────────────
  const SubMenu = ({
    item, isActive, isOpen, onToggle, mobile = false,
  }: {
    item: typeof navigation[0]; isActive: boolean;
    isOpen: boolean; onToggle: () => void; mobile?: boolean;
  }) => (
    <div>
      <button
        onClick={onToggle}
        className={`sidebar-nav-item flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive ? 'active bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-expanded={isOpen}
        aria-controls={`submenu-${item.href.replace(/\//g, '-')}`}
        aria-label={`${item.name} - ${isOpen ? 'Fermer' : 'Ouvrir'} le sous-menu`}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
          {item.name}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          className="ml-4 mt-1 space-y-1"
          id={`submenu-${item.href.replace(/\//g, '-')}`}
          role="menu"
          aria-label={`Sous-menu ${item.name}`}
        >
          {item.subItems!.map(sub => {
            const isSubActive = location.pathname === sub.href;
            return (
              <Link key={sub.href} to={sub.href!}
                className={`sidebar-submenu-item flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isSubActive ? 'active bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  // Save scroll position before navigation
                  const scrollPos = e.currentTarget.closest('nav')?.scrollTop || 0;
                  navigate(sub.href!, { preventScrollReset: true });
                  // Restore scroll position after navigation
                  requestAnimationFrame(() => {
                    const nav = document.querySelector('nav[aria-label="Menu principal"]') || 
                                document.querySelector('nav[aria-label="Menu principal mobile"]');
                    if (nav) nav.scrollTop = scrollPos;
                  });
                  if (mobile) setSidebarOpen(false);
                }}
                role="menuitem"
                aria-label={sub.name}
                aria-current={isSubActive ? 'page' : undefined}
              >
                <sub.icon className={`h-4 w-4 ${isSubActive ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  const NavContent = ({ mobile = false }) => (
    <>
      {navigation.map(item => {
        const isActive    = location.pathname === item.href;
        const hasSubItems = item.subItems && item.subItems.length > 0;

        if (hasSubItems && item.href === '/app/sales') {
          return <SubMenu key={item.href} item={item} isActive={isSalesActive}
            isOpen={salesMenuOpen} onToggle={() => setSalesMenuOpen(o => !o)} mobile={mobile} />;
        }
        if (hasSubItems && item.href === '/app/purchases') {
          return <SubMenu key={item.href} item={item} isActive={isPurchasesActive}
            isOpen={purchasesMenuOpen} onToggle={() => setPurchasesMenuOpen(o => !o)} mobile={mobile} />;
        }
        if (hasSubItems && item.href === '/app/stock') {
          return <SubMenu key={item.href} item={item} isActive={isStockActive}
            isOpen={stockMenuOpen} onToggle={() => setStockMenuOpen(o => !o)} mobile={mobile} />;
        }
        ///////////////treasury////////////////
        if (hasSubItems && item.href === '/app/treasury') {
          return (
            <SubMenu
              key={item.href}
              item={item}
              isActive={isTreasuryActive}
              isOpen={treasuryMenuOpen}
              onToggle={() => setTreasuryMenuOpen(o => !o)}
              mobile={mobile}
            />
          );
        }
        ///////////////treasury////////////////

        return (
          <Link key={item.href} to={item.href!}
            className={`sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'active bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              // Save scroll position before navigation
              const scrollPos = e.currentTarget.closest('nav')?.scrollTop || 0;
              navigate(item.href!, { preventScrollReset: true });
              // Restore scroll position after navigation
              requestAnimationFrame(() => {
                const nav = document.querySelector('nav[aria-label="Menu principal"]') || 
                            document.querySelector('nav[aria-label="Menu principal mobile"]');
                if (nav) nav.scrollTop = scrollPos;
              });
              if (mobile) setSidebarOpen(false);
            }}
            aria-label={item.name}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const avatarUrl = user?.avatarUrl;

  return (
    <PresenceProvider>
      <div className="min-h-screen bg-gray-50">

      {/* ── Mobile sidebar ──────────────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="sidebar-container fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col h-full">
          <div className="sidebar-header flex h-16 items-center justify-between px-6 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">NovaEntra</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu de navigation"
            >
              <X className="h-6 w-6 text-gray-500" aria-hidden="true" />
            </button>
          </div>

          {/* User Card in Mobile Sidebar */}
          <div className="p-4 flex-shrink-0 border-b border-gray-200">
            <div className="sidebar-user-card flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="sidebar-user-avatar h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={getAssetUrl(avatarUrl)}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold">{getUserInitials()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getUserFullName()}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user?.role || '')}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto pb-6 min-h-0" role="navigation" aria-label="Menu principal mobile">
            <NavContent mobile />
          </nav>
          <div className="sidebar-footer p-4 border-t border-gray-200 flex-shrink-0">
            <button onClick={handleLogout}
              className="sidebar-logout-btn flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
              aria-label="Se déconnecter de l'application"
            >
              <LogOut className="h-5 w-5 text-gray-400" aria-hidden="true" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="sidebar-container flex flex-col h-full bg-white border-r border-gray-200">
          <div className="sidebar-header flex h-16 items-center gap-2 px-6 border-b border-gray-200 flex-shrink-0">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">NovaEntra</span>
          </div>

          {/* User Card in Desktop Sidebar */}
          <div className="p-4 flex-shrink-0 border-b border-gray-200">
            <div className="sidebar-user-card flex items-center gap-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
              <div className="sidebar-user-avatar h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={getAssetUrl(avatarUrl)}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">{getUserInitials()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{getUserFullName()}</p>
                <p className="text-xs text-indigo-600 font-medium">{getRoleLabel(user?.role || '')}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6 min-h-0" role="navigation" aria-label="Menu principal">
            <NavContent />
          </nav>
          <div className="sidebar-footer p-4 border-t border-gray-200 flex-shrink-0">
            <button onClick={handleLogout}
              className="sidebar-logout-btn flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
              aria-label="Se déconnecter de l'application"
            >
              <LogOut className="h-5 w-5 text-gray-400" aria-hidden="true" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="lg:pl-72">
        <header className="top-header sticky top-0 z-40 bg-white border-b border-gray-200" role="banner">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex-1 flex items-center gap-4">
              <GlobalSearch />
            </div>

            {/* ── Language switcher ──────────────────────────────────────── */}
            <LanguageSwitcher variant="navbar" />

            {/* ── Bouton Aide Raccourcis Clavier ────────────────────────── */}
            <button
              onClick={() => setShortcutsHelpOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Raccourcis clavier"
              aria-label="Afficher l'aide des raccourcis clavier"
            >
              <Keyboard className="h-6 w-6" />
            </button>

            {/* ── Cloche notifications ───────────────────────────────────── */}
            <div ref={alertsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAlertsPanelOpen(o => !o)}
                className={`relative p-2 rounded-xl transition-colors ${
                  alertsPanelOpen
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} non lues)` : ''}`}
                aria-expanded={alertsPanelOpen}
                aria-controls="alerts-panel"
                aria-describedby={unreadCount > 0 ? 'unread-count' : undefined}
              >
                <Bell className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span 
                    id="unread-count"
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    aria-label={`${unreadCount} notifications non lues`}
                    role="status"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {alertsPanelOpen && businessId && (
                <div 
                  id="alerts-panel"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 400, zIndex: 1000,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                    borderRadius: 16,
                  }}
                  role="region"
                  aria-label="Panneau des notifications"
                >
                  <AlertsPanel
                    businessId={businessId}
                    onNavigate={(entityType) => {
                      setAlertsPanelOpen(false);
                      if (entityType === 'PurchaseInvoice') window.location.href = '/app/purchases/invoices';
                      else if (entityType === 'SupplierPO') window.location.href = '/app/purchases/orders';
                      else if (entityType === 'Supplier')   window.location.href = '/app/purchases/suppliers';
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── User Avatar Dropdown ───────────────────────────────────── */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label={`Menu utilisateur: ${getUserFullName()}`}
                aria-expanded={userMenuOpen}
                aria-controls="user-menu"
                aria-haspopup="true"
              >
                <div className="user-avatar h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={getAssetUrl(avatarUrl)}
                      alt={`Photo de profil de ${getUserFullName()}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium" aria-label={`Initiales: ${getUserInitials()}`}>{getUserInitials()}</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div 
                  id="user-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  role="menu"
                  aria-label="Menu utilisateur"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{getUserFullName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    role="menuitem"
                    aria-label="Accéder à mon profil"
                  >
                    <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    Mon Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    role="menuitem"
                    aria-label="Se déconnecter"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="p-4 sm:p-6 lg:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Modal Aide Raccourcis Clavier ──────────────────────────────── */}
      <KeyboardShortcutsHelp
        isOpen={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />

      {/* ── Global AI Assistant ──────────────────────────────────────────── */}
      <GlobalAIAssistant />
      </div>
    </PresenceProvider>
  );
}
