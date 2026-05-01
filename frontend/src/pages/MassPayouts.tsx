import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const MassPayouts = () => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
    const [summary, setSummary] = useState<{ count: number; total: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setSummary(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');

        // Mock Upload and Processing
        setTimeout(() => {
            setStatus('processing');
            setTimeout(() => {
                setSummary({ count: 150, total: 4500000 }); // Mocked result
                setStatus('completed');
            }, 2000);
        }, 1500);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mass Payouts</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 bg-gray-50 dark:bg-gray-900/50">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload Payout CSV</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                        Upload a CSV file with columns: <code>amount</code>, <code>currency</code>, <code>destination_type</code>, <code>destination_id</code>.
                    </p>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                    >
                        Select File
                    </label>
                    {file && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"><FileText className="w-4 h-4" /> {file.name}</p>}
                </div>

                {file && status !== 'completed' && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={status === 'uploading' || status === 'processing'}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Processing...' : 'Process Batch'}
                        </button>
                    </div>
                )}

                {status === 'completed' && summary && (
                    <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Batch Processed Successfully</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Total Transactions</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summary.count}</p>
                            </div>
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Total Amount</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">KES {summary.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MassPayouts;
