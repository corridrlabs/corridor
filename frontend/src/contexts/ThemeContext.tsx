import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { designTokens, darkTheme, lightTheme } from '../styles/designSystem';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
    isDark: boolean;
    currentTheme: typeof darkTheme | typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeState(stored);
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        let resolvedTheme: 'light' | 'dark';

        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            resolvedTheme = systemPrefersDark ? 'dark' : 'light';
        } else {
            resolvedTheme = theme;
        }

        setEffectiveTheme(resolvedTheme);

        // Apply dark class and CSS variables
        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
            // Apply dark theme CSS variables
            root.style.setProperty('--background-primary', darkTheme.background.primary);
            root.style.setProperty('--background-secondary', darkTheme.background.secondary);
            root.style.setProperty('--background-card', darkTheme.background.card);
            root.style.setProperty('--text-primary', darkTheme.text.primary);
            root.style.setProperty('--text-secondary', darkTheme.text.secondary);
            root.style.setProperty('--accent', darkTheme.accent);
        } else {
            root.classList.remove('dark');
            // Apply light theme CSS variables
            root.style.setProperty('--background-primary', lightTheme.background.primary);
            root.style.setProperty('--background-secondary', lightTheme.background.secondary);
            root.style.setProperty('--background-card', lightTheme.background.card);
            root.style.setProperty('--text-primary', lightTheme.text.primary);
            root.style.setProperty('--text-secondary', lightTheme.text.secondary);
            root.style.setProperty('--accent', lightTheme.accent);
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setEffectiveTheme(e.matches ? 'dark' : 'light');
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const currentTheme = effectiveTheme === 'dark' ? darkTheme : lightTheme;
    const isDark = effectiveTheme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, isDark, currentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook for automatic system theme detection
export const useSystemTheme = () => {
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        
        // Initial check
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        
        // Listen for changes
        mediaQuery.addEventListener('change', handleChange);
        
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    return systemTheme;
};
