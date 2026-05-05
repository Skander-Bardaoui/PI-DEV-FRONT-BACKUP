// src/pages/console/PlatformDashboard.tsx
import { useState } from 'react';
import { Shield, LogOut, KeyRound, User, Clock } from 'lucide-react';
import { usePlatformAdmin } from '../../hooks/usePlatformAdmin';
import { setupPlatformTotp, enablePlatformTotp } from '../../api/platform-admin.api';

export default function PlatformDashboard() {
  const { admin, logout } = usePlatformAdmin();
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetupTotp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await setupPlatformTotp();
      setTotpSecret(response.secret);
      setQrCodeUrl(response.qrCodeUrl);
      setShowTotpSetup(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTotp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await enablePlatformTotp({ code: totpCode });
      setSuccess('Two-factor authentication enabled successfully!');
      setShowTotpSetup(false);
      window.location.reload(); // Refresh to update admin data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Platform Console</h1>
                <p className="text-sm text-purple-200">NovEntra Administration</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200">
            {success}
          </div>
        )}

        {/* Admin Info Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Admin Profile</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-purple-300" />
              <div>
                <p className="text-sm text-purple-200">Email</p>
                <p className="text-white font-medium">{admin?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-purple-300" />
              <div>
                <p className="text-sm text-purple-200">Two-Factor Authentication</p>
                <p className="text-white font-medium">
                  {admin?.totp_enabled ? (
                    <span className="text-green-400">✓ Enabled</span>
                  ) : (
                    <span className="text-yellow-400">Not Enabled</span>
                  )}
                </p>
              </div>
            </div>

            {admin?.last_login_at && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-300" />
                <div>
                  <p className="text-sm text-purple-200">Last Login</p>
                  <p className="text-white font-medium">
                    {new Date(admin.last_login_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TOTP Setup Card */}
        {!admin?.totp_enabled && !showTotpSetup && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Security Recommendation</h2>
            <p className="text-purple-200 mb-4">
              Enable two-factor authentication to add an extra layer of security to your account.
            </p>
            <button
              onClick={handleSetupTotp}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {/* TOTP Setup Modal */}
        {showTotpSetup && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Setup Two-Factor Authentication</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-purple-200 mb-4">
                  1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-64 h-64" />
                </div>
              </div>

              <div>
                <p className="text-purple-200 mb-2">
                  Or manually enter this secret key:
                </p>
                <code className="block bg-white/10 p-3 rounded-lg text-white font-mono text-sm break-all">
                  {totpSecret}
                </code>
              </div>

              <div>
                <p className="text-purple-200 mb-2">
                  2. Enter the 6-digit code from your authenticator app to confirm:
                </p>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white text-center text-2xl tracking-widest placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEnableTotp}
                  disabled={isLoading || totpCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Verifying...' : 'Enable 2FA'}
                </button>
                <button
                  onClick={() => {
                    setShowTotpSetup(false);
                    setTotpCode('');
                    setError('');
                  }}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
