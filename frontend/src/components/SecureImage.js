import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const SecureImage = ({ src, alt, style, className }) => {
    const { t } = useTranslation();
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

        let cleanSrc = src;
        if (cleanSrc.startsWith('/api/v1')) {
            cleanSrc = cleanSrc.substring(7);
        }

        api.get(cleanSrc, { responseType: 'blob' })
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
        return <div className="text-muted small" style={style}>{t('signature.loading', 'Cargando firma...')}</div>;
    }

    if (error || !finalSrc) {
        return <div className="text-danger small" style={style}>{t('signature.loadError', 'Error al cargar firma')}</div>;
    }

    return <img src={finalSrc} alt={alt} style={style} className={className} loading="lazy" decoding="async" />;
};

export default SecureImage;
