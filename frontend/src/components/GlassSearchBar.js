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
    const [prevValueProp, setPrevValueProp] = useState(value);

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
        <div className={`da-search-bar-wrapper ${className}`} style={style}>
            <FontAwesomeIcon icon={faSearch} className="da-search-bar-icon" />
            <Input
                type="text"
                className="da-glass-search-input"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    type="button" 
                    className="da-search-clear-btn" 
                    onClick={handleClear}
                    title="Clear search"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            )}
        </div>
    );
}
