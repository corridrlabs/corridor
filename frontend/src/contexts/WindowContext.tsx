import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WindowState {
    id: string;
    handle: string;
    title: string;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
}

interface WindowContextType {
    windows: WindowState[];
    openWindow: (handle: string, title: string) => void;
    closeWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    maximizeWindow: (id: string) => void;
    restoreWindow: (id: string) => void;
    bringToFront: (id: string) => void;
    updatePosition: (id: string, position: { x: number; y: number }) => void;
    updateSize: (id: string, size: { width: number; height: number }) => void;
    getActiveWindow: () => WindowState | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const useWindows = () => {
    const context = useContext(WindowContext);
    if (!context) {
        throw new Error('useWindows must be used within WindowProvider');
    }
    return context;
};

interface WindowProviderProps {
    children: ReactNode;
}

export const WindowProvider: React.FC<WindowProviderProps> = ({ children }) => {
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [nextZIndex, setNextZIndex] = useState(100);

    const openWindow = useCallback((handle: string, title: string) => {
        setWindows(prev => {
            // Check if window already exists
            const existing = prev.find(w => w.handle === handle);
            if (existing) {
                // Bring to front and restore if minimized
                return prev.map(w =>
                    w.handle === handle
                        ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZIndex }
                        : w
                );
            }

            // Create new window
            const newWindow: WindowState = {
                id: `window-${Date.now()}-${handle}`,
                handle,
                title,
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                position: {
                    x: 100 + (prev.length * 30),
                    y: 100 + (prev.length * 30)
                },
                size: { width: 800, height: 600 },
                zIndex: nextZIndex
            };

            setNextZIndex(z => z + 1);
            return [...prev, newWindow];
        });
    }, [nextZIndex]);

    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
    }, []);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMinimized: true } : w
        ));
    }, []);

    const maximizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w
        ));
    }, []);

    const restoreWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMinimized: false, isMaximized: false } : w
        ));
    }, []);

    const bringToFront = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, zIndex: nextZIndex } : w
        ));
        setNextZIndex(z => z + 1);
    }, [nextZIndex]);

    const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, position } : w
        ));
    }, []);

    const updateSize = useCallback((id: string, size: { width: number; height: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, size } : w
        ));
    }, []);

    const getActiveWindow = useCallback(() => {
        if (windows.length === 0) return null;
        return windows.reduce((max, w) => w.zIndex > max.zIndex ? w : max, windows[0]);
    }, [windows]);

    const value: WindowContextType = {
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        bringToFront,
        updatePosition,
        updateSize,
        getActiveWindow
    };

    return (
        <WindowContext.Provider value={value}>
            {children}
        </WindowContext.Provider>
    );
};
