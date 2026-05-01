import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  QrCode,
  Send,
  Plus,
  Target,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatting';

// Mock data enhancement
const mockWalletBalances = [
  { currency: 'USDC', balance: 2847.50, color: 'bg-blue-600', icon: 'U' },
  { currency: 'KES', balance: 125000.00, color: 'bg-emerald-600', icon: 'K' },
  { currency: 'SOL', balance: 45.2, color: 'bg-purple-600', icon: 'S' }
];

const mockGoals = [
  { id: '1', title: 'MacBook Pro M3', current: 1200, target: 2500, currency: 'USDC', image: 'https://images.unsplash.com/photo-1517336714460-d5a83961a051?w=400' },
  { id: '2', title: 'Japan Trip 2026', current: 4500, target: 10000, currency: 'USDC', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' }
];

const QuickAction = ({ icon: Icon, label, onClick, color }: { icon: any, label: string, onClick?: () => void, color: string }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-3 group"
  >
    <div className={clsx(
      "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg group-active:scale-95",
      color
    )}>
      <Icon size={24} className="text-white" />
    </div>
    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </button>
);

export default function IndividualDashboard() {
  const { user } = useAuthStore();
  const [selectedWallet, setSelectedWallet] = useState(0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Hi, {user?.name?.split(' ')[0] || 'Alice'}! <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-slate-500 font-medium">Your financial ecosystem at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                alt="user"
              />
            ))}
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+12 Social</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wallets & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Multi-Currency Wallet Card */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20 group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                    <Wallet size={20} />
                  </div>
                  <span className="font-bold tracking-wider uppercase text-xs opacity-70">Total Balance</span>
                </div>
                <div className="flex gap-2">
                  {mockWalletBalances.map((w, i) => (
                    <button
                      key={w.currency}
                      onClick={() => setSelectedWallet(i)}
                      className={clsx(
                        "w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold transition-all",
                        selectedWallet === i ? "bg-white text-slate-900" : "hover:bg-white/10"
                      )}
                    >
                      {w.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <span className="text-5xl md:text-6xl font-black tracking-tight">
                  {formatCurrency(mockWalletBalances[selectedWallet].balance, mockWalletBalances[selectedWallet].currency)}
                </span>
                <div className="flex items-center gap-2 mt-2 text-emerald-400 font-bold text-sm">
                  <TrendingUp size={16} />
                  <span>+12.5% this month</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="block text-xs opacity-50 mb-1 uppercase font-bold tracking-wider">Account ID</span>
                  <span className="font-mono text-sm tracking-widest">**** **** 8892</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="block text-xs opacity-50 mb-1 uppercase font-bold tracking-wider">Tier</span>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-blue-400" />
                    <span className="font-bold text-sm uppercase">Diamond Elite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Mobile Priority */}
          <div className="grid grid-cols-4 gap-4 px-2 py-4">
            <QuickAction icon={Send} label="Send" color="bg-blue-600 shadow-blue-200" />
            <QuickAction icon={ArrowDownLeft} label="Request" color="bg-emerald-600 shadow-emerald-200" />
            <QuickAction icon={QrCode} label="Scan QR" color="bg-slate-900 shadow-slate-200" />
            <QuickAction icon={Plus} label="New Goal" color="bg-indigo-600 shadow-indigo-200" />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 group-hover:bg-white transition-colors">
                      {i % 2 === 0 ? <ArrowUpRight className="text-red-500" size={20} /> : <ArrowDownLeft className="text-emerald-500" size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{i % 2 === 0 ? 'Payment to Bob' : 'Received from coffee shop'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        2 hours ago • <span className="text-blue-600 font-bold uppercase">Public</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx("font-bold text-lg", i % 2 === 0 ? "text-slate-900" : "text-emerald-600")}>
                      {i % 2 === 0 ? '-' : '+'}$120.00
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">USDC</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Social Realtime & Goals */}
        <div className="space-y-8">
          {/* Social Marketplace / Goals */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900">Social Goals</h3>
              </div>
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <Plus size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {mockGoals.map(goal => (
                <div key={goal.id} className="relative group overflow-hidden rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
                  <img src={goal.image} alt={goal.title} className="w-full h-32 object-cover" />
                  <div className="p-4 bg-white/90 backdrop-blur-sm">
                    <h4 className="font-bold text-slate-900 mb-1">{goal.title}</h4>
                    <div className="w-full h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-600">${goal.current}</span>
                      <span className="text-slate-400 font-medium">Goal: ${goal.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-4 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
              Discover Goals
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Borderless Pay Promo */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
            <div className="p-3 bg-white/10 w-fit rounded-xl mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Borderless Money</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Send money to any currency instantly with zero conversion fees. Use the command center for mass payouts.
            </p>
            <button className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg active:scale-95">
              Send Now
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}} />
    </div>
  );
}