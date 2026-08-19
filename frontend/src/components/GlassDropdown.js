import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

export default function GlassDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false,
  searchable = false,
  compact = false,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const toggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

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

  const filteredOptions = (searchable && searchTerm)
    ? options.filter(opt => (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`w-full flex items-center justify-between text-left transition-all duration-200 border border-white/80 bg-white/75 hover:bg-white/95 backdrop-blur-md shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
          compact 
            ? 'min-h-[32px] px-2.5 py-1 text-xs rounded-xl font-bold text-slate-800' 
            : 'min-h-[44px] px-4 py-2 text-xs sm:text-sm rounded-2xl font-medium text-slate-800'
        } ${isOpen ? 'ring-2 ring-[#b3c34c]/50 border-[#b3c34c]/60 shadow-md bg-white' : ''}`}
      >
        <span className="truncate flex-1">{displayLabel}</span>
        <FaChevronDown 
          className={`ms-2 flex-shrink-0 transition-transform duration-300 ${
            compact ? 'text-[9px]' : 'text-[11px]'
          } ${isOpen ? 'rotate-180 text-[#7a8a18]' : 'text-slate-400'}`} 
        />
      </button>

      {/* En móvil: acordeón inline suave. En escritorio (md:): flotante absoluto con sombra */}
      <div 
        className={`transition-all duration-300 ease-in-out md:duration-200 origin-top md:absolute md:left-0 md:top-full md:w-full md:z-[9999] ${
          isOpen 
            ? 'grid grid-rows-[1fr] opacity-100 mt-2 md:mt-1.5 pointer-events-auto md:scale-100 md:translate-y-0' 
            : 'grid grid-rows-[0fr] opacity-0 mt-0 pointer-events-none md:scale-95 md:-translate-y-2 md:hidden'
        }`}
      >
        <div className="overflow-hidden md:overflow-visible">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-2xl p-1.5 max-h-60 overflow-y-auto">
            {searchable && (
              <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <input 
                  id="dropdownSearchInput"
                  name="dropdownSearchInput"
                  type="text" 
                  autoComplete="off"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50"
                  placeholder={t('common.search', 'Buscar...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="py-1 flex flex-col gap-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = String(value) === String(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        setSearchTerm("");
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                        isSelected 
                          ? 'bg-[#b3c34c]/25 text-[#283603] font-bold shadow-xs' 
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <FaCheck className="ms-2 text-[10px] text-[#5c680f] flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  {t('common.noData', 'No hay opciones disponibles')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
