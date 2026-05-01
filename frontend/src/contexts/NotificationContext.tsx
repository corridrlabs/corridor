import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { needsLegalAcceptance } from '../utils/legalConsent';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: Date;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { isAuthenticated, user } = useAuthStore();

    // Fetch notifications on mount
    React.useEffect(() => {
        const fullName = String((user as any)?.full_name || (user as any)?.name || '').trim();
        const phone = String((user as any)?.whatsapp_phone || (user as any)?.phone || '').trim();
        const kycStatus = String((user as any)?.kyc_status || '').toUpperCase();
        const hasCompletedKyc = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(kycStatus);
        const hasCompletedProfile = fullName.length > 1 && phone.length > 0;
        const readyForNotifications =
            isAuthenticated &&
            !!user &&
            !needsLegalAcceptance(user) &&
            user.onboarding_completed !== false &&
            hasCompletedProfile &&
            hasCompletedKyc;

        if (!readyForNotifications) {
            setNotifications([]);
            return;
        }

        const fetchNotifications = async () => {
            try {
                // Dynamic import to avoid circular dependency if api uses this context (unlikely but safe)
                const api = (await import('../services/api')).default;
                const response = await api.get('/notifications');
                const payload = response?.data?.data ?? response?.data ?? [];
                // Map backend response to frontend model if needed (backend handles mapping mostly)
                setNotifications(payload.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                })));
            } catch (error: any) {
                // Avoid noisy console logs for common auth/route situations.
                const status = error?.response?.status;
                if (status === 401 || status === 403 || status === 404) {
                    setNotifications([]);
                    return;
                }
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();

        // Optional: Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        // Optimistic update
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(), // Temp ID
            read: false,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = async () => {
        // Optimistic update
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
