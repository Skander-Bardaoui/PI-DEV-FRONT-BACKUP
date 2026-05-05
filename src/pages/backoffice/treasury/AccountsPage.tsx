// src/pages/backoffice/treasury/AccountsPage.tsx
import { useState, useEffect } from 'react';
import {
  Plus,
  Building2,
  Wallet,
  MoreHorizontal,
  Star,
  PowerOff,
  Pencil,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
} from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransfers } from '@/hooks/useTransfers';
import { Account, CreateAccountDto, CreateTransferDto } from '@/types/treasury';
import { createDeposit, CreateDepositDto } from '@/api/treasury.api';
import AccountModal from '@/components/treasury/AccountModal';
import TransferModal from '@/components/treasury/TransferModal';
import DepositModal from '@/components/treasury/DepositModal';
import CashFlowForecast from '@/components/treasury/CashFlowForecast';
import { SummaryCardSkeleton, AccountCardSkeleton } from '@/components/treasury/SkeletonLoaders';
import toast from 'react-hot-toast';
import { useAIAccess } from '@/hooks/useAIAccess';

// Helper: always returns a displayable string from any API error shape
function extractErrorMessage(e: any, fallback: string): string {
  const data = e?.response?.data;
  if (!data) return fallback;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data === 'string') return data;
  return fallback;
}

