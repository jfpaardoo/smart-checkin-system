import React, { useState, useMemo, useEffect } from 'react';
import { Button } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEye, faBuilding } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from '../../../components/GlassSearchBar';
import GlassDropdown from '../../../components/GlassDropdown';
import GlassPagination from '../../../components/GlassPagination';
import { formatDuration } from '../../../util/dateTimeUtil';

const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

const getAttendanceColorClass = (percentage) => {
  if (percentage >= 75) return 'text-emerald-600 font-bold';
  if (percentage >= 50) return 'text-amber-600 font-bold';
  return 'text-rose-500 font-bold';
};

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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, selectedLocator, selectedRole, selectedPerf, selectedStatus, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="mt-3 w-full">
      {/* Panel de Filtros Multidimensional Liquid Glass con capas z-index claras */}
      <div className="p-4 rounded-[28px] bg-white/30 backdrop-blur-md border border-white/50 shadow-xs mb-4 flex flex-col gap-3 relative z-20">
        
        {/* Fila 1 de Filtros (Z-INDEX SUPERIOR para que el desplegable baje sobre la Fila 2) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-20">
          {/* Buscador */}
          <div className="md:col-span-6">
            <GlassSearchBar 
              placeholder={t('analytics.searchEmployee', 'Buscar por nombre, código, usuario, empresa o localizador...')}
              onSearch={(q) => setSearchQuery(q)}
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

          {/* Filtro de Localizador / Sede */}
          <div className="md:col-span-3">
            <GlassDropdown
              options={[
                { value: '', label: t('analytics.allLocators', 'Todas las sedes / localizadores') },
                { value: 'NONE', label: t('analytics.noLocatorFilter', 'Sin localizador') },
                ...PREDEFINED_LOCATORS.map((loc) => ({ value: loc, label: `Sede ${loc}` }))
              ]}
              value={selectedLocator}
              onChange={(val) => setSelectedLocator(val)}
              placeholder={t('analytics.filterLocator', 'Filtrar por Sede')}
              className="w-full"
            />
          </div>
        </div>

        {/* Fila 2 de Filtros (Z-INDEX 10) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-white/30 relative z-10">
          {/* Filtro de Rol */}
          <div>
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('analytics.allRoles', 'Todos los roles') },
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                { value: 'USER', label: 'USER' }
              ]}
              value={selectedRole}
              onChange={(val) => setSelectedRole(val)}
              placeholder={t('analytics.filterRole', 'Rol')}
              className="w-full"
            />
          </div>

          {/* Filtro de Rendimiento de Asistencia */}
          <div>
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('analytics.allPerf', 'Tasa de Asistencia (Todas)') },
                { value: 'HIGH', label: t('analytics.highPerf', 'Alta (≥ 75%)') },
                { value: 'MEDIUM', label: t('analytics.medPerf', 'Media (50% - 74%)') },
                { value: 'LOW', label: t('analytics.lowPerf', 'Baja (< 50%)') }
              ]}
              value={selectedPerf}
              onChange={(val) => setSelectedPerf(val)}
              placeholder={t('analytics.filterPerf', 'Asistencia')}
              className="w-full"
            />
          </div>

          {/* Filtro de Estado Laboral */}
          <div>
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('analytics.allWorkStatus', 'Estado (Todos)') },
                { value: 'WORKING', label: t('users.statusWorking', 'Trabajando') },
                { value: 'RESTING', label: t('users.statusResting', 'Descansando') }
              ]}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              placeholder={t('analytics.filterWorkStatus', 'Estado')}
              className="w-full"
            />
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-1">
          <span>{t('analytics.showing', 'Mostrando')}: {filteredUsers.length} de {userAnalyticsList.length} empleados</span>
          {(searchQuery || selectedCompany || selectedLocator || selectedRole !== 'ALL' || selectedPerf !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCompany('');
                setSelectedLocator('');
                setSelectedRole('ALL');
                setSelectedPerf('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-[#8fa228] hover:underline font-bold cursor-pointer"
            >
              {t('common.clearFilters', 'Limpiar filtros')}
            </button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center p-8 text-slate-500 bg-white/40 rounded-3xl border border-white/40 mt-4">
          <p className="mb-0 text-sm font-semibold">{t('analytics.noEmployees', 'No se encontraron empleados que coincidan con los filtros.')}</p>
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO CON ANCHOS PERFECTAMENTE AJUSTADOS */}
          <div className="hidden lg:block overflow-x-auto rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative z-10">
            <table className="da-table align-middle w-full border-collapse" style={{ tableLayout: 'auto', minWidth: '950px', fontSize: '0.88rem' }}>
              <thead>
                <tr className="border-b border-white/40 bg-white/50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 text-left" style={{ width: '10%' }}>{t('users.personalCode', 'Código')}</th>
                  <th className="py-4 px-4 text-left" style={{ width: '18%' }}>{t('users.name', 'Empleado')}</th>
                  <th className="py-4 px-4 text-left" style={{ width: '16%' }}>{t('users.company', 'Empresa')}</th>
                  <th className="py-4 px-3 text-center" style={{ width: '10%' }}>{t('users.role', 'Rol')}</th>
                  <th className="py-4 px-3 text-center" style={{ width: '14%' }}>{t('analytics.formationsCount', 'Formaciones')}</th>
                  <th className="py-4 px-3 text-center" style={{ width: '11%' }}>{t('analytics.attendancePercentage', '% Asistencia')}</th>
                  <th className="py-4 px-4 text-left" style={{ width: '12%' }}>{t('analytics.totalFormationTime', 'T. Formación')}</th>
                  <th className="py-4 px-4 text-center" style={{ width: '9%' }}>{t('analytics.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-slate-800">
                {paginatedUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-white/50 transition duration-150">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700">{user.personalCode}</span>
                        {user.locator && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30 flex-shrink-0">
                            {user.locator}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4" style={{ wordBreak: 'break-word' }}>
                      <div className="font-bold text-slate-800 leading-tight">{user.firstName} {user.lastName}</div>
                      <small className="text-slate-400 text-xs">@{user.username}</small>
                    </td>
                    <td className="py-4 px-4">
                      {user.companyName ? (
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faBuilding} className="text-[#8fa228] text-xs flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-xs truncate max-w-[130px]" title={user.companyName}>
                            {user.companyName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">{t('users.noCompany', 'Sin empresa')}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="da-badge bg-light text-dark border text-xs" style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                        {user.authority}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-semibold text-slate-700">
                      {user.formationsAttended} / {user.formationsAssigned}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className={getAttendanceColorClass(user.attendancePercentage)}>
                        {user.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                        {formatDuration(user.totalFormationMinutes)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button 
                        size="sm" 
                        className="da-btn-blue font-bold shadow-xs !rounded-2xl px-3 py-1.5 inline-flex items-center justify-center mx-auto text-xs"
                        onClick={() => onOpenUserDetail(user.userId)}
                        title={t('analytics.viewDetails', 'Ver Detalles')}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. VISTA MÓVIL / TABLET */}
          <div className="lg:hidden flex flex-col gap-3 mt-2">
            {paginatedUsers.map((user) => (
              <div key={user.userId} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[24px] p-5 border border-white/50 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                      {user.locator && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30">
                          {user.locator}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 m-0 text-base">{user.firstName} {user.lastName}</h3>
                    <p className="text-xs text-slate-400 m-0">@{user.username}</p>
                  </div>
                  <div>
                    <span className="da-badge bg-light text-dark border text-xs">{user.authority}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">{t('users.company', 'Empresa')}:</span>
                  {user.companyName ? (
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faBuilding} className="text-[#8fa228]" /> {user.companyName}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">{t('users.noCompany', 'Sin empresa')}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-2.5 text-xs text-slate-600">
                  <div><span className="font-semibold text-slate-500">Asistencia:</span> <span className={getAttendanceColorClass(user.attendancePercentage)}>{user.attendancePercentage}%</span></div>
                  <div><span className="font-semibold text-slate-500">T. Formación:</span> {formatDuration(user.totalFormationMinutes)}</div>
                  <div className="col-span-2"><span className="font-semibold text-slate-500">Formaciones (Asist/Asign):</span> {user.formationsAttended} / {user.formationsAssigned}</div>
                </div>

                <div className="border-t border-slate-200/50 pt-3 flex justify-end">
                  <Button 
                    size="sm" 
                    className="da-btn-blue font-bold shadow-sm !rounded-2xl px-5 py-2 inline-flex items-center justify-center gap-2 text-xs w-full sm:w-auto"
                    onClick={() => onOpenUserDetail(user.userId)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    {t('analytics.viewDetails', 'Ver Detalles')}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación Liquid Glass */}
          <div className="relative z-10 mt-3">
            <GlassPagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </>
      )}
    </div>
  );
}