import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { reportsApi } from '../api/reports';

interface CustomReportingProps {
    organizationId: string;
}

export const CustomReportingDashboard: React.FC<CustomReportingProps> = ({ organizationId }) => {
    const [reports, setReports] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [dimensions, setDimensions] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchReports();
        fetchMetrics();
        fetchDimensions();
    }, [organizationId]);

    const fetchReports = async () => {
        try {
            const data = await reportsApi.getReports(organizationId);
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    const fetchMetrics = async () => {
        try {
            const data = await reportsApi.getMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        }
    };

    const fetchDimensions = async () => {
        try {
            const data = await reportsApi.getDimensions();
            setDimensions(data);
        } catch (error) {
            console.error('Failed to fetch dimensions:', error);
        }
    };

    const exportReport = async (reportId: string, format: string) => {
        try {
            const blob = await reportsApi.exportReport(reportId, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportId}.${format}`;
            a.click();
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Custom Reports</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Create Report
                </button>
            </div>

            {/* Available Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {metrics.map((metric) => (
                            <div key={metric.id} className="p-4 border rounded-lg">
                                <h3 className="font-semibold">{metric.name}</h3>
                                <p className="text-sm text-gray-600">{metric.category}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {metric.aggregations.map((agg: string) => (
                                        <span key={agg} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {agg}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Saved Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">{report.name}</h3>
                                    <p className="text-sm text-gray-600">{report.description}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {report.type}
                                        </span>
                                        {report.schedule && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                Scheduled: {report.schedule}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => exportReport(report.id, 'json')}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                    >
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => exportReport(report.id, 'csv')}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => exportReport(report.id, 'pdf')}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                    >
                                        PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomReportingDashboard;
