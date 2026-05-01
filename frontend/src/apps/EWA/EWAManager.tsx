import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Settings, AlertTriangle, RefreshCw, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ewaService, Employee, AdvanceRequest } from '../../services/ewa';
import { useToast } from '../../contexts/ToastContext';

const EWAManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'employees' | 'requests'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [requests, setRequests] = useState<AdvanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [floatBalance, setFloatBalance] = useState(0);
    const [riskLimit, setRiskLimit] = useState(50); // % of accrued salary
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const [empData, reqData, floatData] = await Promise.all([
                ewaService.getEmployees(),
                ewaService.getRequests(),
                ewaService.getFloatBalance()
            ]);
            setEmployees(empData);
            setRequests(reqData);
            setFloatBalance(floatData.balance);
        } catch (error) {
            console.error("Failed to load data", error);
            showToast('error', 'Failed to load EWA data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await ewaService.importEmployees(file);
            showToast('success', 'Employees imported successfully!');
            loadData();
        } catch (error) {
            console.error("Upload failed", error);
            showToast('error', 'Failed to import employees.');
        } finally {
            setUploading(false);
            if (event.target) event.target.value = '';
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header Stats */}
            <div className="grid grid-cols-3 gap-4 p-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Float Balance</span>
                        <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">KES {floatBalance.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">Safe Level</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Active Employees</span>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                    <div className="text-xs text-blue-600 mt-1">100% Eligible</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Risk Limit</span>
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{riskLimit}%</div>
                    <div className="text-xs text-gray-500 mt-1">of Accrued Salary</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-4 flex space-x-4">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'employees'
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Employees
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'requests'
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Requests
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">
                            {activeTab === 'employees' ? 'Employee Eligibility' : 'Advance Requests'}
                        </h3>
                        <div className="flex gap-2">
                            {activeTab === 'employees' && (
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                    {uploading ? 'Uploading...' : 'Import CSV'}
                                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            )}
                            <button onClick={loadData} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {activeTab === 'employees' ? (
                                        <>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Salary</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Available Limit</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Fee</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Repayment</th>
                                            <th className="p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : activeTab === 'employees' ? (
                                    employees.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No employees found. Import a CSV to get started.</td></tr>
                                    ) : (
                                        employees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-900">{emp.name}</td>
                                                <td className="p-4 text-gray-500">{emp.phone_number}</td>
                                                <td className="p-4 text-gray-900">{emp.salary_currency} {emp.salary_amount.toLocaleString()}</td>
                                                <td className="p-4 text-green-600 font-medium">
                                                    {emp.salary_currency} {(emp.salary_amount * (riskLimit / 100) * 0.5).toLocaleString()}
                                                    <span className="text-xs text-gray-400 ml-1">(Est)</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {emp.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    requests.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No advance requests found.</td></tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-500">{new Date(req.requested_at).toLocaleDateString()}</td>
                                                <td className="p-4 font-medium text-gray-900">KES {req.amount_requested.toLocaleString()}</td>
                                                <td className="p-4 text-gray-500">KES {req.fee_amount.toLocaleString()}</td>
                                                <td className="p-4 text-gray-500">KES {req.total_repayment_amount.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'approved' || req.status === 'disbursed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : req.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : req.status === 'repaid'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {req.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {req.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                        {req.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Settings Panel (Bottom) */}
            <div className="bg-white border-t border-gray-200 p-4 px-6">
                <div className="flex items-center gap-4">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Max Advance Percentage</label>
                        <input
                            type="range"
                            min="10"
                            max="80"
                            value={riskLimit}
                            onChange={(e) => setRiskLimit(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="w-12 text-right font-bold text-gray-900">{riskLimit}%</div>
                </div>
            </div>
        </div>
    );
};

export default EWAManager;
