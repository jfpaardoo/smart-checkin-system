import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import tokenService from "../../services/token.service";
import useFetchState from "../../util/useFetchState";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader } from "../../components/GhostLoader";
import api from "../../services/api";
import GlassPageHeader from "../../components/GlassPageHeader";
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
      <div className="da-card">
        
        <GlassPageHeader
          icon={FaCloudUploadAlt}
          title={t('cloudSettings.title', 'Ajustes de Nube')}
          subtitle={t('cloudSettings.description', 'Conecta Distribution Academy con Microsoft OneDrive para almacenar la documentación de las formaciones y copias de seguridad de forma automática.')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
          
          {/* Panel 1: Sincronización con OneDrive */}
          <div className="da-glass-panel p-6 sm:p-8 flex flex-col justify-between items-center text-center rounded-3xl">
            <div className="flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-2xl bg-[#0078d4]/15 border border-[#0078d4]/30 text-[#0078d4] dark:text-[#50a3eb] flex items-center justify-center text-2xl shadow-xs mb-4">
                <FaWindows />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {t('cloudSettings.oneDriveTitle', 'Microsoft OneDrive')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {t('cloudSettings.oneDriveDescription', 'Sincroniza automáticamente actas formativas, firmas de asistencia y documentos generados con la nube de OneDrive mediante Microsoft Graph API.')}
              </p>

              {/* Indicador de Estado */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full shadow-xs"
                style={{
                  background: isConnected ? 'rgba(40, 167, 69, 0.12)' : 'rgba(255, 193, 7, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: isConnected ? '1px solid rgba(40, 167, 69, 0.35)' : '1px solid rgba(255, 193, 7, 0.4)',
                  color: isConnected ? '#155724' : '#856404',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {isConnected ? (
                  <>
                    <FaCheckCircle className="text-emerald-500" />
                    <span>{t('cloudSettings.statusConnected', 'OneDrive Conectado')}</span>
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="text-amber-500" />
                    <span>{t('cloudSettings.statusDisconnected', 'OneDrive No Conectado')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Acción de Conexión */}
            <div className="w-full">
              {isConnected ? (
                <button 
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold shadow-xs transition cursor-pointer border border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 text-sm"
                >
                  <FaUnlink />
                  <span>{t('cloudSettings.disconnectBtn', 'Desconectar cuenta de OneDrive')}</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleConnectOneDrive}
                  className="da-btn-primary w-full sm:w-auto px-6 py-3 rounded-2xl font-bold shadow-md inline-flex items-center justify-center gap-2 border-0 cursor-pointer text-sm"
                >
                  <FaWindows />
                  <span>{t('cloudSettings.connectBtn', 'Conectar con Microsoft OneDrive')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Panel 2: Copia de Seguridad de Base de Datos */}
          <div className="da-glass-panel p-6 sm:p-8 flex flex-col justify-between items-center text-center rounded-3xl">
            <div className="flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] dark:text-[#d4e84a] flex items-center justify-center text-2xl shadow-xs mb-4">
                <FaDatabase />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {t('cloudSettings.backupTitle', 'Copia de Seguridad de la Base de Datos')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {t('cloudSettings.backupDescription', 'Genera un volcado completo de la base de datos MySQL (tablas, usuarios, registros y auditoría) y almacénalo en la nube o descárgalo como respaldo.')}
              </p>

              {/* Indicador de Estado del Respaldo */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full shadow-xs bg-slate-500/10 border border-slate-400/20 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                <FaCloudUploadAlt className="text-[#73841e] dark:text-[#d4e84a]" />
                <span>{isConnected ? t('cloudSettings.backupReady', 'Destino: Microsoft OneDrive') : t('cloudSettings.backupNeedsCloud', 'Requiere conexión con OneDrive')}</span>
              </div>
            </div>

            {/* Acción de Backup */}
            <div className="w-full">
              <button 
                type="button"
                className="da-btn-primary w-full sm:w-auto px-6 py-3 rounded-2xl font-bold shadow-md inline-flex items-center justify-center gap-2 border-0 cursor-pointer text-sm disabled:opacity-50" 
                onClick={handleBackup} 
                disabled={backingUp || !isConnected}
              >
                <FaDatabase />
                <span>{backingUp ? t('cloudSettings.backingUp', 'Respaldando...') : t('cloudSettings.forceBackupBtn', 'Forzar Backup DB')}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}