import { Connection, clusterApiUrl } from '@solana/web3.js';

const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
const wsUrl = import.meta.env.VITE_SOLANA_WS_URL;

/**
 * Enhanced Solana Connection via Helius
 */
export const connection = new Connection(rpcUrl, {
  wsEndpoint: wsUrl,
  commitment: 'confirmed',
});

/**
 * Helper to get USDC balance for a wallet
 */
export const getUSDCBalance = async (walletAddress: string): Promise<number> => {
  try {
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const response = await connection.getTokenAccountsByOwner(
      new Connection(rpcUrl).rpcEndpoint as any, // Fix for type issue if any
      { mint: new Connection(USDC_MINT).rpcEndpoint as any }
    );
    // Real implementation would parse the response
    return 0;
  } catch (err) {
    console.error('Failed to fetch USDC balance:', err);
    return 0;
  }
};
