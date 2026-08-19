import React, { useState, useEffect, useCallback } from 'react';
import { CardTitle, FormGroup, Label } from 'reactstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import api from '../../services/api';
import GlassDropdown from '../../components/GlassDropdown';

const QRGeneratorAdmin = () => {
    const { t } = useTranslation();
    const jwt = tokenService.getUser();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFormationId = queryParams.get('formationId') ? Number.parseInt(queryParams.get('formationId'), 10) : null;

    const [totpToken, setTotpToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(100);
    
    const [selectedFormationId, setSelectedFormationId] = useState(initialFormationId);
    
    // Rompe la clausura del WebSocket para que pida la formación correcta siempre
    const [wsTick, setWsTick] = useState(0);

    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);
    const [adminCoords, setAdminCoords] = useState(null);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && "geolocation" in navigator) {
            const handleSuccess = (position) => {
                setAdminCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            };

            const getPos = (highAccuracy, timeoutMs, maxAge) => {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: highAccuracy,
                        timeout: timeoutMs,
                        maximumAge: maxAge
                    });
                });
            };

            const locate = async () => {
                const tiers = [
                    { high: true, timeout: 4000, maxAge: 15000 },
                    { high: false, timeout: 6000, maxAge: 60000 },
                    { high: false, timeout: 8000, maxAge: 600000 }
                ];
                for (const tier of tiers) {
                    try {
                        const pos = await getPos(tier.high, tier.timeout, tier.maxAge);
                        handleSuccess(pos);
                        return;
                    } catch (error_) {
                        console.debug("Admin GPS tier deferred:", error_);
                    }
                }
            };

            locate();
        }
    }, []);

    const fetchCurrentToken = useCallback(async () => {
        try {
            let url = selectedFormationId
                ? `/totp/current?formationId=${selectedFormationId}`
                : '/totp/current';

            if (adminCoords) {
                const sep = url.includes('?') ? '&' : '?';
                url += `${sep}lat=${adminCoords.lat}&lng=${adminCoords.lng}`;
            }

            const res = await api.get(url);
            setTotpToken(res.data.token);
        } catch (error) {
            console.error("Error fetching TOTP token:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedFormationId, adminCoords]);

    // Recarga el token si cambias de formación o si el WebSocket da un toque (cada 20s)
    useEffect(() => {
        fetchCurrentToken();
    }, [fetchCurrentToken, wsTick]);

    useEffect(() => {
        const calculateProgress = () => {
            const remainingMs = 20000 - (Date.now() % 20000);
            setProgress((remainingMs / 20000) * 100);
        };
        
        calculateProgress();
        const interval = setInterval(calculateProgress, 100);
        return () => clearInterval(interval);
    }, []);

    // El WebSocket ya no sobrescribe con el token global. Solo avisa de que el tiempo pasó.
    useSubscription('/topic/totp', () => {
        setWsTick(prev => prev + 1);
    });



    const buildQrPayload = () => {
        const payload = { 
            token: totpToken, 
            action: "formation" 
        };
        
        if (selectedFormationId) {
            payload.formationId = selectedFormationId;
        }

        if (adminCoords) {
            payload.adminLat = adminCoords.lat;
            payload.adminLng = adminCoords.lng;
        }
        
        return JSON.stringify(payload);
    };

    const isEnding = progress <= (3 / 20) * 100;
    const qrOpacity = isEnding ? Math.max(0.2, progress / ((3 / 20) * 100)) : 1;
    const fadeStyle = {
        opacity: qrOpacity,
        transition: 'opacity 0.2s ease-out'
    };

    return (
        <div className="da-container justify-content-center">
            <div className="da-card da-card-qr p-4 p-md-5 my-auto mx-auto">
                <div className="card-body p-2 d-flex flex-column justify-content-center my-auto">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 gap-lg-5 py-2 my-auto">
                            
                            <div className="d-flex flex-column align-items-center justify-content-center">
                                <div 
                                    className="qr-code-container qr-code-frame d-flex align-items-center justify-content-center text-center" 
                                    style={{ width: '305px', height: '305px', backgroundColor: '#ffffff', borderRadius: '36px' }}
                                >
                                    {selectedFormationId ? (
                                        <div style={fadeStyle}>
                                            <QRCodeSVG 
                                                value={buildQrPayload()} 
                                                size={265} 
                                                level="M" 
                                                marginSize={0}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ color: '#888', fontWeight: '500' }}>
                                            <p className="mb-0">{t('qr.selectFormationPrompt')}</p>
                                            <p className="mb-0">{t('qr.selectFormationPrompt2')}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 text-center">
                                    {adminCoords ? (
                                        <div 
                                            className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-xs"
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.12)',
                                                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                                                color: '#065f46',
                                                fontSize: '0.85rem',
                                                fontWeight: '700'
                                            }}
                                        >
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                                            <span>GPS del Administrador Vinculado</span>
                                        </div>
                                    ) : (
                                        <div 
                                            className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-xs"
                                            style={{
                                                background: 'rgba(245, 158, 11, 0.12)',
                                                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                                                color: '#92400e',
                                                fontSize: '0.85rem',
                                                fontWeight: '700'
                                            }}
                                        >
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                                            <span>Obteniendo GPS del Administrador...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex flex-column align-items-center align-items-md-start text-center text-md-start qr-info-column">
                                <CardTitle tag="h2" className="qr-title">
                                    {t('qr.title')}
                                </CardTitle>
                                <p className="qr-subtitle mb-4">
                                    {t('qr.subtitle')}
                                </p>

                                <div className="w-100 mb-3 text-start">
                                    <FormGroup>
                                        <Label for="formationId" style={{fontWeight: 600, color: '#555'}}>{t('qr.selectFormation')}</Label>
                                        <GlassDropdown
                                            options={formations.map(f => ({ value: f.id, label: f.name }))}
                                            value={selectedFormationId || ''}
                                            onChange={(val) => {
                                                setSelectedFormationId(val ? Number.parseInt(val, 10) : null);
                                            }}
                                            placeholder={t('qr.selectFormationPlaceholder')}
                                        />
                                    </FormGroup>
                                </div>

                                {!!selectedFormationId && (
                                    <div className="w-100 text-center text-md-start mt-2">
                                        <div className="mb-3">
                                            <span 
                                                className="token-display" 
                                                style={{ 
                                                    fontSize: '2.2rem', 
                                                    padding: '5px 20px',
                                                    ...fadeStyle
                                                }}
                                            >
                                                {totpToken}
                                            </span>
                                        </div>

                                        {/* QR expiry countdown — Tailwind liquid glass progress */}
                                        <div className="w-full rounded-full overflow-hidden mb-3" style={{
                                            height: '6px',
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)'
                                        }}>
                                            <div
                                                style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    borderRadius: '9999px',
                                                    background: isEnding
                                                        ? 'linear-gradient(90deg, #f87171, #ef4444)'
                                                        : 'linear-gradient(90deg, #b3c34c, #cce364)',
                                                    boxShadow: isEnding
                                                        ? '0 0 10px rgba(239,68,68,0.7), 0 0 20px rgba(239,68,68,0.35)'
                                                        : '0 0 10px rgba(179,195,76,0.6), 0 0 20px rgba(204,227,100,0.3)',
                                                    transition: 'width 100ms linear, background 0.4s ease, box-shadow 0.4s ease',
                                                }}
                                            />
                                        </div>
                                        
                                        <p className="qr-footer-text mt-1">
                                            {t('qr.totpSecurity')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRGeneratorAdmin;