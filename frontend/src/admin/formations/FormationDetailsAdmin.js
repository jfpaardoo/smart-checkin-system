import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faPencil, faTrash, faFileLines, faChevronDown, faChevronUp, faArrowLeft, faFileExcel, faFilePdf, faCheckDouble, faLock, faSpinner, faRocket } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import getIdFromUrl from "../../util/getIdFromUrl";
import { CardGhostLoader } from "../../components/GhostLoader";
import { getFileIconAndType, getCleanFileInfo } from "../../utils/fileUtils";
import SecureImage from "../../components/SecureImage";
import { useToast } from "../../components/ToastProvider";
import GlassButton from "../../components/GlassButton";
import StatusBadge from "../../components/StatusBadge";

import { useFormationDetails } from "./hooks/useFormationDetails";
import FormationAttendeesTable from "./components/FormationAttendeesTable";
import { DocumentPreviewModal, AttendanceDetailsModal, CloseFormationModal } from "./components/FormationModals";
import PublishFormationModal from "./components/PublishFormationModal";
import CalendarSyncDropdown from "../../components/CalendarSyncDropdown";

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const { t } = useTranslation();
  const toast = useToast();

  const {
    formation,
    allUsers,
    isAddingUser,
    handleAddUser,
    handleRemoveUser,
    handleDeleteFormation,
    downloadSignaturePdf,
    downloadOfficialSheet,
    isDownloadingSheet,
    handleCloseFormation,
    canCloseFormation
  } = useFormationDetails(id);

  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ url: "", name: "", type: "unknown" });
  const [docsOpen, setDocsOpen] = useState(false);

  const renderStatusBadge = () => {
    if (formation.status === 'DRAFT') {
      return <StatusBadge variant="warning">{t('formation.statusDraft', 'Borrador')}</StatusBadge>;
    }
    if (formation.isClosed || formation.status === 'CLOSED') {
      return <StatusBadge variant="neutral">{t('formationDetails.statusClosed', 'Cerrada y Firmada')}</StatusBadge>;
    }
    return <StatusBadge variant="success" pulse>{t('formationDetails.statusPublished', 'Publicada / Abierta')}</StatusBadge>;
  };

  const openDocumentModal = (e, url, fileName) => {
    e.currentTarget.blur();
    const fileInfo = getFileIconAndType(fileName);
    setSelectedDocument({ url, name: fileName, type: fileInfo.type });
    setDocumentModalOpen(true);
  };

  if (!formation) return <CardGhostLoader />;

  return (
    <div className="da-container">
      <div className="da-card">
        <div className="da-card-header da-admin-header border-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <Link
              to="/formations"
              className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center shrink-0 text-decoration-none mt-1 sm:mt-0"
              title={t("common.back", "Volver")}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>

            <div className="flex flex-col items-start text-left min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 max-w-full">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#73841e] dark:text-[#d4e84a] bg-[#b3c34c]/20 px-2.5 sm:px-3 py-0.5 rounded-xl border border-[#b3c34c]/30 inline-flex items-center">
                  {t('formationDetails.title', 'Detalles de la Formación')}
                </span>
                {formation.isClosed && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2.5 sm:px-3 py-0.5 rounded-xl border border-emerald-500/30 inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                    {t('formationDetails.closedBadge', 'Finalizada y Certificada')}
                  </span>
                )}
              </div>
              <h2 className="mb-0 text-slate-800 dark:text-slate-100 font-bold text-xl sm:text-2xl break-words max-w-full leading-tight">
                {formation.name}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-stretch sm:items-center justify-start sm:justify-end gap-2 w-full lg:w-auto">
            {formation.isClosed && (
              <>
                <button
                  type="button"
                  disabled={Boolean(isDownloadingSheet)}
                  className="da-btn-excel col-span-3 sm:col-span-1 sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[40px]"
                  onClick={() => downloadOfficialSheet('excel')}
                  title={t('formationDetails.exportOfficialSheetExcel', 'FOR 99 (Excel)')}
                >
                  <FontAwesomeIcon
                    icon={isDownloadingSheet === 'excel' ? faSpinner : faFileExcel}
                    className={isDownloadingSheet === 'excel' ? "fa-spin" : ""}
                  />
                  <span className="whitespace-nowrap">
                    {isDownloadingSheet === 'excel'
                      ? t('common.downloading', 'Descargando...')
                      : t('formationDetails.exportOfficialSheetExcel', 'FOR 99 (Excel)')}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(isDownloadingSheet)}
                  className="da-btn-pdf col-span-3 sm:col-span-1 sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[40px]"
                  onClick={() => downloadOfficialSheet('pdf')}
                  title={t('formationDetails.exportOfficialSheetPdf', 'FOR 99 (PDF)')}
                >
                  <FontAwesomeIcon
                    icon={isDownloadingSheet === 'pdf' ? faSpinner : faFilePdf}
                    className={isDownloadingSheet === 'pdf' ? "fa-spin" : ""}
                  />
                  <span className="whitespace-nowrap">
                    {isDownloadingSheet === 'pdf'
                      ? t('common.downloading', 'Descargando...')
                      : t('formationDetails.exportOfficialSheetPdf', 'FOR 99 (PDF)')}
                  </span>
                </button>
              </>
            )}

            <CalendarSyncDropdown
              formation={formation}
              buttonLabel={t('formationDetails.syncCalendar', 'Sincronizar Calendario')}
              className="col-span-3 sm:col-span-1 sm:w-auto"
            />

            {formation.status === 'DRAFT' && (
              <GlassButton
                type="button"
                variant="primary"
                className="col-span-3 sm:col-span-1 sm:w-auto px-4 py-2.5 rounded-2xl shadow-md min-h-[40px]"
                onClick={() => setPublishModalOpen(true)}
                icon={<FontAwesomeIcon icon={faRocket} />}
                title={t('formation.publishTitle', 'Publicar Formación')}
              >
                <span className="whitespace-nowrap">{t('formation.publishTitle', 'Publicar Formación')}</span>
              </GlassButton>
            )}

            {!formation.isClosed && formation.status !== 'DRAFT' && (
              <button
                type="button"
                className={`col-span-3 sm:col-span-1 sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border-0 cursor-pointer min-h-[40px] ${canCloseFormation
                    ? 'da-btn-primary shadow-md'
                    : 'da-btn-secondary opacity-75 shadow-xs'
                  }`}
                onClick={() => {
                  if (canCloseFormation) {
                    setCloseModalOpen(true);
                  } else {
                    toast.warning(t('formationDetails.cannotCloseAlert', 'Para finalizar la formación es obligatorio que todos los asistentes inscritos hayan completado el checkout y firmado.'));
                  }
                }}
                title={t('formationDetails.closeAction', 'Finalizar Formación')}
              >
                <FontAwesomeIcon icon={faCheckDouble} />
                <span className="whitespace-nowrap">{t('formationDetails.closeAction', 'Finalizar Formación')}</span>
              </button>
            )}

            {!formation.isClosed && (
              <Link
                className="da-btn-secondary col-span-1 sm:w-auto px-2 sm:px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-1.5 sm:gap-2 text-decoration-none shadow-xs hover:scale-105 active:scale-95 transition-all min-h-[40px]"
                to={`/formations/${id}`}
                title={t('formations.edit')}
              >
                <FontAwesomeIcon icon={faPencil} />
                <span className="whitespace-nowrap">{t('formations.edit', 'Editar')}</span>
              </Link>
            )}

            <Link
              className={`da-btn-blue ${formation.isClosed ? 'col-span-3 sm:col-span-1' : 'col-span-1'} sm:w-auto px-2 sm:px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-1.5 sm:gap-2 text-decoration-none shadow-xs hover:scale-105 active:scale-95 transition-all min-h-[40px]`}
              to={`/qr-generator?formationId=${id}`}
              title={t('formationDetails.qrButton')}
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span className="whitespace-nowrap">{t('formationDetails.qrButton', 'QR')}</span>
            </Link>

            {!formation.isClosed && (
              <button
                type="button"
                className="da-btn-danger col-span-1 sm:w-auto px-2 sm:px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs hover:scale-105 active:scale-95 transition-all border-0 cursor-pointer text-white min-h-[40px]"
                onClick={handleDeleteFormation}
                title={t('formations.delete')}
              >
                <FontAwesomeIcon icon={faTrash} />
                <span className="whitespace-nowrap">{t('formations.delete', 'Eliminar')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner destacado si está en Borrador */}
        {formation.status === 'DRAFT' && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 da-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faRocket} size="lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  {t('formation.draftBannerTitle', 'Formación en Borrador')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 m-0 mt-0.5">
                  {t('formation.draftBannerDesc', 'Esta formación no está visible para los empleados ni permite registrar asistencia hasta que sea publicada.')}
                </p>
              </div>
            </div>
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => setPublishModalOpen(true)}
              icon={<FontAwesomeIcon icon={faRocket} />}
              className="px-5 py-2.5 text-xs font-bold rounded-2xl shadow-md shrink-0 w-full sm:w-auto justify-center"
            >
              <span>{t('formation.publishTitle', 'Publicar Ahora')}</span>
            </GlassButton>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] mb-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.dateTime')}</h4>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0">{dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.locationLabel', 'Lugar')}</h4>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0">{formation.location || 'BA VILLAFRANCA'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.trainerLabel', 'Formador')}</h4>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0">{formation.trainer || 'VICTOR PARDO'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.statusLabel', 'Estado')}</h4>
              <div className="pt-0.5">
                {renderStatusBadge()}
              </div>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.description')}</h4>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">{formation.description || t('formationDetails.noDescription', 'Sin descripción')}</p>

          {formation.observations && (
            <div className="mt-4 pt-4 border-t border-white/40 dark:border-white/10">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.observationsLabel', 'Observaciones / Registro de Incidencias')}</h4>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 mb-0">
                {formation.observations}
              </p>
            </div>
          )}

          {formation.trainerSignature && (
            <div className="mt-4 pt-4 border-t border-white/40 dark:border-white/10">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('formationDetails.trainerSignatureLabel', 'Firma del Formador')} ({formation.trainer || 'VICTOR PARDO'})
              </h4>
              <div className="max-w-[260px] bg-white rounded-2xl border border-dashed border-slate-300 p-2 shadow-inner">
                <SecureImage
                  src={formation.trainerSignature.startsWith('data:image') ? formation.trainerSignature : `/api/v1/signatures/${formation.trainerSignature}`}
                  alt="Firma del Formador"
                  className="w-full h-[90px] object-contain block mx-auto"
                />
              </div>
            </div>
          )}

          {formation.documentUrls && formation.documentUrls.length > 0 && (
            <div className="formation-document-section mt-4 pt-4 border-t border-white/40 dark:border-white/10">
              <button
                type="button"
                className="flex justify-between items-center w-full border-0 bg-transparent p-0 m-0 text-left cursor-pointer"
                onClick={() => setDocsOpen(!docsOpen)}
              >
                <span className="text-sm text-[#73841e] dark:text-[#d4e84a] flex items-center gap-2 font-bold uppercase tracking-wider">
                  <FontAwesomeIcon icon={faFileLines} />
                  {t('formationDetails.documentation', 'Documentación Adjunta')} ({formation.documentUrls.length})
                </span>
                <span className="p-0 text-[#73841e] dark:text-[#d4e84a]">
                  <FontAwesomeIcon icon={docsOpen ? faChevronUp : faChevronDown} />
                </span>
              </button>

              {docsOpen && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {formation.documentUrls.map((item) => {
                    const fileMeta = getCleanFileInfo(item);

                    return (
                      <button
                        key={item}
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 flex items-center gap-2 text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                        onClick={(e) => openDocumentModal(e, fileMeta.url, fileMeta.name)}
                      >
                        <FontAwesomeIcon icon={fileMeta.icon} style={{ color: fileMeta.color }} />
                        <span className="truncate max-w-[200px]">{fileMeta.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <FormationAttendeesTable
          formation={formation}
          allUsers={allUsers}
          isAddingUser={isAddingUser}
          handleAddUser={handleAddUser}
          handleRemoveUser={handleRemoveUser}
          onViewSignature={(att) => {
            setSelectedAttendance(att);
            setModalOpen(true);
          }}
          onDownloadPdf={downloadSignaturePdf}
        />
      </div>

      <DocumentPreviewModal
        isOpen={documentModalOpen}
        toggle={() => setDocumentModalOpen(false)}
        document={selectedDocument}
      />

      <AttendanceDetailsModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        attendance={selectedAttendance}
        formationName={formation?.name}
      />

      <CloseFormationModal
        isOpen={closeModalOpen}
        toggle={() => setCloseModalOpen(false)}
        formation={formation}
        onCloseFormation={handleCloseFormation}
      />

      <PublishFormationModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        formation={formation}
        onPublishSuccess={() => {
          // Automatic reload occurs via WebSocket, but force refresh if needed
          window.location.reload();
        }}
      />
    </div>
  );
}