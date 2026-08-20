import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFileExcel,
  faFilePdf,
  faFileCsv,
  faSpinner,
  faFilter,
  faGraduationCap,
  faUsers,
  faClock,
  faTimes,
  faRotateLeft,
  faBuilding,
  faMapMarkerAlt,
  faUserTag,
  faChartPie,
  faCalendarAlt,
  faUserCheck,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useToast } from '../../../components/ToastProvider';
import downloadExportFile from '../../../util/downloadExportFile';
import GlassDropdown from '../../../components/GlassDropdown';
import api from '../../../services/api';

const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

const REPORT_TYPE_CONFIG = [
  {
    type: 'USER_FORMATIONS',
    icon: faGraduationCap,
    titleKey: 'analytics.reportTypeUserFormations',
    defaultTitle: 'Asistencia a Formaciones por Usuario',
    descKey: 'analytics.reportTypeUserFormationsDesc',
    defaultDesc: 'Horas exactas, tiempos, cursos asistidos, estados (asistió/pendiente) y firmas.',
    badgeKey: 'analytics.recommended',
    defaultBadge: 'Completo'
  },
  {
    type: 'USERS',
    icon: faUsers,
    titleKey: 'analytics.reportTypeEmployees',
    defaultTitle: 'Control y Analítica de Empleados',
    descKey: 'analytics.reportTypeEmployeesDesc',
    defaultDesc: 'Ratios de asistencia, total de minutos trabajados y KPIs por empleado.'
  },
  {
    type: 'FORMATIONS',
    icon: faCalendarAlt,
    titleKey: 'analytics.reportTypeFormations',
    defaultTitle: 'Resumen de Formaciones y Sesiones',
    descKey: 'analytics.reportTypeFormationsDesc',
    defaultDesc: 'Histórico de convocatorias, alumnos esperados y asistencia total.'
  },
  {
    type: 'CHECKINS',
    icon: faClock,
    titleKey: 'analytics.reportTypeCheckins',
    defaultTitle: 'Registro General de Fichajes',
    descKey: 'analytics.reportTypeCheckinsDesc',
    defaultDesc: 'Marcajes de entrada y salida con sellos de tiempo y geolocalización.'
  }
];

const FORMAT_CONFIG = [
  {
    id: 'excel',
    icon: faFileExcel,
    label: 'Excel (.xlsx)',
    sublabel: 'Estilos y fórmulas',
    activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/40 shadow-xs',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'pdf',
    icon: faFilePdf,
    label: 'PDF Ejecutivo',
    sublabel: 'KPIs y sellos',
    activeClass: 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/40 shadow-xs',
    iconColor: 'text-rose-500'
  },
  {
    id: 'csv',
    icon: faFileCsv,
    label: 'CSV (.csv)',
    sublabel: 'UTF-8 BOM',
    activeClass: 'border-[#8a9b1c] bg-[#b3c34c]/15 text-[#3b4707] ring-2 ring-[#b3c34c]/40 shadow-xs',
    iconColor: 'text-[#8a9b1c]'
  }
];

