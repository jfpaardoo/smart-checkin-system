import React, { useEffect, useState, useRef } from "react";
import { Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import tokenService from "../../services/token.service";
import useFetchState from "../../util/useFetchState";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader } from "../../components/GhostLoader";
import api from "../../services/api";
import { FaCloudUploadAlt, FaDatabase, FaCheckCircle, FaExclamationTriangle, FaUnlink, FaWindows } from "react-icons/fa";

export default function CloudSettingsAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const toast = useToast();
  const location = useLocation();
  const hasShownToast = useRef(false);
  
  const [settings, setSettings, loading] = useFetchState(
    { provider: "ONEDRIVE", oneDriveRefreshToken: "" },
    "/api/v1/cloud-settings",
    jwt
  );
  
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const onedriveStatus = queryParams.get('onedrive');

    if (onedriveStatus && !hasShownToast.current) {
      hasShownToast.current = true; // Marcamos como mostrado

      if (onedriveStatus === 'connected') {
        toast.success(t('cloudSettings.connectSuccess', '¡OneDrive conectado con éxito!'));
      } else if (onedriveStatus === 'error') {
        toast.error(t('cloudSettings.connectError', 'Hubo un problema al conectar con Microsoft.'));
      }
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [location, toast, t]);

  const handleConnectOneDrive = async () => {
    try {
      const response = await api.get('/cloud-settings/oauth/authorize-url');
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error connecting to OneDrive OAuth:", error);
      toast.error(t('cloudSettings.oauthInitError', 'Error al iniciar la conexión con OneDrive.'));
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.delete('/cloud-settings/disconnect');
      setSettings({ ...settings, oneDriveRefreshToken: "" });
      toast.success(t('cloudSettings.disconnectSuccess', 'Cuenta de OneDrive desconectada correctamente.'));
    } catch (error) {
      console.error("Error disconnecting OneDrive:", error);
      toast.error(t('cloudSettings.disconnectError', 'Error al desconectar la cuenta.'));
    }
  };

  function handleBackup() {
    setBackingUp(true);
    api.post("/cloud-settings/backup")
      .then(() => toast.success(t('cloudSettings.backupSuccess', 'Copia de seguridad realizada y subida a la nube')))
      .catch((err) => {
        const msg = err.response?.data?.message || t('cloudSettings.backupError', 'Error al realizar el backup');
        toast.error(msg);
      })
      .finally(() => setBackingUp(false));
  }

  if (loading) return <CardGhostLoader />;

  const isConnected = !!settings.oneDriveRefreshToken;

  return (
    <div className="da-container">
      <div className="da-card p-4 p-md-5 mx-auto" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        
        {/* Cabecera y botón de Backup */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4 text-center text-md-start">
          <h2 className="mb-0 text-dark fw-bold d-flex flex-column flex-md-row align-items-center">
            <FaCloudUploadAlt className="mb-2 mb-md-0 me-md-2" style={{ color: 'var(--da-primary)' }} />
            <span>{t('cloudSettings.title', 'Ajustes de Nube')}</span>
          </h2>
          <Button 
            className="da-btn-primary d-flex align-items-center justify-content-center gap-2" 
            onClick={handleBackup} 
            disabled={backingUp || !isConnected}
          >
            <FaDatabase /> {backingUp ? t('cloudSettings.backingUp', 'Respaldando...') : t('cloudSettings.forceBackupBtn', 'Forzar Backup DB')}
          </Button>
        </div>

        {/* Descripción */}
        <p className="text-muted mb-4 text-center text-md-start border-bottom pb-4">
          {t('cloudSettings.description', 'Conecta Distribution Academy con Microsoft OneDrive para almacenar la documentación de las formaciones y copias de seguridad de forma automática.')}
        </p>

        {/* Zona de Estado y Conexión (Glassmorphism & Cápsula) */}
        <div className="text-center my-4 py-4">
          <div 
            className="d-inline-flex align-items-center gap-2 px-4 py-2 mb-4 rounded-pill shadow-sm"
            style={{
              background: isConnected ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.15)',
              backdropFilter: 'blur(10px)',
              border: isConnected ? '1px solid rgba(40, 167, 69, 0.3)' : '1px solid rgba(255, 193, 7, 0.4)',
              color: isConnected ? '#155724' : '#856404',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}
          >
            {isConnected ? (
              <>
                <FaCheckCircle className="text-success" />
                <span>{t('cloudSettings.statusConnected', 'OneDrive Conectado')}</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-warning" />
                <span>{t('cloudSettings.statusDisconnected', 'OneDrive No Conectado')}</span>
              </>
            )}
          </div>

          <div>
            {isConnected ? (
              <Button 
                onClick={handleDisconnect}
                className="btn btn-outline-danger px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                style={{ fontSize: '1rem', transition: 'all 0.2s ease' }}
              >
                <FaUnlink />
                {t('cloudSettings.disconnectBtn', 'Desconectar cuenta de OneDrive')}
              </Button>
            ) : (
              <Button 
                onClick={handleConnectOneDrive}
                className="da-btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                style={{ fontSize: '1.05rem' }}
              >
                <FaWindows />
                {t('cloudSettings.connectBtn', 'Conectar con Microsoft OneDrive')}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}