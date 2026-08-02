import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Badge, Nav, NavItem, NavLink } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faPlus, faCheck, faTimes, faClock } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from "../../components/GlassSearchBar";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import downloadExportFile from "../../util/downloadExportFile";
import { useSubscription } from "../../hooks/useSubscription";

export default function UserListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('approved');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/v1/users?search=${encodeURIComponent(query)}` 
        : `/api/v1/users`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/users/pending', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch pending users", error);
    }
  }, [jwt]);

  useEffect(() => {
    fetchUsers(searchQuery);
    fetchPendingUsers();
  }, [fetchUsers, fetchPendingUsers, searchQuery]);

  const handleWsMessage = useCallback(() => {
    fetchUsers(searchQuery);
    fetchPendingUsers();
  }, [fetchUsers, fetchPendingUsers, searchQuery]);

  useSubscription('/topic/users', handleWsMessage);

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`/api/v1/users/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (response.ok) {
        toast.success(t('users.approvedSuccess', 'Empleado aprobado y activado con éxito.'));
        fetchPendingUsers();
        fetchUsers(searchQuery);
      } else {
        toast.error(t('users.approveError', 'Error al aprobar empleado.'));
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id) => {
    deleteFromList(
      `/api/v1/users/${id}`,
      id,
      [pendingUsers, setPendingUsers],
      toast,
      { entityName: t('users.registrationRequest', 'Solicitud de registro'), t }
    );
  };

  const currentList = activeTab === 'approved' ? users : pendingUsers;

  const filteredUsers = currentList.filter((user) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (user.username?.toLowerCase().includes(q)) ||
      (user.firstName?.toLowerCase().includes(q)) ||
      (user.lastName?.toLowerCase().includes(q)) ||
      (user.personalCode?.toLowerCase().includes(q))
    );
  });

  const handleDownloadExport = (endpoint, defaultFilename) => {
    downloadExportFile(endpoint, defaultFilename, toast, t);
  };

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header flex-wrap gap-3">
            <h2>
                <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--ba-primary)' }} className="me-2" /> {t('users.title', 'Gestión de Empleados')}
            </h2>
            <div className="d-flex gap-2 align-items-center flex-wrap">
                <Button className="ba-btn-primary btn-icon-expand btn-expand-lg" onClick={() => handleDownloadExport('users/csv', 'usuarios.csv')}>
                    <FontAwesomeIcon icon={faFileCsv} />
                    <span className="btn-expand-label">{t('analytics.exportCsv', 'Exportar CSV')}</span>
                </Button>
                <Button className="ba-btn-secondary btn-icon-expand btn-expand-lg" onClick={() => handleDownloadExport('users/excel', 'usuarios.xlsx')}>
                    <FontAwesomeIcon icon={faFileExcel} />
                    <span className="btn-expand-label">{t('analytics.exportExcel', 'Exportar Excel')}</span>
                </Button>
                <Button className="ba-btn-primary" tag={Link} to="/users/new">
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('users.addUser', 'Añadir Empleado')}
                </Button>
            </div>
        </div>

        <Nav tabs className="mb-4 border-bottom-0 gap-2">
          <NavItem>
            <NavLink
              className={`ba-tab-pill ${activeTab === 'approved' ? 'ba-tab-pill-active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <FontAwesomeIcon icon={faUsers} className="me-1" />
              {t('users.activeEmployees', 'Empleados Activos')} ({users.length})
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={`ba-tab-pill ${activeTab === 'pending' ? 'ba-tab-pill-pending' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <FontAwesomeIcon icon={faClock} className="me-1" />
              {t('users.pendingRequestsTab', 'Solicitudes Pendientes')}
              {pendingUsers.length > 0 && (
                <Badge color="danger" pill className="ms-2">
                  {pendingUsers.length}
                </Badge>
              )}
            </NavLink>
          </NavItem>
        </Nav>

        <div className="mb-4">
          <GlassSearchBar 
            placeholder={t('analytics.searchEmployee', 'Buscar empleado por nombre o código...')}
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>
        
        {loading ? (
          <TableGhostLoader columns={7} rows={4} />
        ) : (
          <Table hover aria-label="users" className="ba-table align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '9%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
                <th style={{ width: '13%' }}>{t('users.username', 'Usuario')}</th>
                <th style={{ width: '14%' }}>{t('users.firstName', 'Nombre')}</th>
                <th style={{ width: '14%' }}>{t('users.lastName', 'Apellidos')}</th>
                <th style={{ width: '17%' }}>{t('users.status', 'Estado')}</th>
                <th style={{ width: '11%' }}>{t('users.role', 'Rol')}</th>
                <th style={{ width: '22%' }}>{t('users.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ paddingLeft: '1rem' }}><span className="fw-bold">{user.personalCode}</span></td>
                    <td style={{ wordBreak: 'break-word' }}>{user.username}</td>
                    <td style={{ wordBreak: 'break-word' }}>{user.firstName}</td>
                    <td style={{ wordBreak: 'break-word' }}>{user.lastName}</td>
                    <td className="text-center">
                      {activeTab === 'approved' ? (
                        <span className={`ba-badge ${user.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`} style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                          {user.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold" style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                          {t('users.pendingApproval', 'Pendiente de Aprobación')}
                        </span>
                      )}
                    </td>
                    <td className="fw-bold text-truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.authority?.authority || 'EMPLOYEE'}>
                      {user.authority?.authority || 'EMPLOYEE'}
                    </td>
                    <td>
                      {activeTab === 'approved' ? (
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="ba-btn-secondary"
                            tag={Link}
                            to={"/users/" + user.id}
                          >
                            {t('users.edit', 'Editar')}
                          </Button>
                          <Button
                            size="sm"
                            className="ba-btn-danger"
                            onClick={() =>
                              deleteFromList(
                                `/api/v1/users/${user.id}`,
                                user.id,
                                [users, setUsers],
                                toast,
                                { entityName: t('users.userEntity', 'Usuario'), t }
                              )
                            }
                          >
                            {t('users.delete', 'Eliminar')}
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="ba-btn-primary d-flex align-items-center gap-1 fw-bold"
                            onClick={() => handleApprove(user.id)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                            {t('users.approve', 'Aprobar')}
                          </Button>
                          <Button
                            size="sm"
                            className="ba-btn-danger d-flex align-items-center gap-1 fw-bold"
                            onClick={() => handleReject(user.id)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                            {t('users.reject', 'Rechazar')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-muted">
                    {t('common.noResults', 'No se encontraron registros.')}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}