import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, Users, UserCircle,
  BarChart3, Settings, Menu, X, LogOut, Bell, Search,
  Building2, ChevronDown, MessageSquare, Package, Tag,
  TrendingUp, Box, ShoppingCart, ShoppingBag, FileCheck,
  Truck, ClipboardList, Award, RefreshCw, User,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react';
import { useTranslation }        from 'react-i18next';
import { useAuth }               from '../hooks/useAuth';
import { usePurchaseAlerts }     from '@/hooks/usePurchaseAlerts';
import AlertsPanel               from '@/components/purchases/AlertsPanel';
import LanguageSwitcher          from '@/components/LanguageSwitcher';

export default function BackOfficeLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [stockMenuOpen,     setStockMenuOpen]      = useState(false);
  const [salesMenuOpen,     setSalesMenuOpen]      = useState(false);
  const [purchasesMenuOpen, setPurchasesMenuOpen]  = useState(false);
  const [alertsPanelOpen,   setAlertsPanelOpen]    = useState(false);
  const [userMenuOpen,      setUserMenuOpen]       = useState(false);
  ////treasury////////
  const [treasuryMenuOpen, setTreasuryMenuOpen] = useState(false);
  ////treasury////////

  const location   = useLocation();
  const { user, logout } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  // Alertes non lues (DB)
  const { data: alerts = [] } = usePurchaseAlerts(businessId);
  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

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
        { name: t('nav.supplierPayments'), href: '/app/purchases/payments',         icon: Receipt         },
        { name: t('nav.supplierIntelligence'),  href: '/app/purchases/supplier-intelligence', icon: Award           },
      ],
    },
    { name: t('nav.expenses'),      href: '/app/expenses',      icon: Receipt      },
    { name: t('nav.clients'),       href: '/app/clients',       icon: Users        },
    {
      name: t('nav.stock'), href: '/app/stock', icon: Package,
      subItems: [
        { name: t('nav.overview'),    href: '/app/stock',            icon: LayoutDashboard },
        { name: t('nav.products'),    href: '/app/stock/products',   icon: Box             },
        { name: t('nav.categories'),  href: '/app/stock/categories', icon: Tag             },
        { name: t('nav.movements'),   href: '/app/stock/movements',  icon: TrendingUp      },
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
        { name: 'Transactions', href: '/app/treasury/transactions', icon: ArrowRightLeft },
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
      >
        <div className="flex items-center gap-3">
          <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
          {item.name}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {item.subItems!.map(sub => {
            const isSubActive = location.pathname === sub.href;
            return (
              <Link key={sub.href} to={sub.href!}
                className={`sidebar-submenu-item flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isSubActive ? 'active bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={mobile ? () => setSidebarOpen(false) : undefined}
              >
                <sub.icon className={`h-4 w-4 ${isSubActive ? 'text-indigo-600' : 'text-gray-400'}`} />
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
            onClick={mobile ? () => setSidebarOpen(false) : undefined}
          >
            <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const avatarUrl = user?.avatarUrl;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile sidebar ──────────────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="sidebar-container fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col h-full">
          <div className="sidebar-header flex h-16 items-center justify-between px-6 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">NovaEntra</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* User Card in Mobile Sidebar */}
          <div className="p-4 flex-shrink-0 border-b border-gray-200">
            <div className="sidebar-user-card flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="sidebar-user-avatar h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={`http://localhost:3001${avatarUrl}`}
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

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto pb-6 min-h-0">
            <NavContent mobile />
          </nav>
          <div className="sidebar-footer p-4 border-t border-gray-200 flex-shrink-0">
            <button onClick={handleLogout}
              className="sidebar-logout-btn flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full">
              <LogOut className="h-5 w-5 text-gray-400" />
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
                    src={`http://localhost:3001${avatarUrl}`}
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

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6 min-h-0">
            <NavContent />
          </nav>
          <div className="sidebar-footer p-4 border-t border-gray-200 flex-shrink-0">
            <button onClick={handleLogout}
              className="sidebar-logout-btn flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full">
              <LogOut className="h-5 w-5 text-gray-400" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="lg:pl-72">
        <header className="top-header sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="search" placeholder={t('common.search') + '...'}
                  className="search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {/* ── Language switcher ──────────────────────────────────────── */}
            <LanguageSwitcher variant="navbar" />

            {/* ── Cloche notifications ───────────────────────────────────── */}
            <div ref={alertsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAlertsPanelOpen(o => !o)}
                className={`relative p-2 rounded-xl transition-colors ${
                  alertsPanelOpen
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {alertsPanelOpen && businessId && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 400, zIndex: 1000,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  borderRadius: 16,
                }}>
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
              >
                <div className="user-avatar h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={`http://localhost:3001${avatarUrl}`}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{getUserFullName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Mon Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
