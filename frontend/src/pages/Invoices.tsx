import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { invoicesApi, CreateInvoiceData } from '../api/invoices';
import { customersApi } from '../api/customers';
import {
  FileText,
  Plus,
  Send,
  Bell,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  X,
  ChevronRight,
  Receipt,
  Download,
  ShieldCheck,
  RefreshCw,
  Loader2,
  DollarSign,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; icon: React.FC<any>; color: string; loading?: boolean }> = ({
    label, value, icon: Icon, color, loading
}) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-6 group hover:translate-y-[-4px] transition-all duration-300">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
            <p className="text-3xl font-bold text-slate-900 truncate">{loading ? '...' : value}</p>
        </div>
    </div>
);

export default function Invoices() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<CreateInvoiceData>({
    customer_id: '',
    currency: 'USD',
    reference: '',
    notes: '',
    due_date: '',
    items: [{ description: '', qty: 1, unit_price: 0 }],
  });
  
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rawInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getInvoices(),
  });

  const { data: rawCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  const invoicesList = Array.isArray(rawInvoices) ? rawInvoices : [];
  const customersList = Array.isArray(rawCustomers) ? rawCustomers : [];

  const filteredInvoices = useMemo(() => {
    return invoicesList.filter(inv => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch = 
        inv.number?.toLowerCase().includes(term) ||
        inv.customer_name?.toLowerCase().includes(term) ||
        inv.reference?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [invoicesList, statusFilter, searchQuery]);

  const totalOutstanding = useMemo(() => {
    return invoicesList
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.total, 0);
  }, [invoicesList]);

  const totalPaid = useMemo(() => {
    return invoicesList
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
  }, [invoicesList]);

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => invoicesApi.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowModal(false);
      showToast('success', invoice.pay_link ? 'Invoice created! Link ready to share.' : 'Invoice created successfully!');
      setFormData({
        customer_id: '',
        currency: 'USD',
        reference: '',
        notes: '',
        due_date: '',
        items: [{ description: '', qty: 1, unit_price: 0 }],
      });
      setNewCustomer({ name: '', email: '', phone: '' });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || err.message || 'Failed to create invoice.');
    }
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.sendInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast('success', 'Invoice sent successfully!');
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to send invoice.');
    }
  });

  const generatePaymentLinkMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.generatePaymentLink(id),
    onSuccess: (data) => {
      showToast('info', 'Opening payment link...');
      window.open(data.payment_url, '_blank');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to generate link.');
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast('success', 'Invoice deleted successfully.');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.error || 'Failed to delete invoice.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalCustomerId = formData.customer_id;
      if (formData.customer_id === 'NEW_CUSTOMER') {
        const customer = await customersApi.createCustomer({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone
        });
        showToast('success', 'New customer added.');
        finalCustomerId = customer.id;
      }
      createInvoiceMutation.mutate({ ...formData, customer_id: finalCustomerId });
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      showToast('error', err.response?.data?.error || err.message || 'Failed to add new customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', qty: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
      default:
        return <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-12 px-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 font-semibold text-indigo-600 mb-6 border shadow-sm">
            <Receipt size={14} strokeWidth={3} />
            Billing Active
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Invoices</h1>
          <p className="text-slate-500 font-medium mt-4 text-xl tracking-tight max-w-2xl">Professional invoicing for your business. Send requests and get paid instantly from anywhere.</p>
        </div>
        <div className="flex flex-wrap gap-5">
           <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-4 px-12 py-6 text-sm font-medium text-white bg-indigo-600 rounded-[1.75rem] hover:bg-indigo-700 transition-all shadow-[0_24px_48px_-12px_rgba(79,70,229,0.4)] active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <StatCard label="Outstanding" value={`$${totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={Clock} color="bg-amber-500/10 text-amber-600" loading={loadingInvoices} />
        <StatCard label="Paid Amount" value={`$${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-600" loading={loadingInvoices} />
        <StatCard label="Total Invoices" value={String(invoicesList.length)} icon={FileText} color="bg-slate-900 text-white" loading={loadingInvoices} />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] overflow-hidden">
        {/* Toolbar */}
        <div className="px-12 py-12 flex flex-col md:flex-row items-center gap-10 border-b border-slate-50">
          <div className="relative flex-1 group">
            <Search size={26} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by invoice number, customer, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-20 pr-10 py-7 text-sm font-bold bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-medium shadow-inner"
            />
          </div>
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <Filter size={24} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-56 bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-medium text-slate-600 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
                 className="p-7 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 rounded-[2.5rem] border border-slate-50 transition-all active:scale-95">
                <RefreshCw size={28} strokeWidth={2.5} className={loadingInvoices ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="min-h-[600px] bg-white">
          {loadingInvoices ? (
             <div className="p-60 text-center">
                <Loader2 size={80} className="animate-spin mx-auto mb-12 text-indigo-500/10" />
                <p className="text-sm font-medium text-slate-300">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-52 text-center px-12">
                <div className="w-40 h-40 bg-slate-50 rounded-[4rem] flex items-center justify-center mx-auto mb-14 shadow-inner border border-slate-100 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <FileText size={72} className="text-slate-200 group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">No Invoices</h3>
                <p className="text-slate-500 mt-6 max-w-xl mx-auto font-medium leading-relaxed text-xl tracking-tight">Create your first invoice to start collecting payments.</p>
                <button onClick={() => setShowModal(true)}
                    className="mt-16 inline-flex items-center gap-6 px-14 py-7 bg-indigo-600 text-white text-sm font-medium rounded-[2rem] hover:bg-indigo-700 shadow-[0_24px_48px_-12px_rgba(79,70,229,0.4)] transition-all active:scale-95 group">
                    <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500" /> 
                    Create First Invoice
                </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/40 text-xs font-medium text-slate-400 border-slate-50">
                    <th className="px-14 py-10">Invoice #</th>
                    <th className="px-14 py-10">Customer</th>
                    <th className="px-14 py-10">Amount</th>
                    <th className="px-14 py-10">Status</th>
                    <th className="px-14 py-10">Due Date</th>
                    <th className="px-14 py-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-all group">
                      <td className="px-14 py-12">
                        <Link to={`/invoices/${invoice.id}`} className="font-mono font-black text-indigo-600 hover:text-indigo-800 transition-colors text-lg tracking-tight">
                          {invoice.number}
                        </Link>
                        {invoice.reference && (
                          <div className="text-xs font-medium text-slate-500 mt-2">Ref: {invoice.reference}</div>
                        )}
                      </td>
                      <td className="px-14 py-12">
                        <div className="font-black text-slate-900 text-2xl tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">{invoice.customer_name || 'Customer'}</div>
                      </td>
                      <td className="px-14 py-12">
                        <div className="font-black text-slate-900 text-3xl tracking-tighter tabular-numbers leading-none">
                          {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-400 ml-2">{invoice.currency}</span>
                        </div>
                      </td>
                      <td className="px-14 py-12">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-14 py-12">
                         <div className="flex items-center gap-5 text-slate-600 bg-slate-50 pr-8 pl-3 py-3 rounded-[1.75rem] w-fit border border-slate-100 shadow-inner group-hover:bg-white group-hover:shadow-xl transition-all">
                            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-50 text-indigo-500">
                                <Calendar size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs text-xs font-medium">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}</span>
                        </div>
                      </td>
                      <td className="px-14 py-12">
                        <div className="flex items-center justify-end gap-5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {invoice.status === 'pending' && (
                            <>
                              <button
                                onClick={() => generatePaymentLinkMutation.mutate(invoice.id)}
                                className="p-6 text-slate-300 hover:text-emerald-600 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] rounded-[2.25rem] transition-all border border-transparent hover:border-emerald-100 active:scale-90"
                                title="Open Payment Link"
                              >
                                <CreditCard size={24} />
                              </button>
                              <button
                                onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                                className="p-6 text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.2)] rounded-[2.25rem] transition-all border border-transparent hover:border-indigo-100 active:scale-90"
                                title="Send Invoice"
                              >
                                <Send size={24} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this invoice?')) {
                                    deleteInvoiceMutation.mutate(invoice.id);
                                  }
                                }}
                                className="p-6 text-slate-300 hover:text-rose-500 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.2)] rounded-[2.25rem] transition-all border border-transparent hover:border-rose-100 active:scale-90"
                                title="Delete"
                              >
                                <Trash2 size={24} />
                              </button>
                            </>
                          )}
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="p-6 text-slate-300 hover:text-slate-900 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.1)] rounded-[2.25rem] transition-all border border-transparent hover:border-slate-100 active:scale-90"
                            title="View Details"
                          >
                            <ChevronRight size={24} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

       {/* Security & Compliance Section */}
        <div className="flex flex-col items-center gap-12 pt-24 pb-48 opacity-30 grayscale hover:grayscale-0 transition-all duration-[2s] hover:opacity-100">
            <div className="flex flex-wrap items-center justify-center gap-24">
                <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
                    <ShieldCheck size={24} className="text-indigo-500" strokeWidth={3} />
                    Secure Verification
                </div>
                <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
                    <ShieldCheck size={24} className="text-indigo-500" strokeWidth={3} />
                    Tax Compliance
                </div>
                <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
                    <ShieldCheck size={24} className="text-indigo-500" strokeWidth={3} />
                    PCI-DSS Compliant
                </div>
            </div>
            <div className="h-px w-80 bg-gradient-to-r from-transparent via-slate-200 to-transparent shadow-sm" />
        </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[80px]" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[5rem] shadow-[0_60px_200px_-40px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-[0.98] duration-700 border border-white/50 flex flex-col">
            <div className="flex items-center justify-between p-24 pb-12">
               <div>
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-12 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] border-[8px] border-indigo-100">
                        <Receipt size={40} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">New Invoice</h2>
                    <p className="text-slate-500 text-2xl font-medium mt-6 tracking-tight max-w-xl">Create a professional invoice for your customer.</p>
                </div>
              <button onClick={() => setShowModal(false)} className="p-6 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-[3rem] transition-all border border-transparent hover:border-slate-100 active:scale-90 self-start">
                <X size={32} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-24 space-y-16 pb-24 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Customer</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    >
                      <option value="">Select customer...</option>
                      <option value="NEW_CUSTOMER" className="font-extrabold text-indigo-600">+ Add new customer</option>
                      <optgroup label="Your Customers">
                        {customersList.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {formData.customer_id === 'NEW_CUSTOMER' && (
                    <div className="p-10 bg-indigo-50/30 border-2 border-indigo-100 rounded-[3.5rem] space-y-6 animate-in slide-in-from-top-4 duration-500">
                      <input
                        type="text"
                        required
                        placeholder="Customer Name"
                        className="w-full bg-white border border-indigo-100 rounded-[1.75rem] px-8 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full bg-white border border-indigo-100 rounded-[1.75rem] px-8 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number (+1...)"
                        className="w-full bg-white border border-indigo-100 rounded-[1.75rem] px-8 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Currency</label>
                      <select
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="USD">USD</option>
                        <option value="KES">KES</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="NGN">NGN</option>
                        <option value="ZAR">ZAR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Due Date</label>
                      <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2024-001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={formData.reference || ''}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-6">Invoice Items</label>
                <div className="bg-slate-50 rounded-[4rem] border-2 border-slate-100 p-6 space-y-4 shadow-inner">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group animate-in slide-in-from-right-4 duration-500">
                      <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Description"
                            required
                            className="w-full bg-transparent border-none focus:ring-0 text-lg font-black text-slate-900 placeholder:text-slate-200"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-6 sm:w-80 pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-8">
                        <div className="flex flex-col items-center">
                             <input
                                type="number"
                                placeholder="Qty"
                                required
                                min="1"
                                step="0.01"
                                className="w-20 bg-slate-50 rounded-2xl border-none text-center text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 py-3"
                                value={Number.isNaN(item.qty) ? '' : item.qty}
                                onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value))}
                            />
                        </div>
                        <span className="text-slate-200 font-black">×</span>
                        <div className="flex-1 relative">
                             <input
                                type="number"
                                placeholder="Rate"
                                required
                                min="0"
                                step="0.01"
                                className="w-full bg-slate-50 rounded-2xl border-none text-right text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 py-3 pr-4 pl-8"
                                value={Number.isNaN(item.unit_price) ? '' : item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                            />
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all disabled:opacity-0"
                          disabled={formData.items.length === 1}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full py-8 flex items-center justify-center gap-4 text-sm font-medium bg-white hover:bg-indigo-50 rounded-[2.5rem] transition-all border-4 border-dashed border-indigo-100 active:scale-[0.98]"
                  >
                    <Plus size={20} strokeWidth={3} /> Add Item
                  </button>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-16 items-end">
                    <div className="space-y-6">
                        <label className="block text-xs font-medium">Notes</label>
                        <textarea
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-inner"
                            placeholder="Add any notes or payment instructions..."
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col gap-4 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="flex justify-between items-center font-semibold text-slate-400 relative z-10">
                            <span>Total Amount</span>
                            <ShieldCheck size={16} className="text-indigo-400" />
                        </div>
                        <div className="text-6xl font-black tracking-tighter tabular-nums flex items-baseline gap-3 relative z-10 leading-none">
                            {formData.items.reduce((sum, item) => sum + (item.qty || 0) * (item.unit_price || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-lg text-indigo-400 tracking-widest">{formData.currency}</span>
                        </div>
                    </div>
               </div>

              <div className="flex items-center justify-end gap-8 pt-12">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-10 py-7 text-xs text-sm font-medium hover:text-slate-600 hover:bg-slate-50 rounded-[2.5rem] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isLoading || isSubmitting}
                  className="px-16 py-8 text-xs text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(79,70,229,0.4)] disabled:opacity-50 transition-all flex items-center gap-6 active:scale-95"
                >
                  {createInvoiceMutation.isLoading || isSubmitting ? <><Loader2 size={24} className="animate-spin" /> Creating Invoice...</> : <><ShieldCheck size={24} strokeWidth={3} /> Create & Send Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
