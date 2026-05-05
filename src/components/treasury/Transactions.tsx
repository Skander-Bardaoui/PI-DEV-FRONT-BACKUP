import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useTransactions, useTransactionsByAccount } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { Transaction, TransactionType, Account } from '@/types/treasury';
import { formatAmount, formatDate } from '@/types';
import { updateFraudReview } from '@/api/treasury.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SummaryCardSkeleton, TableRowSkeleton } from './SkeletonLoaders';
import { useAIAccess } from '@/hooks/useAIAccess';

type TransactionWithAccount = Transaction & {
  account?:        Account;
  fraud_score?:    number | null;
  is_fraud?:       boolean;
  fraud_blocked?:  boolean;
  fraud_reviewed?: boolean;
};

// ─── Type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; classes: string; icon: JSX.Element; amountClass: string; sign: string }
> = {
  ENCAISSEMENT: {
    label:       'Encaissement',
    classes:     'bg-green-100 text-green-700',
    icon:        <ArrowDownCircle className="h-3.5 w-3.5" />,
    amountClass: 'text-green-600 font-semibold',
    sign:        '+',
  },
  DECAISSEMENT: {
    label:       'Décaissement',
    classes:     'bg-red-100 text-red-700',
    icon:        <ArrowUpCircle className="h-3.5 w-3.5" />,
    amountClass: 'text-red-600 font-semibold',
    sign:        '-',
  },
  VIREMENT_INTERNE: {
    label:       'Virement interne',
    classes:     'bg-blue-100 text-blue-700',
    icon:        <ArrowLeftRight className="h-3.5 w-3.5" />,
    amountClass: 'text-blue-600 font-semibold',
    sign:        '',
  },
};

const PAGE_SIZE = 5;

// ─── Infinite Scroll Hook ─────────────────────────────────────────────────
function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [callback, hasMore]
  );
  
  return lastElementRef;
}

