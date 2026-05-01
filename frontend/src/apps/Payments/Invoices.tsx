import React, { useState, useEffect } from 'react';
import { Plus, Send, Eye, Download, FileText, RefreshCw } from 'lucide-react';
import { invoicesService, Invoice } from '../../services/invoices';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton, TableSkeleton } from '../../components/common/Skeleton';

const Invoices: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await invoicesService.getAll();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
            showToast('error', 'Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSend = async (invoice: Invoice) => {
        setActionLoading(invoice.id);
        try {
            await invoicesService.send(invoice.id);
            showToast('success', `Invoice ${invoice.invoice_number} sent successfully`);
        } catch (error) {
            showToast('error', 'Failed to send invoice');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async (invoice: Invoice) => {
        try {
            const url = await invoicesService.download(invoice.id);
            window.open(url, '_blank');
        } catch (error) {
            showToast('error', 'Failed to download invoice');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            overdue: 'bg-red-100 text-red-700',
            draft: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading && !invoices.length) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton variant="text" width={200} height={32} />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton variant="rectangular" height={80} />
                        <Skeleton variant="rectangular" height={80} />
                        <Skeleton variant="rectangular" height={80} />
                        <Skeleton variant="rectangular" height={80} />
                    </div>
                    <div className="space-y-4">
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoices</h1>
                        <p className="text-gray-600">Create and manage invoices</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchInvoices}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Invoice
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-sm text-gray-500 mb-1">Total</div>
                        <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-sm text-gray-500 mb-1">Paid</div>
                        <div className="text-2xl font-bold text-green-600">
                            {invoices.filter(i => i.status === 'paid').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-sm text-gray-500 mb-1">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {invoices.filter(i => i.status === 'pending').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-sm text-gray-500 mb-1">Overdue</div>
                        <div className="text-2xl font-bold text-red-600">
                            {invoices.filter(i => i.status === 'overdue').length}
                        </div>
                    </div>
                </div>

                {/* Invoices Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900">{invoice.invoice_number}</h3>
                                            {getStatusBadge(invoice.status)}
                                        </div>
                                        <p className="text-sm text-gray-600">{invoice.client}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Amount</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            KES {invoice.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Due Date</div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(invoice.due_date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="View">
                                            <Eye className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(invoice)}
                                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4 text-gray-600" />
                                        </button>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => handleSend(invoice)}
                                                disabled={actionLoading === invoice.id}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {actionLoading === invoice.id ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Send className="w-3 h-3" />
                                                )}
                                                Send
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {invoices.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No invoices found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Invoices;
