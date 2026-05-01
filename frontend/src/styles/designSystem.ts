// Corridor Design System - Unified Theme & Design Tokens
// Eliminates "vibe coded" inconsistencies with cohesive design language

export const designTokens = {
  // Brand Colors - Inspired by African fintech, sunset gradients
  colors: {
    // Primary Brand - Orange/Sunset inspired
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Main brand color
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
    
    // Secondary - Ocean/Azure inspired
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Secondary brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    
    // Success - Growth/Green inspired
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Success color
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    // Warning - Warm amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Warning color
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    
    // Error - Red tones
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Error color
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // Neutral - Sophisticated grays
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
  },

  // Gradients - Brand-aligned gradients
  gradients: {
    primary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    sunset: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #0ea5e9 100%)',
    ocean: 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)',
    midnight: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },

  // Shadows - Depth without noise
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(249, 115, 22, 0.3)', // Brand glow
    glowSecondary: '0 0 20px rgba(14, 165, 233, 0.3)',
  },

  // Glassmorphism - Modern effects
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(255, 255, 255, 0.6)',
    heavy: 'rgba(255, 255, 255, 0.4)',
    blur: 'blur(12px)',
    border: 'rgba(255, 255, 255, 0.18)',
  },

  // Spacing - Consistent scale
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Typography - Sophisticated scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      display: ['Clash Display', 'Inter', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // Animation - Smooth interactions
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    },
  },

  // Border Radius - Consistent rounding
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
};

// Dark theme configuration
export const darkTheme = {
  background: {
    primary: '#0f172a',   // slate-900
    secondary: '#1e293b', // slate-800
    tertiary: '#334155',   // slate-700
    card: 'rgba(30, 41, 59, 0.8)', // glass effect
    glass: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: '#f8fafc',   // slate-50
    secondary: '#e2e8f0', // slate-200
    tertiary: '#94a3b8',  // slate-400
    muted: '#64748b',     // slate-500
  },
  accent: designTokens.colors.primary[500],
};

// Light theme configuration
export const lightTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    card: 'rgba(255, 255, 255, 0.9)',
    glass: 'rgba(0, 0, 0, 0.02)',
    border: 'rgba(0, 0, 0, 0.06)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
    muted: '#94a3b8',
  },
  accent: designTokens.colors.primary[500],
};

// Component-specific themes
export const componentThemes = {
  // Enhanced KPI cards with brand personality
  kpiCard: {
    background: designTokens.gradients.glass,
    border: designTokens.glass.border,
    shadow: designTokens.shadows.glow,
    hover: {
      shadow: designTokens.shadows.lg,
      transform: 'translateY(-2px)',
    },
  },

  // Modern glassmorphic cards
  glassCard: {
    background: designTokens.glass.light,
    border: designTokens.glass.border,
    backdropFilter: designTokens.glass.blur,
  },

  // Sophisticated buttons
  button: {
    primary: {
      background: designTokens.gradients.primary,
      hover: {
        background: designTokens.gradients.ocean,
        transform: 'scale(1.02)',
      },
    },
    secondary: {
      background: designTokens.glass.light,
      border: designTokens.glass.border,
      hover: {
        background: designTokens.glass.medium,
      },
    },
  },

  // Enhanced tables
  table: {
    header: {
      background: designTokens.glass.heavy,
      border: designTokens.glass.border,
    },
    row: {
      hover: {
        background: designTokens.glass.light,
      },
      border: designTokens.glass.border,
    },
  },
};

export default designTokens;