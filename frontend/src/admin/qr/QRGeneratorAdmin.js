import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import soundAndHaptics from '../../util/soundAndHaptics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faSun, faMoon, faExpand, faTimes, faArrowRight, faFileCircleCheck, faCopy, faCheck, faLightbulb } from '@fortawesome/free-solid-svg-icons';

const getFormationDropdownLabel = (f, t) => {
    const closed = Boolean(f.isClosed) || f.status === 'CLOSED';
    if (closed) {
        return `${f.name} ${t ? t('qr.statusClosed', '(Finalizada)') : '(Finalizada)'}`;
    }
    if (f.status === 'DRAFT') {
        return `${f.name} ${t ? t('qr.statusDraft', '(Borrador)') : '(Borrador)'}`;
    }
    return f.name;
};

const QRDisplayArea = ({ isFormationClosed, selectedFormationId, fadeStyle, qrPayload, onDoubleClick, t }) => {
    if (isFormationClosed) {
        return (
            <div className="w-[280px] h-[280px] rounded-3xl bg-slate-500/10 dark:bg-slate-500/5 border border-slate-400/30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-slate-500/15 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(100,116,139,0.15)]">
                    <FontAwesomeIcon icon={faFileCircleCheck} className="text-2xl" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 mb-1.5">
                    {t('qr.formationClosedBadge', 'Finalizada y Certificada')}
                </span>
                <p className="mb-0 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t('qr.qrNotAvailable', 'Código QR no disponible')}
                </p>
                <p className="mb-0 text-[11px] mt-1 text-slate-500 dark:text-slate-400 leading-snug">
                    {t('qr.formationConcludedNotice', 'Esta formación ha concluido. Por seguridad, no se emiten nuevos códigos.')}
                </p>
            </div>
        );
    }

    if (selectedFormationId) {
        return (
            <SecureCaptureShield
                className="rounded-3xl w-[280px] h-[280px] mx-auto shrink-0"
                overlayMessage={t('qr.captureShieldTitle', 'Contenido Protegido contra Capturas')}
                overlaySubmessage={t('qr.captureShieldDesc', 'El código QR y el PIN se ocultan automáticamente para evitar su difusión no autorizada.')}
            >
                <div 
                    style={fadeStyle} 
                    onDoubleClick={onDoubleClick}
                    className="relative bg-white p-3 sm:p-4 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] flex items-center justify-center border border-slate-100 da-protected-screen overflow-hidden cursor-pointer group w-[280px] h-[280px] mx-auto"
                    title={t('qr.fullscreenHint', 'Doble clic para alternar pantalla completa (Tecla F)')}
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
                        size={245} 
                        style={{ width: '100%', height: '100%', maxWidth: '245px', maxHeight: '245px', display: 'block' }}
                        level="M" 
                        marginSize={1}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                    />

                    {/* Barra láser de validación en vivo (Estándar dinámico anti-captura SafeTix) */}
                    <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b3c34c] to-transparent pointer-events-none z-20 shadow-[0_0_10px_#b3c34c]"
                        style={{
                            animation: 'qrLaserSweep 2.8s ease-in-out infinite alternate'
                        }}
                        aria-hidden="true"
                    />
                </div>
            </SecureCaptureShield>
        );
    }

    return (
        <div className="w-[280px] h-[280px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600/70 flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-slate-800/30 backdrop-blur-sm mx-auto shadow-xs shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center mx-auto mb-3 text-[#73841e] dark:text-[#d4e84a]">
                <FontAwesomeIcon icon={faQrcode} className="text-2xl" />
            </div>
            <p className="mb-0 text-sm font-bold text-slate-700 dark:text-slate-200">{t('qr.selectFormationPrompt', 'Selecciona una formación')}</p>
            <p className="mb-0 text-xs mt-1.5 text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">{t('qr.selectFormationPrompt2', 'para generar el código QR dinámico')}</p>
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
    securityText,
    t
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
                    {t('qr.closedNotice', 'Las actas de esta formación están cerradas y certificadas. Puedes consultar su historial o descargar la hoja oficial FOR 99.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                        to={`/formations/${selectedFormationId}`}
                        className="da-btn-secondary px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 no-underline hover:scale-105 active:scale-95 transition-all text-center flex-1"
                    >
                        <span>{t('qr.viewFormation', 'Ver Formación')}</span>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                    <a
                        href={`/api/v1/exports/formations/${selectedFormationId}/official-sheet`}
                        className="da-btn-excel px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 no-underline hover:scale-105 active:scale-95 transition-all text-white text-center flex-1"
                        download
                    >
                        <FontAwesomeIcon icon={faFileCircleCheck} />
                        <span>{t('qr.officialSheet', 'Acta FOR 99')}</span>
                    </a>
                </div>
            </div>
        );
    }

    if (!selectedFormationId) return null;

    return (
        <div className="w-full text-center md:text-left mt-2 relative z-10">
            <div className="mb-3 flex items-center justify-center md:justify-start gap-2 max-w-full flex-wrap">
                <SecureCaptureShield
                    compact={true}
                    className="rounded-2xl inline-block"
                    overlayMessage={t('qr.pinHidden', 'PIN Oculto')}
                    overlaySubmessage={t('qr.pinHiddenDesc', 'Protegido contra capturas')}
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
                    title={copied ? t('qr.pinCopiedTooltip', '¡PIN copiado al portapapeles!') : t('qr.copyPinTooltip', 'Copiar PIN de 6 dígitos')}
                    aria-label={t('qr.copyPin', 'Copiar PIN')}
                >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                    <span className="hidden sm:inline">{copied ? t('qr.pinCopied', 'Copiado') : t('qr.copy', 'Copiar')}</span>
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
    adminCoords,
    selectedFormationId,
    isFormationClosed,
    onToggleFullscreen,
    t
}) => (
    <div className="mt-3 text-center w-full flex flex-col items-center gap-2">

        {adminCoords ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs max-w-full text-center">
                <span className="w-2 h-2 rounded-full inline-block bg-emerald-500 shrink-0"></span>
                <span className="truncate">{t('qr.gpsLinked', 'GPS del Administrador Vinculado')}</span>
            </div>
        ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-xs max-w-full text-center">
                <span className="w-2 h-2 rounded-full inline-block bg-amber-500 animate-ping shrink-0"></span>
                <span className="truncate">{t('qr.gpsSearching', 'Obteniendo GPS del Administrador...')}</span>
            </div>
        )}

        {Boolean(selectedFormationId && !isFormationClosed) && (
            <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#b3c34c] hover:bg-[#c4d650] active:scale-95 transition-all shadow-md mt-1 cursor-pointer border border-white/60"
                title={t('qr.fullscreenHint', 'Alternar pantalla completa (Atajo: F)')}
            >
                <FontAwesomeIcon icon={faSun} className="text-amber-700" />
                <span>{t('qr.maxBrightnessBtn', 'Modo Brillo Máximo')}</span>
                <FontAwesomeIcon icon={faExpand} className="text-xs opacity-75" />
            </button>
        )}
    </div>
);

