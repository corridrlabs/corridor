import React, { useState } from 'react';
import CardDeposit from '../components/deposits/CardDeposit';
import CryptoDeposit from '../components/deposits/CryptoDeposit';

type DepositMethod = 'card' | 'crypto';

const AddFundsPage: React.FC = () => {
  const [method, setMethod] = useState<DepositMethod>('card');
  const [amount, setAmount] = useState('50.00');

  const getButtonClass = (buttonMethod: DepositMethod) => {
    return method === buttonMethod
      ? 'bg-blue-600 text-white shadow-lg'
      : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  };

  const presets = ['20.00', '50.00', '100.00', '500.00'];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-8 border-b border-gray-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Your Wallet</h1>
          <p className="text-gray-500">Securely add borderless money to your account using card or crypto.</p>
        </div>

        <div className="p-8 bg-gray-50/50">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Select Amount (USD)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className={`py-3 rounded-xl font-bold transition-all ${amount === p ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg scale-[1.02]' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-500/50'}`}
              >
                ${p}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xl font-bold text-gray-800"
              placeholder="Other amount"
            />
          </div>
        </div>

        <div className="flex px-8 pt-8">
          <button
            onClick={() => setMethod('card')}
            className={`flex-1 py-4 px-6 rounded-t-2xl font-bold transition-all ${getButtonClass('card')}`}
          >
            Credit/Debit Card
          </button>
          <button
            onClick={() => setMethod('crypto')}
            className={`flex-1 py-4 px-6 rounded-t-2xl font-bold transition-all ${getButtonClass('crypto')}`}
          >
            USDC (Solana)
          </button>
        </div>

        <div className="border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
          {method === 'card' && <CardDeposit amount={amount} />}
          {method === 'crypto' && <CryptoDeposit amount={amount} />}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 italic">
          <p className="text-xs text-gray-400 text-center">
            Payments processed securely by Circle. Crypto settlements occur instantly on the Solana blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddFundsPage;