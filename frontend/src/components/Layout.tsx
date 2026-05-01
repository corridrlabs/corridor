import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
  Users,
  Wallet,
  Zap,
  Globe,
  Settings,
  Shield,
  Layers,
  Layout as LayoutIcon,
  Plus
} from 'lucide-react';
import clsx from 'clsx';
import { GlobalBackground } from './ui/GlobalBackground';
import { ProfileMenu } from './ProfileMenu';
import { MobileNav } from './MobileNav';
import { navigationConfig } from '../config/navigation';
import { SearchDialog } from './SearchDialog';
import { SupportModal } from './SupportModal';
import { BrandWordmark } from './BrandWordmark';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuthStore } from '../store/authStore';
import { CookieConsent } from './CookieConsent';

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }: { icon: any, label: string, path: string, active: boolean, collapsed: boolean }) => (
  <Link
    to={path}
    className={clsx(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      collapsed && "justify-center"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon size={18} className={clsx(
        "transition-all",
        active ? "text-white" : "group-hover:text-slate-900"
    )} />
    
    {!collapsed && (
        <span>{label}</span>
    )}

    {active && !collapsed && (
        <div className="absolute right-4 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
    )}
  </Link>
);

const QuickActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-md hover:bg-white transition-colors shadow-sm"
  >
    <Icon size={14} className="text-blue-600" />
    {label}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuthStore();

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Support State
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  const navGroups = navigationConfig;
  const currentRole = String((user as any)?.account_type || '').toUpperCase();

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearNotifications = () => {
    clearAll();
  };

  const formatTimeAgo = (value: Date | string) => {
    const d = value instanceof Date ? value : new Date(value);
    const diffMs = Date.now() - d.getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now';

    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;

    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Quick Action Handlers
  const handleCreateInvoice = () => navigate('/invoices');
  const handleSendPayment = () => navigate('/finance?action=send');
  const handleAddEmployee = () => navigate('/team?action=add');
  const handleWhatsApp = () => {
    const whatsappNumber = '254798559893';
    const message = encodeURIComponent('Hi Corridor! I need assistance.');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  // Breadcrumbs logic
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const items = ['My Account']; 

    const pathMap: Record<string, string> = {
      'dashboard': 'Command Center',
      'finance': 'Finance',
      'invoices': 'Invoices',
      'payroll': 'Payroll',
      'team': 'Team',
      'workflows': 'Workflows',
      'ai-workflows': 'AI Agents',
      'bank-connectors': 'Connectors',
      'analytics': 'Analytics',
      'integrations': 'Integrations',
      'settings': 'Settings',
      'admin': 'Admin'
    };

    parts.forEach(part => {
      if (pathMap[part]) {
        items.push(pathMap[part]);
      } else if (part.length > 2) {
        items.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    });

    return items;
  };

  return (
    <div className="flex h-screen text-slate-900 font-sans relative overflow-hidden bg-[#f8fafc]">
      <GlobalBackground />

      {/* Search Overlay */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-30 shadow-sm",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-100 relative z-50">
          <Link 
            to="/landing" 
            className={clsx(
              "flex items-center gap-2 hover:opacity-80 transition-opacity", 
              !isSidebarOpen && "justify-center w-full"
            )}
          >
            <img
              src="/corridor-logo.svg"
              alt="Corridor"
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            {isSidebarOpen && (
              <BrandWordmark
                showLeadingC={false}
                className="text-xl tracking-tight text-slate-900 ml-0.5"
              />
            )}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar no-scrollbar">
          {navGroups
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => {
                if (!item.roles || item.roles.length === 0) return true;
                return item.roles.map((role) => role.toUpperCase()).includes(currentRole);
              }),
            }))
            .filter((group) => group.items.length > 0)
            .map((group, groupIndex, visibleGroups) => (
              <div key={group.title}>
                {isSidebarOpen && (
                  <h3 className="text-xs font-semibold text-slate-400 mb-2 px-3">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    return (
                      <SidebarItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        active={active}
                        collapsed={!isSidebarOpen}
                      />
                    );
                  })}
                </div>
                {!isSidebarOpen && groupIndex < visibleGroups.length - 1 && (
                  <div className="my-2 border-b border-slate-100 mx-2" />
                )}
              </div>
            ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 z-20 shadow-sm">
          {/* Breadcrumbs & Search */}
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center text-xs font-medium text-slate-400 overflow-hidden hidden lg:flex">
              {getBreadcrumbs().map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="mx-2 text-slate-300">/</span>}
                  <span className={clsx(
                      "transition-colors",
                      index === getBreadcrumbs().length - 1 ? "text-slate-900 font-semibold" : "hover:text-slate-600 cursor-default"
                  )}>
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div
              className="relative max-w-md w-full flex-shrink-1 cursor-pointer group hidden sm:block"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors" size={16} />
              <div className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 group-hover:border-slate-300 transition-all flex justify-between items-center">
                <span>Search or type a command...</span>
                <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded shadow-sm">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded shadow-sm">K</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
                <button
                    className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                <button
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setIsSupportOpen(true)}
                    title="Support"
                >
                    <HelpCircle size={20} />
                </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <ProfileMenu />
          </div>
        </header>

        {/* Quick Actions Bar */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200/50 px-8 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 mr-2">
              <Zap size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Quick Actions</span>
          </div>
          
          <QuickActionButton icon={FileText} label="New Invoice" onClick={handleCreateInvoice} />
          <QuickActionButton icon={Wallet} label="Send Payment" onClick={handleSendPayment} />
          <QuickActionButton icon={Users} label="Add Member" onClick={handleAddEmployee} />
          
          <div className="flex-1" />
          
          <button 
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
              <MessageSquare size={12} />
              Support
          </button>
        </div>

        {/* Notifications Dropdown */}
        {isNotificationsOpen && (
            <div className="fixed top-16 right-8 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-sm z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Mark all as read</button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                    {notifications.map(notif => (
                        <div key={notif.id} className={clsx("p-4 hover:bg-slate-50 transition-colors", !notif.read && "bg-indigo-50/30")}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={clsx(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    !notif.read ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                )}>
                                    System
                                </span>
                                <span className="text-[10px] text-slate-400">{formatTimeAgo(notif.timestamp)}</span>
                            </div>
                            <h5 className="font-medium text-slate-900 text-xs mb-0.5">{notif.title}</h5>
                            <p className="text-[11px] text-slate-500 leading-normal">{notif.message}</p>
                        </div>
                    ))}
                    </div>
                )}
                </div>
                
                <div className="p-3 border-t border-slate-50 bg-slate-50/50 text-center">
                    <button onClick={handleClearNotifications} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Clear all notifications</button>
                </div>
            </div>
        )}

        {/* Main Operational Canvas */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 pb-24 lg:pb-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/70 px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-5 text-xs text-slate-500">
            <Link to="/settings" className="hover:text-slate-900 transition-colors">Settings</Link>
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/docs/security" className="hover:text-slate-900 transition-colors">Security</Link>
          </div>
        </footer>

        <MobileNav />
        <CookieConsent />
      </div>
    </div>
  );
};
