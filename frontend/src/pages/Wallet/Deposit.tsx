import React, { useState, useEffect } from 'react';
import { paymentRailsService, PaymentRailInfo, PaymentRail } from '../../services/paymentRails';

const Deposit: React.FC = () => {
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('paystack_card');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [availableRails, setAvailableRails] = useState<PaymentRailInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadAvailableRails();
  }, []);

  const loadAvailableRails = async () => {
    const rails = await paymentRailsService.getAvailableRails('deposit');
    setAvailableRails(rails);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const metadata: Record<string, any> = {};
      if (selectedRail === 'mpesa' && phone) {
        metadata.phone = phone;
      }

      const result = await paymentRailsService.initiateDeposit({
        amount: parseFloat(amount),
        currency,
        rail: selectedRail,
        metadata
      });

      // Handle different rail responses
      if (selectedRail === 'paystack_card') {
        // Redirect to Paystack
        window.location.href = result.reference;
      } else if (selectedRail === 'mpesa') {
        alert('STK push sent to your phone. Please complete the payment.');
      } else if (selectedRail === 'circle_usdc' || selectedRail === 'solana_native') {
        // Show deposit address
        const address = await paymentRailsService.getDepositAddress(selectedRail);
        alert(`Send ${currency} to: ${address}`);
      }
    } catch (error) {
      alert('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRailInfo = availableRails.find(r => r.id === selectedRail);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Deposit Funds</h2>

      {/* Payment Rail Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Method</label>
        <div className="grid grid-cols-2 gap-3">
          {availableRails.map((rail) => (
            <button
              key={rail.id}
              onClick={() => {
                setSelectedRail(rail.id);
                setCurrency(rail.currencies[0]);
              }}
              className={`p-3 border rounded-lg text-left ${
                selectedRail === rail.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{rail.icon}</span>
                <div>
                  <div className="font-medium text-sm">{rail.name}</div>
                  <div className="text-xs text-gray-500">{rail.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency Selection */}
      {selectedRailInfo && selectedRailInfo.currencies.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {selectedRailInfo.currencies.map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* M-Pesa Phone Input */}
      {selectedRail === 'mpesa' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712345678"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      {/* Deposit Button */}
      <button
        onClick={handleDeposit}
        disabled={loading || !amount}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Deposit ${currency}`}
      </button>

      {/* Rail Info */}
      {selectedRailInfo && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">{selectedRailInfo.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Supported currencies: {selectedRailInfo.currencies.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Deposit;