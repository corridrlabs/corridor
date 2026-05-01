import React, { useEffect, useState, useCallback } from 'react';
import {
    Users, Calendar, DollarSign, Plus, Play, Upload, Download,
    CheckCircle2, XCircle, Loader2, ChevronRight, ShieldCheck,
    Pencil, Trash2, AlertCircle, Search, Filter, RefreshCw,
    TrendingUp, Clock, ArrowUpRight, ChevronDown, X
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatting';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Employee {
    id: string;
    full_name: string;
    email: string;
    gross_salary: number;
    currency: string;
    pay_day_of_month: number;
    is_active: boolean;
    external_employee_id?: string;
}

interface PayrollHistory {
    id: string;
    employee_id: string;
    amount_requested: number;
    amount_disbursed: number;
    fee_charged: number;
    status: 'pending' | 'approved' | 'disbursed' | 'failed';
    created_at: string;
}

type ModalType = 'add_employee' | 'run_payroll' | 'edit_employee' | null;

const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    approved:  'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    disbursed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    failed:    'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]',
};

const fmt = (amount: number, currency = 'USD') =>
    formatCurrency(amount, currency);

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; icon: React.FC<any>; trend?: string; loading: boolean }> = ({
    label, value, icon: Icon, trend, loading
}) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-6 group hover:translate-y-[-4px] transition-all duration-300">
        <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
            <p className="text-3xl font-bold text-slate-900 truncate">{loading ? '...' : value}</p>
            {trend && <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1.5"><TrendingUp size={12}/>{trend}</p>}
        </div>
    </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Payroll: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [history, setHistory] = useState<PayrollHistory[]>([]);
    const [activeTab, setActiveTab] = useState<'employees' | 'history'>('employees');
    const [modal, setModal] = useState<ModalType>(null);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        gross_salary: '',
        currency: 'USD',
        pay_day_of_month: '28',
        external_employee_id: ''
    });

    // ─── Data Fetching ──────────────────────────────────────────────────────

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/employees');
            const data = Array.isArray(res.data) ? res.data : [];
            setEmployees(data);
        } catch (err: any) {
            const errMsg = err?.response?.data?.error || err?.message || '';
            if (err?.response?.status !== 403) {
                showToast('error', errMsg || 'Failed to load employees');
            }
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/account/ewa/requests');
            const data = Array.isArray(res.data) ? res.data : [];
            setHistory(data);
        } catch {
            setHistory([]);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchHistory();
    }, [fetchEmployees, fetchHistory]);

    // ─── Derived stats ──────────────────────────────────────────────────────

    const totalPayroll = employees.reduce((sum, e) => sum + e.gross_salary, 0);
    const nextPayDate = employees.length > 0
        ? `Day ${Math.min(...employees.map(e => e.pay_day_of_month))} of month`
        : 'Not configured';
    const disbursed = history.filter(h => h.status === 'disbursed').reduce((s, h) => s + h.amount_disbursed, 0);

    // ─── Employee CRUD ──────────────────────────────────────────────────────

    const resetForm = () => setForm({
        full_name: '', email: '', gross_salary: '', currency: 'USD',
        pay_day_of_month: '28', external_employee_id: ''
    });

    const openAdd = () => { resetForm(); setEditTarget(null); setModal('add_employee'); };
    const openEdit = (emp: Employee) => {
        setForm({
            full_name: emp.full_name,
            email: emp.email,
            gross_salary: String(emp.gross_salary),
            currency: emp.currency,
            pay_day_of_month: String(emp.pay_day_of_month),
            external_employee_id: emp.external_employee_id || ''
        });
        setEditTarget(emp);
        setModal('edit_employee');
    };

    const saveEmployee = async () => {
        if (!form.full_name || !form.gross_salary) {
            showToast('error', 'Name and salary are required');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                full_name: form.full_name,
                email: form.email,
                gross_salary: parseFloat(form.gross_salary),
                currency: form.currency,
                pay_day_of_month: parseInt(form.pay_day_of_month),
                external_employee_id: form.external_employee_id
            };
            await api.post('/employees', payload);
            showToast('success', `Employee ${form.full_name} added to payroll`);
            setModal(null);
            fetchEmployees();
        } catch (err: any) {
            showToast('error', err?.response?.data?.error || 'Failed to save employee');
        } finally {
            setSaving(false);
        }
    };
    const deleteEmployee = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this employee from payroll?')) return;
        try {
            await api.delete(`/employees/delete?id=${id}`);
            showToast('success', 'Employee removed from payroll');
            fetchEmployees();
        } catch (err: any) {
            showToast('error', err?.response?.data?.error || 'Failed to delete employee');
        }
    };

    // ─── Run Payroll ────────────────────────────────────────────────────────

    const openRunPayroll = () => {
        setSelectedEmployeeIds(employees.map(e => e.id));
        setModal('run_payroll');
    };

    const toggleSelect = (id: string) =>
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const runPayroll = async () => {
        if (selectedEmployeeIds.length === 0) {
            showToast('error', 'Select at least one employee');
            return;
        }
        setRunning(true);
        try {
            const res = await api.post('/payroll/run', { employee_ids: selectedEmployeeIds });
            const { success_count, failed_count } = res.data || {};
            setModal(null);
            if (success_count > 0) showToast('success', `Payroll initiated for ${success_count} employee${success_count > 1 ? 's' : ''}!`);
            if (failed_count > 0) showToast('error', `${failed_count} payment${failed_count > 1 ? 's' : ''} failed — check wallet balance`);
            fetchHistory();
        } catch (err: any) {
            showToast('error', err?.response?.data?.error || 'Failed to run payroll');
        } finally {
            setRunning(false);
        }
    };

    const exportCSV = () => {
        const rows = [
            ['Name', 'Email', 'Salary', 'Currency', 'Pay Day'],
            ...employees.map(e => [e.full_name, e.email, String(e.gross_salary), e.currency, String(e.pay_day_of_month)])
        ];
        const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'payroll_employees.csv'; a.click();
    };

    const filtered = employees.filter(e =>
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const EmployeeFormBody = () => (
        <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-3">Identity Full Name</label>
                <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                    placeholder="Jane Doe" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300" />
            </div>
            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-3">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    placeholder="jane@company.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300" />
            </div>
            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-3">External ID</label>
                <input value={form.external_employee_id} onChange={e => setForm(f => ({...f, external_employee_id: e.target.value}))}
                    placeholder="EMP_102" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300" />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-3">Gross Salary</label>
                <div className="relative">
                    <input type="number" value={form.gross_salary} onChange={e => setForm(f => ({...f, gross_salary: e.target.value}))}
                        placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                    <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-3">Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                        <option value="KES">KES</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-3">Pay Day</label>
                    <input type="number" min="1" max="31" value={form.pay_day_of_month} onChange={e => setForm(f => ({...f, pay_day_of_month: e.target.value}))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-12 px-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-600 mb-6 border shadow-sm">
                        <ShieldCheck size={14} strokeWidth={3} />
                        Payroll System Active
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Global Payroll</h1>
                    <p className="text-slate-500 font-medium mt-4 text-xl tracking-tight max-w-2xl">Pay your team anywhere in the world. Automate payments and manage your workforce with ease.</p>
                </div>
                <div className="flex flex-wrap gap-5">
                    <button onClick={exportCSV} 
                        className="flex items-center gap-3 px-8 py-5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                        <Download size={20} /> Export
                    </button>
                    <button onClick={openAdd}
                        className="flex items-center gap-3 px-8 py-5 text-sm font-medium text-slate-900 bg-white border-2 border-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                        <Plus size={20} /> Add Employee
                    </button>
                    <button onClick={openRunPayroll} disabled={employees.length === 0}
                        className="flex items-center gap-4 px-12 py-6 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 group">
                        <Play size={20} className="group-hover:translate-x-1 transition-transform" /> 
                        Run Payroll
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Employees" value={String(employees.length)} icon={Users} loading={loading} />
                <StatCard label="Monthly Payroll" value={fmt(totalPayroll)} icon={DollarSign} loading={loading} trend="+2.4% vs last cycle" />
                <StatCard label="Next Pay Date" value={nextPayDate} icon={Calendar} loading={loading} />
                <StatCard label="Total Paid" value={fmt(disbursed)} icon={ArrowUpRight} loading={loading} />
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] overflow-hidden">
                {/* Tabs */}
                <div className="flex px-12 pt-8 border-b border-slate-50 bg-slate-50/10">
                    {(['employees', 'history'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-14 py-8 text-sm font-semibold transition-all relative ${activeTab === tab
                                ? 'text-blue-600'
                                : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab === 'employees' ? `Employees (${employees.length})` : 'Payment History'}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-600 rounded-t-full shadow-[0_-4px_20px_rgba(37,99,235,0.6)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="px-12 py-12 flex flex-col md:flex-row items-center gap-10 border-b border-slate-50">
                    <div className="relative flex-1 group">
                        <Search size={26} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'employees' ? 'Search by name, email, or ID...' : 'Filter payment history...'}
                            className="w-full pl-20 pr-10 py-7 text-sm font-bold bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all placeholder:text-slate-300 placeholder:font-medium shadow-inner" />
                    </div>
                    <button onClick={() => { fetchEmployees(); fetchHistory(); }}
                        className="p-7 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 rounded-[2.5rem] border border-slate-50 transition-all active:scale-95">
                        <RefreshCw size={28} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Data Section */}
                <div className="min-h-[600px] bg-white">
                    {activeTab === 'employees' ? (
                        loading ? (
                            <div className="p-60 text-center">
                                <Loader2 size={80} className="animate-spin mx-auto mb-12 text-blue-500/10" />
                                <p className="text-sm font-medium text-slate-400">Loading payroll data...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-52 text-center px-12">
                                <div className="w-40 h-40 bg-slate-50 rounded-[4rem] flex items-center justify-center mx-auto mb-14 shadow-inner border border-slate-100 relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <Users size={72} className="text-slate-200 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">No Employees</h3>
                                <p className="text-slate-500 mt-6 max-w-xl mx-auto font-medium leading-relaxed text-xl tracking-tight">Add your employees to get started with global payroll.</p>
                                <button onClick={openAdd}
                                    className="mt-16 inline-flex items-center gap-6 px-14 py-7 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition-all active:scale-95 group">
                                    <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500" /> 
                                    Add First Employee
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/40 font-medium text-slate-500 border-slate-50">
                                            <th className="px-14 py-10">Employee</th>
                                            <th className="px-14 py-10">Salary</th>
                                            <th className="px-14 py-10">Payment Schedule</th>
                                            <th className="px-14 py-10 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filtered.map(emp => (
                                            <tr key={emp.id} className="hover:bg-slate-50/70 transition-all group">
                                                <td className="px-14 py-12">
                                                    <div className="flex items-center gap-8">
                                                        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border-[6px] border-white flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-3">
                                                            {emp.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-2xl tracking-tighter leading-tight">{emp.full_name}</p>
                                                            <p className="text-sm font-medium text-slate-400 mt-1">{emp.email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-14 py-12">
                                                    <div className="flex flex-col">
                                                        <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-numbers">{fmt(emp.gross_salary, emp.currency)}</p>
                                                        <span className="font-medium">
                                                            {emp.currency}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-14 py-12">
                                                    <div className="flex items-center gap-5 text-slate-600 bg-slate-50 pr-8 pl-3 py-3 rounded-[1.75rem] w-fit border border-slate-100 shadow-inner group-hover:bg-white group-hover:shadow-xl transition-all">
                                                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-50 text-blue-500">
                                                            <Calendar size={22} strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-700">Day {emp.pay_day_of_month} · Monthly</span>
                                                    </div>
                                                </td>
                                                <td className="px-14 py-12">
                                                    <div className="flex items-center gap-5 justify-end">
                                                        <button onClick={() => openEdit(emp)}
                                                            className="p-6 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.2)] rounded-[2.25rem] transition-all border border-transparent hover:border-blue-100 active:scale-90">
                                                            <Pencil size={24} />
                                                        </button>
                                                        <button onClick={() => deleteEmployee(emp.id)}
                                                            className="p-6 text-slate-300 hover:text-rose-500 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.2)] rounded-[2.25rem] transition-all border border-transparent hover:border-rose-100 active:scale-90">
                                                            <Trash2 size={24} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/40 font-medium text-slate-500 border-slate-50">
                                        <th className="px-14 py-10">Employee</th>
                                        <th className="px-14 py-10">Amount</th>
                                        <th className="px-14 py-10">Reference</th>
                                        <th className="px-14 py-10">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history
                                        .filter(h => h.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === '')
                                        .map(record => {
                                            const emp = employees.find(e => e.id === record.employee_id);
                                            return (
                                                <tr key={record.id} className="hover:bg-slate-50/70 transition-all group">
                                                    <td className="px-14 py-12">
                                                        <div className="flex flex-col">
                                                            <p className="font-black text-slate-900 text-2xl tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">{emp?.full_name || 'Employee'}</p>
                                                            <p className="text-[10px] font-semibold">
                                                                <Clock size={14} />
                                                                {new Date(record.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-14 py-12">
                                                        <div className="flex flex-col">
                                                            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors tabular-numbers tracking-tighter">{fmt(record.amount_requested)}</p>
                                                            <p className="text-[10px] font-semibold text-emerald-600 mt-2">Payment Authorized</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-14 py-12">
                                                        <code className="text-[10px] font-black text-slate-400 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors">
                                                            REF_{record.id.slice(0, 12).toUpperCase()}
                                                        </code>
                                                    </td>
                                                    <td className="px-14 py-12">
                                                        <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-[2rem] text-sm font-medium shadow-2xl transition-all hover:scale-105 cursor-default ${STATUS_STYLES[record.status] || ''}`}>
                                                            {record.status === 'disbursed' && <CheckCircle2 size={18} strokeWidth={3} />}
                                                            {record.status === 'failed' && <XCircle size={18} strokeWidth={3} />}
                                                            {record.status === 'pending' && <Clock size={18} strokeWidth={3} />}
                                                            <span>{record.status}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Compliance & Security */}
            <div className="flex flex-col items-center gap-12 pt-24 pb-48 opacity-30 grayscale hover:grayscale-0 transition-all duration-[2s] hover:opacity-100">
                <div className="flex flex-wrap items-center justify-center gap-24">
                    <div className="flex items-center gap-5 font-medium text-sm text-slate-400">
                        <ShieldCheck size={24} className="text-blue-500" strokeWidth={3} />
                        Identity Verification
                    </div>
                    <div className="flex items-center gap-5 font-medium text-sm text-slate-400">
                        <ShieldCheck size={24} className="text-blue-500" strokeWidth={3} />
                        Secure Payments
                    </div>
                    <div className="flex items-center gap-5 font-medium text-sm text-slate-400">
                        <ShieldCheck size={24} className="text-blue-500" strokeWidth={3} />
                        Instant Transfers
                    </div>
                </div>
                <div className="h-px w-80 bg-gradient-to-r from-transparent via-slate-200 to-transparent shadow-sm" />
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────── */}

            {/* Employee Modal */}
            {(modal === 'add_employee' || modal === 'edit_employee') && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[80px]" onClick={() => setModal(null)} />
                    <div className="relative bg-white rounded-[5rem] shadow-[0_60px_200px_-40px_rgba(0,0,0,0.5)] w-full max-w-4xl p-24 z-10 animate-in fade-in zoom-in-[0.98] duration-700 border border-white/50">
                        <button onClick={() => setModal(null)} className="absolute top-16 right-16 p-6 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-[3rem] transition-all border border-transparent hover:border-slate-100 active:scale-90">
                            <X size={32} strokeWidth={2.5} />
                        </button>
                        
                        <div className="mb-20">
                            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-12 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.5)] border-[8px] border-white/10">
                                <Users size={40} className="text-white" strokeWidth={2.5} />
                            </div>
                            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                                {modal === 'add_employee' ? 'Add Employee' : 'Edit Employee'}
                            </h2>
                            <p className="text-slate-500 text-2xl font-medium mt-6 tracking-tight max-w-xl">
                                {modal === 'add_employee' ? 'Add a new employee to your payroll.' : 'Update payment details for this employee.'}
                            </p>
                        </div>

                        <div className="space-y-12">
                            <EmployeeFormBody />
                        </div>

                        <div className="flex gap-8 mt-24">
                            <button onClick={() => setModal(null)}
                                className="flex-1 py-8 bg-slate-50 text-slate-500 text-sm font-medium rounded-[2.5rem] hover:bg-slate-100 transition-all border border-slate-100 active:scale-95">
                                Cancel
                            </button>
                            <button onClick={saveEmployee} disabled={saving}
                                className="flex-[3] py-8 bg-slate-900 text-white text-sm font-medium rounded-[2.5rem] hover:bg-slate-800 transition-all shadow-[0_30px_60px_-20px_rgba(15,23,42,0.4)] flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50 border border-slate-800">
                                {saving ? <Loader2 size={32} className="animate-spin" /> : <ShieldCheck size={32} strokeWidth={2.5} />}
                                {modal === 'add_employee' ? 'Add Employee' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Run Payroll Modal */}
            {modal === 'run_payroll' && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[120px]" onClick={() => { if (!running) setModal(null); }} />
                    <div className="relative bg-white rounded-[6rem] shadow-[0_80px_250px_-50px_rgba(0,0,0,0.6)] w-full max-w-5xl z-10 overflow-hidden animate-in fade-in zoom-in-[0.95] duration-1000 border border-white/20">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-24 text-white relative">
                            <div className="absolute top-0 right-0 p-24 opacity-[0.03]">
                                <RefreshCw size={480} className="animate-spin-slow" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-10 mb-10">
                                    <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-[3rem] flex items-center justify-center border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.1)]">
                                        <Play size={40} className="text-blue-400" strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-7xl font-black tracking-tighter leading-none">Run Payroll</h2>
                                </div>
                                <p className="text-blue-100/60 text-2xl font-medium max-w-2xl leading-relaxed tracking-tight">Start a payroll run for your selected employees.</p>
                            </div>
                        </div>

                        <div className="p-24 space-y-16">
                            {/* Summary Dashboard */}
                            <div className="grid grid-cols-2 gap-12 p-16 bg-slate-50 rounded-[4rem] border-2 border-slate-100 shadow-inner relative overflow-hidden group">
                                <div className="absolute -right-32 -top-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
                                <div className="space-y-4 relative z-10">
                                    <p className="text-sm font-semibold text-slate-400">Total Payroll</p>
                                    <p className="text-7xl font-bold text-slate-900 tracking-tighter tabular-nums leading-none">
                                        {fmt(employees.filter(e => selectedEmployeeIds.includes(e.id)).reduce((s, e) => s + e.gross_salary, 0))}
                                    </p>
                                </div>
                                <div className="space-y-4 text-right border-l-2 border-slate-200 pl-16 relative z-10">
                                    <p className="text-sm font-semibold text-slate-400">Selected Employees</p>
                                    <p className="text-7xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{selectedEmployeeIds.length}</p>
                                </div>
                            </div>

                            {/* Selection Hub */}
                            <div className="border-4 border-slate-100 rounded-[4rem] overflow-hidden bg-white shadow-2xl">
                                <div className="flex items-center justify-between px-16 py-10 bg-slate-50/50 border-b-4 border-slate-50">
                                    <span className="text-base font-semibold text-slate-400">Select Employees to Pay</span>
                                    <button onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.length === employees.length ? [] : employees.map(e => e.id))}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-all border-b-2 border-transparent hover:border-blue-600">
                                        {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="max-h-[450px] overflow-y-auto overscroll-contain bg-white scrollbar-hide py-6 translate-z-0">
                                    {employees.map(emp => (
                                        <label key={emp.id} className="flex items-center gap-10 px-16 py-9 hover:bg-slate-50 cursor-pointer transition-all border-b-2 border-slate-50 last:border-0 group select-none">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)}
                                                    onChange={() => toggleSelect(emp.id)}
                                                    className="w-10 h-10 rounded-[1.5rem] border-4 border-slate-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer appearance-none shadow-sm" />
                                                {selectedEmployeeIds.includes(emp.id) && <CheckCircle2 size={24} strokeWidth={3} className="absolute inset-0 m-auto text-white" />}
                                            </div>
                                            <div className="w-16 h-16 rounded-[1.75rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                                                {emp.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-2xl font-black text-slate-800 truncate tracking-tight group-hover:text-blue-600 transition-colors">{emp.full_name}</p>
                                                <p className="text-xs font-medium text-slate-400 mt-1.5">{emp.email || 'Verified Employee'}</p>
                                            </div>
                                            <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">
                                                {fmt(emp.gross_salary, emp.currency)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Warning Section */}
                            <div className="flex items-start gap-8 p-12 bg-rose-50/20 border-4 border-rose-100 rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(244,63,94,0.1)]">
                                <div className="p-5 bg-rose-500 rounded-[2rem] text-white shadow-2xl shadow-rose-200 border-4 border-white/20">
                                    <AlertCircle size={40} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-rose-700 mb-4">Important Notice</p>
                                    <p className="text-lg text-rose-900/60 font-bold leading-relaxed tracking-tight">
                                        Payroll payments are final and cannot be reversed once started. Please ensure all details are correct before proceeding.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-24 pb-24 flex gap-10">
                            <button onClick={() => setModal(null)} disabled={running}
                                className="flex-1 py-10 bg-slate-50 text-slate-500 text-sm font-medium rounded-[3rem] hover:bg-slate-100 transition-all border-2 border-slate-100 active:scale-95">
                                Cancel
                            </button>
                            <button onClick={runPayroll} disabled={running || selectedEmployeeIds.length === 0}
                                className="flex-[4] py-10 bg-blue-600 text-white text-sm font-medium rounded-[3rem] hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-8 shadow-[0_40px_100px_-20px_rgba(37,99,235,0.5)] border-2 border-blue-500 group">
                                {running ? <Loader2 size={40} className="animate-spin" /> : <ShieldCheck size={40} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
                                <span>Confirm & Run Payroll</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
