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
    <UncontrolledDropdown>
      <DropdownToggle caret color="light" className="ba-select-toggle d-inline-flex align-items-center justify-content-between gap-2">
        <FontAwesomeIcon icon={faDownload} style={{ color: 'var(--ba-primary)' }} />
        <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.exportData', 'Export Reports')}</span>
      </DropdownToggle>
      <DropdownMenu end className="ba-dropdown-menu shadow border-0 rounded-3">
        <DropdownItem header className="fw-bold text-muted">{t('analytics.formationExports', 'Formations & Signatures')}</DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('formations/csv', 'formaciones_firmas.csv')} className="py-2 ba-dropdown-item">
          <FontAwesomeIcon icon={faFileCsv} className="me-2" style={{ color: 'var(--ba-primary)' }} /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.formationsCsv', 'Formations & Signatures (CSV)')}</span>
        </DropdownItem>
        <DropdownItem onClick={() => handleDownloadExport('formations/excel', 'formaciones_firmas.xlsx')} className="py-2 ba-dropdown-item">
          <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" /> 
          <span className="fw-bold" style={{ color: '#2c3e50' }}>{t('analytics.formationsExcel', 'Formations & Signatures (Excel)')}</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
