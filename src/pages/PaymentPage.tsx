// src/pages/PaymentPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { PaymentStatusScreen } from '@/components/payment/PaymentStatusScreen';
import axios from 'axios';
import { API_URL } from '@/config/api.config';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentPageData {
  tenantName: string;
  ownerName: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  amount: number | string;
  currency: string;
  subscriptionId: string;
  status: string;
}

export function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    fetchPaymentData();
  }, [token]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/subscriptions/pay/${token}`);
      setPaymentData(data);

      // If status is pending_payment, create payment intent
      if (data.status === 'pending_payment') {
        const { data: intentData } = await axios.post(
          `${API_URL}/subscriptions/pay/${token}/create-payment-intent`
        );
        setClientSecret(intentData.clientSecret);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  // Show status screen if not pending payment
  if (paymentData.status !== 'pending_payment') {
    return <PaymentStatusScreen status={paymentData.status} />;
  }

  // Show payment form
  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Unable to initialize payment. Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            NovEntra
          </h1>
          <p className="text-gray-600">Complete your subscription</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Subscription Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold text-gray-800">{paymentData.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Cycle:</span>
              <span className="font-semibold text-gray-800">
                {paymentData.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
              </span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-purple-600">
                {Number(paymentData.amount).toFixed(3)} {paymentData.currency}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            🔒 Secure payment powered by Stripe
          </p>
        </div>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            token={token!}
            amount={Number(paymentData.amount)}
            currency={paymentData.currency}
            onSuccess={() => navigate(`/pay/${token}/success`)}
          />
        </Elements>
      </div>
    </div>
  );
}