export default function AccountsPage() {
  const { accounts, loading, error, fetchAccounts, createAccount, updateAccount, toggleActive } =
    useAccounts();
  const { transfer } = useTransfers();
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [preselectedFromId, setPreselectedFromId] = useState<string | null>(null);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [preselectedAccountId, setPreselectedAccountId] = useState<string | null>(null);

  const [showSkeleton, setShowSkeleton] = useState(true);

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  const bankBalance = accounts
    .filter((a) => a.is_active && a.type === 'BANK')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  const cashBalance = accounts
    .filter((a) => a.is_active && a.type === 'CASH')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreate = async (dto: CreateAccountDto) => {
    setActionError(null);
    try {
      const payload: CreateAccountDto = {
        name: dto.name?.trim() || '',
        type: dto.type || 'BANK',
        bank_name: dto.bank_name?.trim() || undefined,
        rib: dto.rib?.trim() || undefined,
        opening_balance: typeof dto.opening_balance === 'number' ? dto.opening_balance : 0,
        currency: dto.currency || 'TND',
        is_default: dto.is_default ?? false,
      };
      await createAccount(payload);
      setModalOpen(false);
    } catch (e: any) {
      setActionError(extractErrorMessage(e, 'Failed to create account'));
    }
  };

  const handleUpdate = async (dto: CreateAccountDto & { current_balance?: number }) => {
    if (!editingAccount) return;
    setActionError(null);
    try {
      const payload = {
        name: dto.name?.trim() || editingAccount.name || '',
        type: dto.type || editingAccount.type || 'BANK',
        bank_name: dto.bank_name?.trim() || editingAccount.bank_name || undefined,
        rib: dto.rib?.trim() || editingAccount.rib || undefined,
        currency: dto.currency || editingAccount.currency || 'TND',
        is_default: dto.is_default ?? editingAccount.is_default ?? false,
        current_balance:
          typeof dto.current_balance === 'number'
            ? dto.current_balance
            : Number(editingAccount.current_balance),
      };
      await updateAccount(editingAccount.id, payload);
      setEditingAccount(null);
      setModalOpen(false);
    } catch (e: any) {
      setActionError(extractErrorMessage(e, 'Failed to update account'));
    }
  };

  const handleTransfer = async (dto: CreateTransferDto) => {
    setActionError(null);
    try {
      await transfer(dto);
      await fetchAccounts(); // refresh balances after transfer
    } catch (e: any) {
      setActionError(extractErrorMessage(e, 'Failed to process transfer'));
      throw e; // re-throw so TransferModal stays open and shows its own error
    }
  };

  const handleToggleActive = async (account: Account) => {
    setActionError(null);
    setMenuOpenId(null);
    try {
      await toggleActive(account.id);
    } catch (e: any) {
      setActionError(extractErrorMessage(e, 'Failed to toggle account'));
    }
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setMenuOpenId(null);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const openTransfer = (fromAccountId?: string) => {
    setPreselectedFromId(fromAccountId || null);
    setMenuOpenId(null);
    setTransferModalOpen(true);
  };

  const openDeposit = (accountId?: string) => {
    setPreselectedAccountId(accountId || null);
    setMenuOpenId(null);
    setDepositModalOpen(true);
  };

  const handleDeposit = async (dto: CreateDepositDto) => {
    setActionError(null);
    try {
      const result = await createDeposit(dto);
      await fetchAccounts(); // refresh balances after deposit
      toast.success(`Deposit of ${dto.amount} added successfully!`);
      setDepositModalOpen(false);
      setPreselectedAccountId(null);
    } catch (e: any) {
      const errorMsg = extractErrorMessage(e, 'Failed to add deposit');
      setActionError(errorMsg);
      toast.error(errorMsg);
      throw e; // re-throw so DepositModal stays open and shows its own error
    }
  };

  const formatAmount = (amount: number, currency = 'TND') =>
    `${Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} ${currency}`;

  // Normalize hook-level error to a string too
  const pageError: string | null = !error
    ? null
    : typeof error === 'string'
    ? error
    : Array.isArray(error)
    ? (error as any[]).map((e) => (e?.message ?? String(e))).join(', ')
    : String(error);

  const displayError = pageError || actionError;

  const isDisplayLoading = loading || showSkeleton;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500">Manage your bank accounts and cash</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {accounts.filter((a) => a.is_active).length >= 1 && (
            <button
              onClick={() => openDeposit()}
              className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Add Money
            </button>
          )}
          {accounts.filter((a) => a.is_active).length >= 2 && (
            <button
              onClick={() => openTransfer()}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Account
          </button>
        </div>
      </div>

      {/* Error banner — always a plain string now, safe to render */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <p>{displayError}</p>
        </div>
      )}

      {/* Summary Cards */}
      {isDisplayLoading ? (
        <div className="grid sm:grid-cols-3 gap-6">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-100">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatAmount(totalBalance)}</p>
            <p className="text-sm text-gray-500">Total Balance (active accounts)</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatAmount(bankBalance)}</p>
            <p className="text-sm text-gray-500">
              Bank Accounts ({accounts.filter((a) => a.type === 'BANK' && a.is_active).length})
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatAmount(cashBalance)}</p>
            <p className="text-sm text-gray-500">
              Cash ({accounts.filter((a) => a.type === 'CASH' && a.is_active).length})
            </p>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Accounts</h2>
        </div>

        {isDisplayLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bank / RIB</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(3)].map((_, i) => (
                  <AccountCardSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wallet className="h-12 w-12 mb-3 text-gray-200" />
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm">Create your first account to get started</p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              New Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bank / RIB</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => {
                  const diff = Number(account.current_balance) - Number(account.opening_balance);
                  return (
                    <tr
                      key={account.id}
                      className={`hover:bg-gray-50 transition-colors ${!account.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${account.type === 'BANK' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {account.type === 'BANK' ? (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Wallet className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{account.name}</span>
                              {account.is_default && (
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{account.currency}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${account.type === 'BANK' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {account.type === 'BANK' ? <Building2 className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                          {account.type}
                        </span>
                      </td>

                      {/* Bank / RIB */}
                      <td className="px-6 py-4 text-gray-600">
                        {account.type === 'BANK' ? (
                          <div>
                            <p className="font-medium">{account.bank_name || '—'}</p>
                            {account.rib && <p className="text-xs text-gray-400 font-mono">{account.rib}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Opening Balance */}
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatAmount(account.opening_balance, account.currency)}
                      </td>

                      {/* Current Balance */}
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatAmount(account.current_balance, account.currency)}
                          </p>
                          {diff !== 0 && (
                            <p className={`text-xs flex items-center justify-end gap-0.5 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {diff >= 0 ? '+' : ''}
                              {formatAmount(diff, account.currency)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === account.id ? null : account.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>

                        {menuOpenId === account.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                            <div className="absolute right-6 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
                              <button
                                onClick={() => openEdit(account)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="h-4 w-4 text-gray-400" />
                                Edit
                              </button>
                              {account.is_active && (
                                <button
                                  onClick={() => openDeposit(account.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                                >
                                  <DollarSign className="h-4 w-4" />
                                  Add Money
                                </button>
                              )}
                              {account.is_active && accounts.filter((a) => a.is_active && a.id !== account.id).length >= 1 && (
                                <button
                                  onClick={() => openTransfer(account.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                                >
                                  <ArrowRightLeft className="h-4 w-4" />
                                  Transfer from here
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleActive(account)}
                                className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 ${account.is_active ? 'text-red-600' : 'text-green-600'}`}
                              >
                                <PowerOff className="h-4 w-4" />
                                {account.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Modal */}
      <AccountModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAccount(null); }}
        onSubmit={editingAccount ? handleUpdate : handleCreate}
        account={editingAccount}
      />

      {/* Transfer Modal */}
      <TransferModal
        open={transferModalOpen}
        onClose={() => { setTransferModalOpen(false); setPreselectedFromId(null); }}
        onSubmit={handleTransfer}
        accounts={accounts}
        preselectedFromId={preselectedFromId}
      />

      {/* Deposit Modal */}
      <DepositModal
        open={depositModalOpen}
        onClose={() => { setDepositModalOpen(false); setPreselectedAccountId(null); }}
        onSubmit={handleDeposit}
        accounts={accounts}
        preselectedAccountId={preselectedAccountId}
      />

      {/* AI Cash Flow Forecast - Only for Premium users */}
      {!aiLoading && hasAIAccess && <CashFlowForecast />}
    </div>

  );
}
