import { useEffect } from 'react';

export const usePresenterShortcuts = ({ onToggleFullscreen, onRefreshToken, isFullscreen, onExitFullscreen }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                onToggleFullscreen();
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                onRefreshToken(true);
            } else if (e.key === 'Escape' && isFullscreen) {
                onExitFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggleFullscreen, onRefreshToken, isFullscreen, onExitFullscreen]);
};
