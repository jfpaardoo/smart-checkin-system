import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faFileCircleCheck, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import SecureCaptureShield from '../../../components/SecureCaptureShield';
import soundAndHaptics from '../../../util/soundAndHaptics';
import { useToast } from '../../../components/ToastProvider';
import { copyToClipboard } from '../../../util/clipboardUtil';

export default function PINDisplaySection({
    isFormationClosed,
    selectedFormationId,
    totpToken,
    progress,
    isEnding,
    fadeStyle,
    securityText,
    t
}) {
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    const handleCopyPin = async () => {
        if (!totpToken) return;
        soundAndHaptics.playClick();
        const success = await copyToClipboard(totpToken);
        if (success) {
            setCopied(true);
            soundAndHaptics.playSuccess();
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([40, 60, 40]);
            }
            toast.success(t('qr.pinCopiedToast', '¡PIN copiado al portapapeles!'));
            setTimeout(() => setCopied(false), 2200);
        } else {
            toast.error(t('qr.copyPinError', 'No se pudo copiar el PIN al portapapeles.'));
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
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-105 shadow-emerald-500/10'
                            : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95'
                    }`}
                    title={copied ? t('qr.pinCopiedTooltip', '¡PIN copiado al portapapeles!') : t('qr.copyPinTooltip', 'Copiar PIN de 6 dígitos')}
                    aria-label={t('qr.copyPin', 'Copiar PIN')}
                >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                    <span className="hidden sm:inline">{copied ? t('qr.pinCopied', 'Copiado') : t('qr.copy', 'Copiar')}</span>
                </button>
            </div>

            <div 
                className="w-full rounded-full overflow-hidden mb-3 bg-slate-200/80 dark:bg-white/15" 
                style={{
                    height: '6px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)'
                }}
            >
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
}
