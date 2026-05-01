import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

// Simple Dialog implementation using fixed positioning if Radix is not available, 
// but let's try to simulate the structure expected by Marketplace.tsx.

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

interface DialogSubProps {
    children: React.ReactNode;
    className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 z-10 animate-in fade-in zoom-in duration-200">
                {children}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const DialogContent: React.FC<DialogSubProps> = ({ children, className }) => (
    <div className={clsx(className)}>{children}</div>
);

export const DialogHeader: React.FC<DialogSubProps> = ({ children, className }) => (
    <div className={clsx("mb-4 space-y-1.5 text-center sm:text-left", className)}>{children}</div>
);

export const DialogTitle: React.FC<DialogSubProps> = ({ children, className }) => (
    <h3 className={clsx("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>
);

export const DialogDescription: React.FC<DialogSubProps> = ({ children, className }) => (
    <p className={clsx("text-sm text-gray-500", className)}>{children}</p>
);

export const DialogFooter: React.FC<DialogSubProps> = ({ children, className }) => (
    <div className={clsx("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
        {children}
    </div>
);

