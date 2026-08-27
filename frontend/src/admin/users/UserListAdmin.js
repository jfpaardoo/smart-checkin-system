import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faFilePdf, faPlus, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassDropdown from "../../components/GlassDropdown";
import GlassPageHeader from "../../components/GlassPageHeader";
import GlassPagination from "../../components/GlassPagination";
import { useToast } from "../../components/ToastProvider";
import downloadExportFile from "../../util/downloadExportFile";
import { useSubscription } from "../../hooks/useSubscription";
import api from "../../services/api";
import UserTable from "./components/UserTable";
import UserListTabs from "./components/UserListTabs";
import GlassConfirmModal from "../../components/GlassConfirmModal";

const swrFetcher = (url) => api.get(url).then(res => res.data);

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

  const [activeTab, setActiveTab] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtros avanzados
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Paginación y Exportación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportingType, setExportingType] = useState(null);

  // SWR Hooks for caching and optimistic revalidation
  const usersUrl = searchQuery ? `/users?search=${encodeURIComponent(searchQuery)}` : '/users';
  const { data: usersData, mutate: mutateUsers, isLoading: usersLoading } = useSWR(usersUrl, swrFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000
  });

  const { data: pendingUsersData, mutate: mutatePending } = useSWR('/users/pending', swrFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000
  });

  const { data: companiesData } = useSWR('/companies', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });

  const users = useMemo(() => Array.isArray(usersData) ? usersData : [], [usersData]);
  const pendingUsers = useMemo(() => Array.isArray(pendingUsersData) ? pendingUsersData : [], [pendingUsersData]);
  const companies = useMemo(() => Array.isArray(companiesData) ? companiesData : [], [companiesData]);
  const loading = usersLoading && users.length === 0;

  const handleWsMessage = useCallback(() => {
    mutateUsers();
    mutatePending();
  }, [mutateUsers, mutatePending]);

  useSubscription('/topic/users', handleWsMessage);

  // Estado para el modal de confirmación de borrado
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleApprove = async (id) => {
    try {
      await api.put(`/users/${id}/approve`);
      toast.success(t('users.approvedSuccess', 'Empleado aprobado y activado con éxito.'));
      mutatePending();
      mutateUsers();
    } catch (err) {
      const msg = err.response?.data?.message || t('users.approveError', 'Error al aprobar empleado.');
      toast.error(msg);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success(t('common.deletedSuccess', 'Registro eliminado correctamente'));
      mutatePending();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.deleteError', 'Error al eliminar'));
    }
  };

  const handleRequestDelete = (userOrId) => {
    if (typeof userOrId === 'object' && userOrId !== null) {
      setUserToDelete(userOrId);
    } else {
      const found = users.find(u => u.id === userOrId) || pendingUsers.find(u => u.id === userOrId) || { id: userOrId };
      setUserToDelete(found);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(t('common.deletedSuccess', 'Usuario eliminado correctamente'));
      setUserToDelete(null);
      mutateUsers();
      mutatePending();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.deleteError', 'Error al eliminar usuario'));
    } finally {
      setDeleteLoading(false);
    }
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

  const handleDownloadExport = async (endpoint, defaultFilename, type) => {
    if (exportingType) return;
    setExportingType(type);
    try {
      await downloadExportFile(endpoint, defaultFilename, toast, t);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="da-container">
      <div className="da-card">
        
        {/* Cabecera Liquid Glass */}
        <GlassPageHeader
          icon={<FontAwesomeIcon icon={faUsers} />}
          title={t('users.title', 'Gestión de Empleados y Usuarios')}
          subtitle={t('users.subtitle', 'Administra los roles, centros asociados, estado de actividad y solicitudes de registro')}
          actions={
            <>
              {/* Botón CSV */}
              <button 
                type="button"
                disabled={!!exportingType}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-[#73841e] dark:text-[#d4e84a] hover:text-[#525f0e] dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer disabled:opacity-50" 
                onClick={() => {
                  const companyQuery = selectedCompany && selectedCompany !== 'NONE' ? `?companyId=${selectedCompany}` : '';
                  handleDownloadExport(`users/csv${companyQuery}`, 'usuarios.csv', 'csv');
                }}
                title={t('analytics.exportCsv', 'Exportar CSV')}
                aria-label={t('analytics.exportCsv', 'Exportar CSV')}
              >
                  <FontAwesomeIcon icon={exportingType === 'csv' ? faSpinner : faFileCsv} spin={exportingType === 'csv'} size="lg" />
              </button>
              
              {/* Botón PDF */}
              <button 
                type="button"
                disabled={!!exportingType}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer disabled:opacity-50" 
                onClick={() => {
                  const companyQuery = selectedCompany && selectedCompany !== 'NONE' ? `?companyId=${selectedCompany}` : '';
                  handleDownloadExport(`users/pdf${companyQuery}`, 'usuarios.pdf', 'pdf');
                }}
                title={t('analytics.exportPdf', 'Exportar PDF')}
                aria-label={t('analytics.exportPdf', 'Exportar PDF')}
              >
                  <FontAwesomeIcon icon={exportingType === 'pdf' ? faSpinner : faFilePdf} spin={exportingType === 'pdf'} size="lg" />
              </button>

              {/* Botón Excel */}
              <button 
                type="button"
                disabled={!!exportingType}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer disabled:opacity-50" 
                onClick={() => {
                  const companyQuery = selectedCompany && selectedCompany !== 'NONE' ? `?companyId=${selectedCompany}` : '';
                  handleDownloadExport(`users/excel${companyQuery}`, 'usuarios.xlsx', 'excel');
                }}
                title={t('analytics.exportExcel', 'Exportar Excel')}
                aria-label={t('analytics.exportExcel', 'Exportar Excel')}
              >
                  <FontAwesomeIcon icon={exportingType === 'excel' ? faSpinner : faFileExcel} spin={exportingType === 'excel'} size="lg" />
              </button>

              {/* Botón Principal Añadir */}
              <Link 
                className="da-btn-primary px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm text-slate-950 inline-flex items-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all text-decoration-none" 
                to="/users/new"
              >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('users.addUser', 'Añadir Empleado')}</span>
              </Link>
            </>
          }
        />

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
        <div className="p-4 rounded-[28px] bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-30">
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
              <div className="text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5 px-2">
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
            onDelete={handleRequestDelete}
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

      {/* Modal de Confirmación de Eliminación de Usuario */}
      <GlassConfirmModal
        isOpen={Boolean(userToDelete)}
        toggle={() => setUserToDelete(null)}
        title={t('users.deleteConfirmTitle', 'Eliminar Usuario')}
        message={
          userToDelete ? (
            <span>
              {t('users.deleteConfirmMessage', '¿Estás seguro de que deseas eliminar permanentemente a')} <strong>{userToDelete.firstName ? `${userToDelete.firstName} ${userToDelete.lastName}` : (userToDelete.name || 'este usuario')} {userToDelete.username ? `(@${userToDelete.username})` : ''}</strong>?
            </span>
          ) : ""
        }
        warningMessage={t('users.deleteWarning', 'Esta acción no se puede deshacer. Se eliminarán sus accesos al sistema y registros asociados.')}
        confirmText={t('common.delete', 'Eliminar')}
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}