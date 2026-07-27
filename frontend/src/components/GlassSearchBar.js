import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * GlassSearchBar - Reusable Liquid Glass Capsule Search Bar
 * 
 * Optimized with 350ms debounce and stable ref handling to prevent infinite re-render loops.
 */
export default function GlassSearchBar({ 
    value = '', 
    onSearch, 
    placeholder = 'Search...', 
    className = '', 
    debounceMs = 350,
    style = {} 
}) {
    const [searchTerm, setSearchTerm] = useState(value);
    const onSearchRef = useRef(onSearch);
    const isFirstRender = useRef(true);

    // Keep onSearch ref up to date without triggering useEffect
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    // Sync external value prop
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // 350ms Debounce effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            if (onSearchRef.current) {
                onSearchRef.current(searchTerm);
            }
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchTerm, debounceMs]);

    const handleClear = () => {
        setSearchTerm('');
        if (onSearchRef.current) {
            onSearchRef.current('');
        }
    };

    return (
        <div className={`ba-search-bar-wrapper ${className}`} style={{ position: 'relative', width: '100%', maxWidth: '380px', ...style }}>
            <FontAwesomeIcon icon={faSearch} className="ba-search-bar-icon" />
            <Input
                type="text"
                className="ba-glass-search-input"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    type="button" 
                    className="ba-search-clear-btn" 
                    onClick={handleClear}
                    title="Clear search"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            )}
        </div>
    );
}
