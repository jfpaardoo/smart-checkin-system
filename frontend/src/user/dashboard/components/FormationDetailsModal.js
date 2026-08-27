import React, { useState } from 'react';
import GlassModal from '../../../components/GlassModal';
import GlassButton from '../../../components/GlassButton';
import StatusBadge from '../../../components/StatusBadge';
import { useTranslation } from 'react-i18next';
import { getCleanFileInfo } from '../../../utils/fileUtils';
import { formatDate } from '../../../utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faExternalLinkAlt, faEye, faLock } from '@fortawesome/free-solid-svg-icons';
import { DocumentPreviewModal } from '../../../admin/formations/components/FormationModals';
import api from '../../../services/api';
import { saveBlobFile } from '../../../util/downloadExportFile';

function getExtBadge(name) {
  if (!name) return 'FILE';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
}

function LockedDocumentationNotice({ t }) {
  return (
    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
          <FontAwesomeIcon icon={faLock} />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider flex flex-wrap items-center gap-2">
            <span>{t('dashboard.docLockedTitle', 'Documentación y Material Didáctico')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-500/30">
              {t('dashboard.docLockedBadge', 'Bloqueado hasta Check-in o Finalización')}
            </span>
          </div>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-1 mb-0 leading-relaxed">
            {t('dashboard.docLockedDesc', 'El material didáctico y presentaciones adjuntas se desbloquearán automáticamente cuando confirmes tu asistencia realizando el Check-in o cuando el formador finalice la sesión.')}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormationDocumentList({ documentUrls, isClosedWithoutCheckin, t, onPreview }) {
  if (!documentUrls || documentUrls.length === 0) return null;

  return (
    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">
            {t('dashboard.viewDocumentation', 'Documentación y Material')} ({documentUrls.length})
          </span>
          {isClosedWithoutCheckin && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md font-bold border border-emerald-500/20">
              {t('dashboard.unlockedPostSession', 'Desbloqueado tras finalización')}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {t('dashboard.clickToPreview', 'Haz clic para previsualizar')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 pr-1.5">
        {documentUrls.map((item) => {
          const fileMeta = getCleanFileInfo(item);
          const extBadge = getExtBadge(fileMeta.name);

          return (
            <div
              key={item}
              className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/70 hover:border-[#b3c34c]/60 dark:hover:border-[#b3c34c]/60 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => onPreview({ url: fileMeta.url, name: fileMeta.name })}
                className="flex items-center gap-3 min-w-0 flex-1 text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                title={`Previsualizar ${fileMeta.name}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${fileMeta.color}18`,
                    color: fileMeta.color,
                  }}
                >
                  <FontAwesomeIcon icon={fileMeta.icon} className="text-base" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#73841e] dark:group-hover:text-[#d4e84a] transition-colors">
                    {fileMeta.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700">
                      {extBadge}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faEye} size="xs" /> {t('common.view', 'Ver')}
                    </span>
                  </div>
                </div>
              </button>

              <a
                href={fileMeta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 ms-1"
                title="Abrir en pestaña nueva"
                aria-label={`Abrir ${fileMeta.name} en pestaña nueva`}
                onClick={(e) => e.stopPropagation()}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} size="xs" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormationModalStatusBadge({ checkInDate, checkOutDate, isClosed, t }) {
  if (checkOutDate) {
    return (
      <StatusBadge variant="success">
        {t('dashboard.statusCompleted', 'Completada')}
      </StatusBadge>
    );
  }
  if (checkInDate) {
    return (
      <StatusBadge variant="warning" pulse>
        {t('dashboard.statusInProgress', 'En curso')}
      </StatusBadge>
    );
  }
  if (isClosed) {
    return (
      <StatusBadge variant="neutral">
        {t('dashboard.statusClosedNonAttended', 'Finalizada')}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="info">
      {t('dashboard.statusScheduled', 'Programada')}
    </StatusBadge>
  );
}

function CertificateDownloadButton({ isCompleted, attendanceId, isScheduled, onDownload, downloading, t }) {
  if (!isCompleted || !attendanceId || isScheduled) return <div />;
  return (
    <GlassButton
      type="button"
      variant="secondary"
      className="text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
      onClick={onDownload}
      disabled={downloading}
      icon={<FontAwesomeIcon icon={faFilePdf} />}
    >
      <span>{downloading ? t('common.downloading', 'Descargando...') : t('profile.downloadCertificate', 'Descargar Diploma PDF')}</span>
    </GlassButton>
  );
}

export default function FormationDetailsModal({ isOpen, onClose, selectedAtt }) {
  const { t } = useTranslation();
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  if (!selectedAtt) return null;

  const hasCheckedIn = Boolean(selectedAtt.checkInDate);
  const isClosed = Boolean(selectedAtt.formation?.isClosed || selectedAtt.formation?.status === 'CLOSED');
  const canAccessDocuments = hasCheckedIn || isClosed;
  const isCompleted = Boolean(selectedAtt.checkOutDate);

  const handleDownloadCertificate = async () => {
    if (!selectedAtt?.id) return;
    setDownloadingCert(true);
    try {
      const res = await api.get(`/certificates/attendance/${selectedAtt.id}`, { responseType: 'blob' });
      await saveBlobFile(res.data, `certificado_${selectedAtt.id}.pdf`, 'application/pdf');
    } catch (error) {
      console.error("Error downloading certificate PDF", error);
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <>
      <GlassModal
        isOpen={isOpen}
        toggle={onClose}
        title={selectedAtt.formation.name}
        size="md"
      >
        <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-xs flex flex-col gap-3.5">
          <div>
            <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t('dashboard.descriptionLabel', 'Descripción')}
            </h6>
            <p className="mb-0 text-slate-800 dark:text-slate-100 text-sm font-medium leading-relaxed">
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

          {/* DOCUMENTACIÓN ADJUNTA O BLOQUEO */}
          {canAccessDocuments ? (
            <FormationDocumentList
              documentUrls={selectedAtt.formation.documentUrls}
              isClosedWithoutCheckin={isClosed && !hasCheckedIn}
              t={t}
              onPreview={setPreviewDoc}
            />
          ) : (
            <LockedDocumentationNotice t={t} />
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dashboard.statusLabel', 'Estado:')}
            </span>

            <FormationModalStatusBadge
              checkInDate={selectedAtt.checkInDate}
              checkOutDate={selectedAtt.checkOutDate}
              isClosed={isClosed}
              t={t}
            />
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <CertificateDownloadButton
            isCompleted={isCompleted}
            attendanceId={selectedAtt.id}
            isScheduled={selectedAtt.isScheduled}
            onDownload={handleDownloadCertificate}
            downloading={downloadingCert}
            t={t}
          />

          <GlassButton
            type="button"
            variant="secondary"
            className="text-xs font-bold px-4 py-2.5 rounded-xl"
            onClick={onClose}
          >
            {t('common.close', 'Cerrar')}
          </GlassButton>
        </div>
      </GlassModal>

      {/* Previsualizador de Archivos Integrado */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          toggle={() => setPreviewDoc(null)}
          fileUrl={previewDoc.url}
          fileName={previewDoc.name}
        />
      )}
    </>
  );
}
