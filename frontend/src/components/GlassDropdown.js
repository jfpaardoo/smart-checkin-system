import React from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

export default function GlassDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false 
}) {
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <UncontrolledDropdown className={`w-100 ${className}`}>
      <DropdownToggle
        tag="button"
        type="button"
        disabled={disabled}
        className="ba-select-toggle d-flex align-items-center justify-content-between w-100"
      >
        <span className="text-truncate">{displayLabel}</span>
        <span className="dropdown-caret-icon ms-2">▼</span>
      </DropdownToggle>
      <DropdownMenu className="ba-dropdown-menu w-100" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {options.length > 0 ? (
          options.map((opt) => (
            <DropdownItem
              key={opt.value}
              disabled={opt.disabled}
              className={`ba-dropdown-item d-flex align-items-center justify-content-between ${String(value) === String(opt.value) ? 'active' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="text-truncate">{opt.label}</span>
              {String(value) === String(opt.value) && <span className="ms-2">✓</span>}
            </DropdownItem>
          ))
        ) : (
          <DropdownItem disabled>No hay opciones disponibles</DropdownItem>
        )}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
