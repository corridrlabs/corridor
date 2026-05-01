import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Mail, MessageSquare, Loader2, Send } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        // Context for the email
        const context = {
            userId: user?.id,
            email: user?.email,
            name: user?.name,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            subject,
            message,
        };

        try {
            // Real API Call
            await api.post('/support/contact', context);

            setSent(true);
            setTimeout(() => {
                setSent(false);
                setSubject('');
                setMessage('');
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to send support request', error);
            // Fallback for user experience if backend fails (e.g. offline)
            alert('Failed to send message. Please try again or email people@corridormoeny.net directly.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                                        Contact Support
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {sent ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                            <Send className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900">Message Sent!</h4>
                                        <p className="text-sm text-gray-500 mt-1">We've received your request and will get back to you at {user?.email} shortly.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSend} className="space-y-4">
                                        <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-indigo-900">
                                                <p className="font-medium">Direct Support Line</p>
                                                <p className="text-indigo-700">Messages will be sent to <span className="font-mono">people@corridormoeny.net</span></p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <select
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            >
                                                <option value="">Select a topic...</option>
                                                <option value="Billing Issue">Billing Issue</option>
                                                <option value="Technical Support">Technical Support</option>
                                                <option value="Feature Request">Feature Request</option>
                                                <option value="Account Access">Account Access</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
                                                placeholder="Describe your issue or question..."
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSending}
                                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {isSending ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
