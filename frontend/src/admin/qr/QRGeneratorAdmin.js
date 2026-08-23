import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import api from '../../services/api';
import GlassDropdown from '../../components/GlassDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faSun, faExpand, faTimes } from '@fortawesome/free-solid-svg-icons';

const QRGeneratorAdmin = () => {
    const { t } = useTranslation();
    const jwt = tokenService.getUser();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFormationId = queryParams.get('formationId') ? Number.parseInt(queryParams.get('formationId'), 10) : null;

    const [totpToken, setTotpToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(100);
    const [isMaxBrightnessFullscreen, setIsMaxBrightnessFullscreen] = useState(false);
    
    const [selectedFormationId, setSelectedFormationId] = useState(initialFormationId);
    
    // Rompe la clausura del WebSocket para que pida la formación correcta siempre
    const [wsTick, setWsTick] = useState(0);

    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);
    const [adminCoords, setAdminCoords] = useState(null);

    // Activar Screen Wake Lock para mantener la pantalla siempre encendida con brillo máximo sin atenuarse
    useEffect(() => {
        let wakeLockSentinel = null;

        const requestWakeLock = async () => {
            try {
                if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                    wakeLockSentinel = await navigator.wakeLock.request('screen');
                    console.debug('[QRGenerator] Screen Wake Lock activo');
                }
            } catch (err) {
                console.debug('[QRGenerator] Wake Lock no disponible:', err);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (wakeLockSentinel !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockSentinel) {
                wakeLockSentinel.release().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && "geolocation" in navigator) {
            const handleSuccess = (position) => {
                setAdminCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            };

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
                        handleSuccess(pos);
                        return;
                    } catch (error_) {
                        console.debug("Admin GPS tier deferred:", error_);
                    }
                }
            };

            locate();
        }
    }, []);

    const fetchCurrentToken = useCallback(async () => {
        try {
            let url = selectedFormationId
                ? `/totp/current?formationId=${selectedFormationId}`
                : '/totp/current';

            if (adminCoords) {
                const sep = url.includes('?') ? '&' : '?';
                url += `${sep}lat=${adminCoords.lat}&lng=${adminCoords.lng}`;
            }

            const res = await api.get(url);
            setTotpToken(res.data.token);
        } catch (error) {
            console.error("Error fetching TOTP token:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedFormationId, adminCoords]);

    // Recarga el token si cambias de formación o si el WebSocket da un toque (cada 20s)
    useEffect(() => {
        fetchCurrentToken();
    }, [fetchCurrentToken, wsTick]);

    const lastBucketRef = useRef(Math.floor(Date.now() / 20000));

    useEffect(() => {
        const calculateProgress = () => {
            const now = Date.now();
            const currentBucket = Math.floor(now / 20000);
            const remainingMs = 20000 - (now % 20000);
            setProgress((remainingMs / 20000) * 100);

            // Si el ciclo de 20s ha finalizado y comenzado uno nuevo
            if (currentBucket !== lastBucketRef.current) {
                lastBucketRef.current = currentBucket;
                fetchCurrentToken();
            }
        };
        
        calculateProgress();
        const interval = setInterval(calculateProgress, 100);
        return () => clearInterval(interval);
    }, [fetchCurrentToken]);

    // El WebSocket sincroniza además en tiempo real cuando el backend cambia de token
    useSubscription('/topic/totp', () => {
        setWsTick(prev => prev + 1);
    });

    const buildQrPayload = () => {
        const payload = { 
            token: totpToken, 
            action: "formation" 
        };
        
        if (selectedFormationId) {
            payload.formationId = selectedFormationId;
        }

        if (adminCoords) {
            payload.adminLat = adminCoords.lat;
            payload.adminLng = adminCoords.lng;
        }
        
        return JSON.stringify(payload);
    };

    const isEnding = progress <= (3 / 20) * 100;
    const qrOpacity = isEnding ? Math.max(0.2, progress / ((3 / 20) * 100)) : 1;
    const fadeStyle = {
        opacity: qrOpacity,
        transition: 'opacity 0.2s ease-out'
    };

    const toggleFullscreenBrightness = () => {
        const nextState = !isMaxBrightnessFullscreen;
        setIsMaxBrightnessFullscreen(nextState);
        if (nextState && typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (!nextState && typeof document !== 'undefined' && document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)]">
            <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] p-6 sm:p-8 md:p-10 my-auto">
                <div className="w-full">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2 w-full">
                            
                            {/* QR Presentation (Clean, high-contrast, no bulky dark borders) */}
                            <div className="flex flex-col items-center">
                                {Boolean(selectedFormationId) ? (
                                    <div 
                                        style={fadeStyle} 
                                        className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] flex items-center justify-center border border-slate-100"
                                    >
                                        <QRCodeSVG 
                                            value={buildQrPayload()} 
                                            size={260} 
                                            style={{ width: '100%', height: '100%', maxWidth: '270px', maxHeight: '270px', display: 'block' }}
                                            level="M" 
                                            marginSize={1}
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-[270px] h-[270px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600/70 flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-slate-800/30 backdrop-blur-sm">
                                        <div className="w-12 h-12 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center mx-auto mb-3">
                                            <FontAwesomeIcon icon={faQrcode} className="text-[#73841e] dark:text-[#d4e84a] text-xl" />
                                        </div>
                                        <p className="mb-0 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{t('qr.selectFormationPrompt', 'Selecciona una formación')}</p>
                                        <p className="mb-0 text-[11px] mt-1 text-slate-500 dark:text-slate-400">{t('qr.selectFormationPrompt2', 'para generar el código QR dinámico')}</p>
                                    </div>
                                )}
                                
                                <div className="mt-3 text-center w-full flex flex-col items-center gap-2">
                                    {adminCoords ? (
                                        <div 
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs"
                                        >
                                            <span className="w-2 h-2 rounded-full inline-block bg-emerald-500"></span>
                                            <span>GPS del Administrador Vinculado</span>
                                        </div>
                                    ) : (
                                        <div 
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-xs"
                                        >
                                            <span className="w-2 h-2 rounded-full inline-block bg-amber-500 animate-ping"></span>
                                            <span>Obteniendo GPS del Administrador...</span>
                                        </div>
                                    )}

                                    {Boolean(selectedFormationId) && (
                                        <button
                                            type="button"
                                            onClick={toggleFullscreenBrightness}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#b3c34c] hover:bg-[#c4d650] active:scale-95 transition-all shadow-md mt-1 cursor-pointer border border-white/60"
                                        >
                                            <FontAwesomeIcon icon={faSun} className="text-amber-700" />
                                            <span>{t('qr.maxBrightnessBtn', 'Modo Brillo Máximo')}</span>
                                            <FontAwesomeIcon icon={faExpand} className="text-xs opacity-75" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start text-center md:text-left qr-info-column w-full max-w-sm">
                                <h2 className="qr-title text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {t('qr.title')}
                                </h2>
                                <p className="qr-subtitle mb-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {t('qr.subtitle')}
                                </p>

                                <div className="w-full mb-3 text-left">
                                    <div className="mb-3">
                                        <label htmlFor="formationId" className="block mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('qr.selectFormation')}</label>
                                        <GlassDropdown
                                            options={formations.map(f => ({ value: f.id, label: f.name }))}
                                            value={selectedFormationId || ''}
                                            onChange={(val) => {
                                                setSelectedFormationId(val ? Number.parseInt(val, 10) : null);
                                            }}
                                            placeholder={t('qr.selectFormationPlaceholder')}
                                        />
                                    </div>
                                </div>

                                {Boolean(selectedFormationId) && (
                                    <div className="w-full text-center md:text-left mt-2">
                                        <div className="mb-3">
                                            <span 
                                                className="token-display inline-block" 
                                                style={{ 
                                                    fontSize: '2.2rem', 
                                                    padding: '5px 20px',
                                                    ...fadeStyle
                                                }}
                                            >
                                                {totpToken}
                                            </span>
                                        </div>

                                        {/* QR expiry countdown — Tailwind liquid glass progress */}
                                        <div className="w-full rounded-full overflow-hidden mb-3" style={{
                                            height: '6px',
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)'
                                        }}>
                                            <div
                                                style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    borderRadius: '9999px',
                                                    background: isEnding
                                                        ? 'linear-gradient(90deg, #f87171, #ef4444)'
                                                        : 'linear-gradient(90deg, #b3c34c, #cce364)',
                                                    boxShadow: isEnding
                                                        ? '0 0 10px rgba(239,68,68,0.7), 0 0 20px rgba(239,68,68,0.35)'
                                                        : '0 0 10px rgba(179,195,76,0.6), 0 0 20px rgba(204,227,100,0.3)',
                                                    transition: 'width 100ms linear, background 0.4s ease, box-shadow 0.4s ease',
                                                }}
                                            />
                                        </div>
                                        
                                        <p className="qr-footer-text mt-1 text-xs text-slate-400">
                                            {t('qr.totpSecurity')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Pantalla Completa y Brillo Máximo */}
            {Boolean(isMaxBrightnessFullscreen && selectedFormationId) && (
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between p-6 sm:p-10 select-none text-slate-900 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-full flex items-center justify-between max-w-lg">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                                {formations.find(f => f.id === selectedFormationId)?.name || t('qr.title')}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleFullscreenBrightness}
                            className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer border border-slate-300"
                            title="Cerrar pantalla completa"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                        </button>
                    </div>

                    {/* QR ultra-grande sobre fondo blanco puro y contraste absoluto */}
                    <div className="flex flex-col items-center justify-center my-auto w-full max-w-sm sm:max-w-md aspect-square p-4 bg-white rounded-3xl">
                        <div style={fadeStyle} className="w-full h-full flex items-center justify-center">
                            <QRCodeSVG 
                                value={buildQrPayload()} 
                                size={320} 
                                style={{ width: '100%', height: '100%', maxWidth: '340px', maxHeight: '340px' }}
                                level="M" 
                                marginSize={2}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                            />
                        </div>
                    </div>

                    <div className="w-full max-w-md flex flex-col items-center">
                        <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-wider mb-3">
                            {totpToken}
                        </div>

                        {/* Barra de progreso de caducidad */}
                        <div className="w-full rounded-full overflow-hidden bg-slate-200 h-2 mb-2">
                            <div
                                style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    borderRadius: '9999px',
                                    background: isEnding ? '#ef4444' : '#84cc16',
                                    transition: 'width 100ms linear, background 0.4s ease'
                                }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mb-0">
                            {t('qr.totpSecurity')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRGeneratorAdmin;