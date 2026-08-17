import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCsv, faFileExcel, faFilePdf, faSpinner, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';
import downloadExportFile from '../../../util/downloadExportFile';

export default function AnalyticsExportMenu() {
  const { t } = useTranslation();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadExport = async (endpoint, defaultFilename) => {
    if (isExporting) return;
    setIsExporting(true);
    setIsOpen(false);
    try {
      await downloadExportFile(endpoint, defaultFilename, toast, t);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={menuRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        disabled={isExporting}
        onClick={toggle}
        className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl flex items-center justify-between sm:justify-center gap-2.5 font-bold text-xs sm:text-sm text-slate-800 transition-all duration-200 border border-white/80 bg-white/75 hover:bg-white/95 backdrop-blur-md shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-[#b3c34c]/50 border-[#b3c34c]/60 shadow-md bg-white' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <FontAwesomeIcon icon={isExporting ? faSpinner : faDownload} spin={isExporting} className="text-[#8a9b1c]" />
          <span className="truncate">{t('analytics.exportData', 'Exportar Informes')}</span>
        </div>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`ms-2 flex-shrink-0 text-[11px] text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-[#7a8a18]' : 'text-slate-400'
          }`} 
        />
      </button>

      {/* En móvil: acordeón inline. En escritorio (sm:): flotante absoluto a la derecha */}
      <div 
        className={`transition-all duration-300 ease-in-out sm:duration-200 origin-top-right sm:absolute sm:right-0 sm:top-full sm:w-72 sm:z-[9999] ${
          isOpen 
            ? 'grid grid-rows-[1fr] opacity-100 mt-2 sm:mt-2 pointer-events-auto sm:scale-100 sm:translate-y-0' 
            : 'grid grid-rows-[0fr] opacity-0 mt-0 pointer-events-none sm:scale-95 sm:-translate-y-2 sm:hidden'
        }`}
      >
        <div className="overflow-hidden sm:overflow-visible">
          <div className="w-full bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.14)] rounded-2xl p-2.5">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.formationExports', 'Formaciones y Asistencias')}
            </div>
            
            <div className="flex flex-col gap-0.5 mb-1.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('formations/pdf', 'formaciones_informe.pdf')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.formationsPdf', 'Formaciones (PDF Ejecutivo)')}</span>
              </button>
              
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('formations/excel', 'formaciones_firmas.xlsx')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.formationsExcel', 'Formaciones (Excel)')}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('formations/csv', 'formaciones_firmas.csv')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFileCsv} className="text-[#8a9b1c] w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.formationsCsv', 'Formaciones (CSV)')}</span>
              </button>
            </div>

            <div className="border-t border-slate-100 my-1.5" />

            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.employeeExports', 'Analítica de Empleados')}
            </div>

            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('users/pdf', 'empleados_analiticas.pdf')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFilePdf} className="text-rose-500 w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.employeesPdf', 'Empleados (PDF Ejecutivo)')}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('users/excel', 'empleados_analiticas.xlsx')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.employeesExcel', 'Empleados (Excel)')}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadExport('users/csv', 'empleados_analiticas.csv')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-[#b3c34c]/20 hover:text-[#283603] transition-colors text-left"
              >
                <FontAwesomeIcon icon={faFileCsv} className="text-[#8a9b1c] w-4 flex-shrink-0" />
                <span className="truncate">{t('analytics.employeesCsv', 'Empleados (CSV)')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
