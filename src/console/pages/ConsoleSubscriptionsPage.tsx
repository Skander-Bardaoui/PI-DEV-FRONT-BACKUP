// src/console/pages/ConsoleSubscriptionsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformSubscriptionsService } from '@/services/platform/platformSubscriptions.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  AlertCircle, 
  Clock, 
  MoreVertical,
  Mail,
  CheckCircle,
  XCircle,
  Ban,
  Calendar,
  DollarSign,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';

type ActionType = 'cancel' | 'reactivate' | 'suspend' | 'unsuspend' | 'markPaid' | null;

export function ConsoleSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<ActionType>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', activeTab, page],
    queryFn: () =>
      platformSubscriptionsService.listSubscriptions({
        page,
        limit: 20,
        status: activeTab === 'all' ? undefined : activeTab,
      }),
  });

  const resendPaymentEmailMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.resendPaymentEmail(id),
    onSuccess: (data) => {
      toast.success(`✅ Payment email resent to ${data.sentTo}`);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to resend payment email';
      toast.error(`❌ ${message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.cancelSubscription(id),
    onSuccess: () => {
      toast.success('✅ Subscription cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setActionDialog(null);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to cancel subscription';
      toast.error(`❌ ${message}`);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.reactivateSubscription(id),
    onSuccess: () => {
      toast.success('✅ Subscription reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setActionDialog(null);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reactivate subscription';
      toast.error(`❌ ${message}`);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.suspendSubscription(id),
    onSuccess: () => {
      toast.success('✅ Subscription suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setActionDialog(null);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to suspend subscription';
      toast.error(`❌ ${message}`);
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.unsuspendSubscription(id),
    onSuccess: () => {
      toast.success('✅ Subscription unsuspended successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setActionDialog(null);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to unsuspend subscription';
      toast.error(`❌ ${message}`);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => platformSubscriptionsService.updateSubscription(id, { status: 'active' }),
    onSuccess: () => {
      toast.success('✅ Subscription marked as paid and activated');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setActionDialog(null);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to mark subscription as paid';
      toast.error(`❌ ${message}`);
    },
  });

  const handleAction = () => {
    if (!selectedSubscription) return;

    switch (actionDialog) {
      case 'cancel':
        cancelMutation.mutate(selectedSubscription.id);
        break;
      case 'reactivate':
        reactivateMutation.mutate(selectedSubscription.id);
        break;
      case 'suspend':
        suspendMutation.mutate(selectedSubscription.id);
        break;
      case 'unsuspend':
        unsuspendMutation.mutate(selectedSubscription.id);
        break;
      case 'markPaid':
        markPaidMutation.mutate(selectedSubscription.id);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      active: { variant: 'default', label: 'Active', icon: CheckCircle },
      trial: { variant: 'secondary', label: 'Trial', icon: Clock },
      pending_payment: { variant: 'secondary', label: 'Pending Payment', icon: Clock },
      payment_submitted: { variant: 'secondary', label: 'Payment Submitted', icon: Clock },
      overdue: { variant: 'destructive', label: 'Overdue', icon: AlertCircle },
      suspended: { variant: 'outline', label: 'Suspended', icon: Ban },
      cancelled: { variant: 'outline', label: 'Cancelled', icon: XCircle },
    };
    const config = variants[status] || { variant: 'secondary', label: status, icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (planName: string) => {
    if (planName.toLowerCase().includes('enterprise')) {
      return <Badge className="bg-purple-600">Enterprise</Badge>;
    }
    if (planName.toLowerCase().includes('premium')) {
      return <Badge className="bg-blue-600">Premium</Badge>;
    }
    if (planName.toLowerCase().includes('pro')) {
      return <Badge className="bg-indigo-600">Pro</Badge>;
    }
    return <Badge variant="outline">{planName}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${Number(amount).toFixed(3)} TND`;
  };

  const canResendPaymentEmail = (status: string) => {
    return ['pending_payment', 'overdue'].includes(status);
  };

  const canCancel = (status: string) => {
    return !['cancelled'].includes(status);
  };

  const canReactivate = (status: string) => {
    return ['cancelled', 'suspended'].includes(status);
  };

  const canSuspend = (status: string) => {
    return ['active', 'trial', 'overdue'].includes(status);
  };

  const canUnsuspend = (status: string) => {
    return status === 'suspended';
  };

  const canMarkPaid = (status: string) => {
    return ['pending_payment', 'overdue', 'payment_submitted'].includes(status);
  };

  const filteredData = subscriptions?.data || [];
  const totalCount = subscriptions?.meta?.total || 0;

  // Calculate stats
  const activeCount = filteredData.filter((s) => s.status === 'active').length;
  const trialCount = filteredData.filter((s) => s.status === 'trial').length;
  const overdueCount = filteredData.filter((s) => s.status === 'overdue').length;
  const pendingPaymentCount = filteredData.filter((s) => s.status === 'pending_payment').length;

  const getActionDialogContent = () => {
    const actions = {
      cancel: {
        title: 'Cancel Subscription',
        description: `Are you sure you want to cancel the subscription for ${selectedSubscription?.tenant.name}? This will immediately terminate their access.`,
        icon: XCircle,
        color: 'text-red-600',
        buttonText: 'Cancel Subscription',
        buttonClass: 'bg-red-600 hover:bg-red-700',
      },
      reactivate: {
        title: 'Reactivate Subscription',
        description: `Reactivate the subscription for ${selectedSubscription?.tenant.name}? This will restore their access and start a new billing period.`,
        icon: PlayCircle,
        color: 'text-green-600',
        buttonText: 'Reactivate Subscription',
        buttonClass: 'bg-green-600 hover:bg-green-700',
      },
      suspend: {
        title: 'Suspend Subscription',
        description: `Suspend the subscription for ${selectedSubscription?.tenant.name}? They will lose access immediately but can be reactivated later.`,
        icon: Ban,
        color: 'text-orange-600',
        buttonText: 'Suspend Subscription',
        buttonClass: 'bg-orange-600 hover:bg-orange-700',
      },
      unsuspend: {
        title: 'Unsuspend Subscription',
        description: `Unsuspend the subscription for ${selectedSubscription?.tenant.name}? This will restore their access.`,
        icon: CheckCircle,
        color: 'text-blue-600',
        buttonText: 'Unsuspend Subscription',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
      },
      markPaid: {
        title: 'Mark as Paid',
        description: `Mark the subscription for ${selectedSubscription?.tenant.name} as paid? This will activate their subscription immediately.`,
        icon: CheckCircle,
        color: 'text-green-600',
        buttonText: 'Mark as Paid & Activate',
        buttonClass: 'bg-green-600 hover:bg-green-700',
      },
    };

    return actionDialog ? actions[actionDialog] : null;
  };

  const dialogContent = getActionDialogContent();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trial</p>
                <p className="text-2xl font-bold">{trialCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payment</p>
                <p className="text-2xl font-bold">{pendingPaymentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="trial">Trial ({trialCount})</TabsTrigger>
              <TabsTrigger value="pending_payment">Pending ({pendingPaymentCount})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#534AB7] mx-auto"></div>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No subscriptions found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Billing</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Current Period</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((subscription) => {
                        const amount = subscription.billing_cycle === 'monthly'
                          ? subscription.plan.price_monthly
                          : subscription.plan.price_annual;

                        return (
                          <TableRow key={subscription.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">{subscription.tenant.name}</div>
                                <div className="text-sm text-gray-500">{subscription.tenant.owner?.email || 'No owner'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getPlanBadge(subscription.plan.name)}</TableCell>
                            <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {subscription.billing_cycle}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(amount)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')} - {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {subscription.next_billing_at ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(subscription.next_billing_at).toLocaleDateString('fr-FR')}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  {canResendPaymentEmail(subscription.status) && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => resendPaymentEmailMutation.mutate(subscription.id)}
                                        disabled={resendPaymentEmailMutation.isPending}
                                        className="flex items-center gap-2"
                                      >
                                        <Mail className="h-4 w-4" />
                                        {resendPaymentEmailMutation.isPending ? 'Sending...' : 'Resend Payment Email'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  
                                  {canMarkPaid(subscription.status) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setActionDialog('markPaid');
                                      }}
                                      className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}

                                  {canReactivate(subscription.status) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setActionDialog('reactivate');
                                      }}
                                      className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                    >
                                      <PlayCircle className="h-4 w-4" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}

                                  {canSuspend(subscription.status) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setActionDialog('suspend');
                                      }}
                                      className="flex items-center gap-2 text-orange-600 focus:text-orange-600"
                                    >
                                      <Ban className="h-4 w-4" />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}

                                  {canUnsuspend(subscription.status) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setActionDialog('unsuspend');
                                      }}
                                      className="flex items-center gap-2 text-blue-600 focus:text-blue-600"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Unsuspend
                                    </DropdownMenuItem>
                                  )}

                                  {canCancel(subscription.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedSubscription(subscription);
                                          setActionDialog('cancel');
                                        }}
                                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Cancel Subscription
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {subscriptions && subscriptions.meta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, subscriptions.meta.total)} of{' '}
                        {subscriptions.meta.total} subscriptions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= subscriptions.meta.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      {dialogContent && (
        <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <dialogContent.icon className={`h-5 w-5 ${dialogContent.color}`} />
                {dialogContent.title}
              </DialogTitle>
              <DialogDescription>
                {dialogContent.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                className={dialogContent.buttonClass}
                disabled={
                  cancelMutation.isPending ||
                  reactivateMutation.isPending ||
                  suspendMutation.isPending ||
                  unsuspendMutation.isPending ||
                  markPaidMutation.isPending
                }
              >
                {dialogContent.buttonText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
