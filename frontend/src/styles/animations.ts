import { clsx } from 'clsx';

// Micro-interaction animations for enhanced UX
export const animations = {
    // Entrance animations
    fadeIn: {
        from: 'opacity-0 transform scale-95',
        to: 'opacity-100 transform scale-100',
        duration: 'duration-300',
    },
    slideUp: {
        from: 'opacity-0 transform translate-y-4',
        to: 'opacity-100 transform translate-y-0',
        duration: 'duration-400',
    },
    slideInRight: {
        from: 'opacity-0 transform translate-x-4',
        to: 'opacity-100 transform translate-x-0',
        duration: 'duration-500',
    },

    // Hover interactions
    hover: {
        scale: 'hover:scale-105',
        glow: 'hover:shadow-lg hover:shadow-primary-500/25',
        lift: 'hover:-translate-y-1',
        bright: 'hover:brightness-110',
    },

    // Loading states
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    ping: 'animate-ping',

    // Smooth transitions
    smooth: 'transition-all duration-300 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-500 ease-out',
};

// Interactive utility classes
export const interactiveClasses = {
    // Button interactions
    button: clsx(
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
    ),

    // Card interactions
    card: clsx(
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-xl',
        'hover:-translate-y-1',
        'group-hover:shadow-primary-500/10'
    ),

    // Input interactions
    input: clsx(
        'transition-all duration-200 ease-out',
        'focus:ring-2 focus:ring-primary-500/50',
        'focus:border-primary-500',
        'hover:border-primary-400'
    ),

    // Link interactions
    link: clsx(
        'transition-all duration-200 ease-out',
        'hover:text-primary-600 dark:hover:text-primary-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        'hover:scale-105'
    ),
};

// Staggered animation utilities
export const staggerAnimation = {
    container: 'stagger-container',
    item: 'stagger-item',
    delay: (index: number) => `animation-delay-${index * 100}`,
};

// Parallax effects
export const parallaxEffects = {
    subtle: 'parallax-subtle',
    medium: 'parallax-medium',
    strong: 'parallax-strong',
};

// Glow effects
export const glowEffects = {
    primary: 'glow-primary',
    secondary: 'glow-secondary',
    success: 'glow-success',
    warning: 'glow-warning',
    error: 'glow-error',
};

// Floating animations
export const floatingAnimations = {
    subtle: 'float-subtle',
    medium: 'float-medium',
    strong: 'float-strong',
};