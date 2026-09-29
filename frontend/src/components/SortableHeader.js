import React from 'react';

/**
 * SortableHeader
 * Componente reutilizable para encabezados de tabla con soporte de ordenación interactiva.
 * Muestra el título de la columna y un indicador triangular interactivo según el estado de ordenación.
 */
export default function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = 'left',
  width,
  style = {},
  className = ''
}) {
  const isActive = currentSort?.key === sortKey;
  const direction = currentSort?.direction || 'asc';

  const handleClick = () => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  let alignmentClass = 'text-left justify-start';
  let cellAlignClass = 'text-left';
  if (align === 'center') {
    alignmentClass = 'text-center justify-center';
    cellAlignClass = 'text-center';
  } else if (align === 'right') {
    alignmentClass = 'text-right justify-end';
    cellAlignClass = 'text-right';
  }

  let ariaSort = 'none';
  if (isActive) {
    ariaSort = direction === 'asc' ? 'ascending' : 'descending';
  }

  const headerTitle = typeof label === 'string' ? `Ordenar por ${label}` : `Ordenar por ${sortKey}`;
  const cellStyle = width ? { ...style, width } : style;

  const renderIndicator = () => {
    if (!isActive) {
      return (
        <svg 
          className="w-2 h-2 text-slate-400/40 dark:text-slate-500/40 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" 
          viewBox="0 0 10 10" 
          fill="currentColor"
        >
          <polygon points="5,2 8,7 2,7" />
        </svg>
      );
    }

    if (direction === 'asc') {
      return (
        <svg 
          className="w-2.5 h-2.5 text-[#73841e] dark:text-[#d4e84a] transform transition-transform" 
          viewBox="0 0 10 10" 
          fill="currentColor"
        >
          <polygon points="5,1 9,8 1,8" />
        </svg>
      );
    }

    return (
      <svg 
        className="w-2.5 h-2.5 text-[#73841e] dark:text-[#d4e84a] transform transition-transform" 
        viewBox="0 0 10 10" 
        fill="currentColor"
      >
        <polygon points="1,2 9,2 5,9" />
      </svg>
    );
  };

  return (
    <th
      style={cellStyle}
      className={`py-4 px-5 select-none cursor-pointer group transition-colors hover:text-slate-900 dark:hover:text-white ${cellAlignClass} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="columnheader"
      aria-sort={ariaSort}
      title={headerTitle}
    >
      <div className={`inline-flex items-center gap-1.5 ${alignmentClass}`}>
        <span>{label}</span>
        <span 
          className="inline-flex items-center justify-center w-3.5 h-3.5 transition-all duration-150"
          aria-hidden="true"
        >
          {renderIndicator()}
        </span>
      </div>
    </th>
  );
}
