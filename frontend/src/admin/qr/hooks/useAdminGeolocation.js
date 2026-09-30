import { useState, useEffect } from 'react';

export const useAdminGeolocation = () => {
    const [adminCoords, setAdminCoords] = useState(null);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !("geolocation" in navigator)) return;

        const getPos = (highAccuracy, timeoutMs, maxAge) => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: highAccuracy,
                    timeout: timeoutMs,
                    maximumAge: maxAge
                });
            });
        };

        const locate = async () => {
            const tiers = [
                { high: true, timeout: 4000, maxAge: 15000 },
                { high: false, timeout: 6000, maxAge: 60000 },
                { high: false, timeout: 8000, maxAge: 600000 }
            ];
            for (const tier of tiers) {
                try {
                    const pos = await getPos(tier.high, tier.timeout, tier.maxAge);
                    setAdminCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    return;
                } catch (error_) {
                    console.debug("Admin GPS tier deferred:", error_);
                }
            }
        };

        locate();
    }, []);

    return adminCoords;
};
