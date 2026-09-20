import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

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
    const contentRef = useRef(null);
    const unblackoutTimeoutRef = useRef(null);

    const wipeClipboardSafe = useCallback(() => {
        if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText('').catch(() => {});
        }
    }, []);

    // Aplicación síncrona inmediata en el DOM (0ms de latencia) para adelantarse al buffer de Windows DWM / Snipping Tool
    const applyBlackoutDOM = useCallback((blackout) => {
        if (contentRef.current) {
            contentRef.current.style.visibility = blackout ? 'hidden' : 'visible';
            contentRef.current.style.opacity = blackout ? '0' : '1';
            contentRef.current.style.filter = blackout ? 'blur(40px)' : 'none';
            contentRef.current.style.pointerEvents = blackout ? 'none' : 'auto';
        }
    }, []);

    const triggerBlackout = useCallback(() => {
        if (unblackoutTimeoutRef.current) {
            clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = null;
        }
        // Aplicación síncrona directa antes de que React despache el render
        applyBlackoutDOM(true);
        setIsBlackedOut(true);
    }, [applyBlackoutDOM]);

    const handleDismissBlackout = useCallback((e) => {
        e?.stopPropagation?.();
        if (unblackoutTimeoutRef.current) {
            clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = null;
        }
        applyBlackoutDOM(false);
        setIsBlackedOut(false);
    }, [applyBlackoutDOM]);

    useEffect(() => {
        const handleBlur = () => {
            // Cuando la ventana pierde el foco, activar blackout visual inmediato síncrono
            triggerBlackout();
        };

        const handleFocus = () => {
            // Al recuperar el foco, restaurar automáticamente la visualización
            if (unblackoutTimeoutRef.current) clearTimeout(unblackoutTimeoutRef.current);
            unblackoutTimeoutRef.current = setTimeout(() => {
                if (document.hasFocus() && document.visibilityState === 'visible') {
                    applyBlackoutDOM(false);
                    setIsBlackedOut(false);
                }
            }, 80);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                triggerBlackout();
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
            // Atajos específicos de captura: Win+Shift+S / Cmd+Shift+3/4 / Ctrl+Shift+S / Alt+PrintScreen
            if (((e.ctrlKey || e.metaKey) && e.shiftKey) || (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44))) {
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

        const handleTouchStart = (e) => {
            // Detección de gesto común en móviles para capturas de pantalla (gesto de 3 dedos)
            if (e.touches && e.touches.length >= 3) {
                triggerBlackout();
                wipeClipboardSafe();
            }
        };

        const handlePageHide = () => {
            triggerBlackout();
        };

        const handleMouseLeave = (e) => {
            // Si el cursor abandona la ventana del navegador (por ej. para interactuar con la app de recortes o barra de tareas)
            if (!e.relatedTarget && !e.toElement) {
                triggerBlackout();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                wipeClipboardSafe();
                if (unblackoutTimeoutRef.current) clearTimeout(unblackoutTimeoutRef.current);
                unblackoutTimeoutRef.current = setTimeout(() => {
                    if (document.hasFocus() && document.visibilityState === 'visible') {
                        applyBlackoutDOM(false);
                        setIsBlackedOut(false);
                    }
                }, 3000);
            }
        };

        let rAFId;
        const checkFocusLoop = () => {
            if (typeof document !== 'undefined') {
                if (typeof document.hasFocus === 'function' && !document.hasFocus() && document.visibilityState === 'visible') {
                    triggerBlackout();
                }
            }
            rAFId = requestAnimationFrame(checkFocusLoop);
        };
        rAFId = requestAnimationFrame(checkFocusLoop);

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handlePageHide);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (rAFId) cancelAnimationFrame(rAFId);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handlePageHide);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (unblackoutTimeoutRef.current) {
                clearTimeout(unblackoutTimeoutRef.current);
            }
        };
    }, [triggerBlackout, handleDismissBlackout, wipeClipboardSafe, applyBlackoutDOM]);

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
            {/* Contenido protegido (código QR o PIN) - 0ms de transición al bloquearse para evitar capturar frames intermedios */}
            <div 
                ref={contentRef}
                className={`da-protected-content ${isBlackedOut ? 'opacity-0 pointer-events-none filter blur-xl' : 'opacity-100'} ${contentClassName}`}
                style={{
                    visibility: isBlackedOut ? 'hidden' : 'visible',
                    opacity: isBlackedOut ? 0 : 1,
                    transition: isBlackedOut ? 'none' : 'opacity 120ms ease, filter 120ms ease'
                }}
                aria-hidden={isBlackedOut}
            >
                {children}
            </div>

            {/* Pantalla Negra Instantánea (0ms de retardo, sin transiciones fade-in para evitar captura de buffer) */}
            {isBlackedOut && (
                <button 
                    type="button"
                    onClick={handleDismissBlackout}
                    className={`absolute inset-0 ${compact ? 'z-20' : 'z-50'} bg-[#000000] border-0 outline-none flex items-center justify-center cursor-pointer rounded-[inherit] select-none ${
                        compact 
                            ? 'gap-2 px-3 py-1.5 text-center shadow-sm' 
                            : 'flex-col p-6 text-center'
                    }`}
                    style={{ 
                        backgroundColor: '#000000', 
                        minHeight: compact ? 'auto' : '180px',
                        transition: 'none' 
                    }}
                    title="Haz clic para restablecer la vista"
                >
                    {compact ? (
                        <>
                            <span className="text-sm font-mono font-bold tracking-widest text-slate-200 select-none">
                                ••••••
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline select-none">
                                {overlayMessage}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                                <FontAwesomeIcon icon={faShieldHalved} className="text-red-400 text-xl animate-pulse" />
                            </div>
                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
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

            {/* Estilos estrictos para impresión (@media print) y animación de barrido dinámico SafeTix */}
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
                @keyframes qrLaserSweep {
                    0% { top: 4%; opacity: 0.25; }
                    50% { opacity: 0.9; }
                    100% { top: 94%; opacity: 0.25; }
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
