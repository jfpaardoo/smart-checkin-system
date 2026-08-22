import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { getFileIconAndType, getEmbedUrl } from "../../../utils/fileUtils";
import { formatDate } from "../../../utils/dateUtils";
import SecureImage from "../../../components/SecureImage";
import GlassModal from "../../../components/GlassModal";

export function DocumentPreviewModal({ isOpen, toggle, document }) {
  const { t } = useTranslation();

  if (!document) return null;

  const fileInfo = getFileIconAndType(document.name);

  const modalTitle = (
    <div className="truncate max-w-[55vw] text-slate-800 dark:text-slate-100 flex items-center gap-2">
      <FontAwesomeIcon icon={fileInfo.icon} style={{ color: fileInfo.color }} />
      <span>{document.name}</span>
    </div>
  );
  
  return (
    <GlassModal
      isOpen={isOpen}
      toggle={toggle}
      title={modalTitle}
      size="lg"
      footer={
        <button
          type="button"
          className="da-btn-secondary px-5 py-2 rounded-full font-bold text-xs"
          onClick={toggle}
        >
          {t('formationDetails.close')}
        </button>
      }
    >
      <div className="p-2 text-center">
        <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h5 className="text-slate-800 dark:text-slate-100 mb-3 break-all font-bold">{document.name}</h5>
          
          {(!document.url.includes("onedrive.live.com") && !document.url.includes("1drv.ms") && !document.url.includes("sharepoint.com")) ? (
            <div className="mb-4 h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <iframe 
                src={getEmbedUrl(document.url)} 
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
                title={document.name}
                allowFullScreen
                sandbox="allow-scripts allow-popups"
              ></iframe>
            </div>
          ) : (
            <div className="mb-4 flex flex-col items-center justify-center h-[220px] bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <FontAwesomeIcon icon={fileInfo.icon} style={{ fontSize: "50px", color: fileInfo.color, marginBottom: "15px" }} />
              <h5 className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('formationDetails.previewNotAvailable', 'Previsualización no disponible')}</h5>
              <p className="text-slate-400 text-xs text-center px-4 mb-0">
                {t('formationDetails.cspMessage', 'Por políticas de seguridad de Microsoft OneDrive, este documento no puede incrustarse directamente aquí.')}
              </p>
            </div>
          )}
          
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
            {t('formationDetails.cloudDocDescription', 'Este documento está almacenado de forma segura en la nube. Haz clic en el botón inferior para abrirlo.')}
          </p>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="da-btn-blue px-4 py-2 inline-flex items-center justify-center gap-2 text-decoration-none rounded-xl text-xs font-bold"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
            {t('common.openSecure', 'Abrir / Ver Documento en la Nube')}
          </a>
        </div>
      </div>
    </GlassModal>
  );
}

export function AttendanceDetailsModal({ isOpen, toggle, attendance, formationName }) {
  const { t } = useTranslation();

  const renderBadge = (att) => {
    if (att.checkOutDate) return <span className="badge-glass-success text-xs">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark text-xs">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary text-xs">{t('formationDetails.statusPending')}</span>;
  };

  const modalTitle = (
    <span className="text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base">
      {t('formationDetails.attendanceDetails')} - {formationName}
    </span>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={toggle}
      title={modalTitle}
      size="sm"
      footer={
        <button
          type="button"
          className="da-btn-secondary px-5 py-2 rounded-full font-bold text-xs"
          onClick={toggle}
        >
          {t('formationDetails.close')}
        </button>
      }
    >
      <div className="py-2">
        {attendance && (
          <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-2">
            <div>
              <span className="text-slate-400 text-xs font-semibold block">{t('formationDetails.formation')}:</span>
              <p className="mb-0 font-bold text-slate-800 dark:text-slate-100 text-sm">{formationName}</p>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block">{t('formationDetails.employee')}:</span>
              <p className="mb-0 font-bold text-slate-800 dark:text-slate-100 text-sm">
                {attendance.user.firstName} {attendance.user.lastName} ({attendance.user.username})
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block">{t('formationDetails.personalCodeLabel')}:</span>
              <p className="mb-0 font-bold text-slate-800 dark:text-slate-100 text-sm">{attendance.user.personalCode}</p>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-1">{t('formationDetails.statusLabel')}:</span>
              <div>{renderBadge(attendance)}</div>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block">{t('formationDetails.checkInTime')}:</span>
              <p className="mb-0 font-bold text-slate-800 dark:text-slate-100 text-sm notranslate" translate="no">
                {attendance.checkInDate ? formatDate(attendance.checkInDate) : t('formationDetails.notRecorded')}
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block">{t('formationDetails.checkOutTime')}:</span>
              <p className="mb-0 font-bold text-slate-800 dark:text-slate-100 text-sm notranslate" translate="no">
                {attendance.checkOutDate ? formatDate(attendance.checkOutDate) : t('formationDetails.notRecorded')}
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-1">{t('formationDetails.digitalSignature')}:</span>
              {attendance.signature ? (
                <div className="mx-auto max-w-[265px] bg-white rounded-xl border border-dashed border-slate-300 p-2 shadow-inner overflow-hidden flex justify-center items-center">
                  <SecureImage 
                    src={attendance.signature.startsWith('data:image') ? attendance.signature : `/api/v1/signatures/${attendance.signature}`} 
                    alt={`Firma de ${attendance.user.firstName}`}
                    className="w-full h-[110px] object-contain block mx-auto" 
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <small className="text-slate-400">{t('formationDetails.noSignature')}</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
}