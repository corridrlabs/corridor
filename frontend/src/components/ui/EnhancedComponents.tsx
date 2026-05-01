import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { designTokens, darkTheme, lightTheme, componentThemes } from '../../styles/designSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { clsx } from 'clsx';

interface EnhancedKPICardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
    icon?: LucideIcon;
    iconColor?: string;
    variant?: 'default' | 'gradient' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    iconColor = 'text-primary-500',
    variant = 'default',
    size = 'md',
    loading = false,
}) => {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;

    const sizeClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const valueSizeClasses = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl',
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'gradient':
                return {
                    background: designTokens.gradients.ocean,
                    border: 'none',
                    shadow: designTokens.shadows.glow,
                };
            case 'glass':
                return {
                    background: componentThemes.glassCard.background,
                    border: componentThemes.glassCard.border,
                    backdropFilter: componentThemes.glassCard.backdropFilter,
                };
            default:
                return {
                    background: theme.background.card,
                    border: theme.background.border,
                    shadow: designTokens.shadows.md,
                };
        }
    };

    if (loading) {
        return (
            <div className={clsx(
                'rounded-2xl p-6 animate-pulse',
                sizeClasses[size]
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    {Icon && <div className="w-8 h-8 bg-gray-200 rounded-full" />}
                </div>
                <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
        );
    }

    const variantStyles = getVariantStyles();

    return (
        <div
            className={clsx(
                'rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                sizeClasses[size]
            )}
            style={{
                background: variantStyles.background,
                border: variantStyles.border ? `1px solid ${variantStyles.border}` : 'none',
                boxShadow: variantStyles.shadow,
                backdropFilter: variantStyles.backdropFilter,
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <span className={clsx(
                        'text-sm font-medium uppercase tracking-wide',
                        'text-gray-600 dark:text-gray-400'
                    )}>
                        {title}
                    </span>
                    {change && (
                        <div className={clsx(
                            'flex items-center gap-1 text-sm font-medium mt-1',
                            changeType === 'increase' && 'text-success-600 dark:text-success-400',
                            changeType === 'decrease' && 'text-error-600 dark:text-error-400',
                            changeType === 'neutral' && 'text-gray-600 dark:text-gray-400'
                        )}>
                            {changeType === 'increase' && '↑'}
                            {changeType === 'decrease' && '↓'}
                            {change}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={clsx('p-2 rounded-xl', iconColor)}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            
            <div className={clsx(
                'font-bold mb-2',
                valueSizeClasses[size],
                variant === 'gradient' 
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent'
                    : 'text-gray-900 dark:text-gray-100'
            )}>
                {value}
            </div>
        </div>
    );
};

interface ModernCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'gradient' | 'elevated';
    hover?: boolean;
    padding?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const ModernCard: React.FC<ModernCardProps> = ({
    children,
    className,
    variant = 'default',
    hover = true,
    padding = 'md',
    onClick,
    style,
}) => {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;

    const paddingClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'glass':
                return {
                    background: componentThemes.glassCard.background,
                    border: componentThemes.glassCard.border,
                    backdropFilter: componentThemes.glassCard.backdropFilter,
                };
            case 'gradient':
                return {
                    background: designTokens.gradients.midnight,
                    border: 'none',
                };
            case 'elevated':
                return {
                    background: theme.background.card,
                    border: theme.background.border,
                    shadow: designTokens.shadows.lg,
                };
            default:
                return {
                    background: theme.background.card,
                    border: theme.background.border,
                    shadow: designTokens.shadows.md,
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <div
            className={clsx(
                'rounded-2xl transition-all duration-300',
                paddingClasses[padding],
                hover && 'hover:scale-[1.02] hover:shadow-xl',
                onClick && 'cursor-pointer',
                className
            )}
            style={{
                ...style,
                background: variantStyles.background,
                border: variantStyles.border ? `1px solid ${variantStyles.border}` : 'none',
                boxShadow: variantStyles.shadow,
                backdropFilter: variantStyles.backdropFilter,
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

interface GlassButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: LucideIcon;
    onClick?: () => void;
    className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    onClick,
    className,
}) => {
    const { isDark } = useTheme();

    const sizeClasses = {
        sm: 'px-4 py-2.5 text-sm',
        md: 'px-7 py-3.5 text-base',
        lg: 'px-9 py-4.5 text-lg',
    };

    const getVariantStyles = () => {
        const baseGlassStyles = {
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
                0 8px 32px 0 rgba(31, 38, 135, 0.07),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15)
            `,
        };

        switch (variant) {
            case 'primary':
                return {
                    ...baseGlassStyles,
                    background: `
                        linear-gradient(
                            135deg,
                            ${designTokens.gradients.primary.split(', ')[0]},
                            ${designTokens.gradients.primary.split(', ')[1]}
                        ),
                        radial-gradient(
                            100% 100% at 0% 0%,
                            rgba(255, 255, 255, 0.3) 0%,
                            rgba(255, 255, 255, 0.05) 100%
                        )
                    `,
                    color: 'white',
                    hoverTransform: 'scale(1.02)',
                    hoverGlow: `
                        0 0 20px rgba(59, 130, 246, 0.4),
                        0 8px 32px rgba(31, 38, 135, 0.15)
                    `,
                };
            case 'secondary':
                return {
                    ...baseGlassStyles,
                    background: `
                        rgba(255, 255, 255, 0.08),
                        radial-gradient(
                            100% 100% at 0% 0%,
                            rgba(255, 255, 255, 0.15) 0%,
                            rgba(255, 255, 255, 0.02) 100%
                        )
                    `,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: designTokens.colors.primary[300],
                    hoverTransform: 'scale(1.02)',
                    hoverGlow: '0 0 20px rgba(255, 255, 255, 0.1)',
                };
            case 'glass':
                return {
                    ...baseGlassStyles,
                    background: `
                        linear-gradient(
                            135deg,
                            rgba(255, 255, 255, 0.1) 0%,
                            rgba(255, 255, 255, 0.05) 100%
                        ),
                        radial-gradient(
                            100% 100% at 0% 0%,
                            rgba(255, 255, 255, 0.2) 0%,
                            rgba(255, 255, 255, 0.01) 100%
                        )
                    `,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: designTokens.colors.primary[200],
                    hoverTransform: 'scale(1.02)',
                    hoverGlow: `
                        0 0 25px rgba(255, 255, 255, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `,
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <button
            className={clsx(
                'relative rounded-2xl font-semibold transition-all duration-500 ease-out',
                'hover:scale-[1.02] active:scale-[0.98]',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
                'group overflow-hidden',
                sizeClasses[size],
                className
            )}
            style={{
                background: variantStyles.background,
                border: variantStyles.border,
                color: variantStyles.color || 'white',
                backdropFilter: variantStyles.backdropFilter,
                WebkitBackdropFilter: variantStyles.backdropFilter,
                boxShadow: variantStyles.boxShadow,
                transform: 'translateZ(0)', // Enable hardware acceleration
            }}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {/* Animated background shine effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                    background: `
                        linear-gradient(
                            90deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.1) 50%,
                            transparent 100%
                        )
                    `,
                    transform: 'translateX(-100%)',
                    animation: 'shimmer 2s infinite',
                }}
            />
            
            {/* Glass reflection effect */}
            <div
                className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                    boxShadow: '0 1px 2px rgba(255, 255, 255, 0.1)',
                }}
            />
            
            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                    <div className="relative">
                        <div className="w-6 h-6 border-2 border-white/20 rounded-full" />
                        <div className="absolute top-0 left-0 w-6 h-6 border-2 border-t-white border-transparent rounded-full animate-spin" />
                    </div>
                </div>
            )}
            
            <div className={clsx(
                'relative flex items-center justify-center gap-3 transition-all duration-300',
                loading && 'opacity-0'
            )}>
                {Icon && (
                    <Icon className={clsx(
                        "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                        variant === 'primary' && 'text-white/90',
                        variant === 'secondary' && 'text-primary-300/90',
                        variant === 'glass' && 'text-primary-200/90'
                    )} />
                )}
                <span className="relative">
                    {children}
                    {/* Text underline effect on hover */}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full" />
                </span>
            </div>
        </button>
    );
};

// Inline Loader Components for different use cases
interface InlineLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({ 
    size = 'md', 
    text, 
    className = '' 
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
            {text && <span className="text-sm text-gray-600">{text}</span>}
        </div>
    );
};

// Table Row Loader for partial updates
export const TableRowLoader: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
    <div className="space-y-2">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
            </div>
        ))}
    </div>
);

// Button Loader for action buttons
interface ButtonLoaderProps {
    is_loading: boolean;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
    is_loading,
    children,
    disabled,
    className = ''
}) => (
    <button 
        disabled={disabled || is_loading}
        className={`
            relative inline-flex items-center justify-center gap-2 px-4 py-2 
            bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${className}
        `}
    >
        {is_loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span className={is_loading ? 'opacity-70' : ''}>{children}</span>
    </button>
);

// Progress Loader for operations with known duration
export const ProgressLoader: React.FC<{
    progress: number;
    text?: string;
    className?: string;
}> = ({ progress, text, className = '' }) => (
    <div className={`w-full space-y-2 ${className}`}>
        {text && <div className="text-sm text-gray-600 text-center">{text}</div>}
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
        <div className="text-xs text-gray-500 text-center">{Math.round(progress)}%</div>
    </div>
);