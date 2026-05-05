// src/console/pages/ConsoleDashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { platformDashboardService } from '@/services/platform/platformDashboard.service';
import { platformTenantsService } from '@/services/platform/platformTenants.service';
import { platformSupportService } from '@/services/platform/platformSupport.service';
import { platformAuditService } from '@/services/platform/platformAudit.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ConsoleDashboardPage() {
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => platformDashboardService.getSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => platformDashboardService.getRevenueTrend(8),
    staleTime: 5 * 60 * 1000,
  });

  const { data: planBreakdown } = useQuery({
    queryKey: ['plan-breakdown'],
    queryFn: () => platformDashboardService.getPlanBreakdown(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentTenants } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: () => platformTenantsService.listTenants({ limit: 5 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: openTickets } = useQuery({
    queryKey: ['open-tickets-dashboard'],
    queryFn: () => platformSupportService.listTickets({ status: 'open', limit: 5 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentAuditLogs } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => platformAuditService.listAuditLogs({ limit: 6 }),
    staleTime: 2 * 60 * 1000,
  });

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#534AB7] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasAlerts = (summary?.tenants.pendingApproval || 0) > 0 || (summary?.revenue.overdueAmount || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-3">
          {(summary?.tenants.pendingApproval || 0) > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {summary?.tenants.pendingApproval} tenant(s) pending approval.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#534AB7]"
                  onClick={() => navigate('/console/tenants/pending')}
                >
                  Review now
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {(summary?.revenue.overdueAmount || 0) > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ${summary?.revenue.overdueAmount.toFixed(2)} in overdue subscriptions.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-white underline"
                  onClick={() => navigate('/console/subscriptions/overdue')}
                >
                  View details
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.tenants.active || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{summary?.tenants.newThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.revenue.mrr.toFixed(0) || 0}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +${summary?.revenue.newMrrThisMonth.toFixed(0) || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.users.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{summary?.users.newThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.churnRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Trial conversion: {summary?.trialConversionRate.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 8 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mrr" fill="#534AB7" name="MRR" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Breakdown & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planBreakdown?.map((plan) => (
                <div key={plan.planId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        plan.planName.toLowerCase().includes('enterprise')
                          ? 'default'
                          : plan.planName.toLowerCase().includes('premium')
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        plan.planName.toLowerCase().includes('enterprise')
                          ? 'bg-purple-600'
                          : plan.planName.toLowerCase().includes('premium')
                          ? 'bg-blue-600'
                          : ''
                      }
                    >
                      {plan.planName}
                    </Badge>
                    <span className="text-sm text-gray-600">{plan.tenantCount} tenants</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${plan.monthlyRevenue.toFixed(0)}/mo</div>
                    <div className="text-xs text-gray-500">{plan.percentageOfTotal.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTenants?.data.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-sm font-medium">
                      {tenant.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tenant.name}</div>
                      <div className="text-xs text-gray-500">{tenant.owner?.email || 'No owner'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        tenant.status === 'active'
                          ? 'bg-green-500'
                          : tenant.status === 'suspended'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/console/tenants/${tenant.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Open Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openTickets?.data.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          ticket.priority === 'high'
                            ? 'destructive'
                            : ticket.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                      <span className="text-sm font-medium">{ticket.subject}</span>
                    </div>
                    <div className="text-xs text-gray-500">{ticket.tenant.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/console/support')}
                  >
                    View
                  </Button>
                </div>
              ))}
              {(!openTickets?.data || openTickets.data.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No open tickets</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAuditLogs?.data.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">{log.admin?.email?.[0]?.toUpperCase() || 'A'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{log.admin?.email || 'Unknown'}</span>
                      <span className="text-gray-600"> {log.action}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
