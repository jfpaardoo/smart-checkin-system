import React from 'react';
import GlassModal from '../../../components/GlassModal';
import { useTranslation } from 'react-i18next';
import { getCleanFileInfo } from '../../../utils/fileUtils';
import { formatDate } from '../../../utils/dateUtils';

export default function FormationDetailsModal({ isOpen, onClose, selectedAtt }) {
  const { t } = useTranslation();

  if (!selectedAtt) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={onClose}
      title={selectedAtt.formation.name}
      size="sm"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-xs flex flex-col gap-3">
        <div>
          <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t('dashboard.descriptionLabel', 'Descripción')}
          </h6>
          <p className="mb-0 text-slate-800 dark:text-slate-100 text-sm font-medium">
            {selectedAtt.formation.description || t('dashboard.noDescription', 'Sin descripción')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <div>
            <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t('dashboard.formationDate', 'Fecha de formación')}
            </h6>
            <p className="mb-0 text-slate-800 dark:text-slate-100 text-xs font-semibold">
              {formatDate(selectedAtt.formation.formationDate)}
            </p>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t('dashboard.checkInTime', 'Hora de check-in')}
            </h6>
            <p className="mb-0 text-slate-800 dark:text-slate-100 text-xs font-semibold">
              {formatDate(selectedAtt.checkInDate)}
            </p>
          </div>
        </div>

        {selectedAtt.checkOutDate && (
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t('dashboard.checkOutTime', 'Hora de checkout')}
            </h6>
            <p className="mb-0 text-slate-800 dark:text-slate-100 text-xs font-semibold">
              {formatDate(selectedAtt.checkOutDate)}
            </p>
          </div>
        )}

        {selectedAtt.formation.documentUrls && selectedAtt.formation.documentUrls.length > 0 && (
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs mb-2 block">
              {t('dashboard.viewDocumentation', 'Ver Documentación')}:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {selectedAtt.formation.documentUrls.map((item) => {
                const fileMeta = getCleanFileInfo(item);
                return (
                  <a
                    key={item}
                    href={fileMeta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white text-xs font-medium text-decoration-none truncate max-w-full"
                  >
                    {fileMeta.name}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('dashboard.statusLabel', 'Estado:')}
          </span>

          {selectedAtt.checkOutDate ? (
            <span className="da-badge da-badge-active text-xs">
              {t('dashboard.statusCompleted', 'Completado')}
            </span>
          ) : (
            <span className="da-badge da-badge-warning text-xs">
              {t('dashboard.statusInProgress', 'En curso')}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-4 pt-3 border-t border-white/20 dark:border-white/10">
        <button 
          type="button" 
          className="da-btn-secondary px-5 py-2 text-xs font-bold rounded-2xl" 
          onClick={onClose}
        >
          {t('dashboard.close', 'Cerrar')}
        </button>
      </div>
    </GlassModal>
  );
}
