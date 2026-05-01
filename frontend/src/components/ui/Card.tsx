import React from 'react';
import { clsx } from 'clsx';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={clsx("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>
        {children}
    </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={clsx("p-6 pb-3", className)}>
        {children}
    </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <h3 className={clsx("font-semibold leading-none tracking-tight", className)}>
        {children}
    </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <p className={clsx("text-sm text-gray-500", className)}>
        {children}
    </p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={clsx("p-6 pt-0", className)}>
        {children}
    </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={clsx("flex items-center p-6 pt-0", className)}>
        {children}
    </div>
);
