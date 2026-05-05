// src/console/layouts/PlatformAdminLayout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { platformTenantsService } from '@/services/platform/platformTenants.service';
import { platformSupportService } from '@/services/platform/platformSupport.service';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LifeBuoy,
  FileText,
  Activity,
  LogOut,
  CheckCircle,
  AlertCircle,
  Mail,
  Shield,
  Sparkles,
} from 'lucide-react';

const navigation = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', href: '/console/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/console/analytics', icon: Activity },
    ],
  },
  {
    section: 'Management',
    items: [
      { name: 'Tenants', href: '/console/tenants', icon: Users, badge: 'pendingApprovals' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { name: 'Subscriptions', href: '/console/subscriptions', icon: CreditCard },
      { name: 'Plans & Pricing', href: '/console/plans', icon: FileText },
      { name: 'AI Pricing Assistant', href: '/console/ai-pricing', icon: Sparkles },
      { name: 'Overdue', href: '/console/subscriptions/overdue', icon: AlertCircle, badge: 'overdue' },
    ],
  },
  {
    section: 'Platform',
    items: [
      { name: 'Support Tickets', href: '/console/support', icon: LifeBuoy, badge: 'tickets' },
      { name: 'Audit Log', href: '/console/audit-log', icon: FileText },
      { name: 'System Health', href: '/console/system-health', icon: Activity },
    ],
  },
  {
    section: 'Config',
    items: [
      { name: 'Email Templates', href: '/console/email-templates', icon: Mail },
      { name: 'Security Settings', href: '/console/security', icon: Shield },
    ],
  },
];

export function PlatformAdminLayout() {
  const { admin, logout } = usePlatformAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch badge counts
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => platformTenantsService.getPendingApprovals(),
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: openTickets } = useQuery({
    queryKey: ['open-tickets'],
    queryFn: () => platformSupportService.listTickets({ status: 'open', limit: 1 }),
    refetchInterval: 60000,
  });

  const badges = {
    pendingApprovals: pendingApprovals?.length || 0,
    tickets: openTickets?.meta?.total || 0,
    overdue: 0, // TODO: Fetch overdue count
  };

  const currentPage = navigation
    .flatMap((section) => section.items)
    .find((item) => location.pathname === item.href)?.name || 'Dashboard';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-[#534AB7]">NovEntra Console</h1>
          <p className="text-sm text-gray-500 mt-1">Platform Admin</p>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          {navigation.map((section) => (
            <div key={section.section} className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.section}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : 0;

                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                        transition-colors
                        ${
                          isActive
                            ? 'bg-[#534AB7] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {badgeCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {badgeCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[#534AB7] flex items-center justify-center text-white font-medium">
              {admin?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{admin?.email}</p>
              <p className="text-xs text-gray-500">Platform Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentPage}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
