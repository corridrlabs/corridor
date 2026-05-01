import React, { useState, useEffect } from 'react';
import { careersService, Position, Applicant } from '../services/careers';
import { Briefcase, MapPin, Clock, ArrowRight, Check, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const CareersPage: React.FC = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cover_letter: '',
        resume_url: ''
    });

    useEffect(() => {
        loadPositions();
    }, []);

    const loadPositions = async () => {
        try {
            const data = await careersService.getPositions();
            setPositions(data);
        } catch (error) {
            console.error('Failed to load positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPosition) return;

        setIsApplying(true);
        try {
            await careersService.applyForPosition({
                ...formData,
                position_id: selectedPosition.id
            });
            showToast('success', "We've received your application. Good luck!");
            setSelectedPosition(null);
            setFormData({ name: '', email: '', phone: '', cover_letter: '', resume_url: '' });
        } catch (error) {
            showToast('error', 'Application failed. Something went wrong. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Join the Corridor Team</h1>
                    <p className="text-xl text-slate-600">Help us build the operating system for modern businesses.</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : positions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No Open Positions</h3>
                        <p className="text-slate-500">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {positions.map((position) => (
                            <div key={position.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{position.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {position.department}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {position.location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {position.type}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 line-clamp-2">{position.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPosition(position)}
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {selectedPosition && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-900">Apply for {selectedPosition.title}</h2>
                            <button onClick={() => setSelectedPosition(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleApply} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Resume / Portfolio URL</label>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://linkedin.com/in/..."
                                    value={formData.resume_url}
                                    onChange={e => setFormData({ ...formData, resume_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Letter</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.cover_letter}
                                    onChange={e => setFormData({ ...formData, cover_letter: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPosition(null)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isApplying}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isApplying ? 'Submitting...' : 'Submit Application'}
                                    {!isApplying && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
