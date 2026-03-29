// src/pages/backoffice/purchases/ThreeWayMatchingPage.tsx
//
// Page de rapprochement 3 voies avec analyse IA

import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Package,
  Receipt,
  Bot,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import {
  useInvoiceMatch,
  useAllPendingMatches,
  useApplyMatch,
} from '@/hooks/useThreeWayMatching';
import {
  useApprovePurchaseInvoice,
  useDisputePurchaseInvoice,
} from '@/hooks/usePurchaseInvoices';

import ThreeWayMatchingAIPanel from '@/components/purchases/ThreeWayMatchingAIPanel';
import { formatAmount } from '@/types';

export default function ThreeWayMatchingPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId?: string }>();

  const [useAI, setUseAI] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    invoiceId || null
  );

  // Hooks
  const { data: matchResult, isLoading: matchLoading } = useInvoiceMatch(
    businessId,
    selectedInvoiceId || '',
    useAI
  );

  const { data: allMatches, isLoading: allLoading } = useAllPendingMatches(
    businessId,
    useAI
  );

  const applyMatch = useApplyMatch(businessId, useAI);
  const approve = useApprovePurchaseInvoice(businessId);
  const dispute = useDisputePurchaseInvoice(businessId);

  // Handlers
  const handleApprove = async () => {
    if (!selectedInvoiceId) return;
    try {
      await approve.mutateAsync(selectedInvoiceId);
      toast.success('✅ Facture approuvée avec succès');
      navigate('/app/purchases/invoices');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'approbation';
      
      // Si la facture est déjà approuvée, afficher un message informatif au lieu d'une erreur
      if (errorMsg.includes('Statut') || errorMsg.includes('PENDING')) {
        toast.info('ℹ️ Cette facture a déjà été approuvée automatiquement');
        navigate('/app/purchases/invoices');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleDispute = async () => {
    if (!selectedInvoiceId || !matchResult) return;
    try {
      const disputeReason = matchResult.issues && matchResult.issues.length > 0 
        ? matchResult.issues.join(' | ') 
        : 'Écarts détectés lors du rapprochement 3 voies';
      
      const aiExplanation = matchResult.ai_analysis?.explanation 
        ? ` | Analyse IA: ${matchResult.ai_analysis.explanation}` 
        : '';
      
      await dispute.mutateAsync({
        id: selectedInvoiceId,
        dto: {
          dispute_reason: disputeReason + aiExplanation,
        },
      });
      toast.success('🚨 Facture mise en litige');
      navigate('/app/purchases/invoices');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise en litige');
    }
  };

  const handleContactSupplier = () => {
    toast.info('📧 Fonctionnalité de contact fournisseur à venir');
  };

  const handleApplyAutoAction = async () => {
    if (!selectedInvoiceId) return;
    try {
      const result = await applyMatch.mutateAsync(selectedInvoiceId);
      
      if (result.can_auto_approve) {
        toast.success(`✅ Facture approuvée automatiquement`);
      } else if (result.should_auto_dispute) {
        toast.warning(`🚨 Facture mise en litige automatiquement`);
      } else {
        toast.info(`ℹ️ Revue manuelle requise`);
      }
      
      navigate('/app/purchases/invoices');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'application';
      
      // Si la facture est déjà dans un état final, afficher un message informatif
      if (errorMsg.includes('Statut') || errorMsg.includes('PENDING') || errorMsg.includes('déjà')) {
        toast.info('ℹ️ Cette facture a déjà été traitée automatiquement');
        navigate('/app/purchases/invoices');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const isLoading = matchLoading || allLoading;
  const isProcessing = approve.isPending || dispute.isPending || applyMatch.isPending;

  return (
    <div className="space-y-6">
      {/* Header avec toggle IA - Style cohérent */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/purchases/invoices')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Rapprochement 3 Voies
                {useAI && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                    <Bot className="w-3 h-3 mr-1" />
                    IA
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Vérification automatique BC ↔ BR ↔ Facture
              </p>
            </div>
          </div>

          {/* Toggle IA simplifié */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {useAI ? 'Mode IA' : 'Mode Standard'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 transition-all"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
            </label>
          </div>
        </div>

        {/* Banner info simplifié */}
        {useAI && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
            <Bot className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-indigo-900 font-medium">Analyse IA activée</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                L'IA Gemini analyse automatiquement les écarts et propose des recommandations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Liste des factures en attente - Style cohérent */}
      {!selectedInvoiceId && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b-2 border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Factures en Attente de Rapprochement
              {useAI && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  IA disponible
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 text-sm">Chargement des factures...</p>
            </div>
          ) : allMatches && allMatches.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {allMatches.map((match) => (
                <div
                  key={match.invoice_id}
                  className="p-4 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 cursor-pointer transition-all"
                  onClick={() => setSelectedInvoiceId(match.invoice_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {match.invoice_number}
                        </h3>
                        <span className="text-xs text-gray-600">
                          {match.supplier_name}
                        </span>
                        {match.ai_analysis && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            <Bot className="w-3 h-3 mr-1" />
                            IA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>Montant: {formatAmount(match.invoiced_total)}</span>
                        <span>Écart: {formatAmount(match.total_discrepancy)} ({match.discrepancy_pct.toFixed(2)}%)</span>
                        <span className={`font-medium ${
                          match.status === 'MATCHED' ? 'text-green-600' :
                          match.status === 'MISMATCH' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="font-medium text-sm">Aucune facture en attente</p>
              <p className="text-xs mt-1">Toutes les factures ont été rapprochées</p>
            </div>
          )}
        </div>
      )}

      {/* Détail du rapprochement */}
      {selectedInvoiceId && matchResult && (
        <div className="space-y-6">
          {/* Informations générales - Style cohérent */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {matchResult.invoice_number}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {matchResult.supplier_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoiceId(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>

            {/* Résumé des montants - Design cohérent */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Bon de Commande</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {formatAmount(matchResult.po_total)}
                </div>
                <div className="text-xs text-blue-700 mt-1 truncate">
                  {matchResult.po_number || 'Non associé'}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Bon de Réception</span>
                </div>
                <div className="text-xl font-bold text-green-900">
                  {formatAmount(matchResult.received_total)}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {matchResult.gr_numbers.length > 0
                    ? `${matchResult.gr_numbers.length} BR`
                    : 'Aucun BR'}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Facture</span>
                </div>
                <div className="text-xl font-bold text-purple-900">
                  {formatAmount(matchResult.invoiced_total)}
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  Montant TTC
                </div>
              </div>

              <div className={`rounded-lg p-3 border ${
                Math.abs(matchResult.total_discrepancy) <= 0.005
                  ? 'bg-emerald-50 border-emerald-200'
                  : matchResult.total_discrepancy > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {Math.abs(matchResult.total_discrepancy) <= 0.005 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : matchResult.total_discrepancy > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className={`text-xs font-medium ${
                    Math.abs(matchResult.total_discrepancy) <= 0.005
                      ? 'text-emerald-900'
                      : matchResult.total_discrepancy > 0
                      ? 'text-red-900'
                      : 'text-orange-900'
                  }`}>
                    Écart
                  </span>
                </div>
                <div className={`text-xl font-bold ${
                  Math.abs(matchResult.total_discrepancy) <= 0.005
                    ? 'text-emerald-900'
                    : matchResult.total_discrepancy > 0
                    ? 'text-red-900'
                    : 'text-orange-900'
                }`}>
                  {matchResult.total_discrepancy > 0 ? '+' : ''}{formatAmount(matchResult.total_discrepancy)}
                </div>
                <div className={`text-xs mt-1 ${
                  Math.abs(matchResult.total_discrepancy) <= 0.005
                    ? 'text-emerald-700'
                    : matchResult.total_discrepancy > 0
                    ? 'text-red-700'
                    : 'text-orange-700'
                }`}>
                  {matchResult.discrepancy_pct.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Statut - Style cohérent */}
            <div className={`rounded-lg p-3 border ${
              matchResult.status === 'MATCHED' 
                ? 'bg-green-50 border-green-200' 
                : matchResult.status === 'OVER_INVOICED' || matchResult.status === 'MISMATCH'
                ? 'bg-red-50 border-red-200'
                : matchResult.status === 'MISSING_PO' || matchResult.status === 'MISSING_GR'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {matchResult.status === 'MATCHED' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : matchResult.status === 'OVER_INVOICED' || matchResult.status === 'MISMATCH' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {matchResult.status === 'MATCHED' && '✅ VALIDÉ'}
                    {matchResult.status === 'OVER_INVOICED' && '🚨 SURFACTURATION'}
                    {matchResult.status === 'MISMATCH' && '⚠️ ÉCART'}
                    {matchResult.status === 'MISSING_PO' && '❌ BC MANQUANT'}
                    {matchResult.status === 'MISSING_GR' && '📦 BR MANQUANT'}
                    {matchResult.status === 'PARTIAL_MATCH' && 'ℹ️ PARTIEL'}
                    {matchResult.status === 'UNDER_INVOICED' && '💰 SOUS-FACTURATION'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {matchResult.can_auto_approve && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                      Auto-approbation
                    </span>
                  )}
                  {matchResult.should_auto_dispute && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                      Litige requis
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analyse IA */}
          {useAI && matchResult.ai_analysis && (
            <ThreeWayMatchingAIPanel
              analysis={matchResult.ai_analysis}
              onApprove={handleApprove}
              onDispute={handleDispute}
              onContactSupplier={handleContactSupplier}
              loading={isProcessing}
            />
          )}

          {/* Détail des lignes - Style cohérent */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Détail par Ligne
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Qté BC
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Qté Reçue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Prix Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Total BC
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Total Reçu
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Écart
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matchResult.line_discrepancies.map((line, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50 transition-colors ${
                        line.status !== 'OK' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {line.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                        {line.po_quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={
                          line.received_quantity === 0 
                            ? 'text-red-600' 
                            : line.received_quantity < line.po_quantity
                            ? 'text-orange-600'
                            : line.received_quantity > line.po_quantity
                            ? 'text-red-600'
                            : 'text-green-600'
                        }>
                          {line.received_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatAmount(line.po_unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                        {formatAmount(line.po_line_total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                        {formatAmount(line.received_total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-bold ${
                          Math.abs(line.discrepancy_amount) <= 0.005 
                            ? 'text-green-600' 
                            : line.discrepancy_amount > 0
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}>
                          {line.discrepancy_amount > 0 ? '+' : ''}{formatAmount(line.discrepancy_amount)}
                          <span className="text-xs ml-1">
                            ({line.discrepancy_pct.toFixed(1)}%)
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          line.status === 'OK' 
                            ? 'bg-green-100 text-green-800' 
                            : line.status === 'NOT_RECEIVED'
                            ? 'bg-orange-100 text-orange-800'
                            : line.status === 'OVER_INVOICED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {line.status === 'OK' && '✅'}
                          {line.status === 'NOT_RECEIVED' && '📦'}
                          {line.status === 'OVER_INVOICED' && '🚨'}
                          {line.status === 'QTY_MISMATCH' && '⚠️'}
                          {line.status === 'PRICE_MISMATCH' && '💰'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      TOTAUX :
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-900">
                      {formatAmount(matchResult.po_total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-900">
                      {formatAmount(matchResult.received_total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold">
                      <span className={
                        Math.abs(matchResult.total_discrepancy) <= 0.005 
                          ? 'text-green-600' 
                          : matchResult.total_discrepancy > 0
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }>
                        {matchResult.total_discrepancy > 0 ? '+' : ''}{formatAmount(matchResult.total_discrepancy)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Recommandations - Style cohérent */}
          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                <span>💡</span>
                <span>Recommandations</span>
              </h3>
              <ul className="space-y-2">
                {matchResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Problèmes identifiés - Style cohérent */}
          {matchResult.issues && matchResult.issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Problèmes Identifiés</span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                  {matchResult.issues.length}
                </span>
              </h3>
              <ul className="space-y-2">
                {matchResult.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                    <span className="flex-shrink-0 w-5 h-5 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold">
                      ⚠️
                    </span>
                    <span className="flex-1">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions sans IA - Style cohérent */}
          {!useAI && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <h3 className="font-bold text-gray-900 text-sm">Actions Manuelles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !matchResult.can_auto_approve}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={handleDispute}
                  disabled={isProcessing}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Litige
                </button>
                <button
                  onClick={handleContactSupplier}
                  disabled={isProcessing}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Contacter
                </button>
              </div>
              {!matchResult.can_auto_approve && (
                <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                  ⚠️ Vérification manuelle recommandée avant approbation
                </div>
              )}
            </div>
          )}

          {/* Action automatique IA - Style cohérent */}
          {useAI && matchResult.ai_analysis && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Action Automatique IA</h3>
              </div>
              <button
                onClick={handleApplyAutoAction}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Appliquer l'Action Recommandée
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600 text-center mt-2">
                L'IA appliquera automatiquement l'action la plus appropriée
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
