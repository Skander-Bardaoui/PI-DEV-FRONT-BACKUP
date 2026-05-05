import { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Hash, StickyNote } from 'lucide-react';
import { Account } from '@/types/treasury';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    account_id: string;
    amount: number;
    description?: string;
    reference?: string;
    notes?: string;
    deposit_date?: string;
  }) => Promise<void>;
  accounts: Account[];
  preselectedAccountId?: string | null;
}

export default function DepositModal({
  open,
  onClose,
  onSubmit,
  accounts,
  preselectedAccountId,
}: DepositModalProps) {
  const [accountId, setAccountId] = useState(preselectedAccountId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        account_id: accountId,
        amount: parsedAmount,
        description: description || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        deposit_date: depositDate,
      });
      // Reset form
      setAccountId('');
      setAmount('');
      setDescription('');
      setReference('');
      setNotes('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add deposit');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Money to Account</h2>
              <p className="text-sm text-green-100">Deposit funds into your account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select an account</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {Number(account.current_balance).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} {account.currency}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="mt-2 text-xs text-gray-500">
                Current balance: <span className="font-semibold text-gray-700">
                  {Number(selectedAccount.current_balance).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} {selectedAccount.currency}
                </span>
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000"
                required
                className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                {selectedAccount?.currency || 'TND'}
              </span>
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && selectedAccount && (
              <p className="mt-2 text-xs text-green-600">
                New balance will be: <span className="font-semibold">
                  {(Number(selectedAccount.current_balance) + parseFloat(amount)).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} {selectedAccount.currency}
                </span>
              </p>
            )}
          </div>

          {/* Deposit Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deposit Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cash deposit, Bank transfer..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reference
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., DEP-2024-001"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 mb-1">
                  Transaction Details
                </h4>
                <p className="text-xs text-green-700 leading-relaxed">
                  This deposit will be recorded as a <strong>VIREMENT_INTERNE</strong> transaction and will appear in your transaction history. The account balance will be updated immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Add Deposit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
