import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Form, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faPencil, faTrash, faExternalLinkAlt, faFilePdf, faFileLines, faFileImage, faFile, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import GlassDropdown from "../../components/GlassDropdown";
import SecureImage from "../../components/SecureImage";
import { useSubscription } from "../../hooks/useSubscription";

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();
  
  const [formation, setFormation] = useFetchState(
    null,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
    id
  );

  const [allUsers] = useFetchState(
    [],
    `/api/v1/users`,
    jwt,
    null,
    null
  );

  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ url: "", name: "", type: "unknown" });
  const [docsOpen, setDocsOpen] = useState(false);

  const getEmbedUrl = (url) => {
    if (!url) return "";
    let embedUrl = url;
    
    if (embedUrl.includes("onedrive.live.com")) {
      embedUrl = embedUrl.replace("/redir?", "/embed?").replace("/view.aspx?", "/embed?");
      embedUrl = embedUrl.replace("onedrive.live.com/?", "onedrive.live.com/embed?");
      
      if (embedUrl.includes("/embed?")) {
        return embedUrl;
      }
    }
    
    if (!embedUrl.includes("action=embedview")) {
      return embedUrl.includes("?") ? `${embedUrl}&action=embedview` : `${embedUrl}?action=embedview`;
    }
    return embedUrl;
  };

  const reloadFormation = () => {
    fetch(`/api/v1/formations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setFormation(data))
      .catch((e) => console.error("Error refreshing formation", e));
  };

  useSubscription(`/topic/formations/${id}`, reloadFormation);
  useSubscription('/topic/formations', reloadFormation);

  const handleAddUser = async () => {
    if (!selectedUserId || isAddingUser) return;
    setIsAddingUser(true);
    try {
      const response = await fetch(`/api/v1/formations/${id}/attendances`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: Number(selectedUserId) }),
      });
      if (response.ok) {
        toast.success(t('formationDetails.userAdded'));
        setSelectedUserId("");
        reloadFormation();
      } else {
        const json = await response.json();
        toast.error(json.message || t('formationDetails.userAddError'));
      }
    } catch {
      toast.error(t('formationDetails.userAddError'));
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    toast.confirm(t('formationDetails.userRemoveConfirm'), async () => {
      try {
        const response = await fetch(`/api/v1/formations/${id}/attendances/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          toast.success(t('formationDetails.userRemoved'));
          reloadFormation();
        } else {
          toast.error(t('formationDetails.userRemoveError'));
        }
      } catch {
        toast.error(t('formationDetails.userRemoveError'));
      }
    });
  };

  const handleDeleteFormation = () => {
    toast.confirm(t('formations.deleteConfirm', '¿Seguro que deseas eliminar esta formación?'), async () => {
      try {
        const response = await fetch(`/api/v1/formations/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          toast.success(t('formations.deleted', 'Formación eliminada correctamente'));
          window.location.href = "/formations";
        } else {
          toast.error(t('formations.deleteError', 'Error al eliminar la formación'));
        }
      } catch {
        toast.error(t('formations.deleteError', 'Error al eliminar la formación'));
      }
    });
  };

  const renderAttendanceBadge = (att) => {
    if (att.checkOutDate) return <span className="badge-glass-success">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary">{t('formationDetails.statusPending')}</span>;
  };

  const renderModalAttendanceBadge = renderAttendanceBadge;

  const getFileIconAndType = (fileName) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      return { icon: faFilePdf, color: '#e74c3c', type: 'pdf' };
    } else if (['.txt', '.doc', '.docx', '.odt', '.log'].some(ext => lowerName.endsWith(ext))) {
      return { icon: faFileLines, color: '#3498db', type: 'document' };
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => lowerName.endsWith(ext))) {
      return { icon: faFileImage, color: '#2ecc71', type: 'image' };
    }
    return { icon: faFile, color: '#95a5a6', type: 'other' };
  };

  const openDocumentModal = (e, url, fileName) => {
    e.currentTarget.blur();
    const fileInfo = getFileIconAndType(fileName);
    setSelectedDocument({ url, name: fileName, type: fileInfo.type });
    setDocumentModalOpen(true);
  };

  if (!formation) return <CardGhostLoader />;

  const attendeeIds = formation.attendances ? formation.attendances.map(a => a.user.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

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
                    let fileName = "Documento";
                    let url = item;

                    if (item.includes("||")) {
                      const parts = item.split("||");
                      fileName = parts[0];
                      url = parts[1];
                    } else {
                      const decoded = decodeURIComponent(item);
                      const segments = decoded.split('/');
                      fileName = segments.at(-1)?.split('?')[0] || "Documento";
                    }

                    const fileMeta = getFileIconAndType(fileName);

                    return (
                      <Button
                        key={item}
                        className="ba-btn ba-btn-blue px-3 py-2 d-flex align-items-center gap-2"
                        onClick={(e) => openDocumentModal(e, url, fileName)}
                      >
                        <FontAwesomeIcon icon={fileMeta.icon} style={{ color: fileMeta.color }} />
                        <span className="text-truncate" style={{ maxWidth: '200px' }}>{fileName}</span>
                      </Button>
                    );
                  })}
                </div>
              </Collapse>
            </div>
          )}
        </div>

        <div className="ba-card-header pt-3">
          <h3>{t('formationDetails.attendeesSection')}</h3>
          <Form className="formation-add-form d-flex gap-2 align-items-stretch" style={{ height: '42px' }} onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
            <FormGroup className="mb-0 h-100" style={{ minWidth: '280px', flex: 1, maxWidth: '400px' }}>
              <GlassDropdown
                options={availableUsers.map(u => ({
                  value: u.id,
                  label: `${u.firstName} ${u.lastName} (${u.username})`
                }))}
                value={selectedUserId}
                onChange={(val) => setSelectedUserId(String(val))}
                placeholder={t('formationDetails.selectUserToAdd')}
                searchable={true}
              />
            </FormGroup>
            <Button className="ba-btn-primary h-100 d-flex align-items-center justify-content-center px-4" type="submit" disabled={!selectedUserId || isAddingUser}>
              {isAddingUser ? 'Añadiendo...' : t('formationDetails.addUser')}
            </Button>
          </Form>
        </div>

        <Table responsive className="ba-table align-middle" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th>{t('formationDetails.personalCode')}</th>
              <th>{t('formationDetails.name')}</th>
              <th>{t('formationDetails.username')}</th>
              <th>{t('formationDetails.checkIn')}</th>
              <th>{t('formationDetails.checkOut')}</th>
              <th>{t('formationDetails.status')}</th>
              <th>{t('formationDetails.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {formation.attendances && formation.attendances.length > 0 ? (
              formation.attendances.map((att) => {
                const user = att.user;
                const isCompleted = !!att.checkOutDate;
                const hasCheckedIn = !!att.checkInDate;
                return (
                  <tr key={att.id || user.id}>
                    <td>{user.personalCode}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.username}</td>
                    <td>{hasCheckedIn ? moment(att.checkInDate).format('HH:mm:ss') : '-'}</td>
                    <td>{isCompleted ? moment(att.checkOutDate).format('HH:mm:ss') : '-'}</td>
                    <td>{renderAttendanceBadge(att)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          className="ba-btn-primary"
                          onClick={() => {
                            setSelectedAttendance(att);
                            setModalOpen(true);
                          }}
                        >
                          {t('formationDetails.viewSignature')}
                        </Button>
                        {att.signature && (
                          <Button
                            size="sm"
                            className="ba-btn-secondary"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/v1/certificates/attendance/${att.id}`, {
                                  headers: {
                                    Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
                                  }
                                });
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `certificate_${att.id}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  a.remove();
                                }
                              } catch (error) {
                                console.error("Error downloading PDF", error);
                              }
                            }}
                          >
                            PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="ba-btn-danger"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          {t('formationDetails.remove')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  {t('formationDetails.noAttendees')}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal isOpen={documentModalOpen} toggle={(e) => { e.currentTarget.blur(); setDocumentModalOpen(false); }} size="lg" centered scrollable={true}>
        <ModalHeader toggle={() => setDocumentModalOpen(false)} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
          <div className="text-truncate" style={{ maxWidth: '55vw' }}>
            <FontAwesomeIcon icon={getFileIconAndType(selectedDocument.name).icon} className="me-2" style={{ color: getFileIconAndType(selectedDocument.name).color }} />
            {selectedDocument.name}
          </div>
        </ModalHeader>
        <ModalBody className="p-2 p-md-4 text-center bg-light">
          <div className="p-3 bg-white rounded shadow-sm border">
            <h5 className="text-dark mb-3 text-break"><strong>{selectedDocument.name}</strong></h5>
            
            {(!selectedDocument.url.includes("onedrive.live.com") && !selectedDocument.url.includes("1drv.ms") && !selectedDocument.url.includes("sharepoint.com")) ? (
              <div className="mb-4" style={{ height: "500px", width: "100%", overflow: "hidden", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                <iframe 
                  src={getEmbedUrl(selectedDocument.url)} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none' }}
                  title={selectedDocument.name}
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="mb-4 d-flex flex-column align-items-center justify-content-center" style={{ height: "220px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px dashed #ced4da" }}>
                <FontAwesomeIcon icon={getFileIconAndType(selectedDocument.name).icon} style={{ fontSize: "50px", color: getFileIconAndType(selectedDocument.name).color, marginBottom: "15px" }} />
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
              href={selectedDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary ba-btn-blue px-4 py-2 d-inline-flex align-items-center gap-2 text-wrap"
              style={{ lineHeight: '1.4' }}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
              {t('common.openSecure', 'Abrir / Ver Documento en la Nube')}
            </a>
          </div>
        </ModalBody>
        <ModalFooter style={{ backgroundColor: '#f4f6fa', borderTop: 'none' }}>
          <Button color="secondary" onClick={(e) => { e.currentTarget.blur(); setDocumentModalOpen(false); }} style={{ borderRadius: '20px' }}>
            {t('formationDetails.close')}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered scrollable={true} style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={() => setModalOpen(false)} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
          {t('formationDetails.attendanceDetails')} - {formation?.name}
        </ModalHeader>
        <ModalBody className="py-4" style={{ backgroundColor: '#f4f6fa' }}>
          {selectedAttendance && (
            <div className="p-2" style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.formation')}:</h6>
              <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{formation?.name}</p>

              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.employee')}:</h6>
              <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>
                {selectedAttendance.user.firstName} {selectedAttendance.user.lastName} ({selectedAttendance.user.username})
              </p>

              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.personalCodeLabel')}:</h6>
              <p className="mb-2" style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{selectedAttendance.user.personalCode}</p>

              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.statusLabel')}:</h6>
              <div className="mb-2">{renderModalAttendanceBadge(selectedAttendance)}</div>

              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.checkInTime')}:</h6>
              <p className="mb-2" style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                {selectedAttendance.checkInDate ? moment(selectedAttendance.checkInDate).format('YYYY-MM-DD HH:mm:ss') : t('formationDetails.notRecorded')}
              </p>

              <h6 className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{t('formationDetails.checkOutTime')}:</h6>
              <p className="mb-3" style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                {selectedAttendance.checkOutDate ? moment(selectedAttendance.checkOutDate).format('YYYY-MM-DD HH:mm:ss') : t('formationDetails.notRecorded')}
              </p>

              <h6 className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{t('formationDetails.digitalSignature')}:</h6>
              {selectedAttendance.signature ? (
                <div className="text-center p-1" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <SecureImage 
                    src={selectedAttendance.signature.startsWith('data:image') ? selectedAttendance.signature : `/api/v1/signatures/${selectedAttendance.signature}`} 
                    alt={`Firma de ${selectedAttendance.user.firstName}`}
                    style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }} 
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
          <Button color="secondary" onClick={() => setModalOpen(false)} style={{ borderRadius: '20px' }}>
            {t('formationDetails.close')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}