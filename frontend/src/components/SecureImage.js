import React, { useState, useEffect } from 'react';
import tokenService from '../services/token.service';

const SecureImage = ({ src, alt, style, className }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl = null;

        const fetchImage = async () => {
            if (!src) return;
            
            // If it's already a base64 string, just use it
            if (src.startsWith('data:image')) {
                setImageSrc(src);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(src, {
                    headers: {
                        'Authorization': `Bearer ${tokenService.getLocalAccessToken()}`
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    objectUrl = URL.createObjectURL(blob);
                    setImageSrc(objectUrl);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Error fetching secure image:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    if (loading) {
        return <div className="text-muted small" style={style}>Cargando firma...</div>;
    }

    if (error || !imageSrc) {
        return <div className="text-danger small" style={style}>Error al cargar firma</div>;
    }

    return <img src={imageSrc} alt={alt} style={style} className={className} />;
};

export default SecureImage;
