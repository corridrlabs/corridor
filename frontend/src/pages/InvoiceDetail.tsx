import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bell, Copy, CreditCard, ExternalLink, Plus, Send, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { customersApi } from '../api/customers'
import { CreateInvoiceData, invoicesApi } from '../api/invoices'

const emptyItem = () => ({ description: '', qty: 1, unit_price: 0 })

const toDateInput = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [draft, setDraft] = useState<CreateInvoiceData>({
    customer_id: '',
    currency: 'USD',
    reference: '',
    notes: '',
    due_date: '',
    items: [emptyItem()],
  })

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(id!),
    enabled: !!id,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  })

  useEffect(() => {
    if (!invoice) return
    setDraft({
      customer_id: invoice.customer_id || '',
      currency: invoice.currency || 'USD',
      reference: invoice.reference || '',
      notes: invoice.notes || '',
      due_date: toDateInput(invoice.due_date),
      items:
        invoice.items?.length > 0
          ? invoice.items.map((item) => ({
              description: item.description,
              qty: item.qty,
              unit_price: item.unit_price,
            }))
          : [emptyItem()],
    })
  }, [invoice])

  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => invoicesApi.sendInvoice(invoiceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showToast('success', 'Invoice delivery prepared.')
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to send invoice.')
    },
  })

  const sendReminderMutation = useMutation({
    mutationFn: (invoiceId: string) => invoicesApi.sendReminder(invoiceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showToast('success', 'Reminder prepared.')
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to send reminder.')
    },
  })

  const generatePaymentLinkMutation = useMutation({
    mutationFn: (invoiceId: string) => invoicesApi.generatePaymentLink(invoiceId),
    onSuccess: (data) => {
      window.open(data.payment_url, '_blank', 'noopener,noreferrer')
      showToast('success', 'Payment link opened.')
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to generate payment link.')
    },
  })

  const updateInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoiceData) => invoicesApi.updateInvoice(id!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['invoice', id], updated)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showToast('success', 'Invoice updated successfully.')
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to update invoice.')
    },
  })

  const publicLink = useMemo(() => {
    if (!invoice) return ''
    return invoice.pay_link || (invoice.payment_session_id ? `${window.location.origin}/invoice/${invoice.id}?session=${invoice.payment_session_id}` : '')
  }, [invoice])

  const customer = customers.find((c) => c.id === draft.customer_id) || customers.find((c) => c.id === invoice?.customer_id)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      showToast('error', 'Failed to copy link.')
    }
  }

  const addItem = () => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }))
  }

  const removeItem = (index: number) => {
    setDraft((current) => {
      if (current.items.length === 1) return current
      return {
        ...current,
        items: current.items.filter((_, i) => i !== index),
      }
    })
  }

  const updateItem = (index: number, field: 'description' | 'qty' | 'unit_price', value: string | number) => {
    setDraft((current) => {
      const items = [...current.items]
      items[index] = {
        ...items[index],
        [field]: field === 'qty' || field === 'unit_price' ? Number(value) : value,
      }
      return { ...current, items }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    updateInvoiceMutation.mutate(draft)
  }

  if (isLoading || !invoice) {
    return <div className="card p-8 text-sm text-gray-500">Loading invoice...</div>
  }

  const editable = invoice.status !== 'paid'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendInvoiceMutation.mutate(invoice.id)}
            disabled={sendInvoiceMutation.isLoading}
            className="btn btn-primary inline-flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Send via WhatsApp
          </button>
          <button
            onClick={() => sendReminderMutation.mutate(invoice.id)}
            disabled={sendReminderMutation.isLoading}
            className="btn btn-secondary inline-flex items-center"
          >
            <Bell className="w-4 h-4 mr-2" />
            Send Reminder
          </button>
          <button
            onClick={() => generatePaymentLinkMutation.mutate(invoice.id)}
            disabled={generatePaymentLinkMutation.isLoading}
            className="btn btn-secondary inline-flex items-center"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Generate Payment Link
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="card space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{invoice.number}</h1>
                <p className="text-sm text-gray-500">Edit the invoice, then save changes before sending.</p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {invoice.status}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  className="input"
                  value={draft.customer_id}
                  onChange={(e) => setDraft({ ...draft, customer_id: e.target.value })}
                  disabled={!editable}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  className="input"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                  disabled={!editable}
                >
                  {['USD', 'KES', 'EUR', 'GBP', 'NGN', 'ZAR', 'UGX', 'TZS', 'RWF', 'GHS'].map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / PO Number</label>
                <input
                  className="input"
                  value={draft.reference || ''}
                  onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
                  placeholder="INV-2026-004"
                  disabled={!editable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={draft.due_date || ''}
                  onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                  disabled={!editable}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Notes</label>
              <textarea
                rows={4}
                className="input"
                value={draft.notes || ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Add payment terms, delivery notes, or a short message."
                disabled={!editable}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <button type="button" onClick={addItem} className="btn btn-secondary inline-flex items-center" disabled={!editable}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
              <div className="space-y-3">
                {draft.items.map((item, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[1.8fr_0.5fr_0.7fr_auto]">
                    <input
                      className="input"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      disabled={!editable}
                    />
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      disabled={!editable}
                    />
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      disabled={!editable}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={!editable || draft.items.length === 1}
                      className="btn btn-secondary inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(publicLink)}
                disabled={!publicLink}
                className="btn btn-secondary inline-flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Public Link
              </button>
              <button
                type="submit"
                disabled={!editable || updateInvoiceMutation.isLoading}
                className="btn btn-primary inline-flex items-center"
              >
                {updateInvoiceMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due</span>
                <span className="text-gray-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="text-gray-900">{invoice.reference || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Public Link</span>
                <span className="text-gray-900">{publicLink ? 'Ready' : 'Not ready'}</span>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Customer</h3>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-900">{customer?.name || invoice.customer_name || 'Unknown customer'}</div>
              <div className="text-gray-600">{customer?.phone || invoice.customer_phone || 'No phone'}</div>
              <div className="text-gray-600">{customer?.email || invoice.customer_email || 'No email'}</div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Public Access</h3>
            <div className="text-sm text-gray-600">
              The recipient can open the invoice directly with the signed public link or from the WhatsApp message.
            </div>
            {publicLink ? (
              <div className="space-y-2">
                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700 break-all">{publicLink}</div>
                <button
                  type="button"
                  onClick={() => window.open(publicLink, '_blank', 'noopener,noreferrer')}
                  className="btn btn-secondary inline-flex items-center w-full justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Invoice
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Generate a payment link to activate public access.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
