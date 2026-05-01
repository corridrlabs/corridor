import { create } from 'zustand';

type AdminTab = 'overview' | 'users' | 'wallets' | 'transactions' | 'revenue' | 'config' | 'compliance' | 'audit' | 'approvals';

interface AdminState {
  activeTab: AdminTab;
  searchQuery: string;
  selectedUserId: string | null;
  setActiveTab: (tab: AdminTab) => void;
  setSearchQuery: (query: string) => void;
  setSelectedUserId: (id: string | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeTab: 'overview',
  searchQuery: '',
  selectedUserId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
}));

export type { AdminTab };
