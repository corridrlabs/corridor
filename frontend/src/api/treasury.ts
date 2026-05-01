import { apiClient } from './client';

export interface WalletData {
    id: string;
    currency: string;
    balance: number;
    type: string;
    address?: string;
    chain_address?: string;
    chain_network?: string;
    is_primary?: boolean;
}

export interface ManagedWalletData {
    success: boolean;
    wallet: {
        id: string;
        account_id: string;
        wallet_id: string;
        public_key: string;
        network: string;
        created_at: string;
    };
}

const unwrap = <T>(response: any): T => {
    return (response?.data?.data ?? response?.data) as T;
};

const asArray = <T>(value: any): T[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.wallets)) return value.wallets;
    return [];
};

const normalizeWallet = (wallet: any): WalletData => ({
    id: wallet?.id || '',
    currency: wallet?.currency || 'USD',
    balance: Number(wallet?.balance || 0),
    type: wallet?.type || 'INTERNAL_FIAT',
    address: wallet?.address || wallet?.chain_address || '',
    chain_address: wallet?.chain_address || wallet?.address || '',
    chain_network: wallet?.chain_network || '',
    is_primary: Boolean(wallet?.is_primary),
});

export const treasuryApi = {
    getWallets: async () => {
        try {
            const response = await apiClient.get<WalletData[]>('/api/wallets');
            return asArray<any>(unwrap<any>(response)).map(normalizeWallet);
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
            return [];
        }
    },
    createWallet: async (currency: string) => {
        const response = await apiClient.post<WalletData>('/api/wallets', { currency });
        return normalizeWallet(unwrap<any>(response));
    },
    createManagedWallet: async () => {
        const response = await apiClient.post<ManagedWalletData>('/api/wallets/managed');
        return unwrap<ManagedWalletData>(response);
    },
    deleteWallet: async (walletId: string) => {
        const response = await apiClient.post('/api/wallets/delete', { wallet_id: walletId });
        return unwrap<any>(response);
    },
    getDepositAddress: async (currency: string) => {
        const response = await apiClient.post<ManagedWalletData>('/api/wallets/managed');
        const payload = unwrap<ManagedWalletData>(response);
        const address = payload?.wallet?.public_key || '';
        if (!address) {
            throw new Error(`failed to generate wallet address for ${currency}`);
        }
        return { address };
    },
    convertAssets: async (data: { from_currency: string; to_currency: string; amount: number }) => {
        const response = await apiClient.post('/api/treasury/convert', data);
        return unwrap<any>(response);
    }
};
