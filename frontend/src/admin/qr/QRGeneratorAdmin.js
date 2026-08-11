import React, { useState, useEffect, useCallback } from 'react';
import { CardTitle, FormGroup, Label } from 'reactstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import GlassDropdown from '../../components/GlassDropdown';

const QRGeneratorAdmin = () => {
    const { t } = useTranslation();
    const jwt = tokenService.getLocalAccessToken();
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

    const fetchCurrentToken = useCallback(async () => {
        try {
            const url = selectedFormationId 
                ? `/api/v1/totp/current?formationId=${selectedFormationId}`
                : '/api/v1/totp/current';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTotpToken(data.token);
            }
        } catch (error) {
            console.error("Error fetching TOTP token:", error);
        } finally {
            setLoading(false);
        }
    }, [jwt, selectedFormationId]);

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

    const [adminCoords, setAdminCoords] = useState(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setAdminCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, (error) => {
                console.warn("Geolocation not available or permission denied", error);
            }, { enableHighAccuracy: true });
        }
    }, []);

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