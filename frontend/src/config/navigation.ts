import {
    LayoutDashboard,
    Wallet,
    Users,
    FileText,
    Settings,
    ShieldCheck,
    CreditCard,
    BarChart3,
    Briefcase,
    Globe,
    Shield,
    Key,
    Bot,
    Building2,
    Zap,
    Layers,
    PieChart,
    Network,
    Target,
    Activity
} from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: any;
    roles?: string[]; // Future: RBAC
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
    {
        title: 'Core',
        items: [
            { label: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Payments',
        items: [
            { label: 'Borderless Pay', path: '/finance', icon: Globe },
            { label: 'Add Funds', path: '/add-funds', icon: Wallet },
            { label: 'Invoices', path: '/invoices', icon: FileText },
            { label: 'Payouts', path: '/payouts', icon: Wallet },
            { label: 'Payment Links', path: '/payment-links', icon: Globe },
            { label: 'Cards', path: '/cards', icon: CreditCard },
            { label: 'Treasury', path: '/treasury', icon: Building2 },
        ]
    },
    {
        title: 'Social',
        items: [
            { label: 'Goals', path: '/goals', icon: Target },
            { label: 'Feed', path: '/social/feed', icon: Zap },
            { label: 'Groups', path: '/groups', icon: Users },
        ]
    },
    {
        title: 'Team',
        items: [
            { label: 'Payroll', path: '/payroll', icon: Briefcase },
            { label: 'Staff', path: '/team', icon: Users },
        ]
    },
    {
        title: 'Platform',
        items: [
            { label: 'Settings', path: '/settings', icon: Settings },
            { label: 'Subscription', path: '/subscription', icon: Shield },
            { label: 'Developers', path: '/developers', icon: Key },
            { label: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['ADMIN'] },
        ]
    }
];
