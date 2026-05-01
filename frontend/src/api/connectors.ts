import { apiClient } from './client';

export interface Connector {
    id: string;
    name: string;
    description: string;
    type: string;
    supported_countries: string[];
    supported_currencies: string[];
    is_published: boolean;
    latest_version?: string;
    downloads?: number;
    rating?: number;
    trending?: boolean;
    tags?: string[];
    revenue_share?: {
        developer_percentage: number;
    };
}

const LOCAL_CONNECTOR_CATALOG: Connector[] = [
    {
        id: 'paystack',
        name: 'Paystack',
        description: 'Accept cards and bank debits with Paystack, then route settlements into Corridor wallets.',
        type: 'payments',
        supported_countries: ['NG', 'GH', 'KE', 'ZA'],
        supported_currencies: ['NGN', 'GHS', 'KES', 'ZAR', 'USD'],
        is_published: true,
        latest_version: '1.2.1',
        downloads: 1240,
        rating: 4.8,
        trending: true,
        tags: ['cards', 'checkout', 'collections'],
    },
    {
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Collect and disburse mobile money with real-time callback support.',
        type: 'mobile_money',
        supported_countries: ['KE'],
        supported_currencies: ['KES'],
        is_published: true,
        latest_version: '1.1.3',
        downloads: 980,
        rating: 4.7,
        trending: true,
        tags: ['mobile-money', 'stk', 'payouts'],
    },
    {
        id: 'circle',
        name: 'Circle',
        description: 'Enable USDC treasury flows, onramp and payout orchestration.',
        type: 'stablecoin',
        supported_countries: ['US', 'EU', 'NG', 'KE'],
        supported_currencies: ['USDC', 'USD'],
        is_published: true,
        latest_version: '1.0.9',
        downloads: 640,
        rating: 4.6,
        tags: ['usdc', 'treasury', 'onramp'],
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Receive payment alerts and workflow notifications in Slack channels.',
        type: 'notifications',
        supported_countries: ['GLOBAL'],
        supported_currencies: ['USD', 'USDC', 'KES', 'EUR'],
        is_published: true,
        latest_version: '0.9.5',
        downloads: 410,
        rating: 4.5,
        tags: ['alerts', 'ops', 'automation'],
    },
];

const connectorStorageKey = (orgId: string) => `corridor-installed-connectors:${orgId}`;

const loadInstalled = (orgId: string): string[] => {
    try {
        const raw = localStorage.getItem(connectorStorageKey(orgId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveInstalled = (orgId: string, connectorIDs: string[]) => {
    localStorage.setItem(connectorStorageKey(orgId), JSON.stringify(connectorIDs));
};

export const connectorsApi = {
    /**
     * Get all bank connectors
     */
    async getMarketplace(): Promise<{ connectors: Connector[]; total: number }> {
        try {
            const response = await apiClient.get('/api/bank-connectors/');
            const payload = (response?.data?.data ?? response?.data ?? {}) as { connectors?: Connector[] };
            const connectors = payload.connectors || [];
            if (connectors.length > 0) {
                return { connectors, total: connectors.length };
            }
        } catch (_err) {
            // Fallback to local catalog when backend connector service is unavailable.
        }
        return { connectors: LOCAL_CONNECTOR_CATALOG, total: LOCAL_CONNECTOR_CATALOG.length };
    },

    /**
     * Get installed connectors for an organization
     */
    async getInstalled(orgId: string): Promise<Connector[]> {
        const installedIDs = new Set(loadInstalled(orgId));
        const { connectors } = await this.getMarketplace();
        return connectors.filter((c: Connector) => installedIDs.has(c.id));
    },

    /**
     * Install a connector (placeholder for future implementation)
     */
    async install(data: { connector_id: string; version: string; organization_id: string }): Promise<void> {
        const installedIDs = new Set(loadInstalled(data.organization_id));
        installedIDs.add(data.connector_id);
        saveInstalled(data.organization_id, Array.from(installedIDs));
    },

    /**
     * Uninstall a connector for an organization.
     */
    async uninstall(data: { connector_id: string; organization_id: string }): Promise<void> {
        const installedIDs = new Set(loadInstalled(data.organization_id));
        installedIDs.delete(data.connector_id);
        saveInstalled(data.organization_id, Array.from(installedIDs));
    }
};
