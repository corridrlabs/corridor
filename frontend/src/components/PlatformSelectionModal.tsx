import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Globe, ArrowRight, Smartphone, Zap, Shield, X } from 'lucide-react';

interface PlatformSelectionModalProps {
    isOpen: boolean;
    onClose?: () => void;
    onSelectPlatform: (platform: 'whatsapp' | 'webapp') => void;
}

export const PlatformSelectionModal: React.FC<PlatformSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectPlatform
}) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePlatformSelect = (platform: 'whatsapp' | 'webapp') => {
        onSelectPlatform(platform);
        if (onClose) {
            onClose();
        }
        navigate('/onboarding');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
                    >
                        <X size={24} />
                    </button>
                )}

                <div className="p-8 md:p-12">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Welcome to Corridor
                        </h2>
                        <p className="text-xl text-gray-400">
                            Choose how you'd like to experience Africa's most powerful financial OS
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* WhatsApp Option */}
                        <div
                            onClick={() => handlePlatformSelect('whatsapp')}
                            className="group relative p-8 border-2 border-gray-700 rounded-2xl hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all cursor-pointer bg-gradient-to-br from-green-900/20 to-gray-900"
                        >
                            <div className="absolute top-6 right-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/50">
                                    <MessageSquare className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-3xl font-bold text-white mb-3">Use on WhatsApp</h3>
                                <p className="text-gray-400 mb-8">
                                    Access Corridor directly through WhatsApp. Perfect for on-the-go business management.
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <Smartphone className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">Mobile-First Experience</p>
                                            <p className="text-sm text-gray-400">Manage your business from anywhere via WhatsApp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">AI-Powered Assistant</p>
                                            <p className="text-sm text-gray-400">Chat with Corridor AI for instant help</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">Quick KYC via WhatsApp</p>
                                            <p className="text-sm text-gray-400">Complete verification in minutes</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl group-hover:scale-105 transition-all shadow-lg shadow-green-600/50 flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlatformSelect('whatsapp');
                                    }}
                                >
                                    Continue with WhatsApp
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* WebApp Option */}
                        <div
                            onClick={() => handlePlatformSelect('webapp')}
                            className="group relative p-8 border-2 border-gray-700 rounded-2xl hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all cursor-pointer bg-gradient-to-br from-indigo-900/20 to-gray-900"
                        >
                            <div className="absolute top-6 right-6">
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/50">
                                    <Globe className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-3xl font-bold text-white mb-3">Use Web Dashboard</h3>
                                <p className="text-gray-400 mb-8">
                                    Full-featured web application with advanced analytics and controls.
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">Complete Dashboard</p>
                                            <p className="text-sm text-gray-400">Access all features from your browser</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">Advanced Analytics</p>
                                            <p className="text-sm text-gray-400">Deep insights and reporting tools</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium">Team Collaboration</p>
                                            <p className="text-sm text-gray-400">Invite team members and manage permissions</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl group-hover:scale-105 transition-all shadow-lg shadow-indigo-600/50 flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlatformSelect('webapp');
                                    }}
                                >
                                    Continue with Web App
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        You can always switch between platforms later in your account settings
                    </p>
                </div>
            </div>
        </div>
    );
};
