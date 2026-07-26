import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Form, FormGroup, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const toast = useToast();
  
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

  const handleAddUserSuccess = () => {
    toast.success("User added to formation");
    fetch(`/api/v1/formations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setFormation(data);
        setSelectedUserId("");
      });
  };

  const handleAddUser = () => {
    if (!selectedUserId) return;
    
    fetch(`/api/v1/formations/${id}/users/${selectedUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          handleAddUserSuccess();
          return null;
        }
        return response.json();
      })
      .then((json) => {
        if (json) {
          toast.error(json.message || "Failed to add user");
        }
      })
      .catch(() => {
        toast.error("Connection error. Please try again.");
      });
  };

  const handleRemoveUserSuccess = () => {
    toast.success("User removed from formation");
    fetch(`/api/v1/formations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setFormation(data));
  };

  const handleRemoveUser = (userId) => {
    const performRemove = () => {
      fetch(`/api/v1/formations/${id}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            handleRemoveUserSuccess();
            return null;
          }
          return response.json();
        })
        .then((json) => {
          if (json) {
            toast.error(json.message || "Failed to remove user");
          }
        })
        .catch(() => {
          toast.error("Connection error. Please try again.");
        });
    };

    toast.confirm("Are you sure you want to remove this user from the formation?", performRemove);
  };

  const renderAttendanceBadge = (att) => {
    if (att.checkOutDate) {
      return <span className="badge bg-success">Completada</span>;
    }
    if (att.checkInDate) {
      return <span className="badge bg-warning text-dark">En Curso</span>;
    }
    return <span className="badge bg-secondary">Inscrito</span>;
  };

  const renderModalAttendanceBadge = (att) => {
    if (att.checkOutDate) {
      return <span className="badge bg-success" style={{ fontSize: '0.9rem' }}>Completada (Checkout realizado)</span>;
    }
    if (att.checkInDate) {
      return <span className="badge bg-warning text-dark" style={{ fontSize: '0.9rem' }}>En Curso (Check-in realizado)</span>;
    }
    return <span className="badge bg-secondary" style={{ fontSize: '0.9rem' }}>Inscrito / Sin Fichar</span>;
  };

  if (!formation) {
    return <CardGhostLoader />;
  }

  // Find users not currently attending
  const attendeeIds = formation.attendances ? formation.attendances.map(a => a.user.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

  // Find selected user label for the dropdown display
  const selectedUser = availableUsers.find(u => String(u.id) === String(selectedUserId));
  const selectedLabel = selectedUser 
    ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.username})`
    : "Select User to Add...";

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>Formation Details: {formation.name}</h2>
          <Button className="ba-btn-secondary" tag={Link} to="/formations">
            Back to List
          </Button>
        </div>

        <div className="formation-info-box">
          <h4>Description</h4>
          <p>{formation.description}</p>
          <h4>Date & Time</h4>
          <p>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>
        </div>

        <div className="ba-card-header pt-3">
          <h3>Attendees</h3>
          <Form inline className="formation-add-form" onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <UncontrolledDropdown className="w-100">
                <DropdownToggle
                  tag="button"
                  type="button"
                  className="ba-select-toggle d-flex align-items-center justify-content-between"
                  style={{ minWidth: '280px' }}
                >
                  <span>{selectedLabel}</span>
                  <span className="dropdown-caret-icon">▼</span>
                </DropdownToggle>
                <DropdownMenu className="ba-dropdown-menu w-100">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((u) => (
                      <DropdownItem
                        key={u.id}
                        className="ba-dropdown-item d-flex align-items-center justify-content-between"
                        onClick={() => setSelectedUserId(String(u.id))}
                      >
                        <span>{u.firstName} {u.lastName} ({u.username})</span>
                        {String(selectedUserId) === String(u.id) && <span className="ms-2">✓</span>}
                      </DropdownItem>
                    ))
                  ) : (
                    <DropdownItem disabled>No available users</DropdownItem>
                  )}
                </DropdownMenu>
              </UncontrolledDropdown>
            </FormGroup>
            <Button className="ba-btn-primary" type="submit" disabled={!selectedUserId}>
              Add User
            </Button>
          </Form>
        </div>

        <Table responsive className="ba-table align-middle">
          <thead>
            <tr>
              <th>Personal Code</th>
              <th>Name</th>
              <th>Username</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Actions</th>
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
                    <td>
                      {renderAttendanceBadge(att)}
                    </td>
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
                          Ver Firma / Detalles
                        </Button>
                        <Button
                          size="sm"
                          className="ba-btn-danger"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  No attendees enrolled in this formation.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal for viewing attendance details and digital signature */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={() => setModalOpen(false)} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
          Detalles de Asistencia - {formation?.name}
        </ModalHeader>
        <ModalBody className="py-4" style={{ backgroundColor: '#f4f6fa' }}>
          {selectedAttendance && (
            <div className="p-3" style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h6 className="text-muted mb-1">Formación:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>
                {formation?.name}
              </p>

              <h6 className="text-muted mb-1">Empleado:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>
                {selectedAttendance.user.firstName} {selectedAttendance.user.lastName} ({selectedAttendance.user.username})
              </p>

              <h6 className="text-muted mb-1">Código Personal:</h6>
              <p className="mb-3" style={{ fontWeight: '600', color: '#2c3e50' }}>
                {selectedAttendance.user.personalCode}
              </p>

              <h6 className="text-muted mb-1">Estado:</h6>
              <div className="mb-3">
                {renderModalAttendanceBadge(selectedAttendance)}
              </div>

              <h6 className="text-muted mb-1">Hora de Entrada (Check-in):</h6>
              <p className="mb-3" style={{ fontWeight: '500' }}>
                {selectedAttendance.checkInDate ? moment(selectedAttendance.checkInDate).format('YYYY-MM-DD HH:mm:ss') : 'No registrado'}
              </p>

              <h6 className="text-muted mb-1">Hora de Salida (Check-out):</h6>
              <p className="mb-4" style={{ fontWeight: '500' }}>
                {selectedAttendance.checkOutDate ? moment(selectedAttendance.checkOutDate).format('YYYY-MM-DD HH:mm:ss') : 'No registrado'}
              </p>

              <h6 className="text-muted mb-2">Firma Digital del Empleado:</h6>
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
                  <small className="text-muted">No se ha registrado firma digital aún para este usuario.</small>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter style={{ borderTop: 'none', backgroundColor: '#f4f6fa' }}>
          <Button color="secondary" onClick={() => setModalOpen(false)} style={{ borderRadius: '20px' }}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
