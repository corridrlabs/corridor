import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { X, Minimize2, Square } from 'lucide-react';

interface WindowProps {
    id: string;
    title: string;
    emoji?: string;
    children: ReactNode;
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onBringToFront?: () => void;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    onPositionChange?: (position: { x: number; y: number }) => void;
    onSizeChange?: (size: { width: number; height: number }) => void;
    scrollable?: boolean;
    draggable?: boolean;
    resizable?: boolean;
}

export const Window: React.FC<WindowProps> = ({
    id,
    title,
    children,
    emoji,
    onClose,
    onMinimize,
    onMaximize,
    onBringToFront,
    isOpen,
    isMinimized,
    isMaximized,
    position,
    size,
    zIndex,
    onPositionChange,
    onSizeChange,
    scrollable = false,
    draggable = true,
    resizable = true
}) => {
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    if (!isOpen) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!draggable || isMaximized) return;

        onBringToFront?.();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (!resizable || isMaximized) return;

        e.stopPropagation();
        onBringToFront?.();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragStart.x;
                const newY = e.clientY - dragStart.y;
                onPositionChange?.({ x: newX, y: newY });
            }

            if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                const newWidth = Math.max(400, resizeStart.width + deltaX);
                const newHeight = Math.max(300, resizeStart.height + deltaY);
                onSizeChange?.({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, resizeStart, onPositionChange, onSizeChange]);

    const windowStyle: React.CSSProperties = isMaximized
        ? {
            position: 'fixed',
            top: '60px',
            left: '16px',
            right: '16px',
            bottom: '16px',
            width: 'auto',
            height: 'auto',
            zIndex
        }
        : {
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: isMinimized ? 'auto' : `${size.height}px`,
            zIndex
        };

    return (
        <div
            ref={windowRef}
            className={`bg-white rounded-lg shadow-2xl border border-gray-400 overflow-hidden ${isMinimized ? 'h-auto' : ''
                }`}
            style={windowStyle}
            onMouseDown={() => onBringToFront?.()}
        >
            {/* Title Bar */}
            <div
                className="bg-gradient-to-b from-gray-200 to-gray-300 border-b border-gray-400 px-4 py-2 flex items-center justify-between cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center group"
                            title="Close (Cmd+W)"
                        >
                            <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMinimize?.();
                            }}
                            className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors flex items-center justify-center group"
                            title="Minimize (Cmd+M)"
                        >
                            <Minimize2 className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMaximize?.();
                            }}
                            className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center group"
                            title="Maximize (Cmd+F)"
                        >
                            <Square className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-700 ml-2">{title}</span>
                </div>
            </div>

            {/* Content */}
            <div
                className={scrollable ? 'overflow-y-auto' : ''}
                style={{
                    maxHeight: isMaximized ? 'calc(100vh - 120px)' : `${size.height - 40}px`,
                    display: isMinimized ? 'none' : 'block'
                }}
            >
                {children}
            </div>

            {/* Resize Handle */}
            {!isMinimized && !isMaximized && resizable && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={handleResizeMouseDown}
                    style={{
                        background: 'linear-gradient(135deg, transparent 50%, #9ca3af 50%)'
                    }}
                />
            )}
        </div>
    );
};
