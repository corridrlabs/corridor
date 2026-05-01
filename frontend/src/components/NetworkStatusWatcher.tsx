import { useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

export const NetworkStatusWatcher = () => {
    const { showToast } = useToast();
    const previousOnline = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOffline = () => {
            previousOnline.current = false;
            showToast('error', 'Connection lost. Trying to stay in sync.', 5000);
        };

        const handleOnline = () => {
            if (!previousOnline.current) {
                showToast('success', 'Connection restored.', 3500);
            }
            previousOnline.current = true;
        };

        const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        previousOnline.current = initialOnline;

        if (!initialOnline) {
            showToast('error', 'Connection lost. Trying to stay in sync.', 5000);
        }

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [showToast]);

    return null;
};
