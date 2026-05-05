// src/console/pages/ConsoleAuditLogPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAuditService } from '@/services/platform/platformAudit.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, User } from 'lucide-react';

export function ConsoleAuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, startDate, endDate],
    queryFn: () =>
      platformAuditService.listAuditLogs({
        page,
        limit: 50,
        action: actionFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const getActionBadge = (action: string) => {
    if (action.includes('approved')) return <Badge className="bg-green-600">{action}</Badge>;
    if (action.includes('rejected') || action.includes('deleted')) return <Badge variant="destructive">{action}</Badge>;
    if (action.includes('suspended')) return <Badge variant="outline" className="border-red-500 text-red-600">{action}</Badge>;
    if (action.includes('login')) return <Badge variant="secondary">{action}</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Log</CardTitle>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
                placeholder="End date"
              />
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#534AB7] mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {auditLogs?.data.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#534AB7] flex items-center justify-center text-white flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.admin?.email || 'Unknown'}</span>
                        {getActionBadge(log.action)}
                      </div>
                      {log.target_type && (
                        <div className="text-sm text-gray-600 mb-1">
                          <FileText className="h-3 w-3 inline mr-1" />
                          Target: {log.target_type} {log.target_id && `(${log.target_id.slice(0, 8)}...)`}
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded mt-2">
                          <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {auditLogs && auditLogs.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, auditLogs.meta.total)} of{' '}
                    {auditLogs.meta.total} logs
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
                      disabled={page >= auditLogs.meta.totalPages}
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
    </div>
  );
}
