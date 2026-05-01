import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Grid, Settings, DollarSign } from 'lucide-react';

export function MobileNav() {
    const navItems = [
        { to: '/organizations', icon: Home, label: 'Home' },
        { to: '/analytics', icon: BarChart2, label: 'Analytics' },
        { to: '/marketplace', icon: Grid, label: 'Apps' },
        { to: '/billing', icon: DollarSign, label: 'Billing' }, // Assuming billing route exists or maps to something
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
