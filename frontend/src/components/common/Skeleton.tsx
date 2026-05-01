import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-gray-200';

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="flex-1" height={40} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton width="60%" className="mb-2" />
                    <Skeleton width="40%" />
                </div>
            </div>
            <Skeleton width="100%" height={100} className="mb-4" />
            <div className="flex gap-2">
                <Skeleton width="30%" height={36} />
                <Skeleton width="30%" height={36} />
            </div>
        </div>
    );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Skeleton width="200px" height={32} className="mb-2" />
                <Skeleton width="300px" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <Skeleton width="60%" className="mb-2" />
                        <Skeleton width="40%" height={32} />
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
};
