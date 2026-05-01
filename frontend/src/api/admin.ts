import api from '../services/api';

export interface AdminOverview {
  total_transaction_volume: number;
  treasury_balance: number;
  reserve_balance: number;
  ops_balance: number;
  total_accounts: number;
  active_users: number;
  locked_users: number;
  wallet_count: number;
  pending_sweeps: number;
  tier_distribution: Record<string, number>;
  recent_revenue_sweeps: RevenueSweep[];
  system_health: Record<string, any>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  account_type: string;
  account_status: string;
  user_tier: string;
  subscription_status: string;
  whatsapp_phone: string;
  country: string;
  wallet_address: string;
  wallet_count: number;
  total_wallet_balance: number;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  subscription_expires_at?: string | null;
  onboarding_completed?: boolean;
  onboarding_data?: Record<string, any> | null;
  settings?: Record<string, any>;
  wallets?: AdminWallet[];
  recent_transactions?: AdminTransaction[];
}

export interface AdminTransaction {
  id: string;
  reference: string;
  provider_tx_id: string;
  sender_name: string;
  recipient_name: string;
  sender_wallet_id: string;
  recipient_wallet_id: string;
  amount: number;
  currency: string;
  status: string;
  message: string;
  created_at: string;
}

export interface AdminTransactionDetail extends AdminTransaction {
  fee?: number;
  onchain_tx_hash?: string;
  visibility?: string;
  split_type?: string;
  total_amount?: number;
  settled_at?: string | null;
  context?: Record<string, any>;
}

export interface AdminWallet {
  id: string;
  account_id: string;
  account_name: string;
  email: string;
  type: string;
  currency: string;
  balance: number;
  chain_address: string;
  chain_network: string;
  is_primary: boolean;
  created_at: string;
}

export interface RevenueSweep {
  id: string;
  revenue_account_id: string;
  revenue_account_name: string;
  amount: number;
  bank_details: Record<string, any>;
  status: string;
  created_at: string;
}

export interface AdminApproval {
  id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  requested_by_id: string;
  requested_by_email?: string;
  approved_by_id?: string | null;
  status: string;
  payload?: Record<string, any>;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  executed_at?: string | null;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  payload?: Record<string, any>;
  updated_at: string;
}

export interface FXOverride {
  pair: string;
  rate: number;
  source: string;
  is_override: boolean;
  updated_at: string;
}

