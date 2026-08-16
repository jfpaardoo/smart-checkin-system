import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import deleteFromList from "../../util/deleteFromList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faPlus, faFilter } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassDropdown from "../../components/GlassDropdown";
import GlassPagination from "../../components/GlassPagination";
import { useToast } from "../../components/ToastProvider";
import downloadExportFile from "../../util/downloadExportFile";
import { useSubscription } from "../../hooks/useSubscription";
import api from "../../services/api";
import UserTable from "./components/UserTable";
import UserListTabs from "./components/UserListTabs";

const matchesUserSearch = (user, query) => {
  if (!query?.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    user.username?.toLowerCase().includes(q) ||
    user.firstName?.toLowerCase().includes(q) ||
    user.lastName?.toLowerCase().includes(q) ||
    user.personalCode?.toLowerCase().includes(q) ||
    user.locator?.toLowerCase().includes(q) ||
    user.company?.name?.toLowerCase().includes(q)
  );
};

const matchesCompanyFilter = (user, selectedCompany) => {
  if (!selectedCompany) return true;
  if (selectedCompany === 'NONE') return !user.company;
  return String(user.company?.id) === String(selectedCompany);
};

const matchesStatusFilter = (user, selectedStatus, isPending) => {
  if (isPending || selectedStatus === 'ALL') return true;
  if (selectedStatus === 'WORKING') return Boolean(user.isWorking);
  if (selectedStatus === 'RESTING') return !user.isWorking;
  return true;
};

