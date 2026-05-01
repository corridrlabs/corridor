import React, { useMemo } from 'react';

interface GlobalLoaderProps {
    message?: string;
}

const DEFAULT_MESSAGES = [
    "joining the dots",
    "fueling the rocket",
    "balancing the ledgers",
    "optimizing your flow",
    "syncing with the future",
    "making magic happen",
    "crunching the numbers",
    "simplifying finance"
];

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message }) => {
    const displayMessage = useMemo(() => {
        if (message) return message;
        return DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];
    }, [message]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="relative w-32 h-32 mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Central Node */}
                    <circle cx="50" cy="50" r="4" className="fill-blue-600 animate-pulse" />

                    {/* Surrounding Nodes */}
                    {[
                        { x: 20, y: 20 }, { x: 80, y: 20 },
                        { x: 20, y: 80 }, { x: 80, y: 80 },
                        { x: 50, y: 15 }, { x: 50, y: 85 }
                    ].map((pos, i) => (
                        <React.Fragment key={i}>
                            <circle cx={pos.x} cy={pos.y} r="3" className="fill-slate-400 opacity-40" />
                            <line
                                x1="50" y1="50" x2={pos.x} y2={pos.y}
                                className="stroke-blue-400/30 stroke-[0.5]"
                                strokeDasharray="4 4"
                            >
                                <animate
                                    attributeName="stroke-dashoffset"
                                    from="20" to="0"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                            </line>
                        </React.Fragment>
                    ))}
                </svg>

                {/* Connection Pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-2 border-blue-500/20 rounded-full animate-ping" />
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold text-slate-900 tracking-tight">{displayMessage}</span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
};
