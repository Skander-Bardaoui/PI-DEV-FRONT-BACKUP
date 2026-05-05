// src/components/payment/PaymentStatusScreen.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, Ban } from 'lucide-react';

interface PaymentStatusScreenProps {
  status: string;
}

export function PaymentStatusScreen({ status }: PaymentStatusScreenProps) {
  const navigate = useNavigate();

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
          title: 'Subscription Active',
          message: 'Your subscription is already active. You can now log in to your account.',
          buttonText: 'Go to Login',
          buttonAction: () => navigate('/login'),
        };
      case 'suspended':
        return {
          icon: <Ban className="h-16 w-16 text-red-500" />,
          title: 'Subscription Suspended',
          message: 'Your subscription has been suspended. Please contact support for assistance.',
          buttonText: 'Contact Support',
          buttonAction: () => window.location.href = 'mailto:support@noventra.com',
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-16 w-16 text-gray-500" />,
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. Please contact support to reactivate your account.',
          buttonText: 'Contact Support',
          buttonAction: () => window.location.href = 'mailto:support@noventra.com',
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
          title: 'Invalid Payment Link',
          message: 'This payment link is no longer valid.',
          buttonText: 'Go to Home',
          buttonAction: () => navigate('/'),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {config.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h2>
        <p className="text-gray-600 mb-8">{config.message}</p>
        <Button
          onClick={config.buttonAction}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {config.buttonText}
        </Button>
      </div>
    </div>
  );
}
