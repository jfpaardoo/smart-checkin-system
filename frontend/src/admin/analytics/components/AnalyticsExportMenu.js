import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFileCsv,
  faFileExcel,
  faFilePdf,
  faSpinner,
  faChevronDown,
  faBuilding,
  faSlidersH,
  faGraduationCap,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';
import downloadExportFile from '../../../util/downloadExportFile';
import GlassDropdown from '../../../components/GlassDropdown';
import AdvancedExportModal from './AdvancedExportModal';

export default function AnalyticsExportMenu({ companies = [], activeFilters = {} }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const menuRef = useRef(null);

  const toggle = () => {
    if (!isExporting) {
      setIsOpen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    const compId = selectedCompanyId || activeFilters.companyId;
    if (compId) params.append('companyId', compId);
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.locator && activeFilters.locator !== 'ALL') params.append('locator', activeFilters.locator);
    if (activeFilters.role && activeFilters.role !== 'ALL') params.append('role', activeFilters.role);
    if (activeFilters.performance && activeFilters.performance !== 'ALL') params.append('performance', activeFilters.performance);
    if (activeFilters.isWorking && activeFilters.isWorking !== 'ALL') params.append('isWorking', activeFilters.isWorking === 'WORKING' ? 'true' : 'false');
    if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
    if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);

    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const handleDownloadExport = async (endpoint, defaultFilename) => {
    if (isExporting) return;
    setIsExporting(true);
    setIsOpen(false);
    try {
      const qs = buildQueryString();
      const finalEndpoint = `${endpoint}${qs}`;
      await downloadExportFile(finalEndpoint, defaultFilename, toast, t);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div ref={menuRef} className="relative w-full sm:w-auto">
        <button
          type="button"
          disabled={isExporting}
          onClick={toggle}
          className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl flex items-center justify-between sm:justify-center gap-2.5 font-bold text-xs sm:text-sm text-slate-800 transition-all duration-200 border border-white/80 bg-white/75 hover:bg-white/95 backdrop-blur-md shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen ? 'ring-2 ring-[#b3c34c]/50 border-[#b3c34c]/60 shadow-md bg-white' : ''
          } ${selectedCompanyId ? 'border-[#8a9b1c] bg-[#b3c34c]/10' : ''}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <FontAwesomeIcon icon={isExporting ? faSpinner : faDownload} spin={isExporting} className="text-[#8a9b1c]" />
            <span className="truncate">
              {t('analytics.exportData', 'Exportar Informes')}
              {selectedCompanyId && ` (${t('analytics.filtered', 'Filtrado')})`}
            </span>
          </div>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`ms-2 flex-shrink-0 text-[11px] text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-[#7a8a18]' : 'text-slate-400'
            }`} 
          />
        </button>

        {/* Floating Dropdown Menu */}
        <div 
          className={`transition-all duration-300 ease-in-out sm:duration-200 origin-top-right sm:absolute sm:right-0 sm:top-full sm:w-80 sm:z-[9999] ${
            isOpen 
              ? 'grid grid-rows-[1fr] opacity-100 mt-2 sm:mt-2 pointer-events-auto sm:scale-100 sm:translate-y-0' 
              : 'grid grid-rows-[0fr] opacity-0 mt-0 pointer-events-none sm:scale-95 sm:-translate-y-2 sm:hidden'
          }`}
        >
          <div className="overflow-hidden sm:overflow-visible">
            <div className="w-full bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.14)] rounded-2xl p-3">
              
              {/* Botón Destacado: Generador Avanzado con Filtros */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAdvancedModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#3b4707] bg-[#b3c34c]/20 hover:bg-[#b3c34c]/30 border border-[#b3c34c]/50 transition-all mb-2.5 shadow-xs cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSlidersH} className="text-[#73841e]" />
                  <span>{t('analytics.openAdvancedExport', 'Generador de Informes Avanzado')}</span>
                </div>
                <span className="text-[10px] bg-[#73841e] text-white px-1.5 py-0.5 rounded-md font-bold">
                  {t('analytics.custom', 'Pro')}
                </span>
              </button>

              {companies?.length > 0 && (
                <div className="mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#8a9b1c]" />
                    <span>{t('analytics.filterCompany', 'Filtrar por Empresa')}</span>
                  </div>
                  <div className="mt-1">
                    <GlassDropdown
                      options={[
                        { value: '', label: t('analytics.allCompanies', 'Todas las empresas (Global)') },
                        ...companies.map((comp) => ({
                          value: comp.id,
                          label: comp.name
                        }))
                      ]}
                      value={selectedCompanyId}
                      onChange={(val) => setSelectedCompanyId(val)}
                      placeholder={t('analytics.allCompanies', 'Todas las empresas (Global)')}
                      compact={true}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: MATRIZ DETALLADA DE ASISTENCIAS */}
              <div className="px-3 py-1 text-[11px] font-bold text-[#73841e] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faGraduationCap} />
                <span>{t('analytics.userFormationsMatrix', 'Matriz de Asistencias y Horas')}</span>
              </div>
              
              <div className="flex flex-col gap-0.5 mb-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/excel', 'matriz_asistencias_formaciones.xlsx')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsExcel', 'Matriz Completa (Excel)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.xlsx</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/pdf', 'matriz_asistencias_formaciones.pdf')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsPdf', 'Matriz Completa (PDF)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.pdf</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/csv', 'matriz_asistencias_formaciones.csv')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileCsv} className="text-[#8a9b1c] w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsCsv', 'Matriz Completa (CSV)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.csv</span>
                </button>
              </div>

              <div className="border-t border-slate-100 my-1.5" />

              {/* SECCIÓN 2: ANALÍTICA DE EMPLEADOS */}
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} />
                <span>{t('analytics.employeeExports', 'Analítica de Empleados')}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('users/excel', 'empleados_analiticas.xlsx')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.employeesExcel', 'Empleados (Excel)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.xlsx</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('users/pdf', 'empleados_analiticas.pdf')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.employeesPdf', 'Empleados (PDF)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.pdf</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Avanzado de Exportaciones */}
      <AdvancedExportModal
        isOpen={isAdvancedModalOpen}
        toggle={() => setIsAdvancedModalOpen(!isAdvancedModalOpen)}
        companies={companies}
        initialFilters={{
          ...activeFilters,
          companyId: selectedCompanyId || activeFilters.companyId
        }}
      />
    </>
  );
}
