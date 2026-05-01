import React, { useState, useEffect } from 'react';
import { paymentRailsService, PaymentRailInfo, PaymentRail } from '../../services/paymentRails';

const Withdraw: React.FC = () => {
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('paystack_card');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [destination, setDestination] = useState('');
  const [availableRails, setAvailableRails] = useState<PaymentRailInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableRails();
  }, []);

  const loadAvailableRails = async () => {
    const rails = await paymentRailsService.getAvailableRails('withdraw');
    setAvailableRails(rails);
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || !destination) return;

    setLoading(true);
    try {
      await paymentRailsService.initiateWithdraw({
        amount: parseFloat(amount),
        currency,
        rail: selectedRail,
        destination
      });

      alert('Withdrawal initiated successfully. Processing may take a few minutes.');
      setAmount('');
      setDestination('');
    } catch (error) {
      alert('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRailInfo = availableRails.find(r => r.id === selectedRail);

  const getDestinationPlaceholder = () => {
    switch (selectedRail) {
      case 'paystack_card':
        return 'Bank account number';
      case 'circle_usdc':
        return 'USDC wallet address';
      case 'solana_native':
        return 'Solana wallet address';
      default:
        return 'Destination';
    }
  };

  const getDestinationLabel = () => {
    switch (selectedRail) {
      case 'paystack_card':
        return 'Bank Account';
      case 'circle_usdc':
        return 'USDC Address';
      case 'solana_native':
        return 'Solana Address';
      default:
        return 'Destination';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Withdraw Funds</h2>

      {/* Payment Rail Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Withdrawal Method</label>
        <div className="grid grid-cols-1 gap-3">
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
              <div className="flex items-center space-x-3">
                <span className="text-xl">{rail.icon}</span>
                <div>
                  <div className="font-medium">{rail.name}</div>
                  <div className="text-sm text-gray-500">{rail.description}</div>
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

      {/* Destination Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{getDestinationLabel()}</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={getDestinationPlaceholder()}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Withdraw Button */}
      <button
        onClick={handleWithdraw}
        disabled={loading || !amount || !destination}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Withdraw ${currency}`}
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

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          ⚠️ Withdrawals are irreversible. Please double-check your destination address.
        </p>
      </div>
    </div>
  );
};

export default Withdraw;