const useDynamicThemeColor = (isOpen, isFlashlightMode) => {
    useEffect(() => {
        if (!isOpen) return;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const originalTheme = metaTheme?.getAttribute('content') || '#1e2535';

        if (metaTheme) {
            metaTheme.setAttribute('content', isFlashlightMode ? '#ffffff' : '#090d16');
        }

        return () => {
            if (metaTheme) {
                metaTheme.setAttribute('content', originalTheme);
            }
        };
    }, [isOpen, isFlashlightMode]);
};

const FullscreenHeader = ({ formationTitle, isFlashlightMode, onToggleMode, onClose, t }) => (
    <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider truncate ${isFlashlightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                {formationTitle}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onToggleMode}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isFlashlightMode 
                        ? 'bg-slate-900 text-white border-slate-700 shadow-sm hover:bg-slate-800' 
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={isFlashlightMode ? t('qr.switchDark', 'Modo Oscuro') : t('qr.switchFlashlight', 'Modo Linterna / Blanco Total')}
            >
                <FontAwesomeIcon icon={isFlashlightMode ? faMoon : faSun} className={isFlashlightMode ? "text-amber-300" : "text-amber-400"} />
                <span className="text-[11px] font-semibold">{isFlashlightMode ? t('qr.cinemaMode', 'Cine') : t('qr.lightMode', 'Luz Máx')}</span>
            </button>

            <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-full transition-all cursor-pointer border shrink-0 ${
                    isFlashlightMode 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title={t('qr.closeFullscreen', 'Cerrar pantalla completa (Tecla Esc o F)')}
            >
                <FontAwesomeIcon icon={faTimes} className="text-base" />
            </button>
        </div>
    </div>
);

const FullscreenQrCard = ({ isFlashlightMode, selectedFormationId, fadeStyle, qrPayload, t }) => (
    <SecureCaptureShield
        className="w-full max-w-[250px] sm:max-w-[300px] aspect-square rounded-3xl"
        overlayMessage={t('qr.captureBlockedTitle', 'Captura Bloqueada')}
        overlaySubmessage={t('qr.captureBlockedDesc', 'El código QR y PIN dinámico están protegidos contra capturas y recortes.')}
    >
        <div 
            className={`relative flex flex-col items-center justify-center w-full h-full p-3 sm:p-4 rounded-3xl da-protected-screen overflow-hidden ${
                isFlashlightMode 
                    ? 'bg-white shadow-[0_6px_30px_rgba(0,0,0,0.08)] border-2 border-slate-200' 
                    : 'bg-white shadow-[0_16px_45px_rgba(0,0,0,0.6)]'
            }`}
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

            <div 
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b3c34c] to-transparent pointer-events-none z-20 shadow-[0_0_12px_#b3c34c]"
                style={{
                    animation: 'qrLaserSweep 2.8s ease-in-out infinite alternate'
                }}
                aria-hidden="true"
            />
        </div>
    </SecureCaptureShield>
);

const FullscreenPinFooter = ({ isFlashlightMode, totpToken, progress, isEnding, t }) => (
    <div className="w-full max-w-[250px] sm:max-w-[300px] flex flex-col items-center gap-1">
        <SecureCaptureShield
            compact={true}
            className="rounded-2xl"
            overlayMessage={t('qr.pinHidden', 'PIN Oculto')}
            overlaySubmessage={t('qr.pinHiddenDesc', 'Protegido contra capturas')}
        >
            <div className={`text-3xl sm:text-4xl font-extrabold tracking-widest font-mono da-protected-screen drop-shadow-sm ${
                isFlashlightMode ? 'text-slate-900' : 'text-white'
            }`}>
                {totpToken}
            </div>
        </SecureCaptureShield>

        <div className={`w-full rounded-full overflow-hidden h-2 mt-0.5 ${
            isFlashlightMode ? 'bg-slate-200' : 'bg-slate-800'
        }`}>
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
        <p className={`text-[10px] sm:text-xs font-semibold mb-0 text-center ${
            isFlashlightMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
            {t('qr.totpSecurity')}
        </p>

        <div className={`mt-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium leading-tight text-center border ${
            isFlashlightMode 
                ? 'bg-slate-100 border-slate-200 text-slate-600' 
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
        }`}>
            <FontAwesomeIcon icon={faLightbulb} className="text-amber-400 text-xs shrink-0" />
            <span>{t('qr.pressKey', 'Presiona')} <kbd className={`font-mono font-bold px-1 rounded border text-[9px] sm:text-[10px] ${
                isFlashlightMode ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-700 text-slate-200 border-slate-600'
            }`}>F</kbd> {t('qr.or', 'o')} <kbd className={`font-mono font-bold px-1 rounded border text-[9px] sm:text-[10px] ${
                isFlashlightMode ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-700 text-slate-200 border-slate-600'
            }`}>Esc</kbd> {t('qr.toExit', 'para salir')} · <kbd className={`font-mono font-bold px-1 rounded border text-[9px] sm:text-[10px] ${
                isFlashlightMode ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-700 text-slate-200 border-slate-600'
            }`}>{t('qr.space', 'Espacio')}</kbd> {t('qr.toRegenerate', 'para regenerar')}</span>
        </div>

        <p className={`text-[9px] sm:text-[10px] text-center mt-1 mb-0 opacity-70 ${
            isFlashlightMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
            {t('qr.mobileBrightnessTip', '💡 En iPhone/Android, usa el botón "Luz Máx" o sube el brillo desde el Centro de Control de tu dispositivo.')}
        </p>
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
    const [isFlashlightMode, setIsFlashlightMode] = useState(false);

    useDynamicThemeColor(isOpen, isFlashlightMode);

    if (!isOpen) return null;

    const bgClass = isFlashlightMode ? "bg-white text-slate-900" : "text-slate-100";
    const bgStyle = { backgroundColor: isFlashlightMode ? '#FFFFFF' : '#090d16' };

    const handleToggleMode = () => {
        setIsFlashlightMode(prev => !prev);
        soundAndHaptics.playClick();
    };

    const handleClose = () => {
        soundAndHaptics.playClick();
        onClose();
    };

    const title = formationName || t('qr.title');

    return (
        <div 
            className={`fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col items-center justify-between p-3 sm:p-6 overscroll-none touch-none select-none animate-in fade-in zoom-in-95 duration-200 transition-colors ${bgClass}`}
            style={{ 
                ...bgStyle,
                paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
                paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
                paddingLeft: 'calc(0.75rem + env(safe-area-inset-left, 0px))',
                paddingRight: 'calc(0.75rem + env(safe-area-inset-right, 0px))'
            }}
        >
            <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-2.5 sm:gap-3.5 my-auto">
                <FullscreenHeader 
                    formationTitle={title}
                    isFlashlightMode={isFlashlightMode}
                    onToggleMode={handleToggleMode}
                    onClose={handleClose}
                    t={t}
                />
                <FullscreenQrCard 
                    isFlashlightMode={isFlashlightMode}
                    selectedFormationId={selectedFormationId}
                    fadeStyle={fadeStyle}
                    qrPayload={qrPayload}
                    t={t}
                />
                <FullscreenPinFooter 
                    isFlashlightMode={isFlashlightMode}
                    totpToken={totpToken}
                    progress={progress}
                    isEnding={isEnding}
                    t={t}
                />
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

    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);
    const activeFormations = useMemo(() => {
        return formations.filter(f => !f.isClosed && f.status !== 'CLOSED');
    }, [formations]);
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
        soundAndHaptics.playClick();
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
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-6 py-6 sm:py-10 pb-20 sm:pb-28 min-h-[calc(100vh-120px)] relative">
            <div className="w-full max-w-full rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] p-4 sm:p-8 md:p-10 my-auto box-border relative overflow-visible">
                <div className="w-full">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2 w-full">
                            <div className="flex flex-col items-center w-[280px] max-w-full shrink-0">
                                <QRDisplayArea
                                    isFormationClosed={isFormationClosed}
                                    selectedFormationId={selectedFormationId}
                                    fadeStyle={fadeStyle}
                                    qrPayload={qrPayload}
                                    onDoubleClick={toggleFullscreenBrightness}
                                    t={t}
                                />
                                
                                <AdminControlsBadges
                                    adminCoords={adminCoords}
                                    selectedFormationId={selectedFormationId}
                                    isFormationClosed={isFormationClosed}
                                    onToggleFullscreen={toggleFullscreenBrightness}
                                    t={t}
                                />
                            </div>

                            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm w-full">

                                <h2 className="qr-title text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {t('qr.title')}
                                </h2>
                                <p className="qr-subtitle mb-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {t('qr.subtitle')}
                                </p>

                                <div className="w-full mb-3 text-left relative z-40">
                                    <div className="mb-3">
                                        <label htmlFor="formationId" className="block mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('qr.selectFormation')}</label>
                                        <GlassDropdown
                                            options={activeFormations.map(f => ({
                                                value: f.id,
                                                label: getFormationDropdownLabel(f, t)
                                            }))}
                                            value={selectedFormationId || ''}
                                            onChange={(val) => {
                                                setSelectedFormationId(val ? Number.parseInt(val, 10) : null);
                                            }}
                                            placeholder={t('qr.selectFormationPlaceholder')}
                                            floating={true}
                                            searchable={true}
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
                                    t={t}
                                />

                                {Boolean(selectedFormationId && !isFormationClosed) && (
                                    <div className="w-full mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-center md:justify-start gap-1 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">{t('qr.shortcuts', 'Atajos')}:</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">F</kbd>
                                        <span>{t('qr.projector', 'Proyector')}</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Espacio</kbd>
                                        <span>{t('qr.refresh', 'Refrescar')}</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Esc</kbd>
                                        <span>{t('qr.exit', 'Salir')}</span>
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