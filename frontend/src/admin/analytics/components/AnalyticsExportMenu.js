import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faFileExcel, 
  faFilePdf, 
  faFileCsv, 
  faChevronDown, 
  faBuilding, 
  faGraduationCap, 
  faUsers, 
  faSpinner, 
  faSlidersH 
} from '@fortawesome/free-solid-svg-icons';
import GlassDropdown from '../../../components/GlassDropdown';
import AdvancedExportModal from './AdvancedExportModal';
import { useToast } from '../../../components/ToastProvider';
import api from '../../../services/api';
import { saveBlobFile } from '../../../util/downloadExportFile';

export default function AnalyticsExportMenu({ 
  companies = [], 
  activeFilters = {},
  onFilterChange 
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeFilters.companyId || '');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  const handleDownloadExport = async (endpoint, defaultFilename) => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyId) params.append('companyId', selectedCompanyId);
      if (activeFilters.userId) params.append('userId', activeFilters.userId);
      if (activeFilters.formationId) params.append('formationId', activeFilters.formationId);
      if (activeFilters.locator && activeFilters.locator !== 'ALL') params.append('locator', activeFilters.locator);
      if (activeFilters.role && activeFilters.role !== 'ALL') params.append('role', activeFilters.role);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/exports/${endpoint}${qs}`, {
        responseType: 'blob'
      });

      const mimeType = res.headers['content-type'] || 'application/octet-stream';
      await saveBlobFile(res.data, defaultFilename, mimeType);

      toast.success(t('analytics.exportSuccess', 'Informe descargado con éxito'));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t('analytics.exportError', 'Error al generar el informe'));
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
          className={`w-full sm:w-auto h-[44px] min-h-[44px] px-5 py-2 rounded-2xl flex items-center justify-between sm:justify-center gap-2.5 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 transition-all duration-200 border border-white/80 dark:border-white/10 bg-white/75 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer box-border ${
            isOpen ? 'ring-2 ring-[#b3c34c]/50 border-[#b3c34c]/60 shadow-md bg-white dark:bg-slate-800' : ''
          } ${selectedCompanyId ? 'border-[#8a9b1c] bg-[#b3c34c]/10' : ''}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <FontAwesomeIcon icon={isExporting ? faSpinner : faDownload} spin={isExporting} className="text-[#73841e] dark:text-[#d4e84a]" />
            <span className="truncate">
              {t('analytics.exportData', 'Exportar Informes')}
              {selectedCompanyId && ` (${t('analytics.filtered', 'Filtrado')})`}
            </span>
          </div>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`ms-2 flex-shrink-0 text-[11px] text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-[#7a8a18] dark:text-[#d4e84a]' : 'text-slate-400'
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
            <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-2xl rounded-2xl p-3">
              
              {/* Botón Destacado: Generador Avanzado con Filtros */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAdvancedModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#3b4707] dark:text-[#e2f185] bg-[#b3c34c]/20 hover:bg-[#b3c34c]/30 dark:bg-[#b3c34c]/15 dark:hover:bg-[#b3c34c]/25 border border-[#b3c34c]/50 transition-all mb-2.5 shadow-xs cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSlidersH} className="text-[#73841e] dark:text-[#d4e84a]" />
                  <span>{t('analytics.openAdvancedExport', 'Generador de Informes Avanzado')}</span>
                </div>
                <span className="text-[10px] bg-[#73841e] dark:bg-[#b3c34c] text-white dark:text-slate-950 px-1.5 py-0.5 rounded-md font-bold">
                  {t('analytics.custom', 'Pro')}
                </span>
              </button>

              {companies?.length > 0 && (
                <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#8a9b1c] dark:text-[#d4e84a]" />
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
              <div className="px-3 py-1 text-[11px] font-bold text-[#73841e] dark:text-[#d4e84a] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faGraduationCap} />
                <span>{t('analytics.userFormationsMatrix', 'Matriz de Asistencias y Horas')}</span>
              </div>
              
              <div className="flex flex-col gap-0.5 mb-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/excel', 'matriz_asistencias_formaciones.xlsx')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b3c34c]/20 dark:hover:bg-white/10 hover:text-[#283603] dark:hover:text-white transition-colors text-left border-0 cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 dark:text-emerald-400 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsExcel', 'Matriz Completa (Excel)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.xlsx</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/pdf', 'matriz_asistencias_formaciones.pdf')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b3c34c]/20 dark:hover:bg-white/10 hover:text-[#283603] dark:hover:text-white transition-colors text-left border-0 cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 dark:text-rose-400 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsPdf', 'Matriz Completa (PDF)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.pdf</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('user-formations/csv', 'matriz_asistencias_formaciones.csv')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b3c34c]/20 dark:hover:bg-white/10 hover:text-[#283603] dark:hover:text-white transition-colors text-left border-0 cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileCsv} className="text-[#8a9b1c] dark:text-[#d4e84a] w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.userFormationsCsv', 'Matriz Completa (CSV)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.csv</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />

              {/* SECCIÓN 2: ANALÍTICA DE EMPLEADOS */}
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} />
                <span>{t('analytics.employeeExports', 'Analítica de Empleados')}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('users/excel', 'empleados_analiticas.xlsx')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b3c34c]/20 dark:hover:bg-white/10 hover:text-[#283603] dark:hover:text-white transition-colors text-left border-0 cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 dark:text-emerald-400 w-3.5 flex-shrink-0" />
                    <span className="truncate">{t('analytics.employeesExcel', 'Empleados (Excel)')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">.xlsx</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadExport('users/pdf', 'empleados_analiticas.pdf')}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b3c34c]/20 dark:hover:bg-white/10 hover:text-[#283603] dark:hover:text-white transition-colors text-left border-0 cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 dark:text-rose-400 w-3.5 flex-shrink-0" />
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
