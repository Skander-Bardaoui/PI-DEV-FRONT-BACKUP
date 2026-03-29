// ──────────────────────────────────────────────────────────────────────────────
// src/components/purchases/SupplierStatsCard.tsx
// Composant de stats affiché dans le modal détail fournisseur
// ──────────────────────────────────────────────────────────────────────────────
import { TrendingUp, ShoppingBag, FileText, AlertTriangle } from 'lucide-react';
import { useSupplierStats } from '@/hooks/useSupplierStats';
import { usePDFExport }     from '@/hooks/usePDFExport';
import PDFButton            from '@/components/purchases/PDFButton';
import { formatAmount, Supplier } from '@/types';

interface Props {
  businessId: string;
  supplier:   Supplier;
}

export function SupplierStatsCard({ businessId, supplier }: Props) {
  const { stats, loading, pos, invoices } = useSupplierStats(businessId, supplier.id);
  const { exportReleve, loading: pdfLoad } = usePDFExport();

  if (loading) return (
    <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
      Chargement des statistiques...
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Statistiques</h3>
        <PDFButton
          variant="ghost"
          label="Relevé de compte"
          loading={pdfLoad}
          onClick={() => exportReleve(supplier, pos, invoices)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span className="text-xs text-indigo-600 font-medium">Total achats</span>
          </div>
          <p className="text-sm font-bold text-indigo-800">{formatAmount(stats.totalAchats)}</p>
          <p className="text-xs text-indigo-500 mt-0.5">Payé : {formatAmount(stats.totalPaye)}</p>
        </div>

        <div className={`rounded-xl p-3 ${stats.totalDu > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`h-4 w-4 ${stats.totalDu > 0 ? 'text-orange-500' : 'text-green-500'}`} />
            <span className={`text-xs font-medium ${stats.totalDu > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              Solde dû
            </span>
          </div>
          <p className={`text-sm font-bold ${stats.totalDu > 0 ? 'text-orange-800' : 'text-green-800'}`}>
            {formatAmount(stats.totalDu)}
          </p>
          <p className={`text-xs mt-0.5 ${stats.totalDu > 0 ? 'text-orange-500' : 'text-green-500'}`}>
            {stats.nbPayees}/{stats.nbFactures} factures payées
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600 font-medium">Commandes</span>
          </div>
          <p className="text-sm font-bold text-gray-800">{stats.nbBCs} BCs</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.tauxReception}% entièrement reçus
          </p>
        </div>

        {stats.nbEnRetard > 0 ? (
          <div className="bg-red-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Alertes</span>
            </div>
            <p className="text-sm font-bold text-red-800">{stats.nbEnRetard} en retard</p>
            {stats.nbLitige > 0 && <p className="text-xs text-red-500 mt-0.5">{stats.nbLitige} en litige</p>}
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Alertes</span>
            </div>
            <p className="text-sm font-bold text-green-800">Aucune</p>
            <p className="text-xs text-green-500 mt-0.5">Paiements à jour</p>
          </div>
        )}
      </div>
    </div>
  );
}