import React, { useState, useEffect, useRef, useTransition } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * GlassSearchBar - Reusable Liquid Glass Capsule Search Bar
 * 
 * Optimizado para pantallas de 60Hz y 120Hz:
 * - Utiliza React 18 `useTransition` para que la escritura en el input nunca pierda fotogramas
 * - Debounce adaptable y cancelación inmediata al borrar
 * - GPU layer y renderizado acelerado
 */
export default function GlassSearchBar({ 
    value = '', 
    onSearch, 
    placeholder, 
    className = '', 
    debounceMs = 280,
    style = {} 
}) {
    const { t } = useTranslation();
    const effectivePlaceholder = placeholder || t('common.search', 'Buscar...');
    const [searchTerm, setSearchTerm] = useState(value);
    const [prevValueProp, setPrevValueProp] = useState(value);
    const [isPending, startTransition] = useTransition();

    // Derive state if the external value prop changes
    if (value !== prevValueProp) {
        setPrevValueProp(value);
        setSearchTerm(value);
    }

    const onSearchRef = useRef(onSearch);
    const isFirstRender = useRef(true);

    // Keep onSearch ref up to date without triggering useEffect
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    // Non-blocking concurrent debounce effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            if (onSearchRef.current) {
                startTransition(() => {
                    onSearchRef.current(searchTerm);
                });
            }
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchTerm, debounceMs]);

    const handleClear = () => {
        setSearchTerm('');
        if (onSearchRef.current) {
            startTransition(() => {
                onSearchRef.current('');
            });
        }
    };

    return (
        <div className={`da-search-bar-wrapper relative w-full flex items-center gpu-layer ${className}`} style={style}>
            <FontAwesomeIcon 
                icon={isPending ? faSpinner : faSearch} 
                spin={isPending}
                className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${
                    isPending ? 'text-[#b3c34c]' : 'text-[#73841e] dark:text-[#d4e84a]'
                }`} 
            />
            <input
                type="text"
                className="da-glass-search-input w-full"
                style={{ paddingLeft: '48px', paddingRight: '42px' }}
                placeholder={effectivePlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    type="button" 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer z-10 p-1 active:scale-90 transition-transform duration-150" 
                    onClick={handleClear}
                    title={t('common.clearSearch', 'Limpiar búsqueda')}
                    aria-label={t('common.clearSearch', 'Limpiar búsqueda')}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            )}
        </div>
    );
}