export interface RetentionPolicy {
  id: string;
  data_category: string;
  retention_days: number;
  legal_basis?: string;
  auto_delete: boolean;
  review_date?: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminWaitlistEntry {
  id: string;
  name: string;
  email: string;
  company: string;
  segment: string;
  use_case: string;
  preferred_channel: string;
  volume: string;
  notes: string;
  status: string;
  last_contacted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  getOverview: async (): Promise<AdminOverview> => {
    const response = await api.get('/v1/admin/overview');
    return response.data;
  },
  searchUsers: async (query: string, page = 1, limit = 25): Promise<Paginated<AdminUser>> => {
    const response = await api.get('/v1/admin/users/search', { params: { query, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  updateUserTier: async (id: string, tier: string) => {
    const response = await api.patch(`/v1/admin/users/${id}/tier`, { tier });
    return response.data;
  },
  updateUserStatus: async (id: string, status: string) => {
    const response = await api.patch(`/v1/admin/users/${id}/status`, { status });
    return response.data;
  },
  getUserDetail: async (id: string): Promise<AdminUserDetail> => {
    const response = await api.get(`/v1/admin/users/${id}`);
    return response.data;
  },
  searchTransactions: async (query: string, page = 1, limit = 25): Promise<Paginated<AdminTransaction>> => {
    const response = await api.get('/v1/admin/transactions/search', { params: { query, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  getTransactionDetail: async (id: string): Promise<AdminTransactionDetail> => {
    const response = await api.get(`/v1/admin/transactions/${id}`);
    return response.data;
  },
  listWallets: async (query = '', page = 1, limit = 25): Promise<Paginated<AdminWallet>> => {
    const response = await api.get('/v1/admin/wallets', { params: { query, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  adjustWallet: async (payload: { account_id: string; wallet_id: string; amount: number; direction: 'CREDIT' | 'DEBIT'; memo: string }) => {
    const response = await api.post('/v1/admin/wallets/adjust', payload);
    return response.data;
  },
  listSweeps: async (query = '', page = 1, limit = 25): Promise<Paginated<RevenueSweep>> => {
    const response = await api.get('/v1/admin/revenue/sweeps', { params: { query, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  executeSweep: async (sweep_id: string) => {
    const response = await api.post('/v1/admin/revenue/sweeps/execute', { sweep_id });
    return response.data;
  },
  listFeatureFlags: async (): Promise<FeatureFlag[]> => {
    const response = await api.get('/v1/admin/feature-flags');
    return response.data ?? [];
  },
  saveFeatureFlag: async (flag: Partial<FeatureFlag> & { key: string; enabled: boolean }) => {
    const response = await api.post('/v1/admin/feature-flags', flag);
    return response.data;
  },
  listFXOverrides: async (): Promise<FXOverride[]> => {
    const response = await api.get('/v1/admin/fx-overrides');
    return response.data ?? [];
  },
  saveFXOverride: async (override: Partial<FXOverride> & { pair: string; rate: number; is_override: boolean }) => {
    const response = await api.post('/v1/admin/fx-overrides', override);
    return response.data;
  },
  listAuditLogs: async (query = '', page = 1, limit = 50): Promise<Paginated<AuditLogEntry>> => {
    const response = await api.get('/v1/admin/audit-logs', { params: { query, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  listApprovals: async (status = '', page = 1, limit = 25): Promise<Paginated<AdminApproval>> => {
    const response = await api.get('/v1/admin/approvals', { params: { status, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  approveApproval: async (id: string) => {
    const response = await api.post(`/v1/admin/approvals/${id}/approve`);
    return response.data;
  },
  listWaitlist: async (query = '', status = '', page = 1, limit = 25): Promise<Paginated<AdminWaitlistEntry>> => {
    const response = await api.get('/v1/admin/waitlist', { params: { query, status, page, limit } });
    return response.data ?? { items: [], page, limit, total: 0, has_more: false };
  },
  listRetentionPolicies: async (): Promise<RetentionPolicy[]> => {
    const response = await api.get('/api/compliance/retention-policies');
    return response.data?.policies ?? [];
  },
  runRetentionCleanup: async () => {
    const response = await api.post('/api/v1/admin/compliance/retention-cleanup');
    return response.data;
  },
  runPCIComplianceCheck: async () => {
    const response = await api.post('/api/v1/admin/compliance/pci-check');
    return response.data;
  },
  screenSanctions: async (accountId?: string) => {
    const response = await api.post('/api/compliance/screen-sanctions', {}, { params: accountId ? { account_id: accountId } : {} });
    return response.data;
  },
  updateWaitlistStatus: async (id: string, status: string) => {
    const response = await api.patch(`/v1/admin/waitlist/${id}/status`, { status });
    return response.data;
  },
  sendWaitlistCampaign: async (payload: { subject: string; message: string; status_filter?: string }) => {
    const response = await api.post('/v1/admin/waitlist/campaigns/send', payload);
    return response.data;
  },
  rejectApproval: async (id: string, reason: string) => {
    const response = await api.post(`/v1/admin/approvals/${id}/reject`, { reason });
    return response.data;
  },
  exportUsers: async (query = '') => {
    return api.get('/v1/admin/export/users', { params: { query }, responseType: 'blob' });
  },
  exportTransactions: async (query = '') => {
    return api.get('/v1/admin/export/transactions', { params: { query }, responseType: 'blob' });
  },
  exportAuditLogs: async (query = '') => {
    return api.get('/v1/admin/export/audit-logs', { params: { query }, responseType: 'blob' });
  },
  getSystemHealth: async (): Promise<Record<string, any>> => {
    const response = await api.get('/v1/admin/system/health');
    return response.data ?? {};
  },
};
