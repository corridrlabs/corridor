import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Eye, Lock, RefreshCw, Search, Settings2, Shield, Sparkles, Trash2, Unlock, Users, Wallet, FileDigit, LineChart, ToggleLeft, ToggleRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { adminApi, AdminOverview, AdminUser, AdminUserDetail, AdminWallet, AdminTransaction, AdminTransactionDetail, RevenueSweep, FeatureFlag, FXOverride, AuditLogEntry, AdminApproval, Paginated, AdminWaitlistEntry, RetentionPolicy } from '../api/admin';
import { useAdminStore } from '../store/adminStore';

const safeCurrencyCode = (currency?: string) => {
  const code = String(currency || 'USD').toUpperCase();
  return ['USD', 'KES', 'NGN', 'GHS', 'KWD', 'EUR'].includes(code) ? code : 'USD';
};

const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: safeCurrencyCode(currency), maximumFractionDigits: 2 }).format(Number(value || 0));

const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0));

const tabMeta = [
  { id: 'overview', label: 'Overview', icon: LineChart, help: 'Revenue, health, and distribution' },
  { id: 'users', label: 'Users', icon: Users, help: 'Search, tier, and status control' },
  { id: 'wallets', label: 'Wallets', icon: Wallet, help: 'Balances and manual adjustments' },
  { id: 'transactions', label: 'Transactions', icon: FileDigit, help: 'Global ledger search' },
  { id: 'revenue', label: 'Revenue', icon: Banknote, help: 'Sweeps and treasury desk' },
  { id: 'config', label: 'Config', icon: Settings2, help: 'FX and feature flags' },
  { id: 'compliance', label: 'Compliance', icon: Shield, help: 'KYC, consent, and controls' },
  { id: 'audit', label: 'Audit', icon: Shield, help: 'Immutable action log' },
  { id: 'approvals', label: 'Approvals', icon: AlertTriangle, help: 'Second-admin review queue' },
] as const;

type AdminTab = typeof tabMeta[number]['id'];

