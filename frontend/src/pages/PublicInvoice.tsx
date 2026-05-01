import { useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ArrowLeft, ShieldCheck, Mail, Phone, CreditCard, Wallet, Bitcoin, Loader } from 'lucide-react'
import { invoicesApi } from '../api/invoices'
import { formatCurrency } from '../utils/formatting'

const money = (value: number, currency: string) =>
  formatCurrency(Number(value || 0), currency || 'USD')

export default function PublicInvoice() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams()
  const session = searchParams.get('session') || ''
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || ''
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'mpesa' | 'crypto'>('card')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['public-invoice', id, session, email, phone],
    queryFn: () => invoicesApi.getPublicInvoice(id!, session, email, phone),
    enabled: !!id,
    retry: false,
  })

  const dueState = useMemo(() => {
    if (!invoice?.due_date) return 'Due on receipt'
    const due = new Date(invoice.due_date)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    if (diff < 0) return 'Overdue'
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`
  }, [invoice?.due_date])

  const handlePrint = () => window.print()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-sm text-slate-300">Loading invoice...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-semibold">Invoice access unavailable</h1>
          <p className="text-slate-300 text-sm">
            This invoice link is missing a valid session, or the recipient contact does not match the invoice records.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] text-slate-900 print:bg-white print:text-black">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:px-0 print:py-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to="/landing" className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Corridor
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-black/20 ring-1 ring-white/10 print:rounded-none print:shadow-none print:ring-0">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-8 py-10 text-white print:bg-white print:text-black">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 print:text-slate-500">Corridor Invoice</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight">{invoice.number}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 print:text-slate-600">
                  A clean, printable invoice for {invoice.customer_name || 'your customer'} with direct payment access.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur print:bg-slate-50 print:backdrop-blur-0">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200 print:text-slate-500">Status</div>
                <div className="mt-1 text-2xl font-semibold capitalize">{invoice.status}</div>
                <div className="mt-3 text-sm text-slate-300 print:text-slate-600">{dueState}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bill To</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{invoice.customer_name || 'Customer'}</div>
                  {invoice.customer_email && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      {invoice.customer_email}
                    </div>
                  )}
                  {invoice.customer_phone && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      {invoice.customer_phone}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice Details</div>
                  <div className="mt-2 grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-slate-500">Reference</span>
                    <span className="font-medium text-slate-950">{invoice.reference || '—'}</span>
                    <span className="text-slate-500">Issue Date</span>
                    <span className="font-medium text-slate-950">{new Date(invoice.created_at).toLocaleDateString()}</span>
                    <span className="text-slate-500">Due Date</span>
                    <span className="font-medium text-slate-950">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'On receipt'}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700">
                  Line Items
                </div>
                <div className="divide-y divide-slate-200">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 px-5 py-4 text-sm">
                      <div className="col-span-7">
                        <div className="font-medium text-slate-950">{item.description}</div>
                      </div>
                      <div className="col-span-2 text-right text-slate-600">{item.qty}</div>
                      <div className="col-span-3 text-right text-slate-600">{money(item.line_total, invoice.currency)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {invoice.notes && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Summary</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-950">{money(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium text-slate-950">{money(invoice.tax, invoice.currency)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-950">Total</span>
                      <span className="text-2xl font-bold text-slate-950">{money(invoice.total, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.status === 'paid' ? (
                <div className="rounded-2xl bg-emerald-950 p-5 text-white print:bg-emerald-100 print:text-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 print:text-emerald-600">Paid</div>
                      <p className="text-sm font-medium">This invoice has been paid</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-800 p-5 text-white print:bg-slate-100 print:text-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 print:text-slate-500">Pay Invoice</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300 print:text-slate-700">
                    Securely pay this invoice using your preferred payment method.
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 print:border print:border-slate-300"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now — {money(invoice.total, invoice.currency)}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 print:border print:border-slate-300"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Select Payment Method</h3>
              <p className="mt-1 text-sm text-slate-400">Choose how you'd like to pay {money(invoice.total, invoice.currency)}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  selectedMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Card Payment</div>
                  <div className="text-xs text-slate-400">Visa, Mastercard, Amex</div>
                </div>
                {selectedMethod === 'card' && <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>}
              </button>

              <button
                onClick={() => setSelectedMethod('mpesa')}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  selectedMethod === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">M-Pesa</div>
                  <div className="text-xs text-slate-400">Instant mobile money (Kenya)</div>
                </div>
                {selectedMethod === 'mpesa' && <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>}
              </button>

              <button
                onClick={() => setSelectedMethod('crypto')}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  selectedMethod === 'crypto'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                  <Bitcoin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Crypto / USDC</div>
                  <div className="text-xs text-slate-400">Solana, Ethereum</div>
                </div>
                {selectedMethod === 'crypto' && <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>}
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsProcessing(true)
                  try {
                    await invoicesApi.payPublicInvoice({
                      invoice_id: invoice.id,
                      session: session || undefined,
                      email: email || undefined,
                      phone: phone || undefined,
                      method: selectedMethod,
                    });
                    
                    // Invalidate query to trigger refetch and show Paid state
                    queryClient.invalidateQueries({ queryKey: ['public-invoice', id, session, email, phone] })
                    
                    setShowPaymentModal(false)
                  } catch (err) {
                    console.error('Payment error:', err)
                    alert('Payment simulation failed. Please try again or check logs.')
                  } finally {
                    setIsProcessing(false)
                  }
                }}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Pay ${money(invoice.total, invoice.currency)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
