import React from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../components/ToastProvider";
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

export function CloseFormationModal({ isOpen, toggle, formation, onCloseFormation }) {
  const { t } = useTranslation();
  const toast = useToast();
  const sigCanvas = React.useRef(null);
  const [observations, setObservations] = React.useState('');
  const [trainerName, setTrainerName] = React.useState(formation?.trainer || 'VICTOR PARDO');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (formation?.trainer) {
      setTrainerName(formation.trainer);
    }
  }, [formation]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.warning(t('formationDetails.signatureRequired', 'Por favor, estampe su firma como formador para cerrar la convocatoria.'));
      return;
    }

    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    setIsSubmitting(true);
    const success = await onCloseFormation({
      signature: signatureBase64,
      observations: observations.trim(),
      trainerName: trainerName.trim() || 'VICTOR PARDO',
      location: formation?.location || 'BA VILLAFRANCA'
    });
    setIsSubmitting(false);
    if (success) {
      toggle();
    }
  };

  if (!formation) return null;

  const totalAttendees = formation.attendances?.length || 0;

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={toggle}
      title={
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
          <span>{t('formationDetails.closeModalTitle', 'Finalizar y Certificar Formación')}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-2 flex flex-col gap-4 text-left">
        <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold mb-0">
            {t('formationDetails.closeNotice', `Todos los asistentes (${totalAttendees}/${totalAttendees}) han completado su asistencia. Al finalizar, la formación quedará bloqueada para edición y se guardará el registro oficial con su firma.`)}
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {t('formationDetails.trainerNameLabel', 'Nombre del Formador')}
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {t('formationDetails.observationsLabel', 'Observaciones / Registro de Incidencias (Opcional)')}
          </label>
          <textarea
            rows="3"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={t('formationDetails.observationsPlaceholder', 'Indique si hubo alguna incidencia, incidencias técnicas o puntualizaciones durante la sesión...')}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('formationDetails.trainerSignatureLabel', 'Firma del Formador')} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="text-[11px] font-bold text-slate-500 hover:text-red-500 bg-transparent border-0 cursor-pointer"
              onClick={handleClear}
            >
              {t('common.clear', 'Limpiar')}
            </button>
          </div>
          <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-white overflow-hidden shadow-inner flex justify-center items-center">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#000000"
              canvasProps={{
                width: 380,
                height: 160,
                className: "sigCanvas cursor-crosshair block w-full h-[160px]"
              }}
            />
          </div>
          <small className="text-[11px] text-slate-400 block mt-1">
            {t('formationDetails.signHint', 'Firme con el ratón o el dedo en la pantalla táctil.')}
          </small>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="da-btn-secondary px-4 py-2 rounded-full font-bold text-xs"
            onClick={toggle}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="submit"
            className="da-btn-success px-5 py-2 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.saving', 'Finalizando...') : t('formationDetails.confirmClose', 'Finalizar Formación')}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}