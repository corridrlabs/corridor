import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Search, Filter, MoreVertical, Building } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    company: string;
    status: 'active' | 'inactive';
    spent: number;
    joinedDate: string;
}

const CustomersApp: React.FC = () => {
    const { token } = useAuthStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        if (token) {
            fetchCustomers();
        }
    }, [token]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Fetch from backend (Assuming /api/customers exists, if not we might need to create it or use existing endpoint)
            // For now, let's assume we need to create it or it maps to `Customer` model
            const res = await fetch('/api/customers', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend data to frontend model
                const mapped = data.map((c: any) => ({
                    id: c.id.toString(),
                    name: c.name,
                    email: c.email,
                    company: c.company_name || 'N/A',
                    status: 'active', // Default for now
                    spent: 0, // Need to calculate from invoices
                    joinedDate: c.created_at
                }));
                setCustomers(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-sm text-gray-500">Manage your customer base</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Add Customer
                </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px - 3 py - 1.5 rounded - lg text - sm font - medium transition - colors ${filterStatus === 'all' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'} `}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px - 3 py - 1.5 rounded - lg text - sm font - medium transition - colors ${filterStatus === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'} `}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilterStatus('inactive')}
                        className={`px - 3 py - 1.5 rounded - lg text - sm font - medium transition - colors ${filterStatus === 'inactive' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'} `}
                    >
                        Inactive
                    </button>
                </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                    <div className="text-sm text-gray-500">{customer.email}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Building className="w-3 h-3" />
                                                        {customer.company}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px - 2 py - 1 text - xs font - medium rounded - full ${customer.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                } `}>
                                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            KES {customer.spent.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(customer.joinedDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No customers found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersApp;
