import React from 'react';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface Activity {
    id: string;
    type: 'success' | 'warning' | 'info';
    description: string;
    time: string;
    amount?: string;
    currency?: string;
}

interface ActivityFeedProps {
    activities: Activity[];
    onViewAll?: () => void;
}

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
    switch (type) {
        case 'success': return <CheckCircle className="text-emerald-500" size={18} />;
        case 'warning': return <AlertCircle className="text-amber-500" size={18} />;
        default: return <Clock className="text-blue-500" size={18} />;
    }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onViewAll }) => {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">Live Operation Feed</h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                        View All <ArrowRight size={14} />
                    </button>
                )}
            </div>
            <div className="divide-y divide-slate-50">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">No recent activity detected.</div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <ActivityIcon type={activity.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-800 font-medium leading-snug">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-slate-400">{activity.time}</span>
                                        {activity.amount && (
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {activity.currency} {activity.amount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
