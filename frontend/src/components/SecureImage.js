import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SecureImage = ({ src, alt, style, className }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [blob, setBlob] = useState(null);
    const [objectUrl, setObjectUrl] = useState(null);

    useEffect(() => {
        setBlob(null);
        setObjectUrl(null);
        if (!src) return;
        
        if (src.startsWith('data:image')) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        api.get(src, { responseType: 'blob' })
            .then(response => {
                if (isMounted) {
                    if (response.data) {
                        setBlob(response.data);
                        setError(false);
                    } else {
                        setError(true);
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching secure image:', err);
                if (isMounted) setError(true);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [src]);

    useEffect(() => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [blob]);

    const finalSrc = src?.startsWith('data:image') ? src : objectUrl;

    if (loading) {
        return <div className="text-muted small" style={style}>Cargando firma...</div>;
    }

    if (error || !finalSrc) {
        return <div className="text-danger small" style={style}>Error al cargar firma</div>;
    }

    return <img src={finalSrc} alt={alt} style={style} className={className} />;
};

export default SecureImage;
