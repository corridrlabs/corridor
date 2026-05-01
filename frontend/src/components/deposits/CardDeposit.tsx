import React, { useState } from 'react';
import { CreditCard, Shield, Lock, AlertCircle, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import * as openpgp from 'openpgp';
import { getCirclePublicKey, initializeCardDeposit } from '../../api/deposits';
import { useAuthStore } from '../../store/authStore';

interface CardDepositProps {
    amount: string;
}

const CardDeposit: React.FC<CardDepositProps> = ({ amount }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingLine1, setBillingLine1] = useState('');
    const [billingPostal, setBillingPostal] = useState('');
    const [billingCountry, setBillingCountry] = useState('US');

    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { user } = useAuthStore();

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length > 0) return parts.join(' ');
        return value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2, 4);
        return v;
    };

    /**
     * Encrypts raw card data client-side using Circle's PGP public key.
     * The raw PAN and CVV are NEVER sent to Corridor's servers.
     */
    const encryptCardData = async (publicKeyArmored: string, cardData: { number: string; cvv: string }) => {
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const message = await openpgp.createMessage({
            text: JSON.stringify(cardData),
        });
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: publicKey,
        });
        return encrypted as string;
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('Session expired. Please login again.');
            return;
        }
        if (parseFloat(amount) < 1) {
            setError('Minimum deposit is $1.00');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // STEP 1: Fetch Circle's PGP public key from our backend proxy
            setLoadingStep('Fetching encryption key...');
            const publicKeyData = await getCirclePublicKey();

            // STEP 2: Parse expiry
            const [expMonthStr, expYearStr] = expiry.split('/');
            const expMonth = parseInt(expMonthStr, 10);
            const expYear = 2000 + parseInt(expYearStr, 10);

            if (!expMonth || !expYear) {
                setError('Please enter a valid expiry date (MM/YY).');
                return;
            }

            // STEP 3: PGP-encrypt raw card number + CVV using Circle's public key
            // This happens entirely in the browser. Raw data never leaves the client.
            setLoadingStep('Securing card details...');
            const rawCardData = {
                number: cardNumber.replace(/\s+/g, ''),
                cvv: cvv,
            };
            const encryptedData = await encryptCardData(publicKeyData.publicKey, rawCardData);

            // STEP 4: Send encrypted payload (+ billing details) to Corridor backend
            // which forwards them to Circle. No PAN or CVV touches our DB.
            setLoadingStep('Processing payment...');
            await initializeCardDeposit({
                amount,
                currency: 'USD',
                userId: user.id,
                keyId: publicKeyData.keyId,
                encryptedData,
                expMonth,
                expYear,
                billingDetails: {
                    name: nameOnCard,
                    city: billingCity || 'Nairobi',
                    country: billingCountry || 'US',
                    line1: billingLine1 || '123 Main St',
                    postalCode: billingPostal || '00100',
                },
            });

            setSuccess(`Success! $${amount} has been added to your wallet.`);
            setCardNumber('');
            setExpiry('');
            setCvv('');
            setNameOnCard('');
            setBillingCity('');
            setBillingLine1('');
            setBillingPostal('');

        } catch (err: any) {
            console.error('Deposit Error:', err);
            setError(err.response?.data?.message || err.message || 'Payment failed. Please check your card details.');
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="p-8">
            {success ? (
                <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Deposit Successful!</h3>
                    <p className="text-gray-600 mb-8">{success}</p>
                    <button
                        onClick={() => setSuccess(null)}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                        Make Another Deposit
                    </button>
                </div>
            ) : (
                <form onSubmit={handleDeposit} className="space-y-6 max-w-lg mx-auto">
                    {/* Card Preview */}
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group mb-8">
                        <div className="absolute top-0 right-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <CreditCard size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div className="text-sm font-medium opacity-80">Corridor Secure Deposit</div>
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Total Deposit Amount</div>
                            <div className="text-3xl font-bold flex items-center">
                                <span className="text-xl mr-1 opacity-60">$</span>
                                <span>{amount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <span>Your card details are <strong>encrypted in your browser</strong> using PGP before sending. Corridor never stores your card number or CVV.</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Name on Card</label>
                            <input
                                type="text"
                                value={nameOnCard}
                                onChange={(e) => setNameOnCard(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="JANE DOE"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Card Number</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formatCardNumber(cardNumber)}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    maxLength={19}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="0000 0000 0000 0000"
                                    required
                                />
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Expiry Date</label>
                                <input
                                    type="text"
                                    value={expiry}
                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">CVV</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                        placeholder="***"
                                        maxLength={4}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        required
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Billing Details */}
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Billing Address</p>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={billingLine1}
                                    onChange={(e) => setBillingLine1(e.target.value)}
                                    placeholder="Street address"
                                    className="col-span-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <input
                                    type="text"
                                    value={billingCity}
                                    onChange={(e) => setBillingCity(e.target.value)}
                                    placeholder="City"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <input
                                    type="text"
                                    value={billingPostal}
                                    onChange={(e) => setBillingPostal(e.target.value)}
                                    placeholder="Postal code"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <select
                                    value={billingCountry}
                                    onChange={(e) => setBillingCountry(e.target.value)}
                                    className="col-span-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                >
                                    <option value="US">United States</option>
                                    <option value="KE">Kenya</option>
                                    <option value="NG">Nigeria</option>
                                    <option value="GH">Ghana</option>
                                    <option value="ZA">South Africa</option>
                                    <option value="GB">United Kingdom</option>
                                    <option value="CA">Canada</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-500/25"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {loadingStep || 'Processing...'}
                            </>
                        ) : (
                            <>
                                Secure Deposit ${amount}
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-4 pt-4 grayscale opacity-50">
                        <div className="font-bold text-slate-800 text-xs italic tracking-wider">VISA</div>
                        <div className="font-bold text-slate-800 text-xs font-serif tracking-wider">Mastercard</div>
                        <div className="font-bold text-slate-800 text-xs italic tracking-wider">PayPal</div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CardDeposit;
