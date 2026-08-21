import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

function filterOptions(options, searchTerm, searchable) {
  if (!searchable || !searchTerm) return options;
  const term = searchTerm.toLowerCase();
  return options.filter(opt => {
    const label = (opt.label || '').toLowerCase();
    const searchKeywords = (opt.searchKeywords || '').toLowerCase();
    return label.includes(term) || searchKeywords.includes(term);
  });
}

function getFloatingClasses(openUpwards, isOpen) {
  const positionClass = openUpwards ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top';
  const stateClass = isOpen 
    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0 visible' 
    : 'opacity-0 scale-95 pointer-events-none -translate-y-1 invisible';
  return `absolute left-0 w-full z-[9999] transition-all duration-300 ease-out ${positionClass} ${stateClass}`;
}

function getAccordionClasses(openUpwards, isOpen) {
  const positionClass = openUpwards ? 'sm:bottom-full sm:mb-1.5 sm:origin-bottom' : 'sm:top-full sm:mt-1.5 sm:origin-top';
  const stateClass = isOpen 
    ? 'grid-rows-[1fr] opacity-100 mt-2 z-10 sm:scale-100 sm:translate-y-0 sm:pointer-events-auto sm:visible' 
    : 'grid-rows-[0fr] opacity-0 mt-0 z-0 sm:scale-95 sm:-translate-y-1 sm:pointer-events-none sm:invisible pointer-events-none';
  return `grid transition-all duration-300 ease-out sm:block sm:absolute sm:left-0 sm:w-full sm:z-[9999] ${positionClass} ${stateClass}`;
}

function DropdownOptionItem({ opt, isSelected, onSelect }) {
  const selectedStyle = isSelected 
    ? 'bg-[#b3c34c]/20 text-[#3b4707] font-bold' 
    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900';

  return (
    <button
      key={opt.value}
      type="button"
      disabled={opt.disabled}
      onClick={() => onSelect(opt.value)}
      className={`w-full flex items-center justify-between text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${selectedStyle}`}
    >
      <span className="truncate">{opt.label}</span>
      {isSelected && <FaCheck className="text-[#8a9b1c] text-xs flex-shrink-0 ms-2" />}
    </button>
  );
}

export default function GlassDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false,
  searchable = false,
  compact = false,
  dropup = 'auto',
  floating = false
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef(null);

  const toggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    if (typeof dropup === 'boolean') {
      setOpenUpwards(dropup);
      return;
    }

    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUpwards(spaceBelow < 220 && rect.top > spaceBelow);
  }, [isOpen, dropup]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const filteredOptions = useMemo(() => filterOptions(options, searchTerm, searchable), [options, searchTerm, searchable]);

  const buttonSizeClass = compact 
    ? 'min-h-[32px] px-2.5 py-1 text-xs rounded-xl font-bold text-slate-800' 
    : 'min-h-[44px] px-4 py-2 text-xs sm:text-sm rounded-2xl font-medium text-slate-800';

  const buttonOpenClass = isOpen ? 'ring-2 ring-[#b3c34c]/50 border-[#b3c34c]/60 shadow-md bg-white' : '';
  const chevronSizeClass = compact ? 'text-[9px]' : 'text-[11px]';
  const chevronOpenClass = isOpen ? 'rotate-180 text-[#7a8a18]' : 'text-slate-400';

  const menuContainerClass = floating 
    ? getFloatingClasses(openUpwards, isOpen) 
    : getAccordionClasses(openUpwards, isOpen);

  const handleSelect = (val) => {
    setSearchTerm("");
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`w-full flex items-center justify-between text-left transition-all duration-200 border border-white/80 bg-white/75 hover:bg-white/95 backdrop-blur-md shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${buttonSizeClass} ${buttonOpenClass}`}
      >
        <span className="truncate flex-1 text-slate-800">{displayLabel}</span>
        <FaChevronDown className={`ms-2 flex-shrink-0 transition-transform duration-300 ${chevronSizeClass} ${chevronOpenClass}`} />
      </button>

      {/* Menú: animado en móvil y desktop */}
      <div className={menuContainerClass}>
        <div className="overflow-hidden sm:overflow-visible rounded-2xl">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 max-h-56 overflow-y-auto">
            {searchable && (
              <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <input 
                  id="dropdownSearchInput"
                  name="dropdownSearchInput"
                  type="text" 
                  autoComplete="off"
                  className="w-full px-3 py-1.5 text-xs bg-white text-slate-800 font-medium placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50"
                  style={{ color: '#1e293b' }}
                  placeholder={t('common.search', 'Buscar...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="py-1 flex flex-col gap-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <DropdownOptionItem
                    key={opt.value}
                    opt={opt}
                    isSelected={String(value) === String(opt.value)}
                    onSelect={handleSelect}
                  />
                ))
              ) : (
                <div className="px-3.5 py-2 text-xs text-slate-400 text-center">
                  {t('common.noResults', 'No se encontraron resultados')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
