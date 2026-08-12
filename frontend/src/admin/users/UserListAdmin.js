import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
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
      let url = `/api/v1/users`;
      if (query) {
        url = `/api/v1/users?search=${encodeURIComponent(query)}`;
      }
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
    <div className="da-container">
      <div className="da-card">
        
        {/* Cabecera con el botón de Excel mejorado con Liquid Glass */}
        <div className="da-card-header da-admin-header border-0">
            <h2>
                <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--da-primary)' }} className="me-2" /> 
                {t('users.title', 'Gestión de Empleados')}
            </h2>
            <div className="da-admin-header-actions">
                {/* Botón CSV */}
                <Button 
                  className="da-btn-primary btn-icon-expand btn-expand-lg bg-[#b3c34c]/80 hover:bg-[#b3c34c] text-slate-900 border-0 shadow-sm" 
                  onClick={() => handleDownloadExport('users/csv', 'usuarios.csv')}
                >
                    <FontAwesomeIcon icon={faFileCsv} />
                    <span className="btn-expand-label ms-1">{t('analytics.exportCsv', 'Exportar CSV')}</span>
                </Button>
                
                {/* Botón Excel con efecto Liquid Glass acentuado */}
                <Button 
                  className="da-btn-secondary btn-icon-expand btn-expand-lg bg-slate-500/30 hover:bg-slate-500/50 text-slate-800 border border-white/60 backdrop-blur-xl shadow-[0_8px_20px_0_rgba(31,38,135,0.07)] transition duration-300 hover:-translate-y-0.5" 
                  onClick={() => handleDownloadExport('users/excel', 'usuarios.xlsx')}
                >
                    <FontAwesomeIcon icon={faFileExcel} className="text-slate-700" />
                    <span className="btn-expand-label ms-1 font-semibold">{t('analytics.exportExcel', 'Exportar Excel')}</span>
                </Button>

                {/* Botón Principal Añadir */}
                <Button className="da-btn-primary shadow-[0_0_15px_rgba(179,195,76,0.6)]" tag={Link} to="/users/new">
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('users.addUser', 'Añadir Empleado')}
                </Button>
            </div>
        </div>

        {/* Controles y pestañas originales */}
        <div className="da-admin-controls">
          <UserListTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            activeCount={users.length} 
            pendingCount={pendingUsers.length} 
          />

          <div className="da-admin-search-wrapper">
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