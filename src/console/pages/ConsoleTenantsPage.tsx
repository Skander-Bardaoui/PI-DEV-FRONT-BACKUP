// src/console/pages/ConsoleTenantsPage.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformTenantsService } from '@/services/platform/platformTenants.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Filter,
  Building2,
  Users,
  Calendar,
  Crown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function ConsoleTenantsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', page, statusFilter, debouncedSearch],
    queryFn: () =>
      platformTenantsService.listTenants({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant deleted successfully');
      setDeleteDialog(false);
      setSelectedTenant(null);
    },
    onError: () => {
      toast.error('❌ Failed to delete tenant');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant suspended successfully');
    },
    onError: () => {
      toast.error('❌ Failed to suspend tenant');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => platformTenantsService.unsuspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant reactivated successfully');
    },
    onError: () => {
      toast.error('❌ Failed to reactivate tenant');
    },
  });

  const handleDelete = () => {
    if (!selectedTenant) return;
    deleteMutation.mutate(selectedTenant.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'suspended':
        return <Ban className="h-4 w-4 text-red-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
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
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  const filteredTenants = tenants?.data || [];
  const totalCount = tenants?.meta?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {filteredTenants.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredTenants.filter(t => (t as any).status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">
                  {filteredTenants.filter(t => (t as any).status === 'suspended').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant Management
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
                {search !== debouncedSearch && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#534AB7]"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-colors"
                >
                  <option value="all">All Status ({totalCount})</option>
                  <option value="pending">Pending ({filteredTenants.filter(t => (t as any).status === 'pending').length})</option>
                  <option value="active">Active ({filteredTenants.filter(t => t.status === 'active').length})</option>
                  <option value="suspended">Suspended ({filteredTenants.filter(t => (t as any).status === 'suspended').length})</option>
                  <option value="rejected">Rejected ({filteredTenants.filter(t => (t as any).status === 'rejected').length})</option>
                </select>
              </div>
              {(search || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#534AB7]"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#534AB7] to-[#6B5BC7] flex items-center justify-center text-white font-semibold">
                            {tenant.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">
                              {tenant.domain || 'No domain'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <div>
                            <div className="text-sm font-medium">{tenant.owner?.email || 'No owner'}</div>
                            <div className="text-xs text-gray-500">Business Owner</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {tenant.billingPlan || 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tenant.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{tenant.memberCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/console/tenants/${tenant.id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {(tenant as any).status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => suspendMutation.mutate(tenant.id)}
                                className="flex items-center gap-2 text-orange-600 focus:text-orange-600"
                                disabled={suspendMutation.isPending}
                              >
                                <Ban className="h-4 w-4" />
                                {suspendMutation.isPending ? 'Suspending...' : 'Suspend Tenant'}
                              </DropdownMenuItem>
                            )}
                            
                            {(tenant as any).status === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => unsuspendMutation.mutate(tenant.id)}
                                className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                disabled={unsuspendMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {unsuspendMutation.isPending ? 'Reactivating...' : 'Reactivate Tenant'}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setDeleteDialog(true);
                              }}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Tenant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {tenants && tenants.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, tenants.meta.total)} of{' '}
                    {tenants.meta.total} tenants
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
                      disabled={page >= tenants.meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Tenant
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedTenant?.name}</strong>? 
              This action cannot be undone and will permanently remove all tenant data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}