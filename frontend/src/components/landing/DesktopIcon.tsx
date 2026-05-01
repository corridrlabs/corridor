import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface DesktopIconProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    selected?: boolean;
    initialPosition?: { x: number; y: number };
    onPositionChange?: (position: { x: number; y: number }) => void;
    emoji?: string;
    colorScheme?: 'blue' | 'orange' | 'purple' | 'green' | 'pink' | 'yellow';
    iconImage?: string; // Path to custom icon image
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
    icon: Icon,
    label,
    onClick,
    selected,
    initialPosition = { x: 0, y: 0 },
    onPositionChange,
    emoji,
    iconImage
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const iconRef = useRef<HTMLButtonElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking to open
        if (e.detail === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleDoubleClick = () => {
        onClick();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragStart.x;
                const newY = e.clientY - dragStart.y;
                const newPosition = { x: newX, y: newY };
                setPosition(newPosition);
                onPositionChange?.(newPosition);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart, onPositionChange]);

    return (
        <button
            ref={iconRef}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-all cursor-move ${selected ? 'bg-blue-200/30' : 'hover:bg-black/5'
                }`}
            style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                userSelect: 'none'
            }}
        >
            {/* Icon - just emoji or image, no background */}
            {iconImage ? (
                <div className="w-10 h-10 flex items-center justify-center transform hover:scale-110 transition-transform">
                    <img
                        src={iconImage}
                        alt={label}
                        className="w-full h-full object-contain"
                    />
                </div>
            ) : emoji ? (
                <div
                    className="text-4xl transform hover:scale-110 transition-transform select-none"
                    style={{
                        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                    }}
                    role="img"
                    aria-label={label}
                >
                    {emoji}
                </div>
            ) : (
                <div className="w-10 h-10 flex items-center justify-center transform hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-gray-700" />
                </div>
            )}

            {/* Label */}
            <span className="text-[9px] font-medium text-gray-800 max-w-[65px] text-center leading-tight">
                {label}
            </span>
        </button>
    );
};
