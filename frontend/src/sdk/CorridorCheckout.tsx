import React, { useState, useEffect } from 'react';
import { withApiPath } from '../config/env';

interface CorridorCheckoutProps {
    clientSecret: string;
    onSuccess?: (paymentIntent: any) => void;
    onFailure?: (error: any) => void;
    theme?: 'light' | 'dark';
}

export const CorridorCheckout: React.FC<CorridorCheckoutProps> = ({
    clientSecret,
    onSuccess,
    onFailure,
    theme = 'light'
}) => {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [intent, setIntent] = useState<any>(null);

    useEffect(() => {
        // Fetch intent details using clientSecret (mock for now)
        if (clientSecret) {
            // In real implementation, decode secret or fetch from API
            console.log("Initializing checkout with secret:", clientSecret);
        }
    }, [clientSecret]);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Extract intent ID from clientSecret (format: pi_{id}_secret)
            const intentId = clientSecret.split('_')[1];

            // Call confirm endpoint
            const response = await fetch(withApiPath(`/payments/intents/${intentId}/confirm`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_method: paymentMethod,
                    phone_number: phoneNumber
                })
            });

            const data = await response.json();

            if (data.client_secret) {
                if (data.client_secret === "native_mpesa") {
                    // Native M-Pesa STK Push triggered
                    alert(`STK Push sent to ${phoneNumber}. Please check your phone.`);
                    if (onSuccess) onSuccess(data);
                } else if (data.client_secret.startsWith('{')) {
                    // Native Bank Transfer (JSON string)
                    const accountDetails = JSON.parse(data.client_secret);
                    setIntent(accountDetails); // Store details to show in UI
                } else if (data.client_secret.startsWith('http')) {
                    // Fallback for redirect flows (if any)
                    window.location.href = data.client_secret;
                }
            } else if (onSuccess) {
                onSuccess(data);
            }
        } catch (error) {
            console.error("Payment failed", error);
            if (onFailure) {
                onFailure(error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (intent && intent.account_number) {
        return (
            <div className={`p-6 rounded-lg shadow-lg max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Transfer Instructions</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-100 rounded-md text-gray-800">
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-bold text-lg">{intent.bank_name}</p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-md text-gray-800">
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-bold text-2xl tracking-widest">{intent.account_number}</p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-md text-gray-800">
                        <p className="text-sm text-gray-500">Account Name</p>
                        <p className="font-bold">{intent.account_name}</p>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-4">
                        Please make a transfer to this account. We will confirm automatically.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-lg shadow-lg max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Pay with Corridor</h2>
                <div className="text-sm font-medium text-blue-600">Secure</div>
            </div>

            <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-2 px-4 rounded-md border ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
                    >
                        Card
                    </button>
                    <button
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`flex-1 py-2 px-4 rounded-md border ${paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'}`}
                    >
                        M-Pesa
                    </button>
                </div>

                {paymentMethod === 'mpesa' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Phone Number</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="07XX XXX XXX"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}

                {paymentMethod === 'card' && (
                    <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500 text-sm">
                        Card payments are currently disabled for this demo. Please use M-Pesa or Bank Transfer.
                    </div>
                )}
            </div>

            <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-colors disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>

            <div className="mt-4 text-center text-xs text-gray-400">
                Powered by Corridor Financial OS
            </div>
        </div>
    );
};
