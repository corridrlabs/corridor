import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
    const variants = {
        default: 'bg-indigo-100 text-indigo-800',
        secondary: 'bg-gray-100 text-gray-800',
        outline: 'text-gray-800 border border-gray-200',
        destructive: 'bg-red-100 text-red-800',
    };

    return (
        <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
            {children}
        </span>
    );
};
