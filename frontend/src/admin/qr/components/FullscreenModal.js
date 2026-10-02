import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faTimes, faCopy, faCheck, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import SecureCaptureShield from '../../../components/SecureCaptureShield';
import soundAndHaptics from '../../../util/soundAndHaptics';
import { useToast } from '../../../components/ToastProvider';
import { copyToClipboard } from '../../../util/clipboardUtil';

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

const FullscreenPinFooter = ({ isFlashlightMode, totpToken, progress, isEnding, t }) => {
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    const handleCopyPin = async (e) => {
        e?.stopPropagation?.();
        if (!totpToken) return;
        soundAndHaptics.playClick();
        const success = await copyToClipboard(totpToken);
        if (success) {
            setCopied(true);
            soundAndHaptics.playSuccess();
            toast.success(t('qr.pinCopiedToast', '¡PIN copiado al portapapeles!'));
            setTimeout(() => setCopied(false), 2200);
        } else {
            toast.error(t('qr.copyPinError', 'No se pudo copiar el PIN al portapapeles.'));
        }
    };

    return (
        <div className="w-full max-w-[280px] sm:max-w-[320px] flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2">
                <SecureCaptureShield
                    compact={true}
                    className="rounded-2xl"
                    overlayMessage={t('qr.pinHidden', 'PIN Oculto')}
                    overlaySubmessage={t('qr.pinHiddenDesc', 'Protegido contra capturas')}
                >
                    <div 
                        className={`text-3xl sm:text-4xl font-extrabold tracking-widest font-mono da-protected-screen drop-shadow-sm ${
                            isFlashlightMode ? 'text-slate-900' : 'text-white'
                        }`}
                    >
                        {totpToken}
                    </div>
                </SecureCaptureShield>
                {(() => {
                    let btnClass = isFlashlightMode
                        ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700';
                    if (copied) {
                        btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-600 scale-105';
                    }
                    return (
                        <button
                            type="button"
                            onClick={handleCopyPin}
                            className={`p-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer flex items-center justify-center ${btnClass}`}
                            title={copied ? t('qr.pinCopiedTooltip', '¡PIN copiado al portapapeles!') : t('qr.copyPinTooltip', 'Copiar PIN de 6 dígitos')}
                            aria-label={t('qr.copyPin', 'Copiar PIN')}
                        >
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                        </button>
                    );
                })()}
            </div>

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
};

export default function FullscreenModal({
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
}) {
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
}
