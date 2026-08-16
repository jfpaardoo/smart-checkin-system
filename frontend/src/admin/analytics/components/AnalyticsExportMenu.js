import React from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCsv, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';
import downloadExportFile from '../../../util/downloadExportFile';

export default function AnalyticsExportMenu() {
  const { t } = useTranslation();
  const toast = useToast();

  const handleDownloadExport = (endpoint, defaultFilename) => {
    downloadExportFile(endpoint, defaultFilename, toast, t);
  };

  return (
    <UncontrolledDropdown className="w-full sm:w-auto flex justify-center position-relative" style={{ zIndex: 60 }}>
      <DropdownToggle 
        caret 
        color="light" 
        className="da-select-toggle d-flex align-items-center justify-content-center gap-2 w-full sm:w-auto text-center shadow-xs"
        style={{ minHeight: '46px', padding: '8px 20px', borderRadius: '20px' }}
      >
        <FontAwesomeIcon icon={faDownload} style={{ color: 'var(--da-primary)' }} />
        <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.exportData', 'Exportar Informes')}</span>
      </DropdownToggle>
      <DropdownMenu end className="da-dropdown-menu shadow-2xl border-0 rounded-3" style={{ zIndex: 99999 }}>
        <DropdownItem header className="fw-bold text-muted">{t('analytics.formationExports', 'Formaciones y Asistencias')}</DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('formations/csv', 'formaciones_firmas.csv')} className="py-2 da-dropdown-item">
          <FontAwesomeIcon icon={faFileCsv} className="me-2" style={{ color: 'var(--da-primary)' }} /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.formationsCsv', 'Formaciones (CSV)')}</span>
        </DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('formations/excel', 'formaciones_firmas.xlsx')} className="py-2 da-dropdown-item">
          <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.formationsExcel', 'Formaciones (Excel)')}</span>
        </DropdownItem>
        <DropdownItem divider />
        <DropdownItem header className="fw-bold text-muted">{t('analytics.employeeExports', 'Analítica de Empleados')}</DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('users/csv', 'empleados_analiticas.csv')} className="py-2 da-dropdown-item">
          <FontAwesomeIcon icon={faFileCsv} className="me-2" style={{ color: 'var(--da-primary)' }} /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.employeesCsv', 'Empleados (CSV)')}</span>
        </DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('users/excel', 'empleados_analiticas.xlsx')} className="py-2 da-dropdown-item">
          <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.employeesExcel', 'Empleados (Excel)')}</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
