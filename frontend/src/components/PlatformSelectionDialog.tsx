import React from 'react';
import { MessageSquare, Globe, ArrowRight, Smartphone, Zap, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface PlatformSelectionDialogProps {
    open: boolean;
    onSelectPlatform: (platform: 'whatsapp' | 'webapp') => void;
}

export const PlatformSelectionDialog: React.FC<PlatformSelectionDialogProps> = ({
    open,
    onSelectPlatform
}) => {
    const { effectiveTheme } = useTheme();
    const isDark = effectiveTheme === 'dark';

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className={`sm:max-w-4xl ${isDark ? 'border-slate-800 bg-slate-950 text-white' : ''}`}>
                <DialogHeader>
                    <DialogTitle className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome to Corridor</DialogTitle>
                    <DialogDescription className={`text-center text-lg mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Choose how you'd like to experience Corridor's powerful financial OS
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    {/* WhatsApp Option */}
                    <div
                        onClick={() => onSelectPlatform('whatsapp')}
                        className={`group relative p-6 border-2 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all cursor-pointer ${
                            isDark
                                ? 'border-slate-800 bg-slate-900/90'
                                : 'border-gray-200 bg-gradient-to-br from-green-50 to-white'
                        }`}
                    >
                        <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Use on WhatsApp</h3>
                            <p className={`text-sm mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                Access Corridor directly through WhatsApp. Perfect for on-the-go business management.
                            </p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3">
                                    <Smartphone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Mobile-First Experience</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your business from anywhere via WhatsApp</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>AI-Powered Assistant</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Chat with Corridor AI for instant help</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick KYC via WhatsApp</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Complete verification in minutes</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectPlatform('whatsapp');
                                }}
                            >
                                Continue with WhatsApp
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* WebApp Option */}
                    <div
                        onClick={() => onSelectPlatform('webapp')}
                        className={`group relative p-6 border-2 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer ${
                            isDark
                                ? 'border-slate-800 bg-slate-900/90'
                                : 'border-gray-200 bg-gradient-to-br from-indigo-50 to-white'
                        }`}
                    >
                        <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Use Web Dashboard</h3>
                            <p className={`text-sm mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                Full-featured web application with advanced analytics and controls.
                            </p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Complete Dashboard</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Access all features from your browser</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced Analytics</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Deep insights and reporting tools</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Collaboration</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Invite team members and manage permissions</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectPlatform('webapp');
                                }}
                            >
                                Continue with Web App
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>

                <p className={`text-center text-xs mt-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    You can always switch between platforms later in your account settings
                </p>
            </DialogContent>
        </Dialog>
    );
};
