import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded' | 'pill';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'text',
    width,
    height,
    lines = 1,
    style,
    ...props
}) => {
    if (variant === 'text' && lines > 1) {
        return (
            <div className={clsx("space-y-2", className)} style={style} {...props}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(
                            "animate-pulse bg-gray-200 rounded-md",
                            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
                        )}
                        style={{ height: height || '1rem' }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={clsx(
                "animate-pulse bg-gray-200",
                {
                    'rounded-md': variant === 'text',
                    'rounded-full': variant === 'circular' || variant === 'pill',
                    'rounded-none': variant === 'rectangular',
                    'rounded-lg': variant === 'rounded',
                },
                className
            )}
            style={{
                width,
                height,
                ...style
            }}
            {...props}
        />
    );
};

// Card skeleton for marketplace items
export const CardSkeleton: React.FC = () => (
    <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton width={60} height={20} variant="pill" />
        </div>
        <div className="space-y-2">
            <Skeleton width="60%" height={24} />
            <Skeleton lines={2} />
        </div>
        <div className="flex gap-2">
            <Skeleton width={80} height={24} variant="pill" />
            <Skeleton width={60} height={24} variant="pill" />
        </div>
    </div>
);

// Enhanced table skeleton
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
    rows = 5, 
    columns = 4 
}) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
            <Skeleton width={120} height={24} />
        </div>
        <div className="p-4">
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <div key={j} className="flex-1">
                                <Skeleton 
                                    width={j === 0 ? "80%" : "60%"} 
                                    height={16} 
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// KPI Card skeleton for dashboards
export const KPIPlaceholderSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton width={40} height={16} variant="pill" />
        </div>
        <div className="space-y-2">
            <Skeleton width="40%" height={28} />
            <Skeleton width="60%" height={14} />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton width={16} height={16} variant="circular" />
            <Skeleton width={80} height={12} />
        </div>
    </div>
);

// Connector skeleton for marketplace
export const ConnectorSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Skeleton variant="rounded" width={64} height={64} />
                <div className="space-y-2">
                    <Skeleton width={120} height={20} />
                    <Skeleton width={160} height={14} />
                </div>
            </div>
            <Skeleton width={60} height={24} variant="pill" />
        </div>
        <Skeleton lines={2} />
        <div className="flex flex-wrap gap-2">
            <Skeleton width={80} height={20} variant="pill" />
            <Skeleton width={60} height={20} variant="pill" />
            <Skeleton width={70} height={20} variant="pill" />
        </div>
    </div>
);

// Testimonial skeleton
export const TestimonialSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
                <Skeleton width={140} height={18} />
                <Skeleton width={100} height={14} className="mt-1" />
            </div>
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} width={16} height={16} />
                ))}
            </div>
        </div>
        <Skeleton lines={3} />
        <div className="flex items-center gap-4 pt-2">
            <Skeleton width={60} height={20} variant="pill" />
            <Skeleton width={80} height={20} variant="pill" />
        </div>
    </div>
);

// Dashboard skeleton with KPI grid
export const DashboardSkeleton: React.FC<{ kpiCount?: number; hasChart?: boolean }> = ({ 
    kpiCount = 4, 
    hasChart = true 
}) => (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div>
            <Skeleton width={200} height={32} className="mb-2" />
            <Skeleton width={300} height={16} />
        </div>

        {/* KPI Grid */}
        <div className={clsx(
            "grid gap-4",
            kpiCount === 4 ? "grid-cols-4" : 
            kpiCount === 3 ? "grid-cols-3" : 
            kpiCount === 2 ? "grid-cols-2" : "grid-cols-1"
        )}>
            {Array.from({ length: kpiCount }).map((_, i) => (
                <KPIPlaceholderSkeleton key={i} />
            ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hasChart && (
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <Skeleton width={150} height={24} className="mb-4" />
                    <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                </div>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <Skeleton width={120} height={20} className="mb-4" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton variant="circular" width={8} height={8} />
                            <Skeleton width="70%" height={14} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
