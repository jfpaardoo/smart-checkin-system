import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Collapse } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faPencil, faTrash, faFileLines, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import moment from "moment";
import getIdFromUrl from "../../util/getIdFromUrl";
import { CardGhostLoader } from "../../components/GhostLoader";
import { getFileIconAndType, getCleanFileInfo } from "../../utils/fileUtils";

import { useFormationDetails } from "./hooks/useFormationDetails";
import FormationAttendeesTable from "./components/FormationAttendeesTable";
import { DocumentPreviewModal, AttendanceDetailsModal } from "./components/FormationModals";

import "../../App.css";
import "../../static/css/admin/adminPage.css";

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
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
          <h2 className="mb-0 flex-grow-1 text-wrap" style={{ lineHeight: '1.2' }}>
            {t('formationDetails.title')}: {formation.name}
          </h2>
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-center">
            <Button size="sm" className="ba-btn-secondary px-3 py-2 text-nowrap" tag={Link} to={`/formations/${id}`} title={t('formations.edit')}>
              <FontAwesomeIcon icon={faPencil} className="me-1" />{t('formations.edit')}
            </Button>
            <Button size="sm" className="ba-btn-blue px-3 py-2 text-nowrap" tag={Link} to={`/qr-generator?formationId=${id}`} title={t('formationDetails.qrButton')}>
              <FontAwesomeIcon icon={faQrcode} className="me-1" />{t('formationDetails.qrButton')}
            </Button>
            <Button size="sm" className="ba-btn-danger px-3 py-2 text-nowrap" onClick={handleDeleteFormation} title={t('formations.delete')}>
              <FontAwesomeIcon icon={faTrash} className="me-1" />{t('formations.delete')}
            </Button>
            <Button size="sm" className="ba-btn-secondary px-3 py-2 text-nowrap" tag={Link} to="/formations">
              {t('formationDetails.backToList')}
            </Button>
          </div>
        </div>

        <div className="formation-info-box">
          <h4>{t('formationDetails.description')}</h4>
          <p>{formation.description}</p>
          <h4>{t('formationDetails.dateTime')}</h4>
          <p>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>

          {formation.documentUrls && formation.documentUrls.length > 0 && (
            <div className="formation-document-section mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.4)' }}>
              <button 
                className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent p-0 m-0 text-start" 
                onClick={() => setDocsOpen(!docsOpen)}
                style={{ cursor: 'pointer' }}
              >
                <span className="h4 mb-0 text-primary d-flex align-items-center gap-2" style={{ fontFamily: 'var(--ba-font-family)', fontWeight: 700 }}>
                  <FontAwesomeIcon icon={faFileLines} />
                  {t('formationDetails.documentation', 'Documentación Adjunta')} ({formation.documentUrls.length})
                </span>
                <span className="p-0 text-primary">
                  <FontAwesomeIcon icon={docsOpen ? faChevronUp : faChevronDown} />
                </span>
              </button>
              
              <Collapse isOpen={docsOpen}>
                <div className="d-flex flex-wrap gap-2 mt-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {formation.documentUrls.map((item) => {
                    const fileMeta = getCleanFileInfo(item);

                    return (
                      <Button
                        key={item}
                        className="ba-btn ba-btn-blue px-3 py-2 d-flex align-items-center gap-2"
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