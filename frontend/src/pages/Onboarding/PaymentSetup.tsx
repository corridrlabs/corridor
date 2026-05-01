import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Connect your card for instant deposits',
    icon: '💳',
    available: true
  },
  {
    id: 'bank',
    name: 'Bank Account',
    description: 'Link your bank account for ACH transfers',
    icon: '🏦',
    available: true
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Deposit USDC or SOL directly',
    icon: '₿',
    available: true
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Mobile money for African markets',
    icon: '📱',
    available: false
  }
];

const PaymentSetup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const handleContinue = () => {
    if (selectedMethod) {
      localStorage.setItem('onboarding_payment_method', selectedMethod);
    }
    navigate('/onboarding/complete');
  };

  const handleSkip = () => {
    navigate('/onboarding/complete');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect a payment method</h1>
          <p className="text-gray-600">Choose how you'd like to fund your Corridor wallet</p>
        </div>

        <div className="space-y-4 mb-8">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => method.available && setSelectedMethod(method.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : method.available
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{method.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${method.available ? 'text-gray-900' : 'text-gray-400'}`}>
                    {method.name}
                  </h3>
                  <p className={`text-sm ${method.available ? 'text-gray-600' : 'text-gray-400'}`}>
                    {method.description}
                  </p>
                </div>
                {!method.available && (
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
                {method.available && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === method.id && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-lg">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900">You can add more payment methods later</h4>
              <p className="text-sm text-blue-700">
                This is just to get you started. You can connect additional payment methods from your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/onboarding/business-info')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <div className="space-x-4">
            <button
              onClick={handleSkip}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </button>
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {selectedMethod ? 'Continue' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;