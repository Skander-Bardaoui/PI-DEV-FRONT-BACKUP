// src/components/purchases/ThreeWayMatchingAIPanel.tsx
//
// Panneau d'affichage de l'analyse IA du rapprochement 3 voies

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIMatchingAnalysis {
  confidence_score:         number;
  risk_level:               'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action:       'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_DISPUTE' | 'CONTACT_SUPPLIER';
  explanation:              string;
  key_findings:             string[];
  suggested_next_steps:     string[];
  dispute_category:         string | null;
  estimated_resolution_time: string;
}

interface Props {
  analysis: AIMatchingAnalysis;
  onApprove?: () => void;
  onDispute?: () => void;
  onContactSupplier?: () => void;
  loading?: boolean;
}

// ─── Configurations ──────────────────────────────────────────────────────────

const RISK_LEVEL_CONFIG = {
  LOW: {
    label: 'Risque Faible',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  MEDIUM: {
    label: 'Risque Moyen',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertCircle,
  },
  HIGH: {
    label: 'Risque Élevé',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Risque Critique',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
};

const ACTION_CONFIG = {
  AUTO_APPROVE: {
    label: 'Approbation Automatique',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  MANUAL_REVIEW: {
    label: 'Revue Manuelle Requise',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: FileText,
  },
  AUTO_DISPUTE: {
    label: 'Mise en Litige Automatique',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  CONTACT_SUPPLIER: {
    label: 'Contacter le Fournisseur',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
  },
};

const DISPUTE_CATEGORY_LABELS: Record<string, string> = {
  PRICE_DISCREPANCY:    'Écart de prix unitaire',
  QUANTITY_MISMATCH:    'Écart de quantité',
  MISSING_DELIVERY:     'Livraison non reçue',
  PARTIAL_DELIVERY:     'Livraison partielle',
  QUALITY_ISSUE:        'Problème de qualité',
  DUPLICATE_INVOICE:    'Facture en double',
  UNAUTHORIZED_CHARGE:  'Frais non autorisés',
  CALCULATION_ERROR:    'Erreur de calcul',
};

// ─── Composant ───────────────────────────────────────────────────────────────

export const ThreeWayMatchingAIPanel: React.FC<Props> = ({
  analysis,
  onApprove,
  onDispute,
  onContactSupplier,
  loading = false,
}) => {
  const riskConfig = RISK_LEVEL_CONFIG[analysis.risk_level];
  const actionConfig = ACTION_CONFIG[analysis.recommended_action];
  const RiskIcon = riskConfig.icon;
  const ActionIcon = actionConfig.icon;

  // Couleur du score de confiance
  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec score de confiance - Style cohérent */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Analyse IA
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
                  Gemini
                </span>
              </h3>
            </div>
          </div>

          {/* Score de confiance */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${getConfidenceColor(analysis.confidence_score)}`}>
              {analysis.confidence_score}%
            </div>
            <div className="text-xs text-gray-600">Confiance</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${getConfidenceBgColor(analysis.confidence_score)}`}
            style={{ width: `${analysis.confidence_score}%` }}
          ></div>
        </div>
      </div>

      {/* Niveau de risque et action recommandée - Style cohérent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Niveau de risque */}
        <div className={`${riskConfig.bgColor} ${riskConfig.borderColor} border rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <RiskIcon className={`w-4 h-4 ${riskConfig.color}`} />
            <span className="text-xs font-medium text-gray-600">Niveau de Risque</span>
          </div>
          <div className={`text-lg font-bold ${riskConfig.color}`}>
            {riskConfig.label}
          </div>
        </div>

        {/* Action recommandée */}
        <div className={`${actionConfig.bgColor} border border-gray-300 rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <ActionIcon className={`w-4 h-4 ${actionConfig.color}`} />
            <span className="text-xs font-medium text-gray-600">Action Recommandée</span>
          </div>
          <div className={`text-lg font-bold ${actionConfig.color}`}>
            {actionConfig.label}
          </div>
        </div>
      </div>

      {/* Catégorie de litige */}
      {analysis.dispute_category && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-900 text-sm">Catégorie de Litige</span>
          </div>
          <div className="text-sm font-bold text-orange-800">
            {DISPUTE_CATEGORY_LABELS[analysis.dispute_category] || analysis.dispute_category}
          </div>
        </div>
      )}

      {/* Explication */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm">
          <span>🤖</span>
          <span>Explication</span>
        </h4>
        <p className="text-sm text-blue-900">
          {analysis.explanation}
        </p>
      </div>

      {/* Points clés identifiés */}
      {analysis.key_findings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm">
            <span>🎯</span>
            <span>Points Clés</span>
          </h4>
          <ul className="space-y-2">
            {analysis.key_findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions suggérées */}
      {analysis.suggested_next_steps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2 text-sm">
            <span>✨</span>
            <span>Actions Suggérées</span>
          </h4>
          <ol className="space-y-2">
            {analysis.suggested_next_steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                <span className="flex-shrink-0 w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Délai de résolution estimé */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-gray-900">Délai estimé:</span>
          <span className="text-gray-700">{analysis.estimated_resolution_time}</span>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        {analysis.recommended_action === 'AUTO_APPROVE' && onApprove && (
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Approuver
          </button>
        )}

        {(analysis.recommended_action === 'AUTO_DISPUTE' || 
          analysis.recommended_action === 'MANUAL_REVIEW') && onDispute && (
          <button
            onClick={onDispute}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            Litige
          </button>
        )}

        {onContactSupplier && (
          <button
            onClick={onContactSupplier}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Contacter
          </button>
        )}
      </div>

      {/* Note de bas de page */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-700">
          ℹ️ Analyse générée par <span className="font-bold text-indigo-600">Gemini AI</span>. 
          En cas de doute, privilégiez la revue manuelle.
        </p>
      </div>
    </div>
  );
};

export default ThreeWayMatchingAIPanel;
