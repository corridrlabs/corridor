import React from 'react';
import { clsx } from 'clsx';

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
}

const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void }>({ value: '', onValueChange: () => { } });

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children }) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
        <div className="w-full">{children}</div>
    </TabsContext.Provider>
);

export const TabsList: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={clsx("flex space-x-1 rounded-xl bg-gray-100 p-1", className)}>
        {children}
    </div>
);

export const TabsTrigger: React.FC<{ value: string, children: React.ReactNode }> = ({ value, children }) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;
    return (
        <button
            className={clsx(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all",
                isActive ? "bg-white text-indigo-700 shadow" : "text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600"
            )}
            onClick={() => context.onValueChange(value)}
        >
            {children}
        </button>
    );
};

export const TabsContent: React.FC<{ value: string, children: React.ReactNode }> = ({ value, children }) => {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;
    return <div className="mt-2">{children}</div>
};
