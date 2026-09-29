import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GlassPagination from '../../../components/GlassPagination';
import EmployeeFilterPanel from './EmployeeFilterPanel';
import EmployeeTableView from './EmployeeTableView';
import EmployeeCardList from './EmployeeCardList';

const matchesSearch = (user, query) => {
  if (!query?.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    user.firstName?.toLowerCase().includes(q) ||
    user.lastName?.toLowerCase().includes(q) ||
    user.username?.toLowerCase().includes(q) ||
    user.personalCode?.toLowerCase().includes(q) ||
    user.companyName?.toLowerCase().includes(q) ||
    user.locator?.toLowerCase().includes(q)
  );
};

const matchesCompany = (user, selectedCompany) => {
  if (!selectedCompany) return true;
  if (selectedCompany === 'NONE') return !user.companyId;
  return String(user.companyId) === String(selectedCompany);
};

const matchesLocator = (user, selectedLocator) => {
  if (!selectedLocator) return true;
  if (selectedLocator === 'NONE') return !user.locator;
  return user.locator?.toUpperCase() === selectedLocator.toUpperCase();
};

const matchesRole = (user, selectedRole) => {
  if (!selectedRole || selectedRole === 'ALL') return true;
  return user.authority === selectedRole;
};

const matchesPerformance = (user, selectedPerf) => {
  if (!selectedPerf || selectedPerf === 'ALL') return true;
  const p = user.attendancePercentage || 0;
  if (selectedPerf === 'HIGH') return p >= 75;
  if (selectedPerf === 'MEDIUM') return p >= 50 && p < 75;
  if (selectedPerf === 'LOW') return p < 50;
  return true;
};

const matchesWorkStatus = (user, selectedStatus) => {
  if (!selectedStatus || selectedStatus === 'ALL') return true;
  if (selectedStatus === 'WORKING') return Boolean(user.isWorking);
  if (selectedStatus === 'RESTING') return !user.isWorking;
  return true;
};

const DEFAULT_ARRAY = [];

export default function AnalyticsEmployeesTab({ userAnalyticsList = DEFAULT_ARRAY, companies = DEFAULT_ARRAY, onOpenUserDetail }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedLocator, setSelectedLocator] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedPerf, setSelectedPerf] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Paginación y Ordenación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'personalCode', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredUsers = useMemo(() => {
    return userAnalyticsList.filter((user) => {
      return (
        matchesSearch(user, searchQuery) &&
        matchesCompany(user, selectedCompany) &&
        matchesLocator(user, selectedLocator) &&
        matchesRole(user, selectedRole) &&
        matchesPerformance(user, selectedPerf) &&
        matchesWorkStatus(user, selectedStatus)
      );
    });
  }, [userAnalyticsList, searchQuery, selectedCompany, selectedLocator, selectedRole, selectedPerf, selectedStatus]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    const { key, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    return [...filteredUsers].sort((a, b) => {
      if (key === 'personalCode') {
        const numA = Number.parseInt(a.personalCode, 10);
        const numB = Number.parseInt(b.personalCode, 10);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return (numA - numB) * modifier;
        }
        return String(a.personalCode || '').localeCompare(String(b.personalCode || ''), 'es', { numeric: true }) * modifier;
      }
      if (key === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username || '';
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.username || '';
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' }) * modifier;
      }
      if (key === 'company') {
        const compA = a.companyName || '';
        const compB = b.companyName || '';
        return compA.localeCompare(compB, 'es', { sensitivity: 'base' }) * modifier;
      }
      if (key === 'role') {
        const roleA = a.authority || '';
        const roleB = b.authority || '';
        return roleA.localeCompare(roleB, 'es', { sensitivity: 'base' }) * modifier;
      }
      if (key === 'formations') {
        const valA = Number(a.formationsAttended) || 0;
        const valB = Number(b.formationsAttended) || 0;
        if (valA !== valB) return (valA - valB) * modifier;
        const assA = Number(a.formationsAssigned) || 0;
        const assB = Number(b.formationsAssigned) || 0;
        return (assA - assB) * modifier;
      }
      if (key === 'attendancePercentage') {
        const rateA = Number(a.attendancePercentage) || 0;
        const rateB = Number(b.attendancePercentage) || 0;
        return (rateA - rateB) * modifier;
      }
      if (key === 'formationTime') {
        const timeA = Number(a.totalFormationMinutes) || 0;
        const timeB = Number(b.totalFormationMinutes) || 0;
        return (timeA - timeB) * modifier;
      }
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, selectedLocator, selectedRole, selectedPerf, selectedStatus, pageSize, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    setSelectedLocator('');
    setSelectedRole('ALL');
    setSelectedPerf('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="mt-3 w-full">
      <EmployeeFilterPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        selectedLocator={selectedLocator}
        onLocatorChange={setSelectedLocator}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedPerf={selectedPerf}
        onPerfChange={setSelectedPerf}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
        companies={companies}
        totalFiltered={filteredUsers.length}
        totalCount={userAnalyticsList.length}
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center p-8 text-slate-500 bg-white/40 rounded-3xl border border-white/40 mt-4">
          <p className="mb-0 text-sm font-semibold">{t('analytics.noEmployees', 'No se encontraron empleados que coincidan con los filtros.')}</p>
        </div>
      ) : (
        <>
          <EmployeeTableView 
            users={paginatedUsers} 
            onOpenUserDetail={onOpenUserDetail} 
            sortConfig={sortConfig} 
            onSort={handleSort} 
          />
          <EmployeeCardList 
            users={paginatedUsers} 
            onOpenUserDetail={onOpenUserDetail} 
            sortConfig={sortConfig} 
            onSort={handleSort} 
          />

          <div className="relative z-10 mt-3">
            <GlassPagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </>
      )}
    </div>
  );
}