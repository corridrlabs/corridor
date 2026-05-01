import React, { useState, useRef, useEffect, Children, ReactNode, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Plus, Minus } from 'lucide-react';

interface AccordionProps {
    children: ReactNode;
    className?: string;
    allowMultiple?: boolean;
    defaultActiveKeys?: string[];
    activeKeys?: string[];
    onChange?: (activeKeys: string[]) => void;
    collapsible?: boolean;
    icon?: 'chevron' | 'plus' | 'none';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'bordered' | 'filled';
}

interface AccordionItemProps {
    children: ReactNode;
    className?: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    disabled?: boolean;
    headerClassName?: string;
    contentClassName?: string;
    eventKey?: string;
    defaultActive?: boolean;
}

interface AccordionContentProps {
    children: ReactNode;
    className?: string;
}

interface AccordionHeaderProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
    icon?: 'chevron' | 'plus' | 'none';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'bordered' | 'filled';
}

// Accordion context for managing state
interface AccordionContextType {
    activeKeys: string[];
    toggleItem: (key: string) => void;
    allowMultiple: boolean;
    icon: 'chevron' | 'plus' | 'none';
    size: 'sm' | 'md' | 'lg';
    variant: 'default' | 'bordered' | 'filled';
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

const useAccordion = () => {
    const context = React.useContext(AccordionContext);
    if (!context) {
        throw new Error('Accordion components must be used within an Accordion');
    }
    return context;
};

// Main Accordion Component
export const Accordion: React.FC<AccordionProps> = ({
    children,
    className,
    allowMultiple = false,
    defaultActiveKeys = [],
    activeKeys: controlledActiveKeys,
    onChange,
    collapsible = true,
    icon = 'chevron',
    size = 'md',
    variant = 'default',
}) => {
    const [internalActiveKeys, setInternalActiveKeys] = useState<string[]>(defaultActiveKeys);
    const isControlled = controlledActiveKeys !== undefined;
    const activeKeys = isControlled ? controlledActiveKeys : internalActiveKeys;

    const toggleItem = useCallback((key: string) => {
        let newActiveKeys: string[];

        if (activeKeys.includes(key)) {
            if (collapsible) {
                newActiveKeys = activeKeys.filter(k => k !== key);
            } else {
                newActiveKeys = activeKeys; // Can't collapse the last item
            }
        } else {
            if (allowMultiple) {
                newActiveKeys = [...activeKeys, key];
            } else {
                newActiveKeys = [key];
            }
        }

        if (isControlled && onChange) {
            onChange(newActiveKeys);
        } else if (!isControlled) {
            setInternalActiveKeys(newActiveKeys);
            if (onChange) {
                onChange(newActiveKeys);
            }
        }
    }, [activeKeys, allowMultiple, collapsible, isControlled, onChange]);

    const contextValue = {
        activeKeys,
        toggleItem,
        allowMultiple,
        icon,
        size,
        variant,
    };

    return (
        <AccordionContext.Provider value={contextValue}>
            <div className={clsx(
                "w-full",
                {
                    'space-y-2': variant === 'default',
                    'divide-y divide-gray-200': variant === 'bordered',
                    'space-y-1': variant === 'filled',
                },
                className
            )}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

// Accordion Item Component
export const AccordionItem: React.FC<AccordionItemProps> = ({
    children,
    className,
    title,
    subtitle,
    icon,
    disabled = false,
    headerClassName,
    contentClassName,
    eventKey,
    defaultActive = false,
}) => {
    const [itemKey] = useState(eventKey || `item-${Math.random().toString(36).substr(2, 9)}`);
    const { activeKeys, toggleItem, ...context } = useAccordion();
    const isActive = activeKeys.includes(itemKey);

    useEffect(() => {
        if (defaultActive && !activeKeys.includes(itemKey)) {
            toggleItem(itemKey);
        }
    }, [defaultActive, itemKey, toggleItem, activeKeys]);

    return (
        <div className={clsx(
            "overflow-hidden transition-all duration-200",
            {
                'border border-gray-200 rounded-lg': context.variant === 'default',
                'bg-gray-50 rounded-lg': context.variant === 'filled' && isActive,
                'bg-white': context.variant === 'filled' && !isActive,
            },
            className
        )}>
            <AccordionHeader
                onClick={() => !disabled && toggleItem(itemKey)}
                isActive={isActive}
                isDisabled={disabled}
                className={headerClassName}
            >
                <div className="flex-1 flex items-center gap-3">
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                    <div className="flex-1 text-left">
                        <div className={clsx(
                            "font-medium",
                            {
                                'text-sm': context.size === 'sm',
                                'text-base': context.size === 'md',
                                'text-lg': context.size === 'lg',
                                'text-gray-900': !disabled,
                                'text-gray-400': disabled,
                            }
                        )}>
                            {title}
                        </div>
                        {subtitle && (
                            <div className={clsx(
                                "mt-1",
                                {
                                    'text-xs': context.size === 'sm',
                                    'text-sm': context.size === 'md',
                                    'text-base': context.size === 'lg',
                                    'text-gray-500': !disabled,
                                    'text-gray-400': disabled,
                                }
                            )}>
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
                <div className={clsx(
                    "transition-transform duration-200",
                    {
                        'rotate-180': isActive && context.icon === 'chevron',
                        'rotate-45': isActive && context.icon === 'plus',
                    }
                )}>
                    {context.icon === 'chevron' && <ChevronDown className="w-5 h-5" />}
                    {context.icon === 'plus' && <Plus className="w-5 h-5" />}
                </div>
            </AccordionHeader>
            <AccordionContent
                className={contentClassName}
                isActive={isActive}
            >
                {children}
            </AccordionContent>
        </div>
    );
};

// Accordion Header Component
const AccordionHeader: React.FC<AccordionHeaderProps> = ({
    children,
    className,
    onClick,
    isActive,
    isDisabled,
    icon,
    size,
    variant,
}) => {
    return (
        <button
            className={clsx(
                "w-full flex items-center justify-between p-4 text-left transition-all duration-200",
                {
                    'hover:bg-gray-50': !isDisabled && variant === 'default',
                    'bg-white border-0': variant === 'default',
                    'bg-transparent border-0 px-0': variant === 'bordered',
                    'bg-gradient-to-r from-orange-50 to-orange-100': variant === 'filled' && isActive,
                    'cursor-not-allowed opacity-50': isDisabled,
                    'cursor-pointer': !isDisabled,
                    'py-3': size === 'sm',
                    'py-4': size === 'md',
                    'py-5': size === 'lg',
                },
                className
            )}
            onClick={onClick}
            disabled={isDisabled}
            aria-expanded={isActive}
            aria-disabled={isDisabled}
        >
            {children}
        </button>
    );
};

// Accordion Content Component
const AccordionContent: React.FC<AccordionContentProps & { isActive?: boolean }> = ({
    children,
    className,
    isActive = false,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(isActive ? undefined : 0);

    useEffect(() => {
        if (contentRef.current) {
            const scrollHeight = contentRef.current.scrollHeight;
            setHeight(isActive ? scrollHeight : 0);
        }
    }, [isActive, children]);

    return (
        <div
            ref={contentRef}
            className={clsx(
                "overflow-hidden transition-all duration-300 ease-in-out",
                className
            )}
            style={{ height }}
        >
            <div className="px-4 pb-4 pt-0">
                {children}
            </div>
        </div>
    );
};

// Specialized accordion variants
export const FAQAccordion: React.FC<Omit<AccordionProps, 'icon' | 'variant'>> = (props) => (
    <Accordion
        {...props}
        icon="chevron"
        variant="default"
        allowMultiple={false}
        className={clsx("max-w-3xl mx-auto", props.className)}
    />
);

export const SettingsAccordion: React.FC<Omit<AccordionProps, 'icon' | 'variant'>> = (props) => (
    <Accordion
        {...props}
        icon="chevron"
        variant="bordered"
        allowMultiple={true}
        size="md"
        className={clsx("divide-y divide-gray-200", props.className)}
    />
);

export const NavigationAccordion: React.FC<Omit<AccordionProps, 'icon' | 'variant' | 'size'>> = (props) => (
    <Accordion
        {...props}
        icon="chevron"
        variant="bordered"
        allowMultiple={true}
        size="sm"
        className={clsx("border-0 divide-y divide-gray-100", props.className)}
    />
);

// Hook for programmatic control
export const useAccordionControl = () => {
    const context = useAccordion();
    return {
        activeKeys: context.activeKeys,
        toggleItem: context.toggleItem,
        expandAll: () => {
            // This would need access to all item keys, implementation depends on use case
        },
        collapseAll: () => {
            context.activeKeys.forEach(key => {
                if (context.allowMultiple) {
                    context.toggleItem(key);
                }
            });
        },
    };
};