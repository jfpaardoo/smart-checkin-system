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
  searchable = false
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = (searchable && searchTerm)
    ? options.filter(opt => (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <UncontrolledDropdown className={`w-100 h-100 ${className}`}>
      <DropdownToggle
        tag="button"
        type="button"
        disabled={disabled}
        className="da-select-toggle d-flex align-items-center justify-content-between w-100 h-100"
      >
        <span className="text-truncate">{displayLabel}</span>
        <span className="dropdown-caret-icon ms-2">▼</span>
      </DropdownToggle>
      <DropdownMenu className="da-dropdown-menu da-light-dropdown w-100" style={{ maxHeight: '300px', overflowY: 'auto', padding: 0 }}>
        {searchable && (
          <div className="p-2 border-bottom" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-glass, #ffffff)', zIndex: 2 }}>
            <input 
              type="text" 
              className="form-control form-control-sm"
              placeholder={t('common.search', 'Buscar...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
              onKeyDown={(e) => { e.stopPropagation(); }}
            />
          </div>
        )}
        <div style={{ padding: '0.5rem 0' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <DropdownItem
                key={opt.value}
                disabled={opt.disabled}
                className={`da-dropdown-item d-flex align-items-center justify-content-between ${String(value) === String(opt.value) ? 'active' : ''}`}
                onClick={() => {
                  setSearchTerm("");
                  onChange(opt.value);
                }}
              >
                <span className="text-truncate">{opt.label}</span>
                {String(value) === String(opt.value) && <span className="ms-2">✓</span>}
              </DropdownItem>
            ))
          ) : (
            <DropdownItem disabled>{t('common.noData', 'No hay opciones disponibles')}</DropdownItem>
          )}
        </div>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
