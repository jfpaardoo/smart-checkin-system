import {
  faFileExcel,
  faFilePdf,
  faFileCsv,
  faGraduationCap,
  faUsers,
  faClock,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';

export const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

export const REPORT_TYPE_CONFIG = [
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

export const FORMAT_CONFIG = [
  {
    id: 'excel',
    icon: faFileExcel,
    label: 'Excel (.xlsx)',
    sublabel: 'Estilos y fórmulas',
    activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/40 shadow-xs dark:bg-emerald-950/50 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'pdf',
    icon: faFilePdf,
    label: 'PDF Ejecutivo',
    sublabel: 'KPIs y sellos',
    activeClass: 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/40 shadow-xs dark:bg-rose-950/50 dark:text-rose-200',
    iconColor: 'text-rose-500 dark:text-rose-400'
  },
  {
    id: 'csv',
    icon: faFileCsv,
    label: 'CSV (.csv)',
    sublabel: 'UTF-8 BOM',
    activeClass: 'border-[#8a9b1c] bg-[#b3c34c]/15 text-[#3b4707] ring-2 ring-[#b3c34c]/40 shadow-xs dark:text-[#d2db85]',
    iconColor: 'text-[#8a9b1c]'
  }
];

export const SIMPLE_PARAM_KEYS = ['userId', 'formationId', 'companyId', 'startDate', 'endDate'];
export const FILTER_ALL_KEYS = ['locator', 'role', 'performance', 'attendanceStatus'];

export function appendFiltersToParams(params, filters) {
  for (const key of SIMPLE_PARAM_KEYS) {
    if (filters[key]) params.append(key, filters[key]);
  }
  for (const key of FILTER_ALL_KEYS) {
    if (filters[key] && filters[key] !== 'ALL') {
      params.append(key, filters[key]);
    }
  }
  if (filters.isWorking && filters.isWorking !== 'ALL') {
    params.append('isWorking', String(filters.isWorking === 'WORKING'));
  }
}

export function buildQueryParams(filters) {
  const params = new URLSearchParams();
  appendFiltersToParams(params, filters);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function resolveExportTarget(reportType, exportFormat, qs) {
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

export function formatUserDisplay(u) {
  const firstName = u.firstName || '';
  const lastName = u.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const identifier = u.username ? `@${u.username}` : (u.personalCode || `ID ${u.id}`);
  return fullName ? `${fullName} (${identifier})` : (u.username || `Usuario #${u.id}`);
}

export function formatUserKeywords(u) {
  return `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.personalCode || ''}`.toLowerCase();
}

export function formatFormationOption(f) {
  const name = f.name || f.formationName || '';
  const dateStr = f.formationDate ? ` (${dayjs(f.formationDate).format('YYYY-MM-DD')})` : '';
  return `${name}${dateStr}`.trim();
}

export function countActiveFilters(filters) {
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
