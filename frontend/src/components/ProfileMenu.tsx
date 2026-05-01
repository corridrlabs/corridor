import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
    User, 
    Settings, 
    LogOut, 
    ChevronDown, 
    ShieldCheck, 
    Zap, 
    Key, 
    ExternalLink,
    CreditCard,
    Layout as LayoutIcon
} from 'lucide-react';

export const ProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    const email = user?.email || 'principal@corridor.cash';
    const name = (user as any)?.full_name || user?.name || 'Node Principal';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (n: string) => {
        return n.charAt(0).toUpperCase();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-4 p-2 pl-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 group border border-transparent hover:border-slate-100"
            >
                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">Owner</span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{name}</span>
                </div>
                <div className="relative">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-slate-200 group-hover:scale-105 transition-transform">
                        {getInitials(name)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)] border border-slate-100 py-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
                    {/* Header: User Identification */}
                    <div className="px-6 py-6 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {getInitials(name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{name}</h4>
                                <p className="text-[10px] font-medium text-slate-400 truncate tracking-wide">{email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Nodes */}
                    <div className="p-3 space-y-1">
                        <button
                            onClick={() => {
                                navigate('/settings');
                                setIsOpen(false);
                            }}
                            className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-2xl flex items-center gap-4 transition-all group"
                        >
                            <Settings size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:rotate-45 transition-all" />
                            Node Settings
                        </button>
                        <button
                            onClick={() => {
                                navigate('/billing');
                                setIsOpen(false);
                            }}
                            className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-2xl flex items-center gap-4 transition-all group"
                        >
                            <CreditCard size={18} className="text-slate-400 group-hover:text-emerald-600 transition-all" />
                            Treasury Plan
                        </button>
                        <button
                            onClick={() => {
                                navigate('/developers');
                                setIsOpen(false);
                            }}
                            className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-2xl flex items-center gap-4 transition-all group"
                        >
                            <Key size={18} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
                            Developer Hub
                        </button>
                         <button
                            onClick={() => {
                                navigate('/dashboard');
                                setIsOpen(false);
                            }}
                            className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-2xl flex items-center gap-4 transition-all group"
                        >
                            <LayoutIcon size={18} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
                            Control Panel
                        </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-50 px-3">
                        <button
                            onClick={handleLogout}
                            className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 rounded-2xl flex items-center gap-4 transition-all group"
                        >
                            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                            Terminate Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
