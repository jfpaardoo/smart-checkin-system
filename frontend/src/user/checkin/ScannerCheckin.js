import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faKeyboard, faCalendarCheck, faSpinner, faLocationDot, faCheckCircle, faCameraRotate, faCamera } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../components/ToastProvider';
import api from '../../services/api';
import ManualCheckinForm from './components/ManualCheckinForm';
import SignatureStep from './components/SignatureStep';
import GlassDropdown from '../../components/GlassDropdown';
import { useQrScanner } from '../../hooks/useQrScanner';
import { formatDate } from '../../utils/dateUtils';
import { saveOfflineCheckin, initOfflineSync } from '../../util/offlineQueue';

const parseRawInput = (rawInput) => {
  try {
    const parsed = JSON.parse(rawInput);
    return {
      token: parsed.token || rawInput,
      ...(parsed.formationId && { formationId: parsed.formationId }),
      ...(parsed.adminLat && { adminLat: parsed.adminLat }),
      ...(parsed.adminLng && { adminLng: parsed.adminLng }),
    };
  } catch {
    return { token: rawInput };
  }
};

export default function ScannerCheckin() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [needsSignature, setNeedsSignature] = useState(false);
  const pendingTokenRef = useRef('');

  const [successModal, setSuccessModal] = useState(false);
  const [formationDetails, setFormationDetails] = useState(null);

  const [isManualInput, setIsManualInput] = useState(false);
  const [gpsCoords, setGpsCoords] = useState({});
  const [gpsStatus, setGpsStatus] = useState('prompt'); // 'prompt', 'granted', 'denied', 'unsupported'

  const requestGps = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation || navigator.webdriver || (typeof window !== 'undefined' && (window.__PLAYWRIGHT__ || window.Cypress))) {
      setGpsStatus('unsupported');
      return {};
    }

    const gpsPromise = (async () => {
      const getPos = (highAccuracy, timeoutMs, maxAge = 10000) => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: highAccuracy, 
            timeout: timeoutMs, 
            maximumAge: maxAge 
          });
        });
      };

      try {
        const pos = await getPos(false, 1500, 30000);
        const coords = { userLat: pos.coords.latitude, userLng: pos.coords.longitude };
        setGpsCoords(coords);
        setGpsStatus('granted');
        return coords;
      } catch {
        setGpsStatus('denied');
        return {};
      }
    })();

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({}), 1800));
    return Promise.race([gpsPromise, timeoutPromise]);
  }, []);

  // Solicitar GPS al montar la vista e inicializar sincronizador offline
  useEffect(() => {
    requestGps();
    const cleanupSync = initOfflineSync(api, toast, t);
    return () => {
      if (cleanupSync) cleanupSync();
    };
  }, [requestGps, toast, t]);

  // Hook personalizado de la cámara (Reemplaza al Html5QrcodeScanner directo)
  const isScanningEnabled = !isManualInput && !needsSignature && !successModal;
  
  const { 
    cameras, 
    selectedCameraId, 
    setSelectedCameraId, 
    toggleCamera, 
    facingMode,
    isScannerReady,
    resumeScanning
  } = useQrScanner(
    "qr-reader",
    isScanningEnabled,
    (decodedText) => {
      handleCheckinExecution(decodedText);
    }
  );

  const resetScanner = () => {
    setNeedsSignature(false);
    pendingTokenRef.current = '';
    setIsManualInput(false);
  };

  const handleCloseSuccess = () => {
    setSuccessModal(false);
    resetScanner();
    navigate('/dashboard');
  };

  const handleCheckinExecution = async (rawInput, signature = null) => {
    setLoading(true);
    let payload;
    try {
      const basePayload = parseRawInput(rawInput);
      const coords = gpsCoords.userLat ? gpsCoords : await requestGps();

      if (!coords.userLat && !basePayload.userLat && !navigator.webdriver && !(typeof window !== 'undefined' && (window.__PLAYWRIGHT__ || window.Cypress))) {
        toast.warning(t('checkin.gpsMissingWarning', 'No se ha detectado ubicación GPS. Por favor, autoriza la ubicación en tu navegador si el administrador exige control de distancia.'));
      }

      payload = {
        ...basePayload,
        ...coords,
        ...(signature ? { signature } : {})
      };

      const res = await api.post('/checkins/qr-fichaje', payload, {
        validateStatus: status => (status >= 200 && status < 300) || status === 202
      });

      if (res.status === 202 && res.data?.needsSignature) {
        pendingTokenRef.current = payload.token;
        setIsManualInput(false);
        setNeedsSignature(true);
        toast.info(t('checkin.signatureRequiredInfo', 'Se requiere su firma para registrar la salida.'));
        setLoading(false);
        return;
      }

      const data = res.data;
      setFormationDetails({
        name: data.formationName || data.formation?.name || t('formations.title', 'Formación'),
        description: data.checkin?.type === 'ENTRADA' ? t('checkin.checkinRecorded', 'Entrada registrada con éxito') : t('checkin.checkoutRecorded', 'Salida registrada con éxito'),
        formationDate: data.formationDate || data.formation?.formationDate || data.checkin?.timestamp || new Date().toISOString(),
        type: data.checkin?.type || 'ENTRADA'
      });
      setSuccessModal(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      resumeScanning();

      // Si no hay conexión a internet o falló por error de red
      if ((typeof navigator !== 'undefined' && !navigator.onLine) || !error.response) {
        if (payload) {
          await saveOfflineCheckin(payload);
          toast.info(t('checkin.savedOffline', 'Sin conexión: Fichaje guardado localmente en tu dispositivo. Se sincronizará automáticamente al recuperar cobertura.'));
          setFormationDetails({
            name: t('formations.title', 'Fichaje Guardado Offline'),
            description: t('checkin.offlineQueued', 'Tu registro ha quedado almacenado en el dispositivo y se enviará al recuperar conexión.'),
            formationDate: new Date().toISOString(),
            type: 'ENTRADA'
          });
          setSuccessModal(true);
          return;
        }
      }

      const errMsg = error.response?.data?.message || error.message || t('checkin.processError', 'Error al procesar la solicitud');
      toast.error(errMsg);
    }
  };

  return (
    <div className="da-container flex flex-col justify-center items-center min-h-[calc(100vh-80px)] py-8 relative">
      {/* Overlay de carga */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-8 border border-white shadow-2xl text-center flex flex-col items-center gap-4 max-w-[320px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <FontAwesomeIcon icon={faSpinner} className="fa-spin text-4xl" style={{ color: 'var(--da-primary)' }} />
            <p className="text-slate-800 font-bold mb-0 text-base">
              {t('checkin.processing', 'Procesando registro...')}
            </p>
          </div>
        </div>
      )}

      <div className="da-card mx-auto w-full max-w-[600px] p-6 sm:p-8 shadow-xl">
        
        <div style={{ display: isScanningEnabled ? 'block' : 'none' }}>
          <div className="text-center mb-6">
            <FontAwesomeIcon icon={faQrcode} size="3x" style={{ color: 'var(--da-primary)' }} className="mb-4" />
            <h2 className="text-slate-800 font-bold text-2xl sm:text-3xl mb-2">
              {t('checkin.scanQr', 'Escanear el QR')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-3">
              {t('checkin.qrSubtitle', 'Enfoca el código QR de la formación con tu cámara')}
            </p>

            <div className="flex items-center justify-center gap-2 mb-3 mx-auto max-w-[380px]">
              {gpsStatus === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500" />
                  {t('checkin.gpsActive', 'Ubicación GPS verificada')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requestGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                  title={t('checkin.enableGpsTooltip', 'Pulsa para conceder permiso de ubicación')}
                >
                  <FontAwesomeIcon icon={faLocationDot} className="text-amber-600" />
                  {t('checkin.enableGps', 'Permitir acceso a ubicación GPS')}
                </button>
              )}
            </div>
          </div>

          <div className="scanner-section text-center flex flex-col items-center">
            <div className="mb-3 w-full flex items-center justify-center gap-2" style={{ maxWidth: '360px' }}>
              {cameras && cameras.length > 1 && (
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <GlassDropdown
                    options={cameras}
                    value={selectedCameraId}
                    onChange={(camId) => setSelectedCameraId(camId)}
                    placeholder={t('checkin.selectCamera', 'Seleccionar cámara')}
                  />
                </div>
              )}
              <button 
                type="button" 
                className="da-btn da-btn-secondary px-3 py-2 rounded-full text-xs font-semibold shrink-0 d-inline-flex align-items-center gap-2" 
                onClick={toggleCamera}
                title={facingMode === 'environment' 
                  ? t('checkin.useFrontCamera', 'Cambiar a cámara frontal') 
                  : t('checkin.useBackCamera', 'Cambiar a cámara trasera')}
              >
                <FontAwesomeIcon icon={faCameraRotate} />
                <span className="d-none d-sm-inline">
                  {facingMode === 'environment' 
                    ? t('checkin.useFrontCamera', 'Frontal') 
                    : t('checkin.useBackCamera', 'Trasera')}
                </span>
              </button>
            </div>

            <div 
              className="w-full rounded-2xl overflow-hidden shadow-md relative flex items-center justify-center border border-white/20"
              style={{ maxWidth: '360px', aspectRatio: '1 / 1', backgroundColor: '#000000' }}
            >
              {!isScannerReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-200 p-4">
                  <FontAwesomeIcon icon={faCamera} className="fa-spin text-3xl text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-300 mb-0">
                    {t('checkin.startingCamera', 'Iniciando cámara...')}
                  </p>
                </div>
              )}
              <div 
                id="qr-reader" 
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="mt-6 pt-2 flex flex-col items-center gap-3 w-full">
              <button 
                type="button" 
                className="da-btn da-btn-secondary py-3 px-4 w-full text-xs sm:text-sm" 
                style={{ maxWidth: '360px' }}
                onClick={() => setIsManualInput(true)}
              >
                <FontAwesomeIcon icon={faKeyboard} className="me-2" />
                {t('checkin.cantScan', '¿No puedes escanear? Ingresar código manualmente')}
              </button>
            </div>
          </div>
        </div>

        {isManualInput && (
          <div>
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={faKeyboard} size="3x" style={{ color: 'var(--da-primary)' }} className="mb-4" />
              <h2 className="text-slate-800 font-bold text-3xl mb-2">
                {t('checkin.manualCheckin', 'Check-in Manual')}
              </h2>
              <p className="text-slate-600 text-lg">
                {t('checkin.manualSubtitle', 'Introduce el código que te proporcionó el administrador')}
              </p>
            </div>
            <ManualCheckinForm 
              onSubmit={handleCheckinExecution} 
              onCancel={() => setIsManualInput(false)} 
            />
          </div>
        )}

        {needsSignature && (
          <SignatureStep 
            onSubmit={(signatureBase64) => handleCheckinExecution(pendingTokenRef.current, signatureBase64)}
            onCancel={resetScanner}
            submitLabel={t('checkin.confirmSignature', 'Confirmar Firma y Registrar Salida')}
          />
        )}
      </div>

      <Modal isOpen={successModal} toggle={handleCloseSuccess} centered className="da-glass-modal">
        <ModalHeader toggle={handleCloseSuccess} className="border-0 pb-0">
          <span className="text-slate-800 font-bold">{t('checkin.successTitle', '¡Proceso Completado!')}</span>
        </ModalHeader>
        <ModalBody className="text-center py-5">
          <div className="mb-4">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm border border-slate-100" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(179, 195, 76, 0.1)', color: 'var(--da-primary)' }}>
              <FontAwesomeIcon icon={faQrcode} size="3x" />
            </div>
          </div>
          <h4 className="font-bold text-slate-800 mb-2 text-xl">
            {formationDetails?.description}
          </h4>
          <p className="text-slate-600 mb-3">
            {t('checkin.formationLabel', 'Formación')}: <strong>{formationDetails?.name}</strong>
          </p>
          {formationDetails?.formationDate && (
            <div className="p-3 mx-auto bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-sm">
              <p className="mb-0 font-medium text-slate-700">
                <FontAwesomeIcon icon={faCalendarCheck} className="me-2" style={{ color: 'var(--da-primary)' }} />
                {t('checkin.dateLabel', 'Fecha')}: {formatDate(formationDetails.formationDate)}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-0 pt-0 justify-content-center">
          <button 
            type="button" 
            className="da-btn da-btn-primary px-8 py-3 rounded-full text-lg font-bold" 
            onClick={handleCloseSuccess}
          >
            {t('checkin.close', 'Cerrar')}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
