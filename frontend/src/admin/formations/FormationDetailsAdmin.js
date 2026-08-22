import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faPencil, faTrash, faFileLines, faChevronDown, faChevronUp, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import getIdFromUrl from "../../util/getIdFromUrl";
import { CardGhostLoader } from "../../components/GhostLoader";
import { getFileIconAndType, getCleanFileInfo } from "../../utils/fileUtils";

import { useFormationDetails } from "./hooks/useFormationDetails";
import FormationAttendeesTable from "./components/FormationAttendeesTable";
import { DocumentPreviewModal, AttendanceDetailsModal } from "./components/FormationModals";

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const { t } = useTranslation();
  
  const {
    formation,
    allUsers,
    isAddingUser,
    handleAddUser,
    handleRemoveUser,
    handleDeleteFormation,
    downloadSignaturePdf
  } = useFormationDetails(id);

  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ url: "", name: "", type: "unknown" });
  const [docsOpen, setDocsOpen] = useState(false);

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
        <div className="da-card-header da-admin-header border-0 flex flex-col md:flex-row justify-between items-center gap-4 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/formations"
              className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center shrink-0 text-decoration-none"
              title={t("common.back", "Volver")}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>

            <div className="flex flex-col items-start text-left min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#73841e] bg-[#b3c34c]/20 px-2.5 py-0.5 rounded-full border border-[#b3c34c]/30 mb-1 inline-block truncate max-w-full">
                {t('formationDetails.title', 'Detalles de Formación')}
              </span>
              <h2 className="mb-0 text-slate-800 dark:text-slate-100 font-bold text-lg sm:text-2xl break-words max-w-full" style={{ lineHeight: '1.2' }}>
                {formation.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Link 
              className="da-btn-primary font-bold shadow-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 text-xs text-decoration-none" 
              to={`/formations/${id}`} 
              title={t('formations.edit')}
            >
              <FontAwesomeIcon icon={faPencil} />
              <span>{t('formations.edit', 'Editar')}</span>
            </Link>

            <Link 
              className="da-btn-blue font-bold shadow-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 text-xs text-decoration-none" 
              to={`/qr-generator?formationId=${id}`} 
              title={t('formationDetails.qrButton')}
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t('formationDetails.qrButton', 'QR')}</span>
            </Link>

            <button 
              type="button"
              className="da-btn-danger font-bold shadow-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 text-xs border-0 cursor-pointer" 
              onClick={handleDeleteFormation} 
              title={t('formations.delete')}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>{t('formations.delete', 'Eliminar')}</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] mb-6">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.description')}</h4>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">{formation.description}</p>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('formationDetails.dateTime')}</h4>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0">{dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>

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
    </div>
  );
}