// ─── Dashboard Charts ─────────────────────────────────────────────────────
function TransactionsDashboard({ transactions }: { transactions: TransactionWithAccount[] }) {
  const encaissements = transactions
    .filter((t) => t.type === 'ENCAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);

  const decaissements = transactions
    .filter((t) => t.type === 'DECAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);

  const virements = transactions
    .filter((t) => t.type === 'VIREMENT_INTERNE')
    .reduce((s, t) => s + Number(t.amount), 0);

  const net = encaissements - decaissements;
  const total = encaissements + decaissements + virements;

  // Calculate percentages for pie chart
  const encaissementPercent = total > 0 ? (encaissements / total) * 100 : 0;
  const decaissementPercent = total > 0 ? (decaissements / total) * 100 : 0;
  const virementPercent = total > 0 ? (virements / total) * 100 : 0;

  // Group by month for trend
  const monthlyData = useMemo(() => {
    const grouped: Record<string, { encaissement: number; decaissement: number; virement: number }> = {};
    
    transactions.forEach((t) => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { encaissement: 0, decaissement: 0, virement: 0 };
      }
      
      if (t.type === 'ENCAISSEMENT') {
        grouped[monthKey].encaissement += Number(t.amount);
      } else if (t.type === 'DECAISSEMENT') {
        grouped[monthKey].decaissement += Number(t.amount);
      } else if (t.type === 'VIREMENT_INTERNE') {
        grouped[monthKey].virement += Number(t.amount);
      }
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // Last 6 months
  }, [transactions]);

  const maxAmount = Math.max(
    ...monthlyData.map(([, data]) => Math.max(data.encaissement, data.decaissement, data.virement)),
    1
  );

  // Format large numbers
  const formatLargeAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">
      {/* Pie Chart - Transaction Distribution */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm col-span-1 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Répartition des transactions
          </h3>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Pie chart segments */}
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#10b981"
              strokeWidth="45"
              strokeDasharray={`${(encaissementPercent / 100) * 471} 471`}
              transform="rotate(-90 100 100)"
            />
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#ef4444"
              strokeWidth="45"
              strokeDasharray={`${(decaissementPercent / 100) * 471} 471`}
              strokeDashoffset={`-${(encaissementPercent / 100) * 471}`}
              transform="rotate(-90 100 100)"
            />
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="45"
              strokeDasharray={`${(virementPercent / 100) * 471} 471`}
              strokeDashoffset={`-${((encaissementPercent + decaissementPercent) / 100) * 471}`}
              transform="rotate(-90 100 100)"
            />
            {/* Center circle */}
            <circle cx="100" cy="100" r="48" fill="white" />
            <text x="100" y="92" textAnchor="middle" className="text-xs font-semibold fill-gray-500">
              Total
            </text>
            <text x="100" y="110" textAnchor="middle" className="text-lg font-bold fill-gray-900">
              {transactions.length}
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Encaissements</span>
            </div>
            <span className="text-sm font-bold text-green-700">
              {encaissementPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Décaissements</span>
            </div>
            <span className="text-sm font-bold text-red-700">
              {decaissementPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Virements</span>
            </div>
            <span className="text-sm font-bold text-blue-700">
              {virementPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart - Monthly Trend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm col-span-2 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Tendance mensuelle (6 derniers mois)
          </h3>
        </div>

        {monthlyData.length > 0 ? (
          <div className="space-y-5">
            {monthlyData.map(([monthKey, data]) => {
              const encHeight = (data.encaissement / maxAmount) * 100;
              const decHeight = (data.decaissement / maxAmount) * 100;
              const virHeight = (data.virement / maxAmount) * 100;

              return (
                <div key={monthKey} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 w-20 uppercase tracking-wide">
                      {formatMonthLabel(monthKey)}
                    </span>
                    <div className="flex-1 flex gap-3 mx-4">
                      {/* Encaissement bar */}
                      <div className="flex-1 bg-gray-100 rounded-xl h-8 relative overflow-hidden border border-gray-200 shadow-sm">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-xl transition-all duration-500"
                          style={{ width: `${encHeight}%` }}
                        />
                        {data.encaissement > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                            {formatLargeAmount(data.encaissement)}
                          </span>
                        )}
                      </div>
                      {/* Decaissement bar */}
                      <div className="flex-1 bg-gray-100 rounded-xl h-8 relative overflow-hidden border border-gray-200 shadow-sm">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-xl transition-all duration-500"
                          style={{ width: `${decHeight}%` }}
                        />
                        {data.decaissement > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                            {formatLargeAmount(data.decaissement)}
                          </span>
                        )}
                      </div>
                      {/* Virement bar */}
                      <div className="flex-1 bg-gray-100 rounded-xl h-8 relative overflow-hidden border border-gray-200 shadow-sm">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-xl transition-all duration-500"
                          style={{ width: `${virHeight}%` }}
                        />
                        {data.virement > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                            {formatLargeAmount(data.virement)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="flex items-center justify-center gap-8 pt-4 border-t border-gray-200 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-400 to-green-600 shadow-sm"></div>
                <span className="text-xs font-medium text-gray-600">Encaissements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-red-400 to-red-600 shadow-sm"></div>
                <span className="text-xs font-medium text-gray-600">Décaissements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"></div>
                <span className="text-xs font-medium text-gray-600">Virements</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Pas de données mensuelles</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fraud badge ──────────────────────────────────────────────────────────
function FraudBadge({ 
  score, 
  reviewed, 
  onClick 
}: { 
  score: number | null | undefined; 
  reviewed?: boolean;
  onClick?: () => void;
}) {
  if (score === null || score === undefined) return null;

  const isClickable = onClick && !reviewed;

  if (score > 0.8)
    return (
      <button
        onClick={onClick}
        disabled={reviewed}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium ${
          isClickable ? 'hover:bg-red-200 cursor-pointer' : 'cursor-default'
        }`}
      >
        <ShieldAlert className="h-3 w-3" />
        {(score * 100).toFixed(0)}% risque
        {reviewed && <CheckCircle className="h-3 w-3 ml-1" />}
      </button>
    );

  if (score > 0.5)
    return (
      <button
        onClick={onClick}
        disabled={reviewed}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 font-medium ${
          isClickable ? 'hover:bg-orange-200 cursor-pointer' : 'cursor-default'
        }`}
      >
        <ShieldAlert className="h-3 w-3" />
        {(score * 100).toFixed(0)}% suspect
        {reviewed && <CheckCircle className="h-3 w-3 ml-1" />}
      </button>
    );

  return null;
}

// ─── Summary cards ────────────────────────────────────────────────────────
function SummaryBar({ transactions, hasAIAccess, aiLoading }: { transactions: TransactionWithAccount[]; hasAIAccess: boolean; aiLoading: boolean }) {
  const encaissements = transactions
    .filter((t) => t.type === 'ENCAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);

  const decaissements = transactions
    .filter((t) => t.type === 'DECAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);

  const virements = transactions
    .filter((t) => t.type === 'VIREMENT_INTERNE')
    .reduce((s, t) => s + Number(t.amount), 0);

  const net = encaissements - decaissements;

  const flagged = transactions.filter(
    (t) => t.fraud_score != null && t.fraud_score > 0.5,
  ).length;

  // Format large numbers with spaces for readability
  const formatLargeAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
            Total encaissé
          </p>
        </div>
        <p className="text-2xl font-bold text-green-700 tracking-tight">
          {formatLargeAmount(encaissements)}
        </p>
        <p className="text-xs text-green-600 mt-1">TND</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
            Total décaissé
          </p>
        </div>
        <p className="text-2xl font-bold text-red-700 tracking-tight">
          {formatLargeAmount(decaissements)}
        </p>
        <p className="text-xs text-red-600 mt-1">TND</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
            Total virements
          </p>
        </div>
        <p className="text-2xl font-bold text-blue-700 tracking-tight">
          {formatLargeAmount(virements)}
        </p>
        <p className="text-xs text-blue-600 mt-1">TND</p>
      </div>

      <div className={`rounded-xl border p-6 shadow-sm ${
        net >= 0 
          ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200' 
          : 'bg-gradient-to-br from-red-50 to-white border-red-300'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${net >= 0 ? 'bg-indigo-100' : 'bg-red-100'}`}>
            <DollarSign className={`h-4 w-4 ${net >= 0 ? 'text-indigo-600' : 'text-red-600'}`} />
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
            Solde net
          </p>
        </div>
        <p className={`text-2xl font-bold tracking-tight ${
          net >= 0 ? 'text-indigo-700' : 'text-red-700'
        }`}>
          {net >= 0 ? '+' : ''}{formatLargeAmount(Math.abs(net))}
        </p>
        <p className={`text-xs mt-1 ${net >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>TND</p>
      </div>

      {/* AI Feature - Only for Premium users */}
      {!aiLoading && hasAIAccess && (
        <div className={`rounded-xl border p-6 shadow-sm ${
          flagged > 0 
            ? 'bg-gradient-to-br from-orange-50 to-white border-orange-200' 
            : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${flagged > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <ShieldAlert className={`h-4 w-4 ${flagged > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
              Suspectes
            </p>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${
            flagged > 0 ? 'text-orange-700' : 'text-gray-400'
          }`}>
            {flagged}
          </p>
          <p className={`text-xs mt-1 ${flagged > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            transaction{flagged > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────
function TransactionsTable({ 
  transactions,
  onReviewFraud,
  lastElementRef,
  hasAIAccess,
  aiLoading,
}: { 
  transactions: TransactionWithAccount[];
  onReviewFraud: (transaction: TransactionWithAccount) => void;
  lastElementRef?: (node: HTMLTableRowElement | null) => void;
  hasAIAccess: boolean;
  aiLoading: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <div className="p-20 text-center">
        <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Aucune transaction trouvée</p>
        <p className="text-gray-400 text-sm mt-1">
          Modifiez vos filtres ou enregistrez un premier mouvement.
        </p>
      </div>
    );
  }

  // Format amount with thousand separators
  const formatTableAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Référence
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Compte
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
              Montant (TND)
            </th>
            {/* AI Feature - Only for Premium users */}
            {!aiLoading && hasAIAccess && (
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Fraude
              </th>
            )}
            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((t, index) => {
            const cfg       = TYPE_CONFIG[t.type];
            const isFlagged = t.fraud_score != null && t.fraud_score > 0.5;
            const isLastElement = index === transactions.length - 1;

            return (
              <tr
                key={t.id}
                ref={isLastElement && lastElementRef ? lastElementRef : null}
                className={`transition-all duration-150 ${
                  isFlagged 
                    ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(t.transaction_date)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-semibold ${cfg.classes} shadow-sm`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-[280px]">
                    <div className="font-medium truncate" title={t.description || '—'}>
                      {t.description ?? '—'}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block">
                    {t.reference ?? '—'}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-700">
                    {t.account?.name ?? '—'}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${cfg.amountClass}`}>
                    {cfg.sign}{formatTableAmount(Number(t.amount))}
                  </div>
                </td>

                {/* AI Feature - Only for Premium users */}
                {!aiLoading && hasAIAccess && (
                  <td className="px-6 py-4 text-center">
                    <FraudBadge 
                      score={t.fraud_score} 
                      reviewed={t.fraud_reviewed}
                      onClick={isFlagged && !t.fraud_reviewed ? () => onReviewFraud(t) : undefined}
                    />
                  </td>
                )}

                <td className="px-6 py-4 text-center">
                  {t.is_reconciled ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Rapproché
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 font-medium border border-gray-200">
                      En attente
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Fraud Review Modal ───────────────────────────────────────────────────
function FraudReviewModal({
  transaction,
  onClose,
  onConfirm,
}: {
  transaction: TransactionWithAccount | null;
  onClose: () => void;
  onConfirm: (isFraud: boolean) => void;
}) {
  if (!transaction) return null;

  const cfg = TYPE_CONFIG[transaction.type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Révision de transaction suspecte
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Score de fraude: {((transaction.fraud_score || 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium">{formatDate(transaction.transaction_date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type:</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${cfg.classes}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Montant:</span>
            <span className={`font-semibold ${cfg.amountClass}`}>
              {cfg.sign}{formatAmount(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Compte:</span>
            <span className="font-medium">{transaction.account?.name}</span>
          </div>
          {transaction.description && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Description:</span>
              <span className="font-medium text-right">{transaction.description}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Cette transaction a été signalée comme suspecte par le système de détection de fraude.
            Veuillez confirmer s'il s'agit d'une fraude ou d'une transaction légitime.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <XCircle className="h-4 w-4" />
            C'est une fraude
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle className="h-4 w-4" />
            Transaction légitime
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function Transactions() {
  const { hasAIAccess, loading: aiLoading } = useAIAccess();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType]       = useState('');
  const [fraudOnly, setFraudOnly]             = useState(false);
  const [search, setSearch]                   = useState('');
  const [displayCount, setDisplayCount]       = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [showSkeleton, setShowSkeleton]       = useState(true);
  const [reviewTransaction, setReviewTransaction] = useState<TransactionWithAccount | null>(null);

  const queryClient = useQueryClient();
  const { accounts } = useAccounts();

  const allQuery     = useTransactions();
  const accountQuery = useTransactionsByAccount(selectedAccount);

  const { data: raw = [], isLoading } = (
    selectedAccount ? accountQuery : allQuery
  ) as { data: TransactionWithAccount[]; isLoading: boolean };

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const reviewMutation = useMutation({
    mutationFn: ({ transactionId, isFraud }: { transactionId: string; isFraud: boolean }) =>
      updateFraudReview(transactionId, isFraud),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(
        variables.isFraud 
          ? 'Transaction marquée comme frauduleuse' 
          : 'Transaction marquée comme légitime'
      );
      setReviewTransaction(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleReviewFraud = (transaction: TransactionWithAccount) => {
    setReviewTransaction(transaction);
  };

  const handleConfirmReview = (isFraud: boolean) => {
    if (reviewTransaction) {
      reviewMutation.mutate({
        transactionId: reviewTransaction.id,
        isFraud,
      });
    }
  };

  const filtered = useMemo(() => {
    return raw.filter((t) => {
      if (selectedType && t.type !== selectedType) return false;
      if (fraudOnly && (t.fraud_score == null || t.fraud_score <= 0.5)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q)   ||
          t.account?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [raw, selectedType, fraudOnly, search]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    setIsLoadingMore(false);
  }, [selectedAccount, selectedType, fraudOnly, search]);

  const displayed = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;
  const flaggedCount = raw.filter((t) => t.fraud_score != null && t.fraud_score > 0.5).length;

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // Show loading for 2 seconds before loading more
      setTimeout(() => {
        setDisplayCount((prev) => prev + PAGE_SIZE);
        setIsLoadingMore(false);
      }, 2000);
    }
  }, [hasMore, isLoadingMore]);

  const lastElementRef = useInfiniteScroll(loadMore, hasMore && !isLoadingMore);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
    };

  const isDisplayLoading = isLoading || showSkeleton;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique des transactions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tous les mouvements financiers de votre entreprise
        </p>
      </div>

      {/* SUMMARY */}
      {isDisplayLoading ? (
        <div className="grid grid-cols-5 gap-6 mb-8">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      ) : (
        filtered.length > 0 && (
          <>
            <SummaryBar transactions={filtered} hasAIAccess={hasAIAccess} aiLoading={aiLoading} />
            <TransactionsDashboard transactions={filtered} />
          </>
        )
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher description, référence, compte..."
              value={search}
              onChange={handleChange(setSearch)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            {filtered.length > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <select
            value={selectedAccount}
            onChange={handleChange(setSelectedAccount)}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-white min-w-[180px]"
          >
            <option value="">Tous les comptes</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={handleChange(setSelectedType)}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-white min-w-[180px]"
          >
            <option value="">Tous les types</option>
            <option value="ENCAISSEMENT">Encaissement</option>
            <option value="DECAISSEMENT">Décaissement</option>
            <option value="VIREMENT_INTERNE">Virement interne</option>
          </select>

          {/* AI Feature - Fraud filter toggle - Only for Premium users */}
          {!aiLoading && hasAIAccess && (
            <button
              onClick={() => setFraudOnly((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all shadow-sm ${
                fraudOnly
                  ? 'bg-orange-100 border-orange-400 text-orange-700 shadow-orange-200'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Suspectes
              {flaggedCount > 0 && (
                <span className={`text-xs rounded-full px-2 py-0.5 ml-1 font-bold ${
                  fraudOnly 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {flaggedCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {isDisplayLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Compte</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Montant (TND)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Fraude</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <TransactionsTable 
              transactions={displayed}
              onReviewFraud={handleReviewFraud}
              lastElementRef={lastElementRef}
              hasAIAccess={hasAIAccess}
              aiLoading={aiLoading}
            />

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex items-center justify-center px-6 py-8 border-t bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-b-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-indigo-700">Chargement de plus de transactions...</span>
                </div>
              </div>
            )}

            {/* Footer with count */}
            {!hasMore && !isLoadingMore && displayed.length > 0 && (
              <div className="flex items-center justify-center px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
                <p className="text-sm text-gray-600 font-medium">
                  Affichage de <span className="font-bold text-indigo-600">{displayed.length}</span> transaction{displayed.length > 1 ? 's' : ''}
                  {filtered.length !== raw.length && (
                    <>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-500">{filtered.length} après filtrage</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* FRAUD REVIEW MODAL */}
      <FraudReviewModal
        transaction={reviewTransaction}
        onClose={() => setReviewTransaction(null)}
        onConfirm={handleConfirmReview}
      />

    </div>
  );
}
