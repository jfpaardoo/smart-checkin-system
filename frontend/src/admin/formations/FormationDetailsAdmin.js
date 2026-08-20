import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Collapse } from "reactstrap";
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
        <div className="da-card-header da-admin-header border-0 flex flex-col md:flex-row justify-between items-center gap-4 pb-4 mb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/formations"
              className="p-2.5 rounded-2xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center shrink-0"
              title={t("common.back", "Volver")}
              style={{ textDecoration: 'none' }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>

            <div className="flex flex-col items-start text-left min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#73841e] bg-[#b3c34c]/20 px-2.5 py-0.5 rounded-full border border-[#b3c34c]/30 mb-1 inline-block truncate max-w-full">
                {t('formationDetails.title', 'Detalles de Formación')}
              </span>
              <h2 className="mb-0 text-slate-800 fw-bold text-lg sm:text-2xl break-words max-w-full" style={{ lineHeight: '1.2' }}>
                {formation.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Button 
              size="sm" 
              className="da-btn-primary font-bold shadow-xs px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-1.5" 
              tag={Link} 
              to={`/formations/${id}`} 
              title={t('formations.edit')}
            >
              <FontAwesomeIcon icon={faPencil} />
              <span>{t('formations.edit', 'Editar')}</span>
            </Button>

            <Button 
              size="sm" 
              className="da-btn-blue font-bold shadow-xs px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-1.5" 
              tag={Link} 
              to={`/qr-generator?formationId=${id}`} 
              title={t('formationDetails.qrButton')}
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span>{t('formationDetails.qrButton', 'QR')}</span>
            </Button>

            <Button 
              size="sm" 
              className="da-btn-danger font-bold shadow-xs px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-1.5" 
              onClick={handleDeleteFormation} 
              title={t('formations.delete')}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>{t('formations.delete', 'Eliminar')}</span>
            </Button>
          </div>
        </div>

        <div className="formation-info-box">
          <h4>{t('formationDetails.description')}</h4>
          <p>{formation.description}</p>
          <h4>{t('formationDetails.dateTime')}</h4>
          <p>{dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>

          {formation.documentUrls && formation.documentUrls.length > 0 && (
            <div className="formation-document-section mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.4)' }}>
              <button 
                type="button"
                className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent p-0 m-0 text-start" 
                onClick={() => setDocsOpen(!docsOpen)}
                style={{ cursor: 'pointer' }}
              >
                <span className="h4 mb-0 text-primary d-flex align-items-center gap-2" style={{ fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>
                  <FontAwesomeIcon icon={faFileLines} />
                  {t('formationDetails.documentation', 'Documentación Adjunta')} ({formation.documentUrls.length})
                </span>
                <span className="p-0 text-primary">
                  <FontAwesomeIcon icon={docsOpen ? faChevronUp : faChevronDown} />
                </span>
              </button>
              
              <Collapse isOpen={docsOpen}>
                <div className="da-file-list">
                  {formation.documentUrls.map((item) => {
                    const fileMeta = getCleanFileInfo(item);

                    return (
                      <Button
                        key={item}
                        className="da-btn da-btn-blue px-3 py-2 d-flex align-items-center gap-2"
                        onClick={(e) => openDocumentModal(e, fileMeta.url, fileMeta.name)}
                      >
                        <FontAwesomeIcon icon={fileMeta.icon} style={{ color: fileMeta.color }} />
                        <span className="text-truncate" style={{ maxWidth: '200px' }}>{fileMeta.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </Collapse>
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