export default function AdminDashboard() {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, selectedUserId, setSelectedUserId } = useAdminStore();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [systemHealth, setSystemHealth] = useState<Record<string, any>>({});
  const [usersPage, setUsersPage] = useState<Paginated<AdminUser> | null>(null);
  const [walletsPage, setWalletsPage] = useState<Paginated<AdminWallet> | null>(null);
  const [transactionsPage, setTransactionsPage] = useState<Paginated<AdminTransaction> | null>(null);
  const [sweepsPage, setSweepsPage] = useState<Paginated<RevenueSweep> | null>(null);
  const [approvalsPage, setApprovalsPage] = useState<Paginated<AdminApproval> | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [fxOverrides, setFxOverrides] = useState<FXOverride[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [auditLogsPage, setAuditLogsPage] = useState<Paginated<AuditLogEntry> | null>(null);
  const [waitlistPage, setWaitlistPage] = useState<Paginated<AdminWaitlistEntry> | null>(null);
  const [waitlistStatusFilter, setWaitlistStatusFilter] = useState('');
  const [waitlistSubject, setWaitlistSubject] = useState('Corridor product updates');
  const [waitlistMessageBody, setWaitlistMessageBody] = useState('');
  const [complianceAccountId, setComplianceAccountId] = useState('');
  const [complianceStatus, setComplianceStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [walletMemo, setWalletMemo] = useState('');
  const [walletAmount, setWalletAmount] = useState(0);
  const [walletDirection, setWalletDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [flagDraft, setFlagDraft] = useState<Partial<FeatureFlag> & { key: string }>({ key: '', name: '', description: '', enabled: false, payload: {} });
  const [fxDraft, setFxDraft] = useState<Partial<FXOverride> & { pair: string; rate: number; is_override: boolean }>({ pair: '', rate: 0, source: 'manual', is_override: true });
  const [usersPageIndex, setUsersPageIndex] = useState(1);
  const [walletsPageIndex, setWalletsPageIndex] = useState(1);
  const [transactionsPageIndex, setTransactionsPageIndex] = useState(1);
  const [sweepsPageIndex, setSweepsPageIndex] = useState(1);
  const [approvalsPageIndex, setApprovalsPageIndex] = useState(1);
  const [auditPageIndex, setAuditPageIndex] = useState(1);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<AdminTransactionDetail | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; description: string; execute: () => Promise<void> }>(null);

  const currentTab = activeTab as AdminTab;

  const wallets = walletsPage?.items || [];
  const users = usersPage?.items || [];
  const transactions = transactionsPage?.items || [];
  const sweeps = sweepsPage?.items || [];
  const approvals = approvalsPage?.items || [];
  const auditLogs = auditLogsPage?.items || [];
  const waitlistEntries = waitlistPage?.items || [];
  const selectedWalletRow = useMemo(() => wallets.find((wallet) => wallet.id === selectedWallet) || null, [wallets, selectedWallet]);

  const loadOverview = async () => {
    const data = await adminApi.getOverview();
    setOverview(data);
    setSystemHealth(data.system_health || {});
  };

  const loadUsers = async (query = searchQuery, page = usersPageIndex) => {
    setActionLoading('users');
    try {
      const data = await adminApi.searchUsers(query, page, 25);
      setUsersPage(data);
    } finally {
      setActionLoading(null);
    }
  };

  const loadWallets = async (query = searchQuery, page = walletsPageIndex) => {
    setActionLoading('wallets');
    try {
      const data = await adminApi.listWallets(query, page, 25);
      setWalletsPage(data);
      if (!selectedWallet && data.items[0]?.id) {
        setSelectedWallet(data.items[0].id);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const loadTransactions = async (query = searchQuery, page = transactionsPageIndex) => {
    setActionLoading('transactions');
    try {
      const data = await adminApi.searchTransactions(query, page, 25);
      setTransactionsPage(data);
    } finally {
      setActionLoading(null);
    }
  };

  const loadRevenue = async (page = sweepsPageIndex) => {
    setActionLoading('revenue');
    try {
      const [sweepList, flagList, fxList] = await Promise.all([
        adminApi.listSweeps('', page, 25),
        adminApi.listFeatureFlags(),
        adminApi.listFXOverrides(),
      ]);
      setSweepsPage(sweepList);
      setFlags(flagList);
      setFxOverrides(fxList);
    } finally {
      setActionLoading(null);
    }
  };

  const loadCompliance = async () => {
    setActionLoading('compliance');
    try {
      const [flagList, policyList] = await Promise.all([
        adminApi.listFeatureFlags(),
        adminApi.listRetentionPolicies(),
      ]);
      setFlags(flagList);
      setRetentionPolicies(policyList);
    } finally {
      setActionLoading(null);
    }
  };

  const loadApprovals = async (page = approvalsPageIndex) => {
    setActionLoading('approvals');
    try {
      const data = await adminApi.listApprovals('', page, 25);
      setApprovalsPage(data);
    } finally {
      setActionLoading(null);
    }
  };

  const loadAudit = async (page = auditPageIndex) => {
    setActionLoading('audit');
    try {
      const data = await adminApi.listAuditLogs(searchQuery, page, 25);
      setAuditLogsPage(data);
    } finally {
      setActionLoading(null);
    }
  };

  const loadWaitlist = async (query = searchQuery, status = waitlistStatusFilter) => {
    setActionLoading('waitlist');
    try {
      const data = await adminApi.listWaitlist(query, status, 1, 25);
      setWaitlistPage(data);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
      await Promise.all([loadOverview(), loadRevenue(), loadApprovals(), loadCompliance()]);
      } catch (err) {
        console.error('Admin bootstrap failed', err);
        setMessage('Unable to load admin overview.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (currentTab === 'users') {
      void loadUsers();
      void loadWaitlist();
    }
    if (currentTab === 'wallets') void loadWallets();
    if (currentTab === 'transactions') void loadTransactions();
    if (currentTab === 'revenue') void loadRevenue();
    if (currentTab === 'config') void loadRevenue();
    if (currentTab === 'compliance') void loadCompliance();
    if (currentTab === 'audit') void loadAudit();
    if (currentTab === 'approvals') void loadApprovals();
  }, [currentTab]);

  const refreshCurrentTab = async () => {
    if (currentTab === 'overview') await loadOverview();
    if (currentTab === 'users') await loadUsers();
    if (currentTab === 'wallets') await loadWallets();
    if (currentTab === 'transactions') await loadTransactions();
    if (currentTab === 'revenue') await loadRevenue();
    if (currentTab === 'config') await loadRevenue();
    if (currentTab === 'compliance') await loadCompliance();
    if (currentTab === 'audit') await loadAudit();
    if (currentTab === 'approvals') await loadApprovals();
  };

  const runSearch = async () => {
    if (currentTab === 'users') {
      setUsersPageIndex(1);
      await loadUsers(searchQuery, 1);
      return loadWaitlist(searchQuery, waitlistStatusFilter);
    }
    if (currentTab === 'wallets') {
      setWalletsPageIndex(1);
      return loadWallets(searchQuery, 1);
    }
    if (currentTab === 'transactions') {
      setTransactionsPageIndex(1);
      return loadTransactions(searchQuery, 1);
    }
    if (currentTab === 'audit') {
      setAuditPageIndex(1);
      return loadAudit(1);
    }
    return undefined;
  };

  const handleTierUpdate = async (id: string, tier: string) => {
    setMessage('');
    await adminApi.updateUserTier(id, tier);
    await loadUsers();
    await loadOverview();
    setMessage(`Updated ${id} to ${tier}.`);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setMessage('');
    await adminApi.updateUserStatus(id, status);
    await loadUsers();
    await loadOverview();
    setMessage(`Updated ${id} status to ${status}.`);
  };

  const handleSweep = async (sweepId: string) => {
    setMessage('');
    await adminApi.executeSweep(sweepId);
    await loadRevenue();
    await loadOverview();
    setMessage(`Sweep ${sweepId} submitted for execution.`);
  };

  const handleWalletAdjust = async () => {
    if (!selectedWalletRow) return;
    setMessage('');
    await adminApi.adjustWallet({
      account_id: selectedWalletRow.account_id,
      wallet_id: selectedWalletRow.id,
      amount: walletAmount,
      direction: walletDirection,
      memo: walletMemo,
    });
    setWalletAmount(0);
    setWalletMemo('');
    await loadWallets();
    await loadOverview();
    setMessage(`Wallet ${selectedWalletRow.id} adjusted.`);
  };

  const saveFlag = async () => {
    if (!flagDraft.key) return;
    setMessage('');
    const key = flagDraft.key;
    await adminApi.saveFeatureFlag({
      key,
      name: flagDraft.name || key,
      description: flagDraft.description || '',
      enabled: Boolean(flagDraft.enabled),
      payload: flagDraft.payload || {},
    });
    setFlagDraft({ key: '', name: '', description: '', enabled: false, payload: {} });
    await loadRevenue();
    setMessage(`Feature flag ${key} updated.`);
  };

  const saveFX = async () => {
    if (!fxDraft.pair) return;
    setMessage('');
    const pair = fxDraft.pair;
    await adminApi.saveFXOverride({
      pair,
      rate: Number(fxDraft.rate),
      source: fxDraft.source || 'manual',
      is_override: Boolean(fxDraft.is_override),
    });
    setFxDraft({ pair: '', rate: 0, source: 'manual', is_override: true });
    await loadRevenue();
    setMessage(`FX override ${pair} updated.`);
  };

  const openUserDetail = async (id: string) => {
    setSelectedUserId(id);
    const detail = await adminApi.getUserDetail(id);
    setSelectedUserDetail(detail);
  };

  const openTransactionDetail = async (id: string) => {
    const detail = await adminApi.getTransactionDetail(id);
    setSelectedTransactionDetail(detail);
  };

  const handleWaitlistStatusChange = async (id: string, status: string) => {
    await adminApi.updateWaitlistStatus(id, status);
    await loadWaitlist(searchQuery, waitlistStatusFilter);
    setMessage(`Updated waitlist status to ${status}.`);
  };

  const handleSendWaitlistCampaign = async () => {
    const result = await adminApi.sendWaitlistCampaign({
      subject: waitlistSubject,
      message: waitlistMessageBody,
      status_filter: waitlistStatusFilter || undefined,
    });
    setMessage(`Campaign sent to ${result?.recipients || 0} waitlist users.`);
    setWaitlistMessageBody('');
    await loadWaitlist(searchQuery, waitlistStatusFilter);
  };

  const complianceFeatureDrafts: Array<{ key: string; name: string; description: string; help: string }> = [
    { key: 'kyc_required_at_registration', name: 'KYC at registration', description: 'Requires identity fields and consent before account creation.', help: 'Keeps signup compliant from the first step.' },
    { key: 'consent_required_at_registration', name: 'Consent capture', description: 'Records terms, privacy, and KYC consent during signup.', help: 'Creates an auditable consent trail.' },
    { key: 'sanctions_screening_enabled', name: 'Sanctions screening', description: 'Screens accounts with compliance review workflows.', help: 'Supports AML review before money movement.' },
    { key: 'retention_cleanup_enabled', name: 'Retention cleanup', description: 'Allows scheduled data retention cleanup actions.', help: 'Supports policy-based data deletion.' },
    { key: 'pci_audit_mode', name: 'PCI audit mode', description: 'Keeps card security checks visible to admins.', help: 'Useful when preparing for assessments.' },
  ];

  const saveComplianceFlag = async (key: string, name: string, description: string, enabled: boolean) => {
    await adminApi.saveFeatureFlag({ key, name, description, enabled, payload: { category: 'compliance' } });
    await loadCompliance();
    setMessage(`Compliance flag ${key} updated.`);
  };

  const runComplianceWorkflow = async (workflow: string) => {
    setMessage('');
    if (workflow === 'retention_cleanup') {
      const result = await adminApi.runRetentionCleanup();
      setMessage(`Retention cleanup finished. ${JSON.stringify(result)}`);
      await loadCompliance();
      return;
    }
    if (workflow === 'pci_check') {
      const result = await adminApi.runPCIComplianceCheck();
      setMessage(result?.compliant ? 'PCI check completed. No issues found.' : `PCI issues found: ${(result?.issues || []).length}`);
      return;
    }
    if (workflow === 'sanctions_screen') {
      const result = await adminApi.screenSanctions(complianceAccountId || selectedUserId || undefined);
      setComplianceStatus(result?.sanctions_hit ? 'Sanctions hit found' : 'No sanctions hit');
      setMessage(result?.sanctions_hit ? 'Sanctions screening returned a hit.' : 'Sanctions screening returned clean.');
      return;
    }
  };

  const copyText = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setMessage('Copied to clipboard.');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-neutral-950 text-white p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-56 rounded bg-white/10" />
            <div className="h-4 w-96 rounded bg-white/10" />
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/10" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const healthEntries = Object.entries(systemHealth || {});

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-white/10 bg-neutral-900/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Master control
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight">Corridor Admin Portal</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/65">
                Revenue oversight, account operations, transaction search, wallet control, FX overrides, feature flags, and immutable audit trails.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Shield className="h-5 w-5 text-emerald-300" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">Admin access</div>
                <div className="text-sm font-semibold">Privileged command center</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total volume" value={formatCurrency(overview?.total_transaction_volume || 0)} helper="Completed transactions only" icon={LineChart} />
          <Metric label="Treasury / Reserve / Ops" value={formatCurrency((overview?.treasury_balance || 0) + (overview?.reserve_balance || 0) + (overview?.ops_balance || 0))} helper="Distributed revenue accounts" icon={Banknote} />
          <Metric label="Active users" value={formatNumber(overview?.active_users || 0)} helper={`${overview?.locked_users || 0} locked/suspended`} icon={Users} />
          <Metric label="Wallets" value={formatNumber(overview?.wallet_count || 0)} helper={`${overview?.pending_sweeps || 0} pending sweeps`} icon={Wallet} />
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-7">
          {tabMeta.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  active
                    ? 'border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(16,185,129,0.20)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-300' : 'text-white/70'}`} />
                <div className="mt-3 text-sm font-semibold">{tab.label}</div>
                <div className="mt-1 text-xs text-white/50">{tab.help}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-white/45" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch();
              }}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Search by email, account ID, wallet address, tx ID, or ref code"
            />
          </div>
          <Button onClick={() => void runSearch()} className="bg-emerald-500 text-black hover:bg-emerald-400">
            Search
          </Button>
          <Button variant="outline" onClick={() => void refreshCurrentTab()} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {currentTab === 'overview' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card className="border-white/10 bg-white/5 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Revenue health</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <MiniStat label="Treasury" value={formatCurrency(overview?.treasury_balance || 0)} />
                <MiniStat label="Reserve" value={formatCurrency(overview?.reserve_balance || 0)} />
                <MiniStat label="Operations" value={formatCurrency(overview?.ops_balance || 0)} />
                <MiniStat label="Pending sweeps" value={String(overview?.pending_sweeps || 0)} />
                <MiniStat label="System" value="Online" />
                <MiniStat label="Ledger" value="Live" />
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">System health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthEntries.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium capitalize text-white">{key.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-white/45">{typeof value === 'string' ? value : 'configured'}</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 xl:col-span-3">
              <CardHeader>
                <CardTitle className="text-white">Tier distribution</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                {Object.entries(overview?.tier_distribution || {}).map(([tier, count]) => (
                  <div key={tier} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">{tier}</div>
                    <div className="mt-2 text-2xl font-black text-white">{count}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'users' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-white">Account lookup</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => void adminApi.exportUsers(searchQuery).then((res) => {
                    const url = URL.createObjectURL(res.data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'admin_users.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  })} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdminTable
                  headers={['User', 'Tier', 'Status', 'Wallets', 'Balance', 'Actions']}
                  rows={users.map((user) => [
                    <button key={user.id} type="button" onClick={() => void openUserDetail(user.id)} className="space-y-1 text-left">
                      <div className="font-semibold text-white">{user.full_name || user.email}</div>
                      <div className="text-xs text-white/45">{user.email}</div>
                      <div className="text-xs text-white/45">{user.account_type} · {user.country || '—'}</div>
                    </button>,
                    <Badge tone="indigo">{user.user_tier}</Badge>,
                    <Badge tone={user.account_status === 'ACTIVE' ? 'emerald' : 'amber'}>{user.account_status}</Badge>,
                    <span>{user.wallet_count}</span>,
                    <span>{formatCurrency(user.total_wallet_balance)}</span>,
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label="Pro" onClick={() => setConfirmAction({
                        title: `Upgrade ${user.full_name || user.email} to Pro`,
                        description: 'This changes the user tier and may trigger entitlement changes or approval if double approval is enabled.',
                        execute: async () => handleTierUpdate(user.id, 'PRO'),
                      })} />
                      <ActionButton label="Premium" onClick={() => setConfirmAction({
                        title: `Upgrade ${user.full_name || user.email} to Premium`,
                        description: 'This changes the user tier and may trigger entitlement changes or approval if double approval is enabled.',
                        execute: async () => handleTierUpdate(user.id, 'PREMIUM'),
                      })} />
                      {user.account_status === 'LOCKED'
                        ? <ActionButton label="Unlock" icon={Unlock} onClick={() => setConfirmAction({
                            title: `Unlock ${user.full_name || user.email}`,
                            description: 'Unlocking restores account access immediately or queues for approval if double approval is enabled.',
                            execute: async () => handleStatusUpdate(user.id, 'ACTIVE'),
                          })} />
                        : <ActionButton label="Lock" icon={Lock} onClick={() => setConfirmAction({
                            title: `Lock ${user.full_name || user.email}`,
                            description: 'Locking blocks account access immediately or queues for approval if double approval is enabled.',
                            execute: async () => handleStatusUpdate(user.id, 'LOCKED'),
                          })} />
                      }
                    </div>,
                  ])}
                  emptyText={actionLoading === 'users' ? 'Loading users...' : 'Search to find an account.'}
                />
                <PaginationBar page={usersPage?.page || 1} total={usersPage?.total || 0} limit={usersPage?.limit || 25} hasMore={usersPage?.has_more || false} onPrev={() => { const next = Math.max(1, (usersPage?.page || 1) - 1); setUsersPageIndex(next); void loadUsers(searchQuery, next); }} onNext={() => { const next = (usersPage?.page || 1) + 1; setUsersPageIndex(next); void loadUsers(searchQuery, next); }} />
                <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Waitlist inbox</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={waitlistStatusFilter}
                        onChange={(e) => { setWaitlistStatusFilter(e.target.value); void loadWaitlist(searchQuery, e.target.value); }}
                        className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white"
                      >
                        <option value="">All</option>
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                      <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadWaitlist(searchQuery, waitlistStatusFilter)}>Refresh</Button>
                    </div>
                  </div>
                  <AdminTable
                    headers={['Lead', 'Company', 'Use case', 'Status', 'Actions']}
                    rows={waitlistEntries.map((entry) => [
                      <div key={entry.id}>
                        <div className="font-medium text-white">{entry.name}</div>
                        <div className="text-xs text-white/50">{entry.email}</div>
                      </div>,
                      <span>{entry.company || '—'}</span>,
                      <span className="max-w-[280px] truncate" title={entry.use_case || ''}>{entry.use_case || '—'}</span>,
                      <Badge tone="indigo">{entry.status}</Badge>,
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Contacted" onClick={() => void handleWaitlistStatusChange(entry.id, 'CONTACTED')} />
                        <ActionButton label="Qualified" onClick={() => void handleWaitlistStatusChange(entry.id, 'QUALIFIED')} />
                        <ActionButton label="Archive" icon={Trash2} onClick={() => void handleWaitlistStatusChange(entry.id, 'ARCHIVED')} />
                      </div>,
                    ])}
                    emptyText={actionLoading === 'waitlist' ? 'Loading waitlist...' : 'No waitlist entries yet.'}
                  />
                  <div className="mt-4 grid gap-3">
                    <input value={waitlistSubject} onChange={(e) => setWaitlistSubject(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none" placeholder="Campaign subject" />
                    <textarea value={waitlistMessageBody} onChange={(e) => setWaitlistMessageBody(e.target.value)} rows={4} className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none" placeholder="Write your branded waitlist message..." />
                    <div>
                      <Button onClick={() => void handleSendWaitlistCampaign()} className="bg-emerald-500 text-black hover:bg-emerald-400">
                        Send branded email
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DetailPanel title="User details" open={Boolean(selectedUserDetail)} onClose={() => setSelectedUserDetail(null)}>
              {selectedUserDetail ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="text-sm font-semibold text-white">{selectedUserDetail.full_name || selectedUserDetail.email}</div>
                    <div className="mt-1 text-xs text-white/45">{selectedUserDetail.email}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => void copyText(selectedUserDetail.id)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Copy Account ID</Button>
                      <Button variant="outline" onClick={() => void copyText(selectedUserDetail.email)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Copy Email</Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-white/70">
                      <div>Tier: {selectedUserDetail.user_tier}</div>
                      <div>Status: {selectedUserDetail.account_status}</div>
                      <div>Wallets: {selectedUserDetail.wallet_count}</div>
                      <div>Balance: {formatCurrency(selectedUserDetail.total_wallet_balance)}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">Wallets</div>
                    <div className="mt-3 space-y-2">
                      {(selectedUserDetail.wallets || []).map((wallet) => (
                        <div key={wallet.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                          <div className="font-semibold text-white">{wallet.currency} · {wallet.type}</div>
                          <div className="text-xs text-white/45">{wallet.chain_address || wallet.id}</div>
                          <div className="mt-2 text-xs text-white/60">{formatCurrency(wallet.balance, wallet.currency === 'USDC' ? 'USD' : wallet.currency)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </DetailPanel>
          </div>
        )}

        {currentTab === 'wallets' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card className="border-white/10 bg-white/5 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Wallet inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTable
                  headers={['Wallet', 'Owner', 'Currency', 'Type', 'Balance', 'Primary']}
                  rows={wallets.map((wallet) => [
                    <div key={wallet.id} className="space-y-1">
                      <div className="font-semibold text-white">{wallet.chain_address || wallet.id}</div>
                      <div className="text-xs text-white/45">{wallet.chain_network || 'internal'}</div>
                    </div>,
                    <div key={`${wallet.id}-owner`} className="space-y-1">
                      <div className="text-white">{wallet.account_name}</div>
                      <div className="text-xs text-white/45">{wallet.email}</div>
                    </div>,
                    wallet.currency,
                    wallet.type,
                    formatCurrency(wallet.balance, wallet.currency === 'USDC' ? 'USD' : wallet.currency || 'USD'),
                    wallet.is_primary ? <Badge tone="emerald">Primary</Badge> : <span className="text-white/45">No</span>,
                  ])}
                  emptyText={actionLoading === 'wallets' ? 'Loading wallets...' : 'No wallets loaded.'}
                />
                <div className="mt-4">
                  <PaginationBar page={walletsPage?.page || 1} total={walletsPage?.total || 0} limit={walletsPage?.limit || 25} hasMore={walletsPage?.has_more || false} onPrev={() => { const next = Math.max(1, (walletsPage?.page || 1) - 1); setWalletsPageIndex(next); void loadWallets(searchQuery, next); }} onNext={() => { const next = (walletsPage?.page || 1) + 1; setWalletsPageIndex(next); void loadWallets(searchQuery, next); }} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Manual adjustment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>{wallet.account_name} · {wallet.currency} · {wallet.chain_address || wallet.id}</option>
                  ))}
                </select>
                <input
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(Number(e.target.value))}
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white"
                  placeholder="Amount"
                />
                <select
                  value={walletDirection}
                  onChange={(e) => setWalletDirection(e.target.value as 'CREDIT' | 'DEBIT')}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white"
                >
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
                <textarea
                  value={walletMemo}
                  onChange={(e) => setWalletMemo(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white"
                  placeholder="Audit memo"
                />
                <Button onClick={() => setConfirmAction({
                  title: `${walletDirection === 'CREDIT' ? 'Credit' : 'Debit'} wallet`,
                  description: 'This action changes the wallet balance and will require approval if double approval is enabled.',
                  execute: async () => handleWalletAdjust(),
                })} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">
                  Apply adjustment
                </Button>
                <p className="text-xs text-white/45">
                  {selectedWalletRow ? `${selectedWalletRow.account_name} · ${selectedWalletRow.currency}` : 'Select a wallet to edit.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'transactions' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-white">Global transaction search</CardTitle>
                <Button variant="outline" onClick={() => void adminApi.exportTransactions(searchQuery).then((res) => {
                  const url = URL.createObjectURL(res.data);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'admin_transactions.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                })} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <AdminTable
                  headers={['Transaction', 'From', 'To', 'Amount', 'Status', 'Message', 'Actions']}
                  rows={transactions.map((tx) => [
                    <button key={tx.id} type="button" onClick={() => void openTransactionDetail(tx.id)} className="space-y-1 text-left">
                      <div className="font-semibold text-white">{tx.reference || tx.provider_tx_id || tx.id}</div>
                      <div className="text-xs text-white/45">{tx.id}</div>
                    </button>,
                    tx.sender_name || '—',
                    tx.recipient_name || '—',
                    formatCurrency(tx.amount),
                    <Badge tone={tx.status === 'COMPLETED' ? 'emerald' : 'amber'}>{tx.status}</Badge>,
                    tx.message || '—',
                    <ActionButton label="View" icon={Eye} onClick={() => void openTransactionDetail(tx.id)} />,
                  ])}
                  emptyText={actionLoading === 'transactions' ? 'Loading transactions...' : 'Search by ref code, tx id, provider id, or message.'}
                />
                <div className="mt-4">
                  <PaginationBar page={transactionsPage?.page || 1} total={transactionsPage?.total || 0} limit={transactionsPage?.limit || 25} hasMore={transactionsPage?.has_more || false} onPrev={() => { const next = Math.max(1, (transactionsPage?.page || 1) - 1); setTransactionsPageIndex(next); void loadTransactions(searchQuery, next); }} onNext={() => { const next = (transactionsPage?.page || 1) + 1; setTransactionsPageIndex(next); void loadTransactions(searchQuery, next); }} />
                </div>
              </CardContent>
            </Card>
            <DetailPanel title="Transaction details" open={Boolean(selectedTransactionDetail)} onClose={() => setSelectedTransactionDetail(null)}>
              {selectedTransactionDetail ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="text-sm font-semibold text-white">{selectedTransactionDetail.reference || selectedTransactionDetail.id}</div>
                    <div className="mt-1 text-xs text-white/45">{selectedTransactionDetail.provider_tx_id || 'No provider reference'}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => void copyText(selectedTransactionDetail.reference || selectedTransactionDetail.id)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Copy Reference</Button>
                      <Button variant="outline" onClick={() => void copyText(selectedTransactionDetail.id)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Copy Transaction ID</Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-white/70">
                      <div>From: {selectedTransactionDetail.sender_name || '—'}</div>
                      <div>To: {selectedTransactionDetail.recipient_name || '—'}</div>
                      <div>Amount: {formatCurrency(selectedTransactionDetail.amount)}</div>
                      <div>Status: {selectedTransactionDetail.status}</div>
                      <div>Fee: {formatCurrency(selectedTransactionDetail.fee || 0)}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">Context</div>
                    <pre className="mt-3 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-white/70">{JSON.stringify(selectedTransactionDetail.context || {}, null, 2)}</pre>
                  </div>
                </div>
              ) : null}
            </DetailPanel>
          </div>
        )}

        {currentTab === 'revenue' && (
          <Card className="mt-6 border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-white">Revenue sweeps</CardTitle>
              <Button variant="outline" onClick={() => void loadRevenue(sweepsPageIndex)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sweeps.map((sweep) => (
                <div key={sweep.id} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{sweep.revenue_account_name}</div>
                      <div className="text-xs text-white/45">{sweep.id}</div>
                    </div>
                    <Badge tone={sweep.status === 'PROCESSED' ? 'emerald' : sweep.status === 'FAILED' ? 'rose' : 'amber'}>{sweep.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-white/70">{formatCurrency(sweep.amount)}</div>
                    {sweep.status === 'PENDING' && (
                      <Button onClick={() => setConfirmAction({
                        title: `Execute sweep for ${sweep.revenue_account_name}`,
                        description: 'This payout can be queued for approval if double approval is enabled.',
                        execute: async () => handleSweep(sweep.id),
                      })} className="bg-white text-black hover:bg-white/90">
                        Execute
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {sweeps.length === 0 && <EmptyState text="No sweeps found." />}
              <PaginationBar page={sweepsPage?.page || 1} total={sweepsPage?.total || 0} limit={sweepsPage?.limit || 25} hasMore={sweepsPage?.has_more || false} onPrev={() => { const next = Math.max(1, (sweepsPage?.page || 1) - 1); setSweepsPageIndex(next); void loadRevenue(next); }} onNext={() => { const next = (sweepsPage?.page || 1) + 1; setSweepsPageIndex(next); void loadRevenue(next); }} />
            </CardContent>
          </Card>
        )}

        {currentTab === 'config' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Feature flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {flags.map((flag) => (
                  <div key={flag.key} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{flag.name || flag.key}</div>
                        <div className="text-xs text-white/45">{flag.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminApi.saveFeatureFlag({ key: flag.key, name: flag.name, description: flag.description, enabled: !flag.enabled, payload: flag.payload || {} });
                          await loadRevenue();
                        }}
                        className="text-white/90"
                      >
                        {flag.enabled ? <ToggleRight className="h-6 w-6 text-emerald-300" /> : <ToggleLeft className="h-6 w-6 text-white/40" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Create / update flag</div>
                  <input value={flagDraft.key} onChange={(e) => setFlagDraft((prev) => ({ ...prev, key: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="key" />
                  <input value={flagDraft.name || ''} onChange={(e) => setFlagDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="name" />
                  <textarea value={flagDraft.description || ''} onChange={(e) => setFlagDraft((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="description" />
                  <label className="flex items-center gap-2 text-sm text-white/75">
                    <input type="checkbox" checked={Boolean(flagDraft.enabled)} onChange={(e) => setFlagDraft((prev) => ({ ...prev, enabled: e.target.checked }))} />
                    Enabled
                  </label>
                  <Button onClick={() => void saveFlag()} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">Save flag</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">FX overrides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fxOverrides.map((fx) => (
                  <div key={fx.pair} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{fx.pair}</div>
                      <div className="text-xs text-white/45">{fx.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">{fx.rate}</div>
                      <div className="text-xs text-white/45">{fx.is_override ? 'override' : 'seed'}</div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Set override</div>
                  <input value={fxDraft.pair} onChange={(e) => setFxDraft((prev) => ({ ...prev, pair: e.target.value.toUpperCase() }))} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="USDC_KES" />
                  <input value={fxDraft.rate} onChange={(e) => setFxDraft((prev) => ({ ...prev, rate: Number(e.target.value) }))} type="number" step="0.0001" className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="rate" />
                  <input value={fxDraft.source || ''} onChange={(e) => setFxDraft((prev) => ({ ...prev, source: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="source" />
                  <label className="flex items-center gap-2 text-sm text-white/75">
                    <input type="checkbox" checked={Boolean(fxDraft.is_override)} onChange={(e) => setFxDraft((prev) => ({ ...prev, is_override: e.target.checked }))} />
                    Override active
                  </label>
                  <Button onClick={() => setConfirmAction({
                    title: `Save FX override for ${fxDraft.pair}`,
                    description: 'FX overrides change live pricing and should be reviewed carefully. This can also queue for approval.',
                    execute: async () => saveFX(),
                  })} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">Save FX</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'compliance' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card className="border-white/10 bg-white/5 xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-white">Compliance features</CardTitle>
                <Button variant="outline" onClick={() => void loadCompliance()} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {complianceFeatureDrafts.map((draft) => {
                  const live = flags.find((flag) => flag.key === draft.key);
                  const enabled = live ? live.enabled : false;
                  return (
                    <div key={draft.key} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{draft.name}</div>
                          <div className="text-xs text-white/45">{draft.description}</div>
                          <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/35">{draft.help}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void saveComplianceFlag(draft.key, draft.name, draft.description, !enabled)}
                          className="text-white/90"
                        >
                          {enabled ? <ToggleRight className="h-6 w-6 text-emerald-300" /> : <ToggleLeft className="h-6 w-6 text-white/40" />}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={enabled ? 'emerald' : 'amber'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
                        <Badge tone="indigo">{draft.key}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Compliance workflows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Sanctions screen</div>
                  <input
                    value={complianceAccountId}
                    onChange={(e) => setComplianceAccountId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none"
                    placeholder={selectedUserId || 'Account ID'}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void runComplianceWorkflow('sanctions_screen')} className="bg-emerald-500 text-black hover:bg-emerald-400">
                      Screen account
                    </Button>
                    <Button variant="outline" onClick={() => { setComplianceAccountId(selectedUserId || ''); setComplianceStatus(''); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                      Use selected user
                    </Button>
                  </div>
                  {complianceStatus && <div className="text-xs text-white/50">{complianceStatus}</div>}
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Scheduled controls</div>
                  <Button onClick={() => void runComplianceWorkflow('retention_cleanup')} className="w-full bg-white text-black hover:bg-white/90">
                    Run retention cleanup
                  </Button>
                  <Button onClick={() => void runComplianceWorkflow('pci_check')} className="w-full bg-white text-black hover:bg-white/90">
                    Run PCI compliance check
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 xl:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-white">Retention policies</CardTitle>
                <Badge tone="indigo">{retentionPolicies.length} policies</Badge>
              </CardHeader>
              <CardContent>
                <AdminTable
                  headers={['Category', 'Retention', 'Legal basis', 'Auto-delete', 'Review']}
                  rows={retentionPolicies.map((policy) => [
                    <div key={policy.id} className="space-y-1">
                      <div className="font-semibold text-white">{policy.data_category}</div>
                      <div className="text-xs text-white/45">{policy.id}</div>
                    </div>,
                    `${policy.retention_days} days`,
                    policy.legal_basis || '—',
                    policy.auto_delete ? <Badge tone="emerald">Yes</Badge> : <Badge tone="amber">Manual</Badge>,
                    policy.review_date ? new Date(policy.review_date).toLocaleDateString() : '—',
                  ])}
                  emptyText={actionLoading === 'compliance' ? 'Loading compliance policies...' : 'No retention policies found.'}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'audit' && (
          <Card className="mt-6 border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-white">System audit log</CardTitle>
              <Button variant="outline" onClick={() => void adminApi.exportAuditLogs(searchQuery).then((res) => {
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'admin_audit_logs.csv';
                a.click();
                URL.revokeObjectURL(url);
              })} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <AdminTable
                headers={['Action', 'Actor', 'Entity', 'IP', 'Time']}
                rows={auditLogs.map((entry) => [
                  entry.action,
                  <div key={entry.id} className="space-y-1">
                    <div className="font-semibold text-white">{entry.actor_email || entry.actor_id || 'system'}</div>
                    <div className="text-xs text-white/45">{entry.user_agent || '—'}</div>
                  </div>,
                  `${entry.entity_type || 'system'}${entry.entity_id ? ` · ${entry.entity_id}` : ''}`,
                  entry.ip_address || '—',
                  new Date(entry.created_at).toLocaleString(),
                ])}
                emptyText={actionLoading === 'audit' ? 'Loading audit logs...' : 'No audit entries yet.'}
              />
              <div className="mt-4">
                <PaginationBar page={auditLogsPage?.page || 1} total={auditLogsPage?.total || 0} limit={auditLogsPage?.limit || 25} hasMore={auditLogsPage?.has_more || false} onPrev={() => { const next = Math.max(1, (auditLogsPage?.page || 1) - 1); setAuditPageIndex(next); void loadAudit(next); }} onNext={() => { const next = (auditLogsPage?.page || 1) + 1; setAuditPageIndex(next); void loadAudit(next); }} />
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === 'approvals' && (
          <Card className="mt-6 border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Approval queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="rounded-2xl border border-white/10 bg-neutral-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{approval.action_type}</div>
                      <div className="text-xs text-white/45">{approval.entity_type || 'system'} {approval.entity_id ? `· ${approval.entity_id}` : ''}</div>
                      <div className="mt-2 text-xs text-white/60">Requested by {approval.requested_by_email || approval.requested_by_id}</div>
                    </div>
                    <Badge tone={approval.status === 'APPROVED' ? 'emerald' : approval.status === 'REJECTED' ? 'rose' : 'amber'}>{approval.status}</Badge>
                  </div>
                  {approval.rejection_reason && <div className="mt-2 text-xs text-white/50">{approval.rejection_reason}</div>}
                  {approval.status === 'PENDING' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={async () => { await adminApi.approveApproval(approval.id); await loadApprovals(approvalsPageIndex); setMessage('Approval executed.'); }} className="bg-emerald-500 text-black hover:bg-emerald-400">
                        Approve
                      </Button>
                      <Button variant="outline" onClick={async () => { await adminApi.rejectApproval(approval.id, 'Rejected from admin portal'); await loadApprovals(approvalsPageIndex); setMessage('Approval rejected.'); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {approvals.length === 0 && <EmptyState text="No approvals pending." />}
              <PaginationBar page={approvalsPage?.page || 1} total={approvalsPage?.total || 0} limit={approvalsPage?.limit || 25} hasMore={approvalsPage?.has_more || false} onPrev={() => { const next = Math.max(1, (approvalsPage?.page || 1) - 1); setApprovalsPageIndex(next); void loadApprovals(next); }} onNext={() => { const next = (approvalsPage?.page || 1) + 1; setApprovalsPageIndex(next); void loadApprovals(next); }} />
            </CardContent>
          </Card>
        )}

        <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
          <DialogContent className="bg-neutral-950 text-white border border-white/10 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">{confirmAction?.title || 'Confirm action'}</DialogTitle>
              <DialogDescription className="text-white/60">{confirmAction?.description || ''}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!confirmAction) return;
                const next = confirmAction;
                setConfirmAction(null);
                await next.execute();
              }} className="bg-emerald-500 text-black hover:bg-emerald-400">
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const Metric = ({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: React.ComponentType<{ className?: string }> }) => (
  <Card className="border-white/10 bg-white/5">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
          <div className="mt-2 text-2xl font-black text-white">{value}</div>
          <div className="mt-1 text-xs text-white/45">{helper}</div>
        </div>
        <Icon className="h-5 w-5 text-emerald-300" />
      </div>
    </CardContent>
  </Card>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4">
    <div className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className="mt-2 text-lg font-bold text-white">{value}</div>
  </div>
);

const Badge = ({ children, tone }: { children: React.ReactNode; tone: 'emerald' | 'amber' | 'rose' | 'indigo' }) => {
  const map = {
    emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    rose: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
    indigo: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/20',
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
};

const ActionButton = ({ label, icon: Icon, onClick }: { label: string; icon?: React.ComponentType<{ className?: string }>; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </button>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/45">
    {text}
  </div>
);

const PaginationBar = ({ page, total, limit, hasMore, onPrev, onNext }: { page: number; total: number; limit: number; hasMore: boolean; onPrev: () => void; onNext: () => void }) => {
  const showingStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingEnd = Math.min(total, page * limit);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
      <div>
        Showing {showingStart}-{showingEnd} of {total}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={onPrev} className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-40">
          Prev
        </Button>
        <Button variant="outline" disabled={!hasMore} onClick={onNext} className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-40">
          Next
        </Button>
      </div>
    </div>
  );
};

const DetailPanel = ({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-neutral-950/95 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">Details</div>
          <div className="text-lg font-semibold text-white">{title}</div>
        </div>
        <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10">Close</button>
      </div>
      <div className="mt-5 max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
};

const AdminTable = ({ headers, rows, emptyText }: { headers: string[]; rows: React.ReactNode[][]; emptyText: string }) => (
  <div className="overflow-hidden rounded-2xl border border-white/10">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-neutral-900/80">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-white/5">
          {rows.length > 0 ? rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-white/5">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-4 align-top text-sm text-white/85">
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12">
                <EmptyState text={emptyText} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