function buildQueryParams(filters) {
  const params = new URLSearchParams();
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.formationId) params.append('formationId', filters.formationId);
  if (filters.companyId) params.append('companyId', filters.companyId);
  if (filters.locator && filters.locator !== 'ALL') params.append('locator', filters.locator);
  if (filters.role && filters.role !== 'ALL') params.append('role', filters.role);
  if (filters.performance && filters.performance !== 'ALL') params.append('performance', filters.performance);
  if (filters.isWorking && filters.isWorking !== 'ALL') {
    params.append('isWorking', filters.isWorking === 'WORKING' ? 'true' : 'false');
  }
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.attendanceStatus && filters.attendanceStatus !== 'ALL') {
    params.append('attendanceStatus', filters.attendanceStatus);
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

function resolveExportTarget(reportType, exportFormat, qs) {
  const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
  const endpointMap = {
    USER_FORMATIONS: `user-formations/${exportFormat}${qs}`,
    USERS: `users/${exportFormat}${qs}`,
    FORMATIONS: `formations/${exportFormat}${qs}`,
    CHECKINS: `checkins/${exportFormat}${qs}`,
    AUDIT: `audit/${exportFormat}${qs}`
  };
  const filenameMap = {
    USER_FORMATIONS: `matriz_asistencias_formaciones.${ext}`,
    USERS: `empleados_analiticas.${ext}`,
    FORMATIONS: `formaciones_informe.${ext}`,
    CHECKINS: `fichajes_registro.${ext}`,
    AUDIT: `auditoria_sistema.${ext}`
  };

  return {
    endpoint: endpointMap[reportType] || `user-formations/${exportFormat}${qs}`,
    filename: filenameMap[reportType] || `informe_exportacion.${ext}`
  };
}

function formatUserDisplay(u) {
  const firstName = u.firstName || '';
  const lastName = u.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const identifier = u.username ? `@${u.username}` : (u.personalCode || `ID ${u.id}`);
  return fullName ? `${fullName} (${identifier})` : (u.username || `Usuario #${u.id}`);
}

function formatUserKeywords(u) {
  return `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.personalCode || ''}`.toLowerCase();
}

function formatFormationOption(f) {
  const name = f.name || f.formationName || '';
  const dateStr = f.formationDate ? ` (${dayjs(f.formationDate).format('YYYY-MM-DD')})` : '';
  return `${name}${dateStr}`.trim();
}

function countActiveFilters(filters) {
  let count = 0;
  if (filters.userId) count++;
  if (filters.formationId) count++;
  if (filters.companyId) count++;
  if (filters.locator) count++;
  if (filters.role && filters.role !== 'ALL') count++;
  if (filters.performance && filters.performance !== 'ALL') count++;
  if (filters.isWorking && filters.isWorking !== 'ALL') count++;
  if (filters.startDate) count++;
  if (filters.endDate) count++;
  if (filters.attendanceStatus && filters.attendanceStatus !== 'ALL') count++;
  return count;
}

export default function AdvancedExportModal({
  isOpen,
  toggle,
  companies = [],
  users = [],
  formations = [],
  initialFilters = {}
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [reportType, setReportType] = useState('USER_FORMATIONS');
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);

  // Lists for searchable dropdowns
  const [availableUsers, setAvailableUsers] = useState(users);
  const [availableFormations, setAvailableFormations] = useState(formations);

  // Dynamic Filters State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFormationId, setSelectedFormationId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locator, setLocator] = useState('');
  const [role, setRole] = useState('ALL');
  const [performance, setPerformance] = useState('ALL');
  const [isWorking, setIsWorking] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('ALL');

  // Load users and formations if not provided via props
  useEffect(() => {
    if (!isOpen) return;

    if (!users || users.length === 0) {
      api.get('/analytics/users')
        .then(res => {
          if (Array.isArray(res.data)) setAvailableUsers(res.data);
        })
        .catch(() => {});
    } else {
      setAvailableUsers(users);
    }

    if (!formations || formations.length === 0) {
      api.get('/formations')
        .then(res => {
          if (Array.isArray(res.data)) setAvailableFormations(res.data);
        })
        .catch(() => {});
    } else {
      setAvailableFormations(formations);
    }
  }, [isOpen, users, formations]);

  // Pre-fill filters when modal opens or initialFilters change
  useEffect(() => {
    if (!isOpen) return;
    setSelectedUserId(initialFilters.userId || '');
    setSelectedFormationId(initialFilters.formationId || '');
    setCompanyId(initialFilters.companyId || '');
    setLocator(initialFilters.locator || '');
    setRole(initialFilters.role || 'ALL');
    setPerformance(initialFilters.performance || 'ALL');
    setIsWorking(initialFilters.isWorking || 'ALL');
    setStartDate(initialFilters.startDate || '');
    setEndDate(initialFilters.endDate || '');
    if (initialFilters.reportType) setReportType(initialFilters.reportType);
  }, [isOpen, initialFilters]);

  const handleResetFilters = () => {
    setSelectedUserId('');
    setSelectedFormationId('');
    setCompanyId('');
    setLocator('');
    setRole('ALL');
    setPerformance('ALL');
    setIsWorking('ALL');
    setStartDate('');
    setEndDate('');
    setAttendanceStatus('ALL');
  };

  const currentFilters = useMemo(() => ({
    userId: selectedUserId,
    formationId: selectedFormationId,
    companyId,
    locator,
    role,
    performance,
    isWorking,
    startDate,
    endDate,
    attendanceStatus
  }), [selectedUserId, selectedFormationId, companyId, locator, role, performance, isWorking, startDate, endDate, attendanceStatus]);

  const activeFiltersCount = useMemo(() => countActiveFilters(currentFilters), [currentFilters]);

  const userDropdownOptions = useMemo(() => [
    { value: '', label: t('analytics.allUsersOption', 'Todos los empleados / usuarios'), searchKeywords: '' },
    ...availableUsers.map(u => ({
      value: String(u.id || u.userId),
      label: formatUserDisplay(u),
      searchKeywords: formatUserKeywords(u)
    }))
  ], [availableUsers, t]);

  const formationDropdownOptions = useMemo(() => [
    { value: '', label: t('analytics.allFormationsOption', 'Todas las formaciones') },
    ...availableFormations.map(f => ({
      value: String(f.id || f.formationId),
      label: formatFormationOption(f)
    }))
  ], [availableFormations, t]);

  const handleGenerateExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const qs = buildQueryParams(currentFilters);
      const { endpoint, filename } = resolveExportTarget(reportType, exportFormat, qs);

      await downloadExportFile(endpoint, filename, toast, t);
      toggle();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="xl"
      className="modal-dialog-centered advanced-export-modal !max-w-[1150px] w-full"
      contentClassName="border-0 rounded-[28px] overflow-hidden bg-white/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]"
    >
      <ModalHeader toggle={toggle} className="border-b border-slate-100/80 px-6 py-4 bg-gradient-to-r from-[#b3c34c]/15 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#b3c34c]/25 text-[#73841e] text-lg flex items-center justify-center shadow-xs">
            <FontAwesomeIcon icon={faDownload} />
          </div>
          <div>
            <h5 className="font-bold text-slate-800 m-0 text-lg">
              {t('analytics.advancedExportTitle', 'Generador Avanzado de Informes y Exportaciones')}
            </h5>
            <p className="text-xs text-slate-500 m-0">
              {t('analytics.advancedExportSub', 'Descarga datos detallados de asistencia, horas dedicadas y rendimiento con filtros dinámicos')}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="px-6 py-4 flex flex-col gap-4 max-h-[82vh] overflow-y-auto pb-24 sm:pb-32">
        {/* 1. SELECCIÓN DEL TIPO DE REPORTE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            1. {t('analytics.selectReportType', 'Selecciona el Tipo de Informe')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {REPORT_TYPE_CONFIG.map(item => {
              const isSelected = reportType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setReportType(item.type)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-2.5 text-left w-full ${
                    isSelected
                      ? 'border-[#8a9b1c] bg-[#b3c34c]/15 ring-2 ring-[#b3c34c]/40 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl text-base flex-shrink-0 ${isSelected ? 'bg-[#8a9b1c] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-800 leading-tight">
                        {t(item.titleKey, item.defaultTitle)}
                      </span>
                      {item.badgeKey && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#8a9b1c] text-white flex-shrink-0">
                          {t(item.badgeKey, item.defaultBadge)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 m-0 mt-1 leading-tight line-clamp-2">
                      {t(item.descKey, item.defaultDesc)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SELECCIÓN DEL FORMATO */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            2. {t('analytics.selectFormat', 'Formato de Exportación')}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {FORMAT_CONFIG.map(fmt => {
              const isSelected = exportFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-2.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? fmt.activeClass
                      : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FontAwesomeIcon icon={fmt.icon} className={`text-lg ${fmt.iconColor}`} />
                  <span className="font-bold text-xs">{fmt.label}</span>
                  <span className="text-[10px] text-slate-500 leading-none">{fmt.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. FILTROS DINÁMICOS */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FontAwesomeIcon icon={faFilter} className="text-[#8a9b1c]" />
              <span>3. {t('analytics.customizeFilters', 'Filtros Dinámicos')}</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#8a9b1c] text-white">
                  {activeFiltersCount} {t('analytics.active', 'activos')}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-[#73841e] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
                {t('common.reset', 'Restablecer')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Fila 1: Selectores Principales con Búsqueda (2 columnas en tablet/desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Desplegable con Búsqueda: Empleado / Usuario */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faUserCheck} className="text-[#8a9b1c] text-[10px]" />
                  {t('analytics.filterUserSelect', 'Empleado / Usuario (con búsqueda)')}
                </label>
                <GlassDropdown
                  options={userDropdownOptions}
                  value={selectedUserId}
                  onChange={(val) => setSelectedUserId(String(val))}
                  placeholder={t('analytics.allUsersOption', 'Todos los empleados / usuarios')}
                  searchable={true}
                  compact={true}
                />
              </div>

              {/* Desplegable con Búsqueda: Formación / Convocatoria */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faBookOpen} className="text-[#8a9b1c] text-[10px]" />
                  {t('analytics.filterFormationSelect', 'Formación / Convocatoria (con búsqueda)')}
                </label>
                <GlassDropdown
                  options={formationDropdownOptions}
                  value={selectedFormationId}
                  onChange={(val) => setSelectedFormationId(String(val))}
                  placeholder={t('analytics.allFormationsOption', 'Todas las formaciones')}
                  searchable={true}
                  compact={true}
                />
              </div>
            </div>

            {/* Fila 2: Filtros de Criterios (6 columnas en desktop / 3 en tablet / 1 en móvil) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Empresa */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faBuilding} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.company', 'Empresa')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: '', label: t('analytics.allCompanies', 'Todas las empresas') },
                    ...companies.map(c => ({ value: String(c.id), label: c.name }))
                  ]}
                  value={companyId}
                  onChange={setCompanyId}
                  compact={true}
                />
              </div>

              {/* Sede / Localizador */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.locator', 'Sede')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: '', label: t('analytics.allLocators', 'Todas las sedes') },
                    { value: 'NONE', label: t('analytics.noLocatorFilter', 'Sin sede') },
                    ...PREDEFINED_LOCATORS.map(l => ({ value: l, label: `Sede ${l}` }))
                  ]}
                  value={locator}
                  onChange={setLocator}
                  compact={true}
                />
              </div>

              {/* Rol */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faUserTag} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.role', 'Rol')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: 'ALL', label: t('analytics.allRoles', 'Todos los roles') },
                    { value: 'ADMIN', label: 'ADMIN' },
                    { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                    { value: 'USER', label: 'USER' }
                  ]}
                  value={role}
                  onChange={setRole}
                  compact={true}
                />
              </div>

              {/* Rendimiento / Asistencia */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faChartPie} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.perfRate', 'Tasa')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: 'ALL', label: t('analytics.allPerf', 'Todas las tasas') },
                    { value: 'HIGH', label: t('analytics.highPerf', 'Alta (≥ 75%)') },
                    { value: 'MEDIUM', label: t('analytics.medPerf', 'Media (50% - 74%)') },
                    { value: 'LOW', label: t('analytics.lowPerf', 'Baja (< 50%)') }
                  ]}
                  value={performance}
                  onChange={setPerformance}
                  compact={true}
                />
              </div>

              {/* Estado de Asistencia a la Formación */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.attendanceStatus', 'Asistencia')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: 'ALL', label: t('analytics.allStatuses', 'Todos') },
                    { value: 'ATTENDED', label: t('analytics.attended', 'Asistió') },
                    { value: 'IN_PROGRESS', label: t('analytics.inProgress', 'En curso') },
                    { value: 'MISSED', label: t('analytics.missed', 'No asistió') }
                  ]}
                  value={attendanceStatus}
                  onChange={setAttendanceStatus}
                  compact={true}
                />
              </div>

              {/* Estado Laboral */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-[#8a9b1c] text-[9px]" />
                  <span className="truncate">{t('analytics.workStatus', 'Estado')}</span>
                </label>
                <GlassDropdown
                  options={[
                    { value: 'ALL', label: t('analytics.allWorkStatus', 'Todos') },
                    { value: 'WORKING', label: t('users.statusWorking', 'Trabajando') },
                    { value: 'RESTING', label: t('users.statusResting', 'Descansando') }
                  ]}
                  value={isWorking}
                  onChange={setIsWorking}
                  compact={true}
                />
              </div>
            </div>

            {/* Fila 3: Rango de Fechas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-slate-200/60">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 m-0 whitespace-nowrap">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-[#8a9b1c] text-[10px]" />
                {t('analytics.dateRange', 'Rango de fechas:')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full flex-1 max-w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">{t('analytics.startDate', 'Desde')}:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-w-0 px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50"
                    aria-label={t('analytics.startDate', 'Fecha Inicio')}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">{t('analytics.endDate', 'Hasta')}:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-w-0 px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50"
                    aria-label={t('analytics.endDate', 'Fecha Fin')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
        <div className="text-xs text-slate-500 w-full sm:w-auto text-center sm:text-left">
          <span className="font-bold text-slate-700">{activeFiltersCount}</span> {t('analytics.filtersActive', 'filtros aplicados')}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={isExporting}
            onClick={toggle}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-200 hover:bg-slate-300 border border-slate-300 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FontAwesomeIcon icon={faTimes} className="text-slate-500" />
            <span>{t('common.cancel', 'Cancelar')}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleGenerateExport}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-[#7a8a18] hover:bg-[#687614] border-0 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={isExporting ? faSpinner : faDownload} spin={isExporting} />
            <span>
              {isExporting ? t('common.generating', 'Generando...') : t('analytics.downloadReport', 'Generar y Descargar')}
            </span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
