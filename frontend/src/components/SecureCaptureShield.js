import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faLock } from '@fortawesome/free-solid-svg-icons';

/**
 * SecureCaptureShield
 * 
 * Componente de blindaje anti-capturas de pantalla con efecto pantalla negra (DRM Blackout Shield).
 * Protege el código QR y el PIN dinámico de asistencia contra capturas y pérdida de foco,
 * y se restaura automáticamente sin exigir clics manuales cuando el usuario regresa a la vista.
 */
export default function SecureCaptureShield({
    children,
    className = '',
    contentClassName = '',
    showBadge = true,
    compact = false,
    overlayMessage = 'Contenido protegido contra capturas',
    overlaySubmessage = 'El código QR y el PIN dinámico se ocultan automáticamente para evitar su difusión no autorizada.'
}) {
    const [isBlackedOut, setIsBlackedOut] = useState(false);
    const unblackoutTimeoutRef = useRef(null);

    const wipeClipboardSafe = useCallback(() => {
        if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText('').catch(() => {});
        }
    }, []);

    const triggerBlackout = useCallback(() => {
        if (unblackoutTimeoutRef.current) {
            clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = null;
        }
        setIsBlackedOut(true);
    }, []);

    const handleDismissBlackout = useCallback((e) => {
        e?.stopPropagation?.();
        if (unblackoutTimeoutRef.current) {
            clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = null;
        }
        setIsBlackedOut(false);
    }, []);

    useEffect(() => {
        const handleBlur = () => {
            // Cuando la ventana pierde el foco, activar blackout
            triggerBlackout();
            wipeClipboardSafe();
        };

        const handleFocus = () => {
            // Al recuperar el foco, purgar portapapeles y restaurar automáticamente
            wipeClipboardSafe();
            if (unblackoutTimeoutRef.current) clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = setTimeout(() => {
                if (document.hasFocus() && document.visibilityState === 'visible') {
                    setIsBlackedOut(false);
                }
            }, 80);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                triggerBlackout();
                wipeClipboardSafe();
            } else {
                handleFocus();
            }
        };

        const handleKeyDown = (e) => {
            // Tecla Impr Pant / PrintScreen
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                triggerBlackout();
                wipeClipboardSafe();
            }
            // Ctrl+Shift+S / Cmd+Shift+4
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
                triggerBlackout();
                wipeClipboardSafe();
            }
            // Ctrl+P (Imprimir)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
                e.preventDefault();
                triggerBlackout();
            }
            // Escape para restablecer vista si está bloqueado
            if (e.key === 'Escape') {
                handleDismissBlackout();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                wipeClipboardSafe();
                if (unblackoutTimeoutRef.current) clearTimeout(unblackoutTimeoutRef.current);
                unblackoutTimeoutRef.current = setTimeout(() => {
                    setIsBlackedOut(false);
                }, 150);
            }
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            if (unblackoutTimeoutRef.current) {
                clearTimeout(unblackoutTimeoutRef.current);
            }
        };
    }, [triggerBlackout, handleDismissBlackout, wipeClipboardSafe]);

    return (
        <div 
            className={`relative select-none overflow-hidden ${className}`}
            data-blackout={isBlackedOut ? 'true' : undefined}
            style={{
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
        >
            {/* Contenido protegido (código QR o PIN) */}
            <div 
                className={`da-protected-content transition-all duration-150 ${isBlackedOut ? 'opacity-0 pointer-events-none filter blur-xl scale-95' : 'opacity-100'} ${contentClassName}`}
                aria-hidden={isBlackedOut}
            >
                {children}
            </div>

            {/* Pantalla Negra Instantánea con restauración automática o manual */}
            {isBlackedOut && (
                <button 
                    type="button"
                    onClick={handleDismissBlackout}
                    className={`absolute inset-0 z-50 bg-[#000000] border-0 outline-none flex items-center justify-center cursor-pointer animate-in fade-in duration-100 rounded-[inherit] ${
                        compact 
                            ? 'gap-2 px-3 py-1.5 text-center select-none shadow-sm' 
                            : 'flex-col p-6 text-center'
                    }`}
                    style={{ backgroundColor: '#000000', minHeight: compact ? 'auto' : '180px' }}
                    title="Haz clic para restablecer la vista"
                >
                    {compact ? (
                        <>
                            <FontAwesomeIcon icon={faLock} className="text-amber-400 text-xs animate-pulse shrink-0" />
                            <span className="text-sm font-mono font-bold tracking-widest text-slate-200 select-none">
                                ••••••
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline select-none">
                                {overlayMessage}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                                <FontAwesomeIcon icon={faShieldHalved} className="text-red-400 text-xl animate-pulse" />
                            </div>
                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faLock} className="text-[10px] text-amber-400" />
                                {overlayMessage}
                            </span>
                            <p className="text-[11px] text-slate-400 max-w-xs mt-1.5 leading-snug mb-0">
                                {overlaySubmessage}
                            </p>
                            <span className="mt-3 text-[10px] text-slate-300 font-mono tracking-tight bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 transition-all active:scale-95 shadow-xs">
                                Haz clic aquí para restablecer la vista
                            </span>
                        </>
                    )}
                </button>
            )}

            {/* Estilos estrictos para impresión (@media print) */}
            <style>{`
                @media print {
                    .da-protected-screen,
                    .da-protected-content {
                        display: none !important;
                    }
                    .da-protected-print-blackout {
                        display: flex !important;
                        background: #000000 !important;
                        color: #ffffff !important;
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}

SecureCaptureShield.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    contentClassName: PropTypes.string,
    showBadge: PropTypes.bool,
    compact: PropTypes.bool,
    overlayMessage: PropTypes.string,
    overlaySubmessage: PropTypes.string
};
