import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { getFileIconAndType, getEmbedUrl } from "../../../utils/fileUtils";
import { formatDate } from "../../../utils/dateUtils";
import SecureImage from "../../../components/SecureImage";

export function DocumentPreviewModal({ isOpen, toggle, document }) {
  const { t } = useTranslation();

  if (!document) return null;

  const fileInfo = getFileIconAndType(document.name);
  
  return (
    <Modal isOpen={isOpen} toggle={(e) => { e.currentTarget.blur(); toggle(); }} size="lg" centered scrollable={true}>
      <ModalHeader toggle={toggle} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
        <div className="text-truncate" style={{ maxWidth: '55vw' }}>
          <FontAwesomeIcon icon={fileInfo.icon} className="me-2" style={{ color: fileInfo.color }} />
          {document.name}
        </div>
      </ModalHeader>
      <ModalBody className="p-2 p-md-4 text-center bg-light">
        <div className="p-3 bg-white rounded shadow-sm border">
          <h5 className="text-dark mb-3 text-break"><strong>{document.name}</strong></h5>
          
          {(!document.url.includes("onedrive.live.com") && !document.url.includes("1drv.ms") && !document.url.includes("sharepoint.com")) ? (
            <div className="mb-4" style={{ height: "500px", width: "100%", overflow: "hidden", borderRadius: "8px", border: "1px solid #dee2e6" }}>
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
            <div className="mb-4 d-flex flex-column align-items-center justify-content-center" style={{ height: "220px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px dashed #ced4da" }}>
              <FontAwesomeIcon icon={fileInfo.icon} style={{ fontSize: "50px", color: fileInfo.color, marginBottom: "15px" }} />
              <h5 className="text-muted">{t('formationDetails.previewNotAvailable', 'Previsualización no disponible')}</h5>
              <p className="text-muted small text-center px-4">
                {t('formationDetails.cspMessage', 'Por políticas de seguridad de Microsoft OneDrive, este documento no puede incrustarse directamente aquí.')}
              </p>
            </div>
          )}
          
          <p className="text-muted small mb-4">
            {t('formationDetails.cloudDocDescription', 'Este documento está almacenado de forma segura en la nube. Haz clic en el botón inferior para abrirlo.')}
          </p>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary da-btn-blue px-4 py-2 d-inline-flex align-items-center gap-2 text-wrap"
            style={{ lineHeight: '1.4' }}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
            {t('common.openSecure', 'Abrir / Ver Documento en la Nube')}
          </a>
        </div>
      </ModalBody>
      <ModalFooter style={{ backgroundColor: '#f4f6fa', borderTop: 'none' }}>
        <Button color="secondary" onClick={(e) => { e.currentTarget.blur(); toggle(); }} style={{ borderRadius: '20px' }}>
          {t('formationDetails.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function AttendanceDetailsModal({ isOpen, toggle, attendance, formationName }) {
  const { t } = useTranslation();

  const renderBadge = (att) => {
    if (att.checkOutDate) return <span className="badge-glass-success">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary">{t('formationDetails.statusPending')}</span>;
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered scrollable={true} style={{ maxWidth: '500px' }}>
      <ModalHeader toggle={toggle} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
        {t('formationDetails.attendanceDetails')} - {formationName}
      </ModalHeader>
      <ModalBody className="py-4" style={{ backgroundColor: '#f4f6fa' }}>
        {attendance && (
          <div className="p-2" style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.formation')}:</h6>
            <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{formationName}</p>

            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.employee')}:</h6>
            <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>
              {attendance.user.firstName} {attendance.user.lastName} ({attendance.user.username})
            </p>

            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.personalCodeLabel')}:</h6>
            <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{attendance.user.personalCode}</p>

            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.statusLabel')}:</h6>
            <div className="mb-2">{renderBadge(attendance)}</div>

            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.checkInTime')}:</h6>
            <p className="mb-2 notranslate" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }} translate="no">
              {attendance.checkInDate ? formatDate(attendance.checkInDate) : t('formationDetails.notRecorded')}
            </p>

            <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.checkOutTime')}:</h6>
            <p className="mb-3 notranslate" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }} translate="no">
              {attendance.checkOutDate ? formatDate(attendance.checkOutDate) : t('formationDetails.notRecorded')}
            </p>

            <h6 className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{t('formationDetails.digitalSignature')}:</h6>
            {attendance.signature ? (
              <div className="mx-auto max-w-[265px] bg-white rounded-xl border border-dashed border-slate-300 p-2 shadow-inner overflow-hidden flex justify-center items-center">
                <SecureImage 
                  src={attendance.signature.startsWith('data:image') ? attendance.signature : `/api/v1/signatures/${attendance.signature}`} 
                  alt={`Firma de ${attendance.user.firstName}`}
                  className="w-full h-[110px] object-contain block mx-auto" 
                />
              </div>
            ) : (
              <div className="alert alert-light text-center border mb-0" style={{ borderRadius: '12px' }}>
                <small className="text-muted">{t('formationDetails.noSignature')}</small>
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter style={{ borderTop: 'none', backgroundColor: '#f4f6fa' }}>
        <Button color="secondary" onClick={toggle} style={{ borderRadius: '20px' }}>
          {t('formationDetails.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}