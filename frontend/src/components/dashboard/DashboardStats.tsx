import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, delay = 0 }) => (
    <div
        className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className={clsx(
                        "flex items-center gap-1 mt-2 text-xs font-semibold",
                        trend.isPositive ? "text-emerald-600" : "text-rose-600"
                    )}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                        <span className="text-slate-400 font-normal ml-1">vs last month</span>
                    </div>
                )}
            </div>
            <div className={clsx(
                "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300",
                color
            )}>
                <Icon size={22} />
            </div>
        </div>
    </div>
);

interface DashboardStatsProps {
    stats: StatCardProps[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <StatCard key={stat.title} {...stat} delay={index * 100} />
            ))}
        </div>
    );
};
