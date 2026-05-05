// src/pages/PaymentSuccessPage.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
        
        <p className="text-gray-600 mb-2">
          Your subscription is now active.
        </p>
        <p className="text-gray-600 mb-8">
          You can log in to your NovEntra account and start using all the features.
        </p>

        <Button
          onClick={() => navigate('/login')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg"
        >
          Go to Login
        </Button>

        <p className="text-xs text-gray-500 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
