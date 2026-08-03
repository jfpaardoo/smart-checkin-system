import React from 'react';
import { useTranslation } from 'react-i18next';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const LANGUAGES = [
  { code: 'es', flag: '🇪🇸' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'pt', flag: '🇵🇹' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'pl', flag: '🇵🇱' },
  { code: 'bg', flag: '🇧🇬' },
  { code: 'ro', flag: '🇷🇴' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || LANGUAGES[0];

  const handleChange = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <UncontrolledDropdown>
      <DropdownToggle tag="div" className="d-inline-flex align-items-center gap-1 cursor-pointer" style={{ fontSize: '1rem' }}>
        <span>{current.flag}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{current.code.toUpperCase()}</span>
      </DropdownToggle>
      <DropdownMenu className="ba-dropdown-menu" end style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {LANGUAGES.map(({ code, flag }) => (
          <DropdownItem
            key={code}
            className={`ba-dropdown-item d-flex align-items-center gap-2${i18n.resolvedLanguage === code ? ' fw-bold' : ''}`}
            onClick={() => handleChange(code)}
          >
            <span>{flag}</span>
            <span>{t(`lang.${code}`)}</span>
            {i18n.resolvedLanguage === code && <span className="ms-auto">✓</span>}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
