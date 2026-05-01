import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { withApiPath } from '../../../config/env';

interface DataImportProps {
    workflowId: string;
    onImportComplete?: () => void;
}

const DataImport: React.FC<DataImportProps> = ({ workflowId, onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath(`/workflows/${workflowId}/import-data`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                if (onImportComplete) onImportComplete();
            } else {
                const errData = await response.json();
                setError(errData.detail || 'Failed to import data');
            }
        } catch (err) {
            console.error("Import failed", err);
            setError('An error occurred during import');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-gray-500" />
                Bulk Data Import
            </h3>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                        disabled={isUploading}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                        <FileText className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                            {file ? file.name : 'Click to upload CSV'}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV files only'}
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}

                {result && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-800">Import Successful</span>
                        </div>
                        <div className="text-xs text-green-700 space-y-1">
                            <div>Total Rows: {result.total_rows_in_file}</div>
                            <div>Processed: {result.success_count}</div>
                            <div>Failed: {result.failure_count}</div>
                            {result.note && <div className="italic mt-1">{result.note}</div>}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleImport}
                    disabled={!file || isUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isUploading ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Import & Run
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DataImport;
