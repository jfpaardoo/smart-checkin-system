import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaCheck, FaChevronDown } from 'react-icons/fa';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'bg', label: 'Български' },
  { code: 'ro', label: 'Română' },
];

export default function LanguageSwitcher({ isMobile = false, isOpen = false, onToggle = null, onSelect = null }) {
  const { i18n } = useTranslation();
  const currentLangCode = i18n.resolvedLanguage || 'es';
  const current = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];
  
  const [canScrollMore, setCanScrollMore] = useState(true);
  const scrollContainerRef = useRef(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setCanScrollMore(scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(checkScroll, 100);
    }
  }, [isOpen]);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    if (isMobile && onSelect) {
      onSelect();
    } else if (onToggle) {
      onToggle();
    }
  };

  const handleToggle = (e) => {
    if (e) e.stopPropagation();
    if (onToggle) onToggle(e);
  };

  return (
    <div className="relative lang-switcher-container inline-block">
      <button
        type="button"
        onClick={handleToggle}
        className="ba-nav-btn flex items-center gap-2 focus:outline-none"
      >
        <FaGlobe className="text-white/80" />
        <span className="uppercase font-semibold text-[0.85rem]">{current.code}</span>
        <svg
          className={`w-4 h-4 ml-0.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menú emergente exclusivo para escritorio */}
      {!isMobile && (
        <div
          className={`ba-nav-dropdown-container right-0 min-w-[180px] w-max transition-all duration-300 origin-top-right z-[100] ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 visible'
              : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'
          }`}
        >
          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="py-1 max-h-[220px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              role="menu"
            >
              {LANGUAGES.map(({ code, label }) => {
                const isSelected = currentLangCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleChange(code)}
                    className={`ba-nav-dropdown-item w-full flex items-center justify-between text-left whitespace-nowrap ${
                      isSelected ? 'bg-white/10 font-bold' : ''
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <FaCheck className="text-[#b3c34c] text-xs ml-3 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {canScrollMore && (
              <div className="flex justify-center items-center py-1 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none rounded-b-xl">
                <FaChevronDown className="text-white/60 text-xs animate-bounce" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}