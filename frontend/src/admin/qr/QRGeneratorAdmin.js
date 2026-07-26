import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, FormGroup, Label } from 'reactstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import GlassDropdown from '../../components/GlassDropdown';

const QRGeneratorAdmin = () => {
    const jwt = tokenService.getLocalAccessToken();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFormationId = queryParams.get('formationId') || '';

    const [totpToken, setTotpToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(100);
    
    const [selectedFormationId, setSelectedFormationId] = useState(initialFormationId);

    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);

    useEffect(() => {
        const fetchCurrentToken = async () => {
            try {
                const response = await fetch('/api/v1/totp/current', {
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
                console.error("Error fetching initial TOTP token:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentToken();
    }, [jwt]);

    useEffect(() => {
        const calculateProgress = () => {
            const remainingMs = 20000 - (Date.now() % 20000);
            setProgress((remainingMs / 20000) * 100);
        };
        
        calculateProgress();
        const interval = setInterval(calculateProgress, 100);
        return () => clearInterval(interval);
    }, []);

    useSubscription('/topic/totp', (message) => {
        try {
            const data = JSON.parse(message.body);
            if (data?.token) {
                setTotpToken(data.token);
            }
        } catch (err) {
            console.warn("Error parsing WS message for TOTP token", err);
        }
    });

    const buildQrPayload = () => {
        const payload = { 
            token: totpToken, 
            action: "formation" 
        };
        
        if (selectedFormationId) {
            payload.formationId = Number.parseInt(selectedFormationId, 10);
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
        <div className="ba-container justify-content-center">
            <Card className="ba-card ba-card-qr p-4 p-md-5 my-auto mx-auto">
                <CardBody className="p-2 d-flex flex-column justify-content-center my-auto">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 gap-lg-5 py-2 my-auto">
                            
                            <div 
                                className="qr-code-container qr-code-frame d-flex align-items-center justify-content-center text-center" 
                                style={{ width: '305px', height: '305px', backgroundColor: '#f8f9fa' }}
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
                                        <p className="mb-0">Selecciona una formación</p>
                                        <p className="mb-0">para generar el QR</p>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex flex-column align-items-center align-items-md-start text-center text-md-start qr-info-column">
                                <CardTitle tag="h2" className="qr-title">
                                    QR de Formación
                                </CardTitle>
                                <p className="qr-subtitle mb-4">
                                    Selecciona la formación activa y proyecta el código para registrar la asistencia.
                                </p>

                                <div className="w-100 mb-3 text-start">
                                    <FormGroup>
                                        <Label for="formationId" style={{fontWeight: 600, color: '#555'}}>Seleccionar Formación</Label>
                                        <GlassDropdown
                                            options={formations.map(f => ({ value: f.id, label: f.name }))}
                                            value={selectedFormationId}
                                            onChange={(val) => setSelectedFormationId(String(val))}
                                            placeholder="Elige una formación..."
                                        />
                                    </FormGroup>
                                </div>

                                {selectedFormationId && (
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

                                        <div className="progress qr-progress-bar">
                                            <div 
                                                className={`progress-bar qr-progress-fill ${isEnding ? 'ending' : ''}`}
                                                style={{ width: `${progress}%` }}>
                                            </div>
                                        </div>
                                        
                                        <p className="qr-footer-text mt-1">
                                            Seguridad TOTP: Se actualiza cada 20s
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default QRGeneratorAdmin;