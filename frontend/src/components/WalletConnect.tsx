import React, { useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';
import bs58 from 'bs58';

interface WalletConnectProps {
    onWalletConnected: (address: string) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletConnected }) => {
    const [createdWallet, setCreatedWallet] = useState<{ publicKey: string; secretKey: string } | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCreateWallet = () => {
        const newAccount = Keypair.generate();
        const secretKey = bs58.encode(newAccount.secretKey);
        const pubKey = newAccount.publicKey.toBase58();

        setCreatedWallet({
            publicKey: pubKey,
            secretKey: secretKey
        });

        // Notify parent of the new wallet
        onWalletConnected(pubKey);
    };

    const copyToClipboard = () => {
        if (createdWallet) {
            navigator.clipboard.writeText(createdWallet.secretKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Option 1: Corridor-managed wallet</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Corridor provisions a managed wallet for your account. This avoids browser wallet bridge issues and keeps onboarding consistent.
                </p>
                <button
                    type="button"
                    onClick={() => onWalletConnected('managed-wallet')}
                    className="w-full py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Continue with Corridor wallet
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">Or</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Option 2: Create New Wallet</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Generate a new Solana wallet for your business.
                </p>

                {!createdWallet ? (
                    <button
                        onClick={handleCreateWallet}
                        className="w-full py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Generate New Wallet
                    </button>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 mb-2">
                                <Check size={20} />
                                <span className="font-semibold">Wallet Generated!</span>
                            </div>
                            <p className="text-sm text-green-800 break-all">
                                Address: {createdWallet.publicKey}
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700 mb-2">
                                <AlertTriangle size={20} />
                                <span className="font-semibold">SAVE THIS SECRET KEY!</span>
                            </div>
                            <p className="text-xs text-red-600 mb-3">
                                This key grants full access to your funds. If you lose it, you lose your funds. We do not store this key.
                            </p>

                            <div className="relative">
                                <div className="p-3 bg-white border border-red-200 rounded font-mono text-xs break-all pr-10">
                                    {showSecret ? createdWallet.secretKey : '•'.repeat(64)}
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                    >
                                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
