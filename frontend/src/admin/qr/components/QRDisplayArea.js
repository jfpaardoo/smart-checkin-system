import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCircleCheck, faQrcode } from '@fortawesome/free-solid-svg-icons';
import SecureCaptureShield from '../../../components/SecureCaptureShield';

export default function QRDisplayArea({ isFormationClosed, selectedFormationId, fadeStyle, qrPayload, onDoubleClick, t }) {
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
}
