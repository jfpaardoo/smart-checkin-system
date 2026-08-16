import React, { useState } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useTranslation } from 'react-i18next';

export default function GlassDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false,
  searchable = false,
  compact = false,
  direction = "down"
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = (searchable && searchTerm)
    ? options.filter(opt => (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <UncontrolledDropdown direction={direction} className={`w-100 position-relative ${className}`} style={{ zIndex: 50 }}>
      <DropdownToggle
        tag="button"
        type="button"
        disabled={disabled}
        className="da-select-toggle d-flex align-items-center justify-content-between w-100 text-start"
        style={{ 
          minHeight: compact ? '32px' : '46px',
          padding: compact ? '2px 8px' : '8px 16px',
          fontSize: compact ? '12px' : '14px',
          borderRadius: compact ? '12px' : '20px'
        }}
      >
        <span className={compact ? "font-bold text-slate-800" : "text-truncate flex-grow-1"}>{displayLabel}</span>
        <span className="dropdown-caret-icon ms-1.5 flex-shrink-0" style={{ fontSize: compact ? '8px' : '11px' }}>▼</span>
      </DropdownToggle>
      <DropdownMenu 
        className="da-dropdown-menu da-light-dropdown w-100 shadow-2xl" 
        style={{ 
          maxHeight: '260px', 
          overflowY: 'auto', 
          padding: 0, 
          zIndex: 99999,
          backgroundColor: '#ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)'
        }}
      >
        {searchable && (
          <div className="p-2 border-bottom" style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 2 }}>
            <input 
              id="dropdownSearchInput"
              name="dropdownSearchInput"
              type="text" 
              autoComplete="off"
              className="form-control form-control-sm"
              placeholder={t('common.search', 'Buscar...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
              onKeyDown={(e) => { e.stopPropagation(); }}
            />
          </div>
        )}
        <div style={{ padding: '0.4rem 0' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <DropdownItem
                key={opt.value}
                disabled={opt.disabled}
                className={`da-dropdown-item d-flex align-items-center justify-content-between ${String(value) === String(opt.value) ? 'active' : ''}`}
                style={{ fontSize: compact ? '12px' : '13px', padding: compact ? '5px 10px' : '8px 16px' }}
                onClick={() => {
                  setSearchTerm("");
                  onChange(opt.value);
                }}
              >
                <span className="text-truncate">{opt.label}</span>
                {String(value) === String(opt.value) && <span className="ms-2 font-bold">✓</span>}
              </DropdownItem>
            ))
          ) : (
            <DropdownItem disabled className="text-xs">{t('common.noData', 'No hay opciones disponibles')}</DropdownItem>
          )}
        </div>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
