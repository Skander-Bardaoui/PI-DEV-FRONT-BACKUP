// src/components/purchases/AlertsPanel.tsx
// Panneau d'alertes latéral — affiché dans le dashboard achats
// et accessible via la cloche de notification

import { useState } from 'react';
import {
  Bell, X, Check, Clock, ChevronRight,
  AlertTriangle, AlertCircle, Info, RefreshCw,
} from 'lucide-react';
import {
  usePurchaseAlerts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useResolveAlert,
  useSnoozeAlert,
  useTriggerAlertScan,
  PurchaseAlertItem,
  AlertSeverity,
  AlertType,
} from '@/hooks/usePurchaseAlerts';

// Style pour la scrollbar personnalisée
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    transition: background 0.2s;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
`;

// ─── Config visuelle ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<AlertSeverity, {
  bg: string; border: string; icon: string; iconColor: string; badgeColor: string;
}> = {
  INFO:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'info',    iconColor: 'text-blue-600',   badgeColor: 'bg-blue-100 text-blue-800'   },
  WARNING: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'warning', iconColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800' },
  DANGER:  { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'danger',  iconColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800'       },
};

const TYPE_LABELS: Record<AlertType, string> = {
  INVOICE_DUE_SOON:     'Échéance proche',
  INVOICE_OVERDUE:      'Facture en retard',
  PO_NOT_RECEIVED:      'BC non réceptionné',
  SUPPLIER_HIGH_DEBT:   'Solde élevé',
  INVOICE_HIGH_AMOUNT:  'Montant élevé',
  PO_AWAITING_CONFIRM:  'En attente confirmation',
};

const SeverityIcon = ({ severity, className }: { severity: AlertSeverity; className?: string }) => {
  const props = { className: `h-4 w-4 ${className ?? ''}` };
  if (severity === 'DANGER')  return <AlertCircle   {...props} />;
  if (severity === 'WARNING') return <AlertTriangle {...props} />;
  return <Info {...props} />;
};

// ─── Carte alerte ─────────────────────────────────────────────────────────────
function AlertCard({
  alert, businessId,
  onNavigate,
}: {
  alert:       PurchaseAlertItem;
  businessId:  string;
  onNavigate?: (entityType: string, entityId: string) => void;
}) {
  const [showSnooze, setShowSnooze] = useState(false);
  const cfg     = SEVERITY_CONFIG[alert.severity];
  const markRead = useMarkAlertRead(businessId);
  const resolve  = useResolveAlert(businessId);
  const snooze   = useSnoozeAlert(businessId);

  const handleClick = () => {
    if (alert.status === 'UNREAD') markRead.mutate(alert.id);
    if (onNavigate) onNavigate(alert.entity_type, alert.entity_id);
  };

  return (
    <div className={`rounded-xl border p-3 transition-all ${cfg.bg} ${cfg.border} ${
      alert.status === 'UNREAD' ? 'ring-1 ring-offset-0 ring-current' : 'opacity-80'
    }`}>
      <div className="flex items-start gap-3">
        <SeverityIcon severity={alert.severity} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {alert.status === 'UNREAD' && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>
              {TYPE_LABELS[alert.type]}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(alert.created_at).toLocaleDateString('fr-TN')}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-900 mb-1">{alert.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>

          {alert.entity_label && (
            <button
              onClick={handleClick}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {alert.entity_label} <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-current border-opacity-20">
        {alert.status === 'UNREAD' && (
          <button
            onClick={() => markRead.mutate(alert.id)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white/50"
          >
            <Check className="h-3 w-3" /> Marquer lu
          </button>
        )}

        <button
          onClick={() => setShowSnooze(s => !s)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white/50"
        >
          <Clock className="h-3 w-3" /> Reporter
        </button>

        <button
          onClick={() => resolve.mutate(alert.id)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-white/50 ml-auto"
        >
          <X className="h-3 w-3" /> Résoudre
        </button>
      </div>

      {/* Options snooze */}
      {showSnooze && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            { label: '2h',   hours: 2    },
            { label: '24h',  hours: 24   },
            { label: '3j',   hours: 72   },
            { label: '1sem', hours: 168  },
          ].map(opt => (
            <button
              key={opt.hours}
              onClick={() => { snooze.mutate({ id: alert.id, hours: opt.hours }); setShowSnooze(false); }}
              className="text-xs px-3 py-1 bg-white/70 border border-current border-opacity-30 rounded-lg hover:bg-white"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panneau principal ────────────────────────────────────────────────────────
interface AlertsPanelProps {
  businessId: string;
  onNavigate?: (entityType: string, entityId: string) => void;
}

export default function AlertsPanel({ businessId, onNavigate }: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'danger'>('all');

  const { data: alerts = [], isLoading, refetch } = usePurchaseAlerts(businessId);
  const markAllRead = useMarkAllAlertsRead(businessId);
  const triggerScan = useTriggerAlertScan(businessId);

  const unreadCount  = alerts.filter(a => a.status === 'UNREAD').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;
  const dangerCount  = alerts.filter(a => a.severity === 'DANGER').length;

  const filtered = alerts.filter(a => {
    if (filter === 'unread')  return a.status === 'UNREAD';
    if (filter === 'warning') return a.severity === 'WARNING';
    if (filter === 'danger')  return a.severity === 'DANGER';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <style>{scrollbarStyles}</style>

      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Alertes</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerScan.mutate()}
            disabled={triggerScan.isPending}
            title="Scanner maintenant"
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${triggerScan.isPending ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
        {[
          { key: 'all',     label: 'Toutes',   count: alerts.length,  color: 'text-gray-700' },
          { key: 'warning', label: 'Attention', count: warningCount,  color: 'text-orange-600' },
          { key: 'danger',  label: 'Urgentes',  count: dangerCount,   color: 'text-red-600' },
        ].map((f, i) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`py-2.5 text-center text-sm transition-colors ${
              i < 2 ? 'border-r border-gray-200' : ''
            } ${
              filter === f.key
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`block text-lg font-bold ${f.color}`}>{f.count}</span>
            <span className="text-xs">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Filtres rapides */}
      <div className="px-3 py-2 border-b border-gray-100 flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Toutes' : 'Non lues'}
            {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucune alerte</p>
            <p className="text-xs text-gray-300 mt-1">Tout est sous contrôle</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              businessId={businessId}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
}