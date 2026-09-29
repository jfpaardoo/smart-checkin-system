import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaSortAmountDown } from 'react-icons/fa';
import GlassDropdown from './GlassDropdown';

/**
 * MobileSortBar
 * Barra de ordenación táctil para dispositivos móviles integrada con GlassDropdown.
 * Permite seleccionar la columna mediante el componente Liquid Glass del sistema
 * y alternar entre orden ascendente (▲) y descendente (▼).
 */
export default function MobileSortBar({
  options = [],
  currentSort,
  onSort,
  className = ''
}) {
  const { t } = useTranslation();
  const direction = currentSort?.direction || 'asc';
  const isAsc = direction === 'asc';

  const dropdownOptions = options.map((opt) => ({
    value: opt.key || opt.value,
    label: opt.label
  }));

  const handleFieldChange = (newKey) => {
    if (newKey && onSort) {
      onSort(newKey);
    }
  };

  const toggleDirection = () => {
    if (currentSort?.key && onSort) {
      onSort(currentSort.key);
    }
  };

  return (
    <div className={`md:hidden flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs mb-3 relative z-40 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="p-2 rounded-xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0 flex items-center justify-center">
          <FaSortAmountDown size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
            {t('common.sortBy', 'Ordenar por')}
          </label>
          <GlassDropdown
            options={dropdownOptions}
            value={currentSort?.key || ''}
            onChange={handleFieldChange}
            compact
            floating
            dropup={false}
            placeholder={t('common.select', 'Seleccionar...')}
            className="w-full"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={toggleDirection}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-700/70 border border-white/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs cursor-pointer transition active:scale-95 flex-shrink-0 mt-3.5"
        title={isAsc ? t('common.ascending', 'Ascendente') : t('common.descending', 'Descendente')}
        aria-label={isAsc ? t('common.ascending', 'Ascendente') : t('common.descending', 'Descendente')}
      >
        <span className="text-[#73841e] dark:text-[#d4e84a]">
          {isAsc ? (
            <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="5,1 9,8 1,8" />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="1,2 9,2 5,9" />
            </svg>
          )}
        </span>
        <span className="text-[11px] font-mono tracking-tight">{isAsc ? 'ASC' : 'DESC'}</span>
      </button>
    </div>
  );
}
