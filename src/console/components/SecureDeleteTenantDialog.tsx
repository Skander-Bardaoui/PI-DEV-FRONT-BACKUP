// src/console/components/SecureDeleteTenantDialog.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformTenantsService } from '@/services/platform/platformTenants.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Lock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SecureDeleteTenantDialogProps {
  tenant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ExportFormat = 'json' | 'csv' | 'excel' | 'sql';

export function SecureDeleteTenantDialog({
  tenant,
  open,
  onOpenChange,
  onSuccess,
}: SecureDeleteTenantDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'warning' | 'export' | 'confirm'>('warning');
  const [adminPassword, setAdminPassword] = useState('');
  const [exportToken, setExportToken] = useState('');
  const [exportData, setExportData] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => platformTenantsService.exportTenantData(tenant.id, exportFormat),
    onSuccess: (data) => {
      setExportToken(data.exportToken);
      setExportData(data.data);
      toast.success('✅ Tenant data exported successfully');
      // Stay on export step to show summary and download button
      // User will click "Continue to Delete" to proceed
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export tenant data';
      toast.error(`❌ ${message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      platformTenantsService.deleteTenantSecure(tenant.id, adminPassword, exportToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('✅ Tenant deleted successfully');
      handleClose();
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete tenant';
      toast.error(`❌ ${message}`);
    },
  });

  const handleClose = () => {
    setStep('warning');
    setAdminPassword('');
    setExportToken('');
    setExportData(null);
    onOpenChange(false);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleDownloadExport = () => {
    if (!exportData) return;

    let fileContent: string;
    let fileName: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (exportFormat) {
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        fileName = `tenant-${tenant.name}-export-${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        fileContent = convertToCSV(exportData);
        fileName = `tenant-${tenant.name}-export-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      case 'excel':
        // For Excel, we'll use CSV format with .xlsx extension
        // In a real implementation, you'd use a library like xlsx
        fileContent = convertToCSV(exportData);
        fileName = `tenant-${tenant.name}-export-${timestamp}.csv`;
        mimeType = 'text/csv';
        toast.info('ℹ️ Excel format exported as CSV. Use Excel to open the file.');
        break;

      case 'sql':
        fileContent = convertToSQL(exportData, tenant.name);
        fileName = `tenant-${tenant.name}-export-${timestamp}.sql`;
        mimeType = 'application/sql';
        break;

      default:
        fileContent = JSON.stringify(exportData, null, 2);
        fileName = `tenant-${tenant.name}-export-${timestamp}.json`;
        mimeType = 'application/json';
    }

    const dataBlob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`📥 Export file downloaded (${exportFormat.toUpperCase()})`);
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data: any): string => {
    let csv = '';

    // Tenant Info
    csv += '=== TENANT INFORMATION ===\n';
    csv += 'Field,Value\n';
    csv += `ID,${data.tenant.id}\n`;
    csv += `Name,${data.tenant.name}\n`;
    csv += `Domain,${data.tenant.domain || 'N/A'}\n`;
    csv += `Status,${data.tenant.status}\n`;
    csv += `Billing Plan,${data.tenant.billingPlan}\n`;
    csv += `Contact Email,${data.tenant.contactEmail || 'N/A'}\n`;
    csv += `Created At,${data.tenant.createdAt}\n\n`;

    // Owner Info
    if (data.tenant.owner) {
      csv += '=== TENANT OWNER ===\n';
      csv += 'Field,Value\n';
      csv += `Email,${data.tenant.owner.email}\n`;
      csv += `Name,${data.tenant.owner.firstName} ${data.tenant.owner.lastName}\n`;
      csv += `Phone,${data.tenant.owner.phone || 'N/A'}\n`;
      csv += `Role,${data.tenant.owner.role}\n\n`;
    }

    // Businesses
    if (data.businesses && data.businesses.length > 0) {
      csv += '=== BUSINESSES ===\n';
      csv += 'ID,Name,Email,Phone,Tax ID,Currency,Suspended,Created At\n';
      data.businesses.forEach((b: any) => {
        csv += `${b.id},${b.name},${b.email || 'N/A'},${b.phone || 'N/A'},${b.tax_id || 'N/A'},${b.currency},${b.is_suspended},${b.created_at}\n`;
      });
      csv += '\n';
    }

    // Users
    if (data.users && data.users.length > 0) {
      csv += '=== USERS ===\n';
      csv += 'ID,Email,First Name,Last Name,Role,Phone,Job Title,Verified,Suspended,Created At\n';
      data.users.forEach((u: any) => {
        csv += `${u.id},${u.email},${u.firstName},${u.lastName},${u.role},${u.phone || 'N/A'},${u.jobTitle || 'N/A'},${u.is_verified},${u.is_suspended},${u.created_at}\n`;
      });
      csv += '\n';
    }

    // Statistics
    csv += '=== STATISTICS ===\n';
    csv += 'Metric,Count\n';
    csv += `Total Businesses,${data.statistics.totalBusinesses}\n`;
    csv += `Total Users,${data.statistics.totalUsers}\n`;
    csv += `Total Members,${data.statistics.totalMembers}\n`;
    csv += `Total Support Tickets,${data.statistics.totalSupportTickets}\n`;

    return csv;
  };

  // Helper function to convert data to SQL
  const convertToSQL = (data: any, tenantName: string): string => {
    let sql = `-- Tenant Export: ${tenantName}\n`;
    sql += `-- Exported At: ${data.exportedAt}\n`;
    sql += `-- NOTE: This is a backup export. IDs may conflict if imported directly.\n\n`;

    // Tenant
    sql += `-- TENANT\n`;
    sql += `INSERT INTO tenants (id, name, domain, status, "billingPlan", "contactEmail", description, "createdAt", "updatedAt") VALUES\n`;
    sql += `('${data.tenant.id}', '${escapeSql(data.tenant.name)}', ${data.tenant.domain ? `'${escapeSql(data.tenant.domain)}'` : 'NULL'}, '${data.tenant.status}', '${data.tenant.billingPlan}', ${data.tenant.contactEmail ? `'${escapeSql(data.tenant.contactEmail)}'` : 'NULL'}, ${data.tenant.description ? `'${escapeSql(data.tenant.description)}'` : 'NULL'}, '${data.tenant.createdAt}', '${data.tenant.updatedAt}');\n\n`;

    // Owner
    if (data.tenant.owner) {
      sql += `-- TENANT OWNER\n`;
      sql += `INSERT INTO users (id, email, "firstName", "lastName", role, phone, "jobTitle", "is_verified", "is_suspended", "created_at") VALUES\n`;
      sql += `('${data.tenant.owner.id}', '${escapeSql(data.tenant.owner.email)}', '${escapeSql(data.tenant.owner.firstName)}', '${escapeSql(data.tenant.owner.lastName)}', '${data.tenant.owner.role}', ${data.tenant.owner.phone ? `'${escapeSql(data.tenant.owner.phone)}'` : 'NULL'}, NULL, false, false, '${data.tenant.createdAt}');\n\n`;
    }

    // Businesses
    if (data.businesses && data.businesses.length > 0) {
      sql += `-- BUSINESSES\n`;
      data.businesses.forEach((b: any, index: number) => {
        if (index === 0) {
          sql += `INSERT INTO businesses (id, tenant_id, name, email, phone, tax_id, currency, is_suspended, created_at) VALUES\n`;
        }
        sql += `('${b.id}', '${data.tenant.id}', '${escapeSql(b.name)}', ${b.email ? `'${escapeSql(b.email)}'` : 'NULL'}, ${b.phone ? `'${escapeSql(b.phone)}'` : 'NULL'}, ${b.tax_id ? `'${escapeSql(b.tax_id)}'` : 'NULL'}, '${b.currency}', ${b.is_suspended}, '${b.created_at}')`;
        sql += index < data.businesses.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Users
    if (data.users && data.users.length > 0) {
      sql += `-- USERS\n`;
      data.users.forEach((u: any, index: number) => {
        if (index === 0) {
          sql += `INSERT INTO users (id, email, "firstName", "lastName", role, phone, "jobTitle", "is_verified", "is_suspended", "created_at") VALUES\n`;
        }
        sql += `('${u.id}', '${escapeSql(u.email)}', '${escapeSql(u.firstName)}', '${escapeSql(u.lastName)}', '${u.role}', ${u.phone ? `'${escapeSql(u.phone)}'` : 'NULL'}, ${u.jobTitle ? `'${escapeSql(u.jobTitle)}'` : 'NULL'}, ${u.is_verified}, ${u.is_suspended}, '${u.created_at}')`;
        sql += index < data.users.length - 1 ? ',\n' : ';\n\n';
      });
    }

    return sql;
  };

  // Helper to escape SQL strings
  const escapeSql = (str: string): string => {
    if (!str) return '';
    return str.replace(/'/g, "''");
  };

  const handleDelete = () => {
    if (!adminPassword.trim()) {
      toast.error('Please enter your admin password');
      return;
    }
    if (!exportToken) {
      toast.error('Please export tenant data first');
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Delete Tenant: {tenant?.name}
          </DialogTitle>
          <DialogDescription>
            This is a permanent and irreversible action. Please follow all steps carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">{/* Added padding bottom for better scrolling */}

        {/* Step 1: Warning */}
        {step === 'warning' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ WARNING: This action cannot be undone!</strong>
                <br />
                Deleting this tenant will permanently remove:
              </AlertDescription>
            </Alert>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                <li>Tenant record and all configuration</li>
                <li>All {tenant.businesses?.length || 0} business(es) under this tenant</li>
                <li>All {tenant.memberCount || 0} user account(s) and business members</li>
                <li>All products, inventory, and stock movements</li>
                <li>All purchase orders, invoices, and supplier data</li>
                <li>All sales orders, quotes, and client data</li>
                <li>All financial transactions and payment records</li>
                <li>All audit logs and historical data</li>
              </ul>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Export Policy:</strong>
                <p className="mt-2 text-sm">
                  Before deletion, you must export tenant metadata including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Tenant information and configuration</li>
                  <li>Business names and contact information</li>
                  <li>User accounts and roles</li>
                  <li>Subscription and approval records</li>
                </ul>
                <p className="mt-2 text-sm text-orange-600">
                  ⚠️ Note: Confidential business data (invoices, products, transactions) is NOT exported for privacy reasons.
                </p>
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Required Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Export tenant metadata (mandatory backup)</li>
                  <li>Confirm deletion with your admin password</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('export')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Continue to Export
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Export Data */}
        {step === 'export' && (
          <div className="space-y-4">
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 1: Export Tenant Data</strong>
                <br />
                You must export tenant metadata before deletion. This creates a backup of tenant information (NO confidential business data like invoices or products).
              </AlertDescription>
            </Alert>

            {!exportData && (
              <div className="space-y-3">
                <Label htmlFor="export-format">Export Format</Label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON - JavaScript Object Notation</option>
                  <option value="csv">CSV - Comma Separated Values (Excel compatible)</option>
                  <option value="excel">Excel - CSV format for Excel</option>
                  <option value="sql">SQL - Database INSERT statements</option>
                </select>
                <p className="text-xs text-gray-500">
                  Choose the format that best suits your needs. All formats contain the same tenant metadata.
                </p>
              </div>
            )}

            {exportData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Export Completed ({exportFormat.toUpperCase()})</p>
                    <p className="text-sm text-green-700 mt-1">
                      Tenant metadata exported successfully. Download the file to keep a backup.
                    </p>
                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                      <p className="text-xs text-gray-600">Export Summary:</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• Businesses: {exportData.statistics?.totalBusinesses || 0}</li>
                        <li>• Users: {exportData.statistics?.totalUsers || 0}</li>
                        <li>• Members: {exportData.statistics?.totalMembers || 0}</li>
                        <li>• Support Tickets: {exportData.statistics?.totalSupportTickets || 0}</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">
                        ℹ️ Only tenant metadata exported. No confidential business data included.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('warning')}>
                Back
              </Button>
              {exportData ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownloadExport}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Export
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Continue to Delete
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm with Password */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 2: Confirm Deletion</strong>
                <br />
                Enter your admin password to authorize this permanent deletion.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="admin-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Admin Password *
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="mt-1"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your password is required to authorize this destructive action
                </p>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">Export Token (Auto-filled):</p>
                <code className="text-xs bg-white px-2 py-1 rounded border block overflow-x-auto">
                  {exportToken}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  ⏱️ This token expires in 30 minutes
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Final Warning:</strong> Once you click "Delete Permanently", all data
                will be immediately and permanently removed from the database. This cannot be
                undone.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('export')}>
                Back
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending || !adminPassword.trim()}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>{/* Close the space-y-4 pb-4 div */}
      </DialogContent>
    </Dialog>
  );
}
