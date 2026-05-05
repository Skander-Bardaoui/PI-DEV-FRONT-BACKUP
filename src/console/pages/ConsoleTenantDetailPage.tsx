// src/console/pages/ConsoleTenantDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformTenantsService } from '@/services/platform/platformTenants.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SecureDeleteTenantDialog } from '@/console/components/SecureDeleteTenantDialog';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar, 
  Mail, 
  Phone, 
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  AlertTriangle,
  Crown,
  CreditCard,
  Activity,
  Shield,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export function ConsoleTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'suspend' | 'unsuspend' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-detail', id],
    queryFn: () => platformTenantsService.getTenantDetail(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.approveTenant(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['tenant-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant approved successfully');
      setActionDialog(null);
    },
    onError: () => {
      toast.error('❌ Failed to approve tenant');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      platformTenantsService.rejectTenant(id, reason),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['tenant-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant rejected');
      setActionDialog(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject tenant';
      toast.error(`❌ ${message}`);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      platformTenantsService.suspendTenant(id, reason),
    onSuccess: async () => {
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['tenant-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant suspended successfully');
      setActionDialog(null);
      setSuspendReason('');
    },
    onError: () => {
      toast.error('❌ Failed to suspend tenant');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.unsuspendTenant(id),
    onSuccess: async () => {
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['tenant-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant unsuspended successfully');
      setActionDialog(null);
    },
    onError: () => {
      toast.error('❌ Failed to unsuspend tenant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant deleted successfully');
      navigate('/console/tenants');
    },
    onError: () => {
      toast.error('❌ Failed to delete tenant');
    },
  });

  const handleAction = () => {
    if (!tenant) return;

    switch (actionDialog) {
      case 'approve':
        approveMutation.mutate(tenant.id);
        break;
      case 'reject':
        if (!rejectionReason.trim()) {
          toast.error('Please provide a rejection reason');
          return;
        }
        if (rejectionReason.trim().length < 10) {
          toast.error('Rejection reason must be at least 10 characters');
          return;
        }
        rejectMutation.mutate({ id: tenant.id, reason: rejectionReason });
        break;
      case 'suspend':
        suspendMutation.mutate({ id: tenant.id, reason: suspendReason || undefined });
        break;
      case 'unsuspend':
        unsuspendMutation.mutate(tenant.id);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#534AB7]"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Tenant Not Found</h2>
        <Button onClick={() => navigate('/console/tenants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'suspended':
        return <Ban className="h-5 w-5 text-red-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      suspended: { variant: 'destructive', label: 'Suspended' },
      pending: { variant: 'secondary', label: 'Pending' },
      rejected: { variant: 'outline', label: 'Rejected' },
      approved: { variant: 'default', label: 'Approved' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/console/tenants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#534AB7] to-[#6B5BC7] flex items-center justify-center text-white font-semibold text-lg">
              {tenant.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-500">{tenant.domain || 'No domain configured'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(tenant.status)}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {tenant.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setActionDialog('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActionDialog('reject')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {/* Always show Suspend/Unsuspend button */}
            {tenant.status === 'suspended' ? (
              <Button
                size="sm"
                onClick={() => setActionDialog('unsuspend')}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={unsuspendMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {unsuspendMutation.isPending ? 'Reactivating...' : 'Unsuspend'}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionDialog('suspend')}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                disabled={suspendMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Businesses</p>
                <p className="text-2xl font-bold">{tenant.businesses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{tenant.memberCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-bold">{tenant.subscription?.plan?.name || 'Free'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Age</p>
                <p className="text-lg font-bold">
                  {Math.floor((Date.now() - new Date(tenant.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tenant ID</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{tenant.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Domain</label>
                <p className="text-sm">{tenant.domain || 'Not configured'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  {getStatusBadge(tenant.status)}
                </div>
              </div>
            </div>

            {tenant.approval?.reviewed_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Reviewed</label>
                <p className="text-sm">{new Date(tenant.approval.reviewed_at).toLocaleString()}</p>
              </div>
            )}
            
            {tenant.approval?.rejection_reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {tenant.approval.rejection_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Business Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-semibold">
                {tenant.owner.firstName?.[0]}{tenant.owner.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium">{tenant.owner.firstName} {tenant.owner.lastName}</p>
                <p className="text-sm text-gray-500">Business Owner</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {tenant.owner?.email || 'No owner email'}
                </p>
              </div>
              
              {tenant.owner.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {tenant.owner.phone}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{tenant.owner.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Details */}
      {tenant.subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <p className="text-sm font-semibold">{tenant.subscription.plan?.name || 'Free'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm capitalize">{tenant.subscription.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Billing Cycle</label>
                <p className="text-sm capitalize">{tenant.subscription.billing_cycle}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(tenant.subscription.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {tenant.subscription.trial_ends_at && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Trial Ends</label>
                <p className="text-sm">{new Date(tenant.subscription.trial_ends_at).toLocaleDateString()}</p>
              </div>
            )}
            
            {tenant.subscription.suspended_at && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Suspended At</label>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {new Date(tenant.subscription.suspended_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Businesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Businesses ({tenant.businesses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenant.businesses && tenant.businesses.length > 0 ? (
            <div className="space-y-4">
              {tenant.businesses.map((business: any) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#534AB7] to-[#6B5BC7] flex items-center justify-center text-white font-medium">
                      {business.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{business.name}</h3>
                      <p className="text-sm text-gray-500">{business.email || 'No email configured'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {business.is_suspended ? (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(business.created_at).toLocaleDateString()}
                    </p>
                    {business.tax_id && (
                      <p className="text-xs mt-1">Tax ID: {business.tax_id}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No businesses found for this tenant</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog === 'approve' && <><CheckCircle2 className="h-5 w-5 text-green-600" />Approve Tenant</>}
              {actionDialog === 'reject' && <><XCircle className="h-5 w-5 text-red-600" />Reject Tenant</>}
              {actionDialog === 'suspend' && <><Ban className="h-5 w-5 text-orange-600" />Suspend Tenant</>}
              {actionDialog === 'unsuspend' && <><CheckCircle2 className="h-5 w-5 text-blue-600" />Unsuspend Tenant</>}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'approve' && `Approve ${tenant?.name}? This will activate their subscription and grant access.`}
              {actionDialog === 'reject' && `Reject ${tenant?.name}? This action cannot be undone.`}
              {actionDialog === 'suspend' && `Suspend ${tenant?.name}? All users will lose access immediately.`}
              {actionDialog === 'unsuspend' && `Unsuspend ${tenant?.name}? This will restore access for all users.`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a detailed reason for rejection (minimum 10 characters)..."
                rows={4}
                className={rejectionReason.length > 0 && rejectionReason.length < 10 ? 'border-red-300' : ''}
              />
              <p className="text-xs text-gray-500">
                {rejectionReason.length}/10 characters minimum
                {rejectionReason.length > 0 && rejectionReason.length < 10 && (
                  <span className="text-red-600 ml-2">
                    ({10 - rejectionReason.length} more needed)
                  </span>
                )}
              </p>
            </div>
          )}

          {actionDialog === 'suspend' && (
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Suspension Reason (Optional)</Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Provide a reason for suspension..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              variant={actionDialog === 'reject' ? 'destructive' : 
                     actionDialog === 'approve' ? 'default' : 'default'}
              className={actionDialog === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                        actionDialog === 'unsuspend' ? 'bg-blue-600 hover:bg-blue-700' :
                        actionDialog === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {actionDialog === 'approve' && 'Approve Tenant'}
              {actionDialog === 'reject' && 'Reject Tenant'}
              {actionDialog === 'suspend' && 'Suspend Tenant'}
              {actionDialog === 'unsuspend' && 'Unsuspend Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secure Delete Dialog */}
      {tenant && (
        <SecureDeleteTenantDialog
          tenant={tenant}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={() => navigate('/console/tenants')}
        />
      )}
    </div>
  );
}
