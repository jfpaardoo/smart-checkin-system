import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faPlus } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from "../../components/GlassSearchBar";
import { useToast } from "../../components/ToastProvider";
import downloadExportFile from "../../util/downloadExportFile";
import { useSubscription } from "../../hooks/useSubscription";
import UserTable from "./components/UserTable";
import UserListTabs from "./components/UserListTabs";

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

  const handleDelete = async (id) => {
    deleteFromList(
      `/api/v1/users/${id}`,
      id,
      [users, setUsers],
      toast,
      { entityName: t('users.userEntity', 'Usuario'), t }
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
        <div className="ba-card-header mb-4 border-0 pb-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h2>
                <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--ba-primary)' }} className="me-2" /> {t('users.title', 'Gestión de Empleados')}
            </h2>
            <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-md-end">
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

        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-center align-items-xl-start gap-4 mb-4">
          <UserListTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            activeCount={users.length} 
            pendingCount={pendingUsers.length} 
          />

          <div className="d-flex flex-column flex-md-row gap-3 align-items-center w-100 w-xl-auto justify-content-center justify-content-xl-end">
            <GlassSearchBar 
              placeholder={t('users.searchPlaceholder', 'Buscar por nombre, código...')}
              onSearch={(query) => setSearchQuery(query)}
            />
          </div>
        </div>
        
        <UserTable 
            users={filteredUsers} 
            loading={loading} 
            activeTab={activeTab} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            onDelete={handleDelete}
        />
      </div>
    </div>
  );
}