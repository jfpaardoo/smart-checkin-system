import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation, Link } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import api from '../../services/api';
import GlassDropdown from '../../components/GlassDropdown';
import SecureCaptureShield from '../../components/SecureCaptureShield';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faSun, faExpand, faTimes, faShieldHalved, faLock, faArrowRight, faFileCircleCheck, faCopy, faCheck, faWifi, faLightbulb } from '@fortawesome/free-solid-svg-icons';

const getFormationDropdownLabel = (f) => {
    const closed = Boolean(f.isClosed) || f.status === 'CLOSED';
    if (closed) {
        return `${f.name} (Finalizada)`;
    }
    if (f.status === 'DRAFT') {
        return `${f.name} (Borrador)`;
    }
    return f.name;
};

const QRDisplayArea = ({ isFormationClosed, selectedFormationId, fadeStyle, qrPayload, onDoubleClick, t }) => {
    if (isFormationClosed) {
        return (
            <div className="w-[280px] h-[280px] rounded-3xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <FontAwesomeIcon icon={faLock} className="text-2xl" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-1.5">
                    Finalizada y Cerrada
                </span>
                <p className="mb-0 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Código QR no disponible
                </p>
                <p className="mb-0 text-[11px] mt-1 text-slate-500 dark:text-slate-400 leading-snug">
                    Esta formación ha concluido. Por seguridad, no se emiten nuevos códigos.
                </p>
            </div>
        );
    }

    if (selectedFormationId) {
        return (
            <SecureCaptureShield
                className="rounded-2xl"
                overlayMessage="Contenido Protegido contra Capturas"
                overlaySubmessage="El código QR y el PIN se ocultan automáticamente para evitar su difusión no autorizada."
            >
                <div 
                    style={fadeStyle} 
                    onDoubleClick={onDoubleClick}
                    className="relative bg-white p-3 sm:p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] flex items-center justify-center border border-slate-100 da-protected-screen overflow-hidden cursor-pointer group w-full max-w-[260px] aspect-square mx-auto"
                    title="Doble clic para alternar pantalla completa (Tecla F)"
                >
                    {/* Marca de agua forense sutil contra capturas con cámaras físicas */}
                    <div 
                        className="absolute inset-0 pointer-events-none flex items-center justify-center select-none z-10"
                        style={{ opacity: 0.05, transform: 'rotate(-25deg)' }}
                        aria-hidden="true"
                    >
                        <span className="text-[12px] font-mono font-black tracking-widest text-slate-900 whitespace-nowrap">
                            {`SESSION #${selectedFormationId} · SMART-CHECKIN VERIFIED`}
                        </span>
                    </div>

                    <QRCodeCanvas 
                        value={qrPayload} 
                        size={260} 
                        style={{ width: '100%', height: '100%', maxWidth: '260px', maxHeight: '260px', display: 'block' }}
                        level="M" 
                        marginSize={1}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                    />
                </div>
            </SecureCaptureShield>
        );
    }

    return (
        <div className="w-full max-w-[260px] aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600/70 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-white/40 dark:bg-slate-800/30 backdrop-blur-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faQrcode} className="text-[#73841e] dark:text-[#d4e84a] text-xl" />
            </div>
            <p className="mb-0 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{t('qr.selectFormationPrompt', 'Selecciona una formación')}</p>
            <p className="mb-0 text-[11px] mt-1 text-slate-500 dark:text-slate-400">{t('qr.selectFormationPrompt2', 'para generar el código QR dinámico')}</p>
        </div>
    );
};

const useScreenWakeLock = () => {
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
        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
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

const useAdminGeolocation = () => {
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

const createQrPayload = (token, formationId, adminCoords) => {
    const payload = { 
        token, 
        action: "formation" 
    };
    if (formationId) {
        payload.formationId = formationId;
    }
    if (adminCoords) {
        payload.adminLat = adminCoords.lat;
        payload.adminLng = adminCoords.lng;
    }
    return JSON.stringify(payload);
};

const PINDisplaySection = ({
    isFormationClosed,
    selectedFormationId,
    totpToken,
    progress,
    isEnding,
    fadeStyle,
    securityText
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPin = async () => {
        if (!totpToken) return;
        try {
            await navigator.clipboard.writeText(totpToken);
            setCopied(true);
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([40, 60, 40]);
            }
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.warn('Error al copiar PIN:', err);
        }
    };

    if (isFormationClosed) {
        return (
            <div className="w-full text-center md:text-left mt-2 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/30 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                    Las actas de esta formación están cerradas y certificadas. Puedes consultar su historial o descargar la hoja oficial FOR 99.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                        to={`/formations/${selectedFormationId}`}
                        className="da-btn-secondary px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 no-underline hover:scale-105 active:scale-95 transition-all text-center flex-1"
                    >
                        <span>Ver Formación</span>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                    <a
                        href={`/api/v1/exports/formations/${selectedFormationId}/official-sheet`}
                        className="da-btn-excel px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 no-underline hover:scale-105 active:scale-95 transition-all text-white text-center flex-1"
                        download
                    >
                        <FontAwesomeIcon icon={faFileCircleCheck} />
                        <span>Acta FOR 99</span>
                    </a>
                </div>
            </div>
        );
    }

    if (!selectedFormationId) return null;

    return (
        <div className="w-full text-center md:text-left mt-2">
            <div className="mb-3 flex items-center justify-center md:justify-start gap-2 max-w-full flex-wrap">
                <SecureCaptureShield
                    compact={true}
                    className="rounded-2xl inline-block"
                    overlayMessage="PIN Protegido"
                    overlaySubmessage="Oculto contra capturas"
                >
                    <span 
                        className="token-display inline-block da-protected-screen" 
                        style={{ 
                            fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', 
                            padding: '4px 14px',
                            letterSpacing: 'clamp(0.1em, 1.8vw, 0.3em)',
                            ...fadeStyle
                        }}
                    >
                        {totpToken}
                    </span>
                </SecureCaptureShield>
                <button
                    type="button"
                    onClick={handleCopyPin}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 ${
                        copied
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-105'
                            : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95'
                    }`}
                    title={copied ? '¡PIN copiado al portapapeles!' : 'Copiar PIN de 6 dígitos'}
                    aria-label="Copiar PIN"
                >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                    <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
            </div>

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
                {securityText}
            </p>
        </div>
    );
};

const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

const usePresenterShortcuts = ({ onToggleFullscreen, onRefreshToken, isFullscreen, onExitFullscreen }) => {
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

const AdminControlsBadges = ({
    isOnline,
    adminCoords,
    selectedFormationId,
    isFormationClosed,
    onToggleFullscreen,
    t
}) => (
    <div className="mt-3 text-center w-full flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-xs">
                <FontAwesomeIcon icon={faShieldHalved} className="text-indigo-500" />
                <span>Blindaje Anti-Captura</span>
            </div>

            <div 
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs transition-colors duration-300 ${
                    isOnline 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
                title={isOnline ? 'Conexión activa y sincronizada en tiempo real' : 'Modo local: El código QR continúa rotando de forma autónoma con el reloj interno'}
            >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <FontAwesomeIcon icon={faWifi} className="text-[10px]" />
                <span>{isOnline ? 'En Vivo' : 'Modo Local'}</span>
            </div>
        </div>

        {adminCoords ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs max-w-full text-center">
                <span className="w-2 h-2 rounded-full inline-block bg-emerald-500 shrink-0"></span>
                <span className="truncate">GPS del Administrador Vinculado</span>
            </div>
        ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-xs max-w-full text-center">
                <span className="w-2 h-2 rounded-full inline-block bg-amber-500 animate-ping shrink-0"></span>
                <span className="truncate">Obteniendo GPS del Administrador...</span>
            </div>
        )}

        {Boolean(selectedFormationId && !isFormationClosed) && (
            <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#b3c34c] hover:bg-[#c4d650] active:scale-95 transition-all shadow-md mt-1 cursor-pointer border border-white/60"
                title="Alternar pantalla completa (Atajo: F)"
            >
                <FontAwesomeIcon icon={faSun} className="text-amber-700" />
                <span>{t('qr.maxBrightnessBtn', 'Modo Brillo Máximo')}</span>
                <FontAwesomeIcon icon={faExpand} className="text-xs opacity-75" />
            </button>
        )}
    </div>
);

const FullscreenModal = ({
    isOpen,
    formationName,
    onClose,
    fadeStyle,
    qrPayload,
    totpToken,
    progress,
    isEnding,
    selectedFormationId,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col items-center justify-center p-3 sm:p-6 overscroll-none touch-none select-none text-slate-100 animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: '#090d16' }}
        >
            <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-2.5 sm:gap-3.5 my-auto">
                <div className="w-full flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-200 truncate">
                            {formationName || t('qr.title')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer border border-slate-700 shrink-0"
                        title="Cerrar pantalla completa (Tecla Esc o F)"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-base" />
                    </button>
                </div>

                <SecureCaptureShield
                    className="w-full max-w-[250px] sm:max-w-[300px] aspect-square rounded-3xl"
                    overlayMessage="Captura Bloqueada"
                    overlaySubmessage="El código QR y PIN dinámico están protegidos contra capturas y recortes."
                >
                    <div 
                        className="relative flex flex-col items-center justify-center w-full h-full p-3 sm:p-4 rounded-3xl shadow-[0_16px_45px_rgba(0,0,0,0.6)] da-protected-screen overflow-hidden"
                        style={{ backgroundColor: '#FFFFFF' }}
                    >
                        <div 
                            className="absolute inset-0 pointer-events-none flex items-center justify-center select-none z-10"
                            style={{ opacity: 0.05, transform: 'rotate(-25deg)' }}
                            aria-hidden="true"
                        >
                            <span className="text-[13px] font-mono font-black tracking-widest text-slate-900 whitespace-nowrap">
                                {`SESSION #${selectedFormationId} · SMART-CHECKIN VERIFIED`}
                            </span>
                        </div>

                        <div style={fadeStyle} className="w-full h-full flex items-center justify-center">
                            <QRCodeCanvas 
                                value={qrPayload} 
                                size={280} 
                                style={{ width: '100%', height: '100%', maxWidth: '270px', maxHeight: '270px' }}
                                level="M" 
                                marginSize={1}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                            />
                        </div>
                    </div>
                </SecureCaptureShield>

                <div className="w-full max-w-[250px] sm:max-w-[300px] flex flex-col items-center gap-1">
                    <SecureCaptureShield
                        compact={true}
                        className="rounded-2xl"
                        overlayMessage="PIN Oculto"
                        overlaySubmessage="Protegido contra capturas"
                    >
                        <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-widest font-mono da-protected-screen drop-shadow-md">
                            {totpToken}
                        </div>
                    </SecureCaptureShield>

                    {/* Barra de progreso de caducidad */}
                    <div className="w-full rounded-full overflow-hidden bg-slate-800 h-2 mt-0.5">
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
                    <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mb-0 text-center">
                        {t('qr.totpSecurity')}
                    </p>

                    <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[10px] sm:text-[11px] font-medium leading-tight text-center">
                        <FontAwesomeIcon icon={faLightbulb} className="text-amber-400 text-xs shrink-0" />
                        <span>Presiona <kbd className="font-mono font-bold bg-slate-700 text-slate-200 px-1 rounded border border-slate-600 text-[9px] sm:text-[10px]">F</kbd> o <kbd className="font-mono font-bold bg-slate-700 text-slate-200 px-1 rounded border border-slate-600 text-[9px] sm:text-[10px]">Esc</kbd> para salir · <kbd className="font-mono font-bold bg-slate-700 text-slate-200 px-1 rounded border border-slate-600 text-[9px] sm:text-[10px]">Espacio</kbd> para regenerar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const [wsTick, setWsTick] = useState(0);

    const isOnline = useNetworkStatus();
    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);
    const adminCoords = useAdminGeolocation();
    const { requestWakeLock } = useScreenWakeLock();

    const selectedFormation = formations.find(f => f.id === selectedFormationId);
    const isFormationClosed = selectedFormation && (Boolean(selectedFormation.isClosed) || selectedFormation.status === 'CLOSED');

    const [isRefreshingFeedback, setIsRefreshingFeedback] = useState(false);

    const fetchCurrentToken = useCallback(async (force = false) => {
        if (isFormationClosed) {
            setTotpToken(null);
            setLoading(false);
            return;
        }

        try {
            if (force) {
                setIsRefreshingFeedback(true);
            }
            let url = selectedFormationId
                ? `/totp/current?formationId=${selectedFormationId}`
                : '/totp/current';

            if (force) {
                url += (url.includes('?') ? '&' : '?') + 'force=true';
            }

            if (adminCoords) {
                const sep = url.includes('?') ? '&' : '?';
                url += `${sep}lat=${adminCoords.lat}&lng=${adminCoords.lng}`;
            }

            const res = await api.get(url);
            setTotpToken(res.data.token);
            if (force) {
                setProgress(100);
                setTimeout(() => setIsRefreshingFeedback(false), 400);
            }
        } catch (error) {
            console.error("Error fetching TOTP token:", error);
            setTotpToken(null);
            setIsRefreshingFeedback(false);
        } finally {
            setLoading(false);
        }
    }, [selectedFormationId, adminCoords, isFormationClosed]);

    useEffect(() => {
        fetchCurrentToken();
    }, [fetchCurrentToken, wsTick]);

    const lastBucketRef = useRef(Math.floor(Date.now() / 20000));

    useEffect(() => {
        if (isFormationClosed) return;

        const calculateProgress = () => {
            const now = Date.now();
            const currentBucket = Math.floor(now / 20000);
            const remainingMs = 20000 - (now % 20000);
            setProgress((remainingMs / 20000) * 100);

            if (currentBucket !== lastBucketRef.current) {
                lastBucketRef.current = currentBucket;
                fetchCurrentToken();
            }
        };
        
        calculateProgress();
        const interval = setInterval(calculateProgress, 100);
        return () => clearInterval(interval);
    }, [fetchCurrentToken, isFormationClosed]);

    useSubscription('/topic/totp', () => {
        setWsTick(prev => prev + 1);
    });

    const qrPayload = createQrPayload(totpToken, selectedFormationId, adminCoords);

    const isEnding = progress <= (3 / 20) * 100;
    const qrOpacity = isEnding ? Math.max(0.2, progress / ((3 / 20) * 100)) : 1;
    const fadeStyle = {
        opacity: isRefreshingFeedback ? 0.35 : qrOpacity,
        transform: isRefreshingFeedback ? 'scale(0.95)' : 'scale(1)',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
    };

    const toggleFullscreenBrightness = useCallback(async () => {
        setIsMaxBrightnessFullscreen(prev => {
            const nextState = !prev;
            if (nextState) {
                requestWakeLock();
                if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else if (typeof document !== 'undefined' && document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            return nextState;
        });
    }, [requestWakeLock]);

    usePresenterShortcuts({
        onToggleFullscreen: toggleFullscreenBrightness,
        onRefreshToken: fetchCurrentToken,
        isFullscreen: isMaxBrightnessFullscreen,
        onExitFullscreen: () => setIsMaxBrightnessFullscreen(false)
    });

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-6 min-h-[calc(100vh-140px)]">
            <div className="w-full max-w-full rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] p-3 sm:p-6 md:p-8 my-auto box-border">
                <div className="w-full">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2 w-full">
                            <div className="flex flex-col items-center">
                                <QRDisplayArea
                                    isFormationClosed={isFormationClosed}
                                    selectedFormationId={selectedFormationId}
                                    fadeStyle={fadeStyle}
                                    qrPayload={qrPayload}
                                    onDoubleClick={toggleFullscreenBrightness}
                                    t={t}
                                />
                                
                                <AdminControlsBadges
                                    isOnline={isOnline}
                                    adminCoords={adminCoords}
                                    selectedFormationId={selectedFormationId}
                                    isFormationClosed={isFormationClosed}
                                    onToggleFullscreen={toggleFullscreenBrightness}
                                    t={t}
                                />
                            </div>

                            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm w-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#b3c34c]/20 text-[#54620e] dark:text-[#d4e84a] border border-[#b3c34c]/40 mb-3 shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-[#73841e] dark:bg-[#d4e84a] animate-pulse"></span>
                                    <span>{t('qr.autoUpdateBadge', 'Actualización automática')}</span>
                                </div>

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
                                            options={formations.map(f => ({
                                                value: f.id,
                                                label: getFormationDropdownLabel(f)
                                            }))}
                                            value={selectedFormationId || ''}
                                            onChange={(val) => {
                                                setSelectedFormationId(val ? Number.parseInt(val, 10) : null);
                                            }}
                                            placeholder={t('qr.selectFormationPlaceholder')}
                                            floating={true}
                                        />
                                    </div>
                                </div>

                                <PINDisplaySection
                                    isFormationClosed={isFormationClosed}
                                    selectedFormationId={selectedFormationId}
                                    totpToken={totpToken}
                                    progress={progress}
                                    isEnding={isEnding}
                                    fadeStyle={fadeStyle}
                                    securityText={t('qr.totpSecurity')}
                                />

                                {Boolean(selectedFormationId && !isFormationClosed) && (
                                    <div className="w-full mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-center md:justify-start gap-1 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Atajos:</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">F</kbd>
                                        <span>Proyector</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Espacio</kbd>
                                        <span>Refrescar</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Esc</kbd>
                                        <span>Salir</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FullscreenModal
                isOpen={Boolean(isMaxBrightnessFullscreen && selectedFormationId && !isFormationClosed)}
                formationName={formations.find(f => f.id === selectedFormationId)?.name}
                onClose={toggleFullscreenBrightness}
                fadeStyle={fadeStyle}
                qrPayload={qrPayload}
                totpToken={totpToken}
                progress={progress}
                isEnding={isEnding}
                selectedFormationId={selectedFormationId}
                t={t}
            />
        </div>
    );
};

export default QRGeneratorAdmin;