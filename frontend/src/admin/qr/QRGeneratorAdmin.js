import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useSubscription } from '../../hooks/useSubscription';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';

const QRGeneratorAdmin = () => {
    const [totpToken, setTotpToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(100);

    const fetchCurrentToken = async () => {
        try {
            const jwt = tokenService.getLocalAccessToken();
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

    // Al montar el componente, obtener el token inicial para no esperar hasta 30s
    useEffect(() => {
        fetchCurrentToken();
    }, []);

    // Efecto para calcular el progreso de la barra (10 segundos en total)
    useEffect(() => {
        const calculateProgress = () => {
            const remainingMs = 10000 - (Date.now() % 10000);
            setProgress((remainingMs / 10000) * 100);
        };
        
        calculateProgress(); // cálculo inicial
        const interval = setInterval(calculateProgress, 100); // actualización suave cada 100ms

        return () => clearInterval(interval);
    }, []);

    // Suscripción al WebSocket para recibir los nuevos tokens en tiempo real
    useSubscription('/topic/totp', (message) => {
        try {
            const data = JSON.parse(message.body);
            if (data?.token) {
                setTotpToken(data.token);
                console.log("Token actualizado via WebSocket:", data.token);
            }
        } catch (err) {
            console.warn("Error parsing WS message for TOTP token", err);
        }
    });

    const qrPayload = JSON.stringify({ token: totpToken, action: "checkin" });

    return (
        <div className="ba-container justify-content-center">
            <Card className="ba-card ba-card-qr p-4 p-md-5 my-auto mx-auto">
                <CardBody className="p-2 d-flex flex-column justify-content-center my-auto">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 gap-lg-5 py-2 my-auto">
                            {/* Left Side: Glowing QR Code Container */}
                            <div className="qr-code-container qr-code-frame">
                                <QRCodeSVG 
                                    value={qrPayload} 
                                    size={265} 
                                    level="M" 
                                    marginSize={0}
                                />
                            </div>

                            {/* Right Side: Title, PIN & Progress */}
                            <div className="d-flex flex-column align-items-center align-items-md-start text-center text-md-start qr-info-column">
                                <CardTitle tag="h2" className="qr-title">
                                    Fichaje de Empleados
                                </CardTitle>
                                <p className="qr-subtitle">
                                    Escanea este código QR con la app para registrar tu entrada o salida.
                                </p>

                                {/* Token Code Display */}
                                <div className="mb-4">
                                    <span className="token-display">
                                        {totpToken}
                                    </span>
                                </div>

                                {/* Neon Progress Bar */}
                                <div className="progress qr-progress-bar">
                                    <div 
                                        className="progress-bar qr-progress-fill" 
                                        style={{ width: `${progress}%` }}>
                                    </div>
                                </div>
                                
                                <p className="qr-footer-text">
                                    Se actualiza automáticamente cada 10 segundos
                                </p>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default QRGeneratorAdmin;
