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
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 sm:p-3.5 rounded-[22px] bg-white/35 backdrop-blur-md border border-white/60 shadow-xs mt-4 relative z-20 w-full max-w-full ${className}`}>
      
      {/* 1. Lado Izquierdo: Contador y Selector "Por pág" alineados */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-600 w-full sm:w-auto flex-wrap">
        <span className="font-medium whitespace-nowrap text-[11px] sm:text-xs">
          {t('pagination.showing', 'Mostrando')}{' '}
          <strong className="text-slate-800 font-bold">{startItem}-{endItem}</strong>{' '}
          {t('pagination.of', 'de')}{' '}
          <strong className="text-slate-800 font-bold">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1 relative shrink-0" ref={dropdownRef}>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">{t('pagination.perPage', 'Por pág:')}</span>
            
            {/* Botón selector custom Liquid Glass */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-between gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/80 hover:bg-white text-slate-800 font-bold text-xs rounded-xl border border-white shadow-xs backdrop-blur-md transition active:scale-95 cursor-pointer min-w-[46px]"
            >
              <span>{pageSize}</span>
              <span className={`text-[7px] sm:text-[8px] text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Menú flotante hacia arriba */}
            {isOpen && (
              <div 
                className="absolute bottom-[calc(100%+6px)] right-0 min-w-[65px] bg-white rounded-2xl p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col gap-1"
                style={{ zIndex: 99999 }}
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#b3c34c]/30 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <span className="text-[10px] text-[#7a8a1c]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Lado Derecho: Controles de navegación */}
      <div className="flex items-center gap-1 max-w-full justify-center">
        {/* Primera página (oculto en pantallas muy estrechas) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex p-2 rounded-xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs items-center justify-center"
          title={t('pagination.first', 'Primera página')}
          aria-label={t('pagination.first', 'Primera página')}
        >
          <FaAngleDoubleLeft size={11} />
        </button>

        {/* Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs flex items-center justify-center shrink-0"
          title={t('pagination.prev', 'Página anterior')}
          aria-label={t('pagination.prev', 'Página anterior')}
        >
          <FaChevronLeft size={10} />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 overflow-hidden">
          {visiblePages.map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] sm:min-w-[32px] h-[28px] sm:h-[32px] px-1.5 sm:px-2 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-[#b3c34c]/80 text-slate-900 border border-white shadow-[0_2px_8px_rgba(179,195,76,0.4)] scale-105'
                    : 'bg-white/50 text-slate-700 border border-white/70 hover:bg-white hover:text-slate-900'
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
          className="p-1.5 sm:p-2 rounded-xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs flex items-center justify-center shrink-0"
          title={t('pagination.next', 'Página siguiente')}
          aria-label={t('pagination.next', 'Página siguiente')}
        >
          <FaChevronRight size={10} />
        </button>

        {/* Última página (oculto en pantallas muy estrechas) */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex p-2 rounded-xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs items-center justify-center"
          title={t('pagination.last', 'Última página')}
          aria-label={t('pagination.last', 'Última página')}
        >
          <FaAngleDoubleRight size={11} />
        </button>
      </div>
    </div>
  );
}
