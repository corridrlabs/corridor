import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, Wallet, Bitcoin, Loader, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentLinksApi } from '../api/paymentLinks';
import { formatCurrency } from '../utils/formatting';

const money = (value: number, currency: string) =>
  formatCurrency(Number(value || 0), currency || 'USD');

type PaymentMethod = 'card' | 'mpesa' | 'crypto';

export default function PaymentLinkPay() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'confirm' | 'processing' | 'success' | 'error'>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const { data: link, isLoading, error } = useQuery({
    queryKey: ['payment-link-resolve', slug],
    queryFn: () => paymentLinksApi.resolve(slug!),
    enabled: !!slug,
    retry: false,
  });

  const payMutation = useMutation({
    mutationFn: (data: { slug: string; payment_method: string; phone?: string }) =>
      paymentLinksApi.pay(data),
    onSuccess: (data) => {
      if (data.transaction_id) {
        setTransactionId(data.transaction_id);
      }
      setPaymentStep('processing');
      startPolling(data.transaction_id);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.error || 'Payment failed. Please try again.');
      setPaymentStep('error');
      setIsProcessing(false);
    },
  });

  const statusQuery = useQuery({
    queryKey: ['payment-status', transactionId],
    queryFn: () => paymentLinksApi.checkStatus(transactionId),
    enabled: !!transactionId && paymentStep === 'processing',
    refetchInterval: 3000,
    retry: false,
  });

  useEffect(() => {
    if (statusQuery.data && paymentStep === 'processing') {
      const status = statusQuery.data.status;
      if (status === 'COMPLETED') {
        setPaymentStep('success');
        setIsProcessing(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      } else if (status === 'FAILED') {
        setErrorMessage('Payment failed. Please try again.');
        setPaymentStep('error');
        setIsProcessing(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      }
    }
  }, [paymentStep, pollingInterval, statusQuery.data]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const startPolling = (txId: string) => {
    setTransactionId(txId);
    const timeoutInterval = setInterval(() => {
      clearInterval(timeoutInterval);
      setPollingInterval(null);
      if (paymentStep === 'processing') {
        setErrorMessage('This is taking a bit longer than usual. Please check status again shortly.');
      }
    }, 120000);
    setPollingInterval(timeoutInterval);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStep('details');
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    if (selectedMethod === 'mpesa' && !phoneNumber) {
      setErrorMessage('Please enter your phone number');
      setIsProcessing(false);
      return;
    }

    payMutation.mutate({
      slug: slug!,
      payment_method: selectedMethod,
      phone: selectedMethod === 'mpesa' ? phoneNumber : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <div className="text-sm text-slate-300">Loading payment details...</div>
        </div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Link Not Found</h1>
          <p className="text-slate-300">
            This payment link is unavailable.
          </p>
          <Link to="/landing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold">
            <ArrowLeft className="w-4 h-4" />
            Go to Corridor
          </Link>
        </div>
      </div>
    );
  }

  if (!link.is_active) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Link Inactive</h1>
          <p className="text-slate-300">
            This payment link is not active right now.
          </p>
          <Link to="/landing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold">
            <ArrowLeft className="w-4 h-4" />
            Go to Corridor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Payment For</p>
                <h1 className="text-xl font-black text-white break-words">{link.title}</h1>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Amount</p>
                <p className="text-2xl font-black text-emerald-400">{money(link.amount, link.currency)}</p>
              </div>
            </div>
          </div>

          {paymentStep === 'method' && (
            <div className="p-6 sm:p-8 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Choose how you want to pay</p>

              <button
                onClick={() => handleMethodSelect('card')}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 p-4 text-left hover:border-blue-500 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 group-hover:scale-110 transition-transform shadow-lg shadow-blue-900/20">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">Card</div>
                  <div className="text-xs text-slate-500">Visa, Mastercard, Amex</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('mpesa')}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 p-4 text-left hover:border-green-500 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 group-hover:scale-110 transition-transform shadow-lg shadow-green-900/20">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">M-Pesa</div>
                  <div className="text-xs text-slate-500">Mobile money (STK Push)</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('crypto')}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 p-4 text-left hover:border-purple-500 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 group-hover:scale-110 transition-transform shadow-lg shadow-purple-900/20">
                  <Bitcoin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">Crypto</div>
                  <div className="text-xs text-slate-500">USDC on Solana</div>
                </div>
              </button>
            </div>
          )}

          {paymentStep === 'details' && (
            <div className="p-6 sm:p-8 space-y-6">
              <button onClick={() => setPaymentStep('method')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3" /> Choose another method
              </button>

              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'mpesa' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+254700000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-400 leading-relaxed font-medium">You'll get an M-Pesa prompt on your phone. Enter your PIN to continue.</p>
                  </div>
                </div>
              )}

              {selectedMethod === 'crypto' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      Send exactly <span className="font-black text-emerald-400">{money(link.amount, link.currency)}</span> in <span className="text-blue-400 font-bold">USDC</span> to the address below:
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl break-all text-xs font-mono text-slate-300 border border-slate-700">
                    {link.id?.replace(/-/g, '').toUpperCase()}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center italic">Only USDC on Solana is accepted</p>
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-400">After sending payment, tap below to confirm.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setPaymentStep('confirm')}
                className="w-full mt-4 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98]"
              >
                Review payment
              </button>
            </div>
          )}

          {paymentStep === 'confirm' && (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-2xl bg-slate-800 flex items-center justify-center shadow-inner">
                  {selectedMethod === 'card' && <CreditCard className="h-10 w-10 text-blue-400" />}
                  {selectedMethod === 'mpesa' && <Wallet className="h-10 w-10 text-green-400" />}
                  {selectedMethod === 'crypto' && <Bitcoin className="h-10 w-10 text-purple-400" />}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">Confirm payment</h3>
                <p className="text-slate-400 text-sm">
                  You're paying <span className="text-emerald-400 font-black">{money(link.amount, link.currency)}</span> via {selectedMethod === 'card' ? 'card' : selectedMethod === 'mpesa' ? 'M-Pesa' : 'crypto'}.
                </p>
              </div>
              {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setPaymentStep('details')}
                  className="flex-1 border border-slate-700 py-4 rounded-2xl text-slate-300 font-bold hover:bg-slate-800 transition-all"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Pay now'}
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="p-10 sm:p-16 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <Loader className="h-16 w-16 animate-spin mx-auto text-emerald-400 relative z-10" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Processing payment</p>
                <p className="text-slate-500 text-sm mt-1">
                  {selectedMethod === 'mpesa' && 'Please check your phone and enter M-Pesa PIN...'}
                  {selectedMethod === 'card' && 'Processing your card...'}
                  {selectedMethod === 'crypto' && 'Waiting for network confirmation...'}
                </p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                  <CheckCircle className="h-12 w-12 text-slate-900" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Payment received!</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Your payment for <span className="text-white font-bold">{link.title}</span> was successful. A confirmation has been sent.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/landing"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </div>
            </div>
          )}

          {paymentStep === 'error' && (
            <div className="p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/20">
                  <AlertCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Payment failed</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {errorMessage || 'Something went wrong. Please try again.'}
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setPaymentStep('method');
                    setErrorMessage('');
                  }}
                  className="flex-1 border border-slate-700 py-4 rounded-2xl text-slate-300 font-bold hover:bg-slate-800 transition-all"
                >
                  Try again
                </button>
                <Link
                  to="/landing"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
            Powered by Corridor
          </div>
        </div>
      </div>
    </div>
  );
}
