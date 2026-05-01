import { apiClient } from './client'
const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T

export interface InvoiceItem {
  id: string
  description: string
  qty: number
  unit_price: number
  line_total: number
}

export interface Invoice {
  id: string
  business_id: string
  customer_id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  number: string
  currency: string
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  due_date?: string
  reference?: string
  notes?: string
  pay_link?: string
  payment_session_id?: string
  created_at: string
  paid_at?: string
  items: InvoiceItem[]
}

export interface CreateInvoiceData {
  customer_id: string
  currency: string
  reference?: string
  notes?: string
  items: {
    description: string
    qty: number
    unit_price: number
  }[]
  due_date?: string
}

export interface InvoiceDelivery {
  invoice_id: string
  channel: string
  message: string
  whatsapp_url?: string
  email_sent: boolean
  email_recipient?: string
}

export const invoicesApi = {
  getInvoices: async (status?: string): Promise<Invoice[]> => {
    const params = status ? { status } : {}
    const response = await apiClient.get('/api/invoices', { params })
    return unwrap<Invoice[]>(response)
  },

  createInvoice: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post('/api/invoices', data)
    return unwrap<Invoice>(response)
  },

  updateInvoice: async (id: string, data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post(`/api/invoices/update?id=${id}`, data)
    return unwrap<Invoice>(response)
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/api/invoices/detail?id=${id}`)
    return unwrap<Invoice>(response)
  },

  getPublicInvoice: async (id: string, session?: string, email?: string, phone?: string): Promise<Invoice> => {
    const params: Record<string, string> = { id }
    if (session) params.session = session
    if (email) params.email = email
    if (phone) params.phone = phone
    const response = await apiClient.get('/api/invoices/public', { params })
    return unwrap<Invoice>(response)
  },

  sendInvoice: async (id: string): Promise<{ message: string; whatsapp_url?: string; delivery?: InvoiceDelivery }> => {
    const response = await apiClient.post(`/api/invoices/send?id=${id}`)
    return unwrap<{ message: string; whatsapp_url?: string; delivery?: InvoiceDelivery }>(response)
  },

  sendReminder: async (id: string): Promise<{ message: string; whatsapp_url?: string; delivery?: InvoiceDelivery }> => {
    const response = await apiClient.post(`/api/invoices/remind?id=${id}`)
    return unwrap<{ message: string; whatsapp_url?: string; delivery?: InvoiceDelivery }>(response)
  },

  generatePaymentLink: async (id: string): Promise<{ payment_url: string; session_id: string }> => {
    const response = await apiClient.post(`/api/invoices/pay?id=${id}`)
    return unwrap<{ payment_url: string; session_id: string }>(response)
  },

  payPublicInvoice: async (data: { invoice_id: string, session?: string, method: string, email?: string, phone?: string }): Promise<{ status: string }> => {
    const response = await apiClient.post('/api/invoices/public/pay', data)
    return unwrap<{ status: string }>(response)
  },
  deleteInvoice: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/invoices/delete?id=${id}`)
    return unwrap<{ message: string }>(response)
  },
}
