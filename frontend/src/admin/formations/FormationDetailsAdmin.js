import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Form, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import GlassDropdown from "../../components/GlassDropdown";
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
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    if (!selectedUserId) return;
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

  const renderAttendanceBadge = (att) => {
    if (att.checkOutDate) return <span className="badge bg-success">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge bg-warning text-dark">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge bg-secondary">{t('formationDetails.statusPending')}</span>;
  };

  const renderModalAttendanceBadge = renderAttendanceBadge;

  if (!formation) return <CardGhostLoader />;

  const attendeeIds = formation.attendances ? formation.attendances.map(a => a.user.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>{t('formationDetails.title')}: {formation.name}</h2>
          <div className="d-flex gap-2">
            <Button className="ba-btn-blue" tag={Link} to={`/qr-generator?formationId=${id}`} title={t('formationDetails.qrButton')}>
              <FontAwesomeIcon icon={faQrcode} className="me-2" />{t('formationDetails.qrButton')}
            </Button>
            <Button className="ba-btn-secondary" tag={Link} to="/formations">
              {t('formationDetails.backToList')}
            </Button>
          </div>
        </div>

        <div className="formation-info-box">
          <h4>{t('formationDetails.description')}</h4>
          <p>{formation.description}</p>
          <h4>{t('formationDetails.dateTime')}</h4>
          <p>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>
        </div>

        <div className="ba-card-header pt-3">
          <h3>{t('formationDetails.attendeesSection')}</h3>
          <Form inline className="formation-add-form" onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0" style={{ minWidth: '280px' }}>
              <GlassDropdown
                options={availableUsers.map(u => ({
                  value: u.id,
                  label: `${u.firstName} ${u.lastName} (${u.username})`
                }))}
                value={selectedUserId}
                onChange={(val) => setSelectedUserId(String(val))}
                placeholder={t('formationDetails.selectUserToAdd')}
              />
            </FormGroup>
            <Button className="ba-btn-primary" type="submit" disabled={!selectedUserId}>
              {t('formationDetails.addUser')}
            </Button>
          </Form>
        </div>

        <Table responsive className="ba-table align-middle">
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

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={() => setModalOpen(false)} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
          {t('formationDetails.attendanceDetails')} - {formation?.name}
        </ModalHeader>
        <ModalBody className="py-4" style={{ backgroundColor: '#f4f6fa' }}>
          {selectedAttendance && (
            <div className="p-3" style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h6 className="text-muted mb-1">{t('formationDetails.formation')}:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>{formation?.name}</p>

              <h6 className="text-muted mb-1">{t('formationDetails.employee')}:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>
                {selectedAttendance.user.firstName} {selectedAttendance.user.lastName} ({selectedAttendance.user.username})
              </p>

              <h6 className="text-muted mb-1">{t('formationDetails.personalCodeLabel')}:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>{selectedAttendance.user.personalCode}</p>

              <h6 className="text-muted mb-1">{t('formationDetails.statusLabel')}:</h6>
              <div className="mb-3">{renderModalAttendanceBadge(selectedAttendance)}</div>

              <h6 className="text-muted mb-1">{t('formationDetails.checkInTime')}:</h6>
              <p className="mb-3" style={{ fontWeight: '500' }}>
                {selectedAttendance.checkInDate ? moment(selectedAttendance.checkInDate).format('YYYY-MM-DD HH:mm:ss') : t('formationDetails.notRecorded')}
              </p>

              <h6 className="text-muted mb-1">{t('formationDetails.checkOutTime')}:</h6>
              <p className="mb-4" style={{ fontWeight: '500' }}>
                {selectedAttendance.checkOutDate ? moment(selectedAttendance.checkOutDate).format('YYYY-MM-DD HH:mm:ss') : t('formationDetails.notRecorded')}
              </p>

              <h6 className="text-muted mb-2">{t('formationDetails.digitalSignature')}:</h6>
              {selectedAttendance.signature ? (
                <div className="text-center p-2" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <img 
                    src={selectedAttendance.signature} 
                    alt={`Firma de ${selectedAttendance.user.firstName}`}
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }} 
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
