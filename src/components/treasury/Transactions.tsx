// src/components/treasury/Transactions.tsx

import { useState, useMemo } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTransactions, useTransactionsByAccount } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { Transaction, TransactionType, Account } from '@/types/treasury';
import { formatAmount, formatDate } from '@/types';

// ─── Backend returns account relation but it's not in the type — extend locally
type TransactionWithAccount = Transaction & { account?: Account };

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

const PAGE_SIZE = 20;

// ─── Summary cards ────────────────────────────────────────────────────────
function SummaryBar({ transactions }: { transactions: TransactionWithAccount[] }) {
  const encaissements = transactions
    .filter((t) => t.type === 'ENCAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);
  const decaissements = transactions
    .filter((t) => t.type === 'DECAISSEMENT')
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = encaissements - decaissements;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <ArrowDownCircle className="h-3 w-3 text-green-500" />
          Total encaissé
        </p>
        <p className="text-2xl font-bold text-green-600">{formatAmount(encaissements)}</p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <ArrowUpCircle className="h-3 w-3 text-red-500" />
          Total décaissé
        </p>
        <p className="text-2xl font-bold text-red-600">{formatAmount(decaissements)}</p>
      </div>

      <div className={`rounded-xl border p-5 ${net >= 0 ? 'bg-white' : 'bg-red-50 border-red-200'}`}>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solde net</p>
        <p className={`text-2xl font-bold ${net >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {net >= 0 ? '+' : ''}{formatAmount(net)}
        </p>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────
function TransactionsTable({ transactions }: { transactions: TransactionWithAccount[] }) {
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

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-4 text-left">Date</th>
          <th className="px-4 py-4 text-left">Type</th>
          <th className="px-4 py-4 text-left">Description</th>
          <th className="px-4 py-4 text-left">Référence</th>
          <th className="px-4 py-4 text-left">Compte</th>
          <th className="px-4 py-4 text-right">Montant</th>
          <th className="px-4 py-4 text-center">Rapprochement</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => {
          const cfg = TYPE_CONFIG[t.type];
          return (
            <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">

              <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                {formatDate(t.transaction_date)}
              </td>

              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full font-medium ${cfg.classes}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              </td>

              <td className="px-4 py-4 text-sm text-gray-700 max-w-[240px] truncate">
                {t.description ?? '—'}
              </td>

              <td className="px-4 py-4 text-sm font-mono text-gray-500">
                {t.reference ?? '—'}
              </td>

              <td className="px-4 py-4 text-sm text-gray-600">
                {t.account?.name ?? '—'}
              </td>

              <td className={`px-4 py-4 text-right text-sm ${cfg.amountClass}`}>
                {cfg.sign}{formatAmount(t.amount)}
              </td>

              <td className="px-4 py-4 text-center">
                {t.is_reconciled ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    ✓ Rapproché
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                    En attente
                  </span>
                )}
              </td>

            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function Transactions() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType]       = useState('');
  const [search, setSearch]                   = useState('');
  const [page, setPage]                       = useState(1);

  const { accounts } = useAccounts();

  const allQuery     = useTransactions();
  const accountQuery = useTransactionsByAccount(selectedAccount);

  const { data: raw = [], isLoading } = (
    selectedAccount ? accountQuery : allQuery
  ) as { data: TransactionWithAccount[]; isLoading: boolean };

  const filtered = useMemo(() => {
    return raw.filter((t) => {
      if (selectedType && t.type !== selectedType) return false;
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
  }, [raw, selectedType, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
      setPage(1);
    };

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
      {!isLoading && filtered.length > 0 && (
        <SummaryBar transactions={filtered} />
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher description, référence…"
            value={search}
            onChange={handleChange(setSearch)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedAccount}
          onChange={handleChange(setSelectedAccount)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les comptes</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={handleChange(setSelectedType)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les types</option>
          <option value="ENCAISSEMENT">Encaissement</option>
          <option value="DECAISSEMENT">Décaissement</option>
          <option value="VIREMENT_INTERNE">Virement interne</option>
        </select>

        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {filtered.length} transaction(s)
        </span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400">Chargement...</div>
        ) : (
          <>
            <TransactionsTable transactions={paginated} />

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {page} sur {totalPages} —{' '}
                  <span className="font-medium">{filtered.length}</span> transaction(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