export default function UserListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('approved');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtros avanzados
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : '';
      const res = await api.get(`/users${params}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/pending');
      setPendingUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch pending users", error);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch companies", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers(searchQuery);
    fetchPendingUsers();
    fetchCompanies();
  }, [fetchUsers, fetchPendingUsers, fetchCompanies, searchQuery]);

  const handleWsMessage = useCallback(() => {
    fetchUsers(searchQuery);
    fetchPendingUsers();
  }, [fetchUsers, fetchPendingUsers, searchQuery]);

  useSubscription('/topic/users', handleWsMessage);

  const handleApprove = async (id) => {
    try {
      await api.put(`/users/${id}/approve`);
      toast.success(t('users.approvedSuccess', 'Empleado aprobado y activado con éxito.'));
      fetchPendingUsers();
      fetchUsers(searchQuery);
    } catch (err) {
      const msg = err.response?.data?.message || t('users.approveError', 'Error al aprobar empleado.');
      toast.error(msg);
    }
  };

  const handleReject = async (id) => {
    deleteFromList(
      `/users/${id}`,
      id,
      [pendingUsers, setPendingUsers],
      toast,
      { entityName: t('users.registrationRequest', 'Solicitud de registro'), t }
    );
  };

  const handleDelete = async (id) => {
    deleteFromList(
      `/users/${id}`,
      id,
      [users, setUsers],
      toast,
      { entityName: t('users.userEntity', 'Usuario'), t }
    );
  };

  // Conteo de roles para las pestañas
  const adminCount = useMemo(() => users.filter(u => u.authority?.authority === 'ADMIN').length, [users]);
  const employeeCount = useMemo(() => users.filter(u => u.authority?.authority !== 'ADMIN').length, [users]);

  // Selección de lista base según pestaña
  const baseList = useMemo(() => {
    if (activeTab === 'pending') return pendingUsers;
    if (activeTab === 'admins') return users.filter(u => u.authority?.authority === 'ADMIN');
    if (activeTab === 'employees') return users.filter(u => u.authority?.authority !== 'ADMIN');
    return users;
  }, [activeTab, users, pendingUsers]);

  // Filtrado compuesto
  const filteredUsers = useMemo(() => {
    const isPending = activeTab === 'pending';
    return baseList.filter((user) => 
      matchesUserSearch(user, searchQuery) &&
      matchesCompanyFilter(user, selectedCompany) &&
      matchesStatusFilter(user, selectedStatus, isPending)
    );
  }, [baseList, searchQuery, selectedCompany, selectedStatus, activeTab]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedCompany, selectedStatus, pageSize]);

  // Paginación de resultados
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleDownloadExport = (endpoint, defaultFilename) => {
    downloadExportFile(endpoint, defaultFilename, toast, t);
  };

  return (
    <div className="da-container">
      <div className="da-card">
        
        {/* Cabecera Liquid Glass */}
        <div className="da-card-header da-admin-header border-0 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full md:w-auto">
              <div className="p-3.5 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] text-2xl flex-shrink-0 flex items-center justify-center shadow-xs">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div>
                <h2 className="mb-1 text-2xl font-bold text-slate-800">
                  {t('users.title', 'Gestión de Empleados y Usuarios')}
                </h2>
                <p className="text-xs text-slate-500 mb-0">
                  {t('users.subtitle', 'Administra los roles, centros asociados, estado de actividad y solicitudes de registro')}
                </p>
              </div>
            </div>
            
            <div className="da-admin-header-actions flex flex-wrap gap-2 w-full md:w-auto justify-end">
                {/* Botón CSV */}
                <Button 
                  className="da-btn-primary btn-icon-expand btn-expand-lg bg-[#b3c34c]/80 hover:bg-[#b3c34c] text-slate-900 border-0 shadow-sm" 
                  onClick={() => handleDownloadExport('users/csv', 'usuarios.csv')}
                >
                    <FontAwesomeIcon icon={faFileCsv} />
                    <span className="btn-expand-label ms-1">{t('analytics.exportCsv', 'Exportar CSV')}</span>
                </Button>
                
                {/* Botón Excel */}
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

        {/* Pestañas de Roles y Solicitudes */}
        <div className="mb-4">
          <UserListTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            allCount={users.length}
            adminCount={adminCount}
            employeeCount={employeeCount} 
            pendingCount={pendingUsers.length} 
          />
        </div>

        {/* Barra de Filtros y Búsqueda Liquid Glass */}
        <div className="p-4 rounded-[28px] bg-white/30 backdrop-blur-md border border-white/50 shadow-xs mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-30">
          {/* Buscador */}
          <div className="md:col-span-6">
            <GlassSearchBar 
              placeholder={t('users.searchPlaceholder', 'Buscar por nombre, código, usuario o empresa...')}
              onSearch={(query) => setSearchQuery(query)}
            />
          </div>

          {/* Filtro de Empresa */}
          <div className="md:col-span-3">
            <GlassDropdown
              options={[
                { value: '', label: t('users.allCompanies', 'Todas las empresas') },
                { value: 'NONE', label: t('users.noCompanyFilter', 'Sin empresa asignada') },
                ...companies.map(c => ({
                  value: c.id,
                  label: c.name
                }))
              ]}
              value={selectedCompany}
              onChange={(val) => setSelectedCompany(val)}
              placeholder={t('users.filterByCompany', 'Filtrar por Empresa')}
              className="w-full"
            />
          </div>

          {/* Filtro de Estado (solo en pestaña de activos) */}
          <div className="md:col-span-3">
            {activeTab !== 'pending' ? (
              <GlassDropdown
                options={[
                  { value: 'ALL', label: t('users.allStates', 'Todos los estados') },
                  { value: 'WORKING', label: t('users.statusWorking', 'Trabajando') },
                  { value: 'RESTING', label: t('users.statusResting', 'Descansando') }
                ]}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                placeholder={t('users.filterByStatus', 'Filtrar por Estado')}
                className="w-full"
              />
            ) : (
              <div className="text-xs text-slate-500 italic flex items-center gap-1.5 px-2">
                <FontAwesomeIcon icon={faFilter} className="text-[#8fa228]" />
                {t('users.pendingFilterHint', 'Mostrando solicitudes que esperan validación')}
              </div>
            )}
          </div>
        </div>
        
        {/* Tabla de Usuarios */}
        <UserTable 
            users={paginatedUsers} 
            loading={loading} 
            activeTab={activeTab} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            onDelete={handleDelete}
        />

        {/* Paginación Liquid Glass */}
        {!loading && filteredUsers.length > 0 && (
          <GlassPagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>
    </div>
  );
}