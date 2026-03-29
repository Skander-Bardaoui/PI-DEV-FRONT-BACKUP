// src/components/treasury/TreasuryWidget.tsx
// Drop this into your Dashboard.tsx
import { useEffect, useState } from 'react';
import { Building2, Wallet, ArrowRight, TrendingUp } from 'lucide-react';
import { getAccounts } from '@/api/treasury.api';
import { Account } from '@/types/treasury';
import { useNavigate } from 'react-router-dom';

export default function TreasuryWidget() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + Number(a.current_balance), 0);
  const bankBalance = activeAccounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);
  const cashBalance = activeAccounts
    .filter((a) => a.type === 'CASH')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  const fmt = (n: number) =>
    `${Number(n).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Treasury</h2>
        </div>
        <button
          onClick={() => navigate('/app/treasury/accounts')}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          {/* Total */}
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider mb-1">
              Total Balance
            </p>
            <p className="text-2xl font-bold text-indigo-700">{fmt(totalBalance)}</p>
            <p className="text-xs text-indigo-400 mt-0.5">{activeAccounts.length} active accounts</p>
          </div>

          {/* Bank / Cash split */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-gray-500 font-medium">Banks</span>
              </div>
              <p className="font-semibold text-gray-900">{fmt(bankBalance)}</p>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-gray-500 font-medium">Cash</span>
              </div>
              <p className="font-semibold text-gray-900">{fmt(cashBalance)}</p>
            </div>
          </div>

          {/* Account list (max 4) */}
          <div className="divide-y divide-gray-50">
            {activeAccounts.slice(0, 4).map((account) => (
              <div key={account.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      account.type === 'BANK' ? 'bg-blue-100' : 'bg-green-100'
                    }`}
                  >
                    {account.type === 'BANK' ? (
                      <Building2 className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Wallet className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{account.name}</p>
                    {account.bank_name && (
                      <p className="text-xs text-gray-400">{account.bank_name}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {fmt(Number(account.current_balance))}
                </p>
              </div>
            ))}
            {activeAccounts.length > 4 && (
              <div className="px-6 py-3 text-xs text-gray-400 text-center">
                +{activeAccounts.length - 4} more accounts
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
