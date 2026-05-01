import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { treasuryApi, WalletData } from '../../api/treasury';
import { useAuthStore } from '../../store/authStore';
import { Copy, Wallet, ExternalLink, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';

interface CryptoDepositProps {
    amount: string;
}

const CryptoDeposit: React.FC<CryptoDepositProps> = ({ amount }) => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const { user } = useAuthStore();
    
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    useEffect(() => {
        const fetchOrStepUpWallet = async () => {
            if (!user) return;
            
            try {
                const wallets = await treasuryApi.getWallets();
                const usdcWallet = wallets.find(w => w.currency === 'USDC' && w.chain_address);
                
                if (usdcWallet) {
                    setWallet(usdcWallet);
                } else {
                    const newWallet = await treasuryApi.createWallet('USDC');
                    setWallet(newWallet);
                }
            } catch (err: any) {
                console.error('Failed to resolve USDC treasury wallet:', err);
                setError(err.response?.data?.message || err.message || 'Failed to initialize USDC treasury vault.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrStepUpWallet();
    }, [user]);

    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWalletPay = async () => {
        if (!publicKey || !wallet?.chain_address) return;
        
        setIsPaying(true);
        try {
            const destPubKey = new PublicKey(wallet.chain_address);
            const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
            const amountInUnits = Math.round(parseFloat(amount) * 1_000_000);

            // Get associated token accounts
            const sourceATA = await getAssociatedTokenAddress(USDC_MINT, publicKey);
            const destATA = await getAssociatedTokenAddress(USDC_MINT, destPubKey);

            const tx = new Transaction().add(
                createTransferCheckedInstruction(
                    sourceATA,
                    USDC_MINT,
                    destATA,
                    publicKey,
                    amountInUnits,
                    6
                )
            );

            // Add memo for tracking (account ID prefix)
            const memoProgramId = new PublicKey('MemoSq4gqABboxP77ue2it4ygv9u4E69dp9N3DsXCcj');
            tx.add({
                keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
                programId: memoProgramId,
                data: Buffer.from(user?.id.substring(0, 8) || 'deposit'),
            });

            const signature = await sendTransaction(tx, connection);
            console.log('Transaction sent:', signature);
            // In a real app, you would toast success and wait for confirmation
        } catch (err) {
            console.error('Wallet payment failed:', err);
        } finally {
            setIsPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Initializing your stablecoin vault...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center bg-red-50/50 rounded-b-3xl">
                <p className="text-red-600 font-bold mb-2">Setup Required</p>
                <p className="text-sm text-red-500 mb-6">{error}</p>
                <Link to="/treasury" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all">
                    Go to Treasury to fix
                </Link>
            </div>
        );
    }

    const address = wallet?.chain_address || wallet?.address;

    if (!address) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-600 font-bold mb-4">No treasury address found</p>
                <Link to="/treasury" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                    Setup Treasury Vault
                </Link>
            </div>
        );
    }

    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const qrValue = `solana:${address}?amount=${amount}&spl-token=${usdcMint}`;

    return (
        <div className="p-8 border-t bg-slate-50/50">
            <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 mb-1">Deposit USDC</h3>
                    <p className="text-sm text-slate-500">Pay via connected wallet or scan QR to send from exchange.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-2xl">
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-white">
                            <QRCodeSVG value={qrValue} size={180} />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Listening for payment...</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex justify-center">
                                <WalletMultiButton className="!bg-blue-600 !rounded-xl !h-12 !font-bold hover:!bg-blue-700 transition-all w-full" />
                            </div>
                            
                            {publicKey && (
                                <button
                                    onClick={handleWalletPay}
                                    disabled={isPaying}
                                    className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/10"
                                >
                                    {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                                    Pay ${amount} USDC
                                </button>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                            <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                                <span className="font-bold">Security Tip:</span> Send only <span className="font-bold">USDC</span> on <span className="font-bold">Solana</span>. Funds reflect instantly via Helius real-time rails.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Solana Deposit Address</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm overflow-hidden group cursor-pointer hover:border-blue-500 transition-all" onClick={() => handleCopy(address)}>
                            <p className="text-xs font-mono text-slate-600 break-all">{address}</p>
                        </div>
                        <button 
                            onClick={() => handleCopy(address)} 
                            className="p-3 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl transition-all shadow-sm group"
                        >
                            <Copy size={18} className="group-active:scale-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {copied && <p className="text-xs font-bold text-green-600 animate-in fade-in zoom-in duration-300">Address copied to clipboard!</p>}
            </div>
        </div>
    );
};

export default CryptoDeposit;
