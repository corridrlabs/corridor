import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Wallet, Bitcoin, Loader, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { invoicesApi } from '../api/invoices';
import { formatCurrency } from '../utils/formatting';

const money = (value: number, currency: string) =>
  formatCurrency(Number(value || 0), currency || 'USD');

type PaymentMethod = 'card' | 'mpesa' | 'crypto';

export default function InvoicePayPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const session = searchParams.get('session') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const methodParam = searchParams.get('method') as PaymentMethod | null;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(methodParam || 'card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'confirm' | 'processing' | 'success'>('method');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['public-invoice', id, session, email, phone],
    queryFn: () => invoicesApi.getPublicInvoice(id!, session, email, phone),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (invoice && methodParam) {
      setSelectedMethod(methodParam);
      setPaymentStep('details');
    }
  }, [invoice, methodParam]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStep('details');
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentStep('processing');

    setTimeout(() => {
      setIsComplete(true);
      setPaymentStep('success');
    }, 3000);
  };

  if (isLoading || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-sm text-slate-300">Loading payment...</div>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Invoice Already Paid</h1>
          <p className="text-slate-300">
            This invoice has already been paid. No further action is needed.
          </p>
          <Link to="/landing" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Go to Corridor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to={`/invoice/${invoice.id}?session=${session}&email=${email}&phone=${phone}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Invoice
          </Link>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Paying</p>
                <h1 className="text-xl font-bold">{invoice.number}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-slate-500">Amount</p>
                <p className="text-xl font-bold text-emerald-400">{money(invoice.total, invoice.currency)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">To:</span>
              <span className="text-white">{invoice.customer_name || 'Customer'}</span>
            </div>
          </div>

          {paymentStep === 'method' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400 mb-4">Select payment method</p>
              
              <button
                onClick={() => handleMethodSelect('card')}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-700 p-4 text-left hover:border-blue-500 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Card</div>
                  <div className="text-xs text-slate-400">Visa, Mastercard</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('mpesa')}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-700 p-4 text-left hover:border-green-500 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-xs text-slate-400">Mobile money</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('crypto')}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-700 p-4 text-left hover:border-purple-500 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                  <Bitcoin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Crypto</div>
                  <div className="text-xs text-slate-400">USDC, SOL</div>
                </div>
              </button>
            </div>
          )}

          {paymentStep === 'details' && (
            <div className="p-6 space-y-4">
              <button onClick={() => setPaymentStep('method')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                ← Change method
              </button>

              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'mpesa' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+254700000000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400">You'll receive an STK push on your phone</p>
                </div>
              )}

              {selectedMethod === 'crypto' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">Send exactly <span className="font-bold text-emerald-400">{money(invoice.total, invoice.currency)}</span> in USDC to the address below:</p>
                  <div className="bg-slate-800 p-3 rounded-lg break-all text-xs font-mono text-slate-300">
                    {invoice.id?.slice(0, 32)}...
                  </div>
                  <p className="text-xs text-slate-400">Only USDC on Solana is accepted</p>
                </div>
              )}

              <button
                onClick={() => setPaymentStep('confirm')}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-3 rounded-xl"
              >
                Continue
              </button>
            </div>
          )}

          {paymentStep === 'confirm' && (
            <div className="p-6 space-y-4 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  {selectedMethod === 'card' && <CreditCard className="h-8 w-8 text-blue-400" />}
                  {selectedMethod === 'mpesa' && <Wallet className="h-8 w-8 text-green-400" />}
                  {selectedMethod === 'crypto' && <Bitcoin className="h-8 w-8 text-purple-400" />}
                </div>
              </div>
              <h3 className="text-lg font-semibold">Confirm Payment</h3>
              <p className="text-slate-400 text-sm">
                Pay <span className="text-emerald-400 font-semibold">{money(invoice.total, invoice.currency)}</span> via {selectedMethod === 'card' ? 'card' : selectedMethod === 'mpesa' ? 'M-Pesa' : 'crypto'}?
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setPaymentStep('details')}
                  className="flex-1 border border-slate-700 py-3 rounded-xl text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePay}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-3 rounded-xl"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="p-12 text-center space-y-4">
              <Loader className="h-12 w-12 animate-spin mx-auto text-emerald-400" />
              <p className="text-slate-300">Processing payment...</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-slate-900" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Payment Successful!</h3>
              <p className="text-slate-400 text-sm">
                Invoice {invoice.number} has been paid. A receipt has been sent to your email.
              </p>
              <Link
                to={`/invoice/${invoice.id}?session=${session}&email=${email}&phone=${phone}`}
                className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-3 rounded-xl"
              >
                View Receipt
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}