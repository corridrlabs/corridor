import { useEffect } from 'react';
import { useWindows } from '../contexts/WindowContext';

interface KeyboardShortcut {
    key: string;
    ctrlOrCmd: boolean;
    shift?: boolean;
    action: () => void;
}

export const useKeyboardShortcuts = () => {
    const { closeWindow, minimizeWindow, maximizeWindow, getActiveWindow } = useWindows();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            const activeWindow = getActiveWindow();
            if (!activeWindow) return;

            // Cmd/Ctrl + W: Close active window
            if (ctrlOrCmd && e.key === 'w') {
                e.preventDefault();
                closeWindow(activeWindow.id);
                return;
            }

            // Cmd/Ctrl + M: Minimize active window
            if (ctrlOrCmd && e.key === 'm') {
                e.preventDefault();
                minimizeWindow(activeWindow.id);
                return;
            }

            // Cmd/Ctrl + F: Maximize/restore active window
            if (ctrlOrCmd && e.key === 'f') {
                e.preventDefault();
                maximizeWindow(activeWindow.id);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeWindow, minimizeWindow, maximizeWindow, getActiveWindow]);
};
