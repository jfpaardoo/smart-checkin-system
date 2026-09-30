import { useEffect, useCallback, useRef } from 'react';

export const useScreenWakeLock = () => {
    const wakeLockRef = useRef(null);

    const requestWakeLock = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.debug('[QRGenerator] Screen Wake Lock activo');
            }
        } catch (err) {
            console.debug('[QRGenerator] Wake Lock no disponible:', err);
        }
    }, []);

    useEffect(() => {
        void requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => {});
            }
        };
    }, [requestWakeLock]);

    return { requestWakeLock };
};
