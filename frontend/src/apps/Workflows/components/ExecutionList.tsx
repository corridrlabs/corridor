import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { withApiPath } from '../../../config/env';

interface Execution {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
    triggered_by: string;
    steps_completed: number;
    total_steps: number;
    logs: any[];
}

interface ExecutionListProps {
    workflowId: string;
}

const ExecutionList: React.FC<ExecutionListProps> = ({ workflowId }) => {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const fetchExecutions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath(`/workflows/${workflowId}/executions`), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setExecutions(data);
            }
        } catch (error) {
            console.error("Failed to fetch executions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (workflowId) {
            fetchExecutions();
            // Poll for updates every 5 seconds
            const interval = setInterval(fetchExecutions, 5000);
            return () => clearInterval(interval);
        }
    }, [workflowId]);

    const handleManualExecute = async () => {
        setIsExecuting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath(`/workflows/${workflowId}/execute`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    trigger_data: {
                        source: 'manual_dashboard',
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                await fetchExecutions();
                alert('Workflow execution started');
            } else {
                alert('Failed to start execution');
            }
        } catch (error) {
            console.error("Failed to execute workflow", error);
            alert('Error starting execution');
        } finally {
            setIsExecuting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            case 'running': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatDuration = (start: string, end?: string) => {
        if (!end) return '-';
        const duration = new Date(end).getTime() - new Date(start).getTime();
        return `${(duration / 1000).toFixed(2)}s`;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Execution History
                </h3>
                <button
                    onClick={handleManualExecute}
                    disabled={isExecuting}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isExecuting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Run Now
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {executions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
                        <Clock className="w-8 h-8 mb-2 text-gray-300" />
                        No executions yet
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {executions.map((exec) => (
                                <tr key={exec.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(exec.status)}`}>
                                            {getStatusIcon(exec.status)}
                                            {exec.status.charAt(0).toUpperCase() + exec.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                        {new Date(exec.started_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 font-mono">
                                        {formatDuration(exec.started_at, exec.completed_at)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                        {exec.triggered_by}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ExecutionList;
