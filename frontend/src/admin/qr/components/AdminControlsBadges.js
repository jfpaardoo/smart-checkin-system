import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faExpand } from '@fortawesome/free-solid-svg-icons';

export default function AdminControlsBadges({
    adminCoords,
    selectedFormationId,
    isFormationClosed,
    onToggleFullscreen,
    t
}) {
    return (
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
}
