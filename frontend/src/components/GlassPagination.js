import React, { useState, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function GlassPagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = ''
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar números de página visibles
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        start = 1;
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages;
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const visiblePages = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 p-3 sm:px-5 sm:py-3 rounded-2xl sm:rounded-full bg-white/40 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm mt-4 relative z-20 w-full ${className}`}>
      
      {/* 1. Información de página y Selector de elementos por página (en fila en desktop, apilados en móvil estrecho) */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left">
        <span className="font-medium whitespace-nowrap text-xs">
          {t('pagination.showing', 'Mostrando')}{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-bold">{startItem}-{endItem}</strong>{' '}
          {t('pagination.of', 'de')}{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center justify-center gap-1.5 relative shrink-0" ref={dropdownRef}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{t('pagination.perPage', 'Por pág:')}</span>
            
            {/* Botón selector custom Liquid Glass */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-between gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-full border border-white/80 dark:border-white/10 shadow-2xs backdrop-blur-md transition active:scale-95 cursor-pointer min-w-[50px]"
            >
              <span>{pageSize}</span>
              <span className={`text-[8px] text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Menú flotante hacia arriba */}
            {isOpen && (
              <div 
                className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 min-w-[75px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 z-50"
              >
                {pageSizeOptions.map((opt) => {
                  const isSelected = opt === pageSize;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onPageSizeChange(opt);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center justify-between border-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#b3c34c]/30 text-[#54620f] dark:text-[#d4e84a]'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <span className="text-[10px] text-[#7a8a1c] dark:text-[#d4e84a]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Controles circulares de navegación */}
      <div className="flex items-center gap-1 sm:gap-1.5 max-w-full justify-center flex-wrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-700/50">
        {/* Primera página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex w-8 h-8 rounded-full bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shadow-2xs items-center justify-center cursor-pointer shrink-0"
          title={t('pagination.first', 'Primera página')}
          aria-label={t('pagination.first', 'Primera página')}
        >
          <FaAngleDoubleLeft size={10} />
        </button>

        {/* Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shadow-2xs inline-flex items-center justify-center shrink-0 cursor-pointer"
          title={t('pagination.prev', 'Página anterior')}
          aria-label={t('pagination.prev', 'Página anterior')}
        >
          <FaChevronLeft size={10} />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {visiblePages.map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all shadow-2xs inline-flex items-center justify-center shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#b3c34c] text-slate-950 border border-[#b3c34c] shadow-[0_2px_10px_rgba(179,195,76,0.5)] font-extrabold scale-105'
                    : 'bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shadow-2xs inline-flex items-center justify-center shrink-0 cursor-pointer"
          title={t('pagination.next', 'Página siguiente')}
          aria-label={t('pagination.next', 'Página siguiente')}
        >
          <FaChevronRight size={10} />
        </button>

        {/* Última página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex w-8 h-8 rounded-full bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shadow-2xs items-center justify-center cursor-pointer shrink-0"
          title={t('pagination.last', 'Última página')}
          aria-label={t('pagination.last', 'Última página')}
        >
          <FaAngleDoubleRight size={10} />
        </button>
      </div>
    </div>
  );
}
