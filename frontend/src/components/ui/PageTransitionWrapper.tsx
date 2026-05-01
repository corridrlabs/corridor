import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransitionWrapper = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

    useEffect(() => {
        setTransitionStage('fadeOut');

        // Keep route changes smooth without blocking the interface with a full-screen loader.
        const raf = requestAnimationFrame(() => {
            setTransitionStage('fadeIn');
        });

        return () => cancelAnimationFrame(raf);
    }, [location.pathname]);

    return (
        <div
            className={`${transitionStage === 'fadeOut' ? 'opacity-95' : 'opacity-100'} transition-opacity duration-200`}
        >
            {children}
        </div>
    );
};
