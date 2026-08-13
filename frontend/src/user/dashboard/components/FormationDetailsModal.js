import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getCleanFileInfo } from '../../../utils/fileUtils';
import { formatDate } from '../../../utils/dateUtils';

export default function FormationDetailsModal({ isOpen, onClose, selectedAtt }) {
  const { t } = useTranslation();

  if (!selectedAtt) return null;

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered style={{ maxWidth: '440px' }}>
      <ModalHeader toggle={onClose} className="py-2.5 px-4 text-sm font-bold">
        {selectedAtt.formation.name}
      </ModalHeader>

      <ModalBody className="py-3 px-4">
        <div className="p-3.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(15px)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' }}>
          <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.descriptionLabel', 'Descripción')}</h6>
          <p className="mb-2.5 text-slate-800 text-sm font-medium">{selectedAtt.formation.description || t('dashboard.noDescription', 'Sin descripción')}</p>

          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div>
              <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.formationDate', 'Fecha de formación')}</h6>
              <p className="mb-0 text-slate-800 text-xs font-semibold">{formatDate(selectedAtt.formation.formationDate)}</p>
            </div>
            <div>
              <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.checkInTime', 'Hora de check-in')}</h6>
              <p className="mb-0 text-slate-800 text-xs font-semibold">{formatDate(selectedAtt.checkInDate)}</p>
            </div>
          </div>

          {selectedAtt.checkOutDate && (
            <div className="mb-2.5">
              <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.checkOutTime', 'Hora de checkout')}</h6>
              <p className="mb-0 text-slate-800 text-xs font-semibold">{formatDate(selectedAtt.checkOutDate)}</p>
            </div>
          )}

          {selectedAtt.formation.documentUrls && selectedAtt.formation.documentUrls.length > 0 && (
            <div className="mb-3">
              <span className="font-bold text-slate-700 text-xs mb-1.5 block">{t('dashboard.viewDocumentation', 'Ver Documentación')}:</span>
              <div className="flex flex-wrap gap-1.5 justify-center max-h-28 overflow-y-auto p-1">
                {selectedAtt.formation.documentUrls.map((item) => {
                  const fileMeta = getCleanFileInfo(item);
                  return (
                    <a
                      key={item}
                      href={fileMeta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="da-btn da-btn-secondary px-2.5 py-1 text-xs text-truncate rounded-full"
                      style={{ textDecoration: 'none', maxWidth: '100%' }}
                    >
                      {fileMeta.name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-start items-center mt-3 pt-2.5 border-t border-black/5">
            <span style={{ color: '#64748b', fontSize: '0.85rem' }} className="mr-1.5">
              {t('dashboard.statusLabel', 'Estado:')}
            </span>

            {selectedAtt.checkOutDate ? (
              <span className="badge-glass-success text-xs px-2.5 py-0.5">
                {t('dashboard.statusCompleted', 'Completado')}
              </span>
            ) : (
              <span className="badge-glass-warning text-dark text-xs px-2.5 py-0.5">
                {t('dashboard.statusInProgress', 'En curso')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-3 pt-2 border-t border-black/5">
          <button type="button" className="da-btn da-btn-secondary m-0 px-3 py-1.5 text-xs rounded-full" onClick={onClose}>
            {t('dashboard.close', 'Cerrar')}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
