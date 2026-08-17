import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faKeyboard, faCamera, faCalendarCheck, faSpinner, faLocationDot, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../components/ToastProvider';
import GlassDropdown from '../../components/GlassDropdown';
import { useQrScanner } from '../../hooks/useQrScanner';
import api from '../../services/api';
import ManualCheckinForm from './components/ManualCheckinForm';
import SignatureStep from './components/SignatureStep';

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
    if (typeof navigator === 'undefined' || !("geolocation" in navigator)) {
      setGpsStatus('unsupported');
      return {};
    }
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 8000,
          maximumAge: 10000 
        });
      });
      const coords = { userLat: pos.coords.latitude, userLng: pos.coords.longitude };
      setGpsCoords(coords);
      setGpsStatus('granted');
      return coords;
    } catch (err) {
      console.warn("Geolocalización fallida o denegada", err);
      setGpsStatus('denied');
      return {};
    }
  }, []);

  // Solicitar ubicación automáticamente al entrar a la pantalla
  useEffect(() => {
    requestGps();
  }, [requestGps]);

  // Hook maneja la lógica de las cámaras y validación del código
  const {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    isScannerReady,
    resetScannerState,
    toggleCamera,
    hasMultipleCameras
  } = useQrScanner('qr-reader', !isManualInput && !needsSignature && !successModal, (decodedText) => {
    toast.success(t('checkin.qrDetected', 'Código QR detectado.'));
    handleCheckinExecution(decodedText);
  });

  const resetScanner = () => {
    resetScannerState();
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
    try {
      const basePayload = parseRawInput(rawInput);
      const coords = gpsCoords.userLat ? gpsCoords : await requestGps();
      const payload = {
        ...basePayload,
        ...coords,
        ...(signature ? { signature } : {})
      };

      const res = await api.post('/checkins/qr-fichaje', payload, {
        validateStatus: status => (status >= 200 && status < 300) || status === 202
      });

      if (res.status === 202 && res.data?.needsSignature) {
        pendingTokenRef.current = payload.token;
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
      resetScanner();
      const errMsg = error.response?.data?.message || error.message || t('checkin.processError', 'Error al procesar la solicitud');
      toast.error(errMsg);
    }
  };

  return (
    <div className="da-container flex flex-col justify-center items-center min-h-[calc(100vh-80px)] py-8 relative">
      {/* Overlay de carga centrado sin alterar el diseño de la tarjeta */}
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
        
        <div style={{ display: (!isManualInput && !needsSignature) ? 'block' : 'none' }}>
          <div className="text-center mb-6">
            <FontAwesomeIcon icon={faQrcode} size="3x" style={{ color: 'var(--da-primary)' }} className="mb-4" />
            <h2 className="text-slate-800 font-bold text-2xl sm:text-3xl mb-2">
              {t('checkin.scanQr', 'Escanear el QR')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-3">
              {t('checkin.qrSubtitle', 'Enfoca el código QR de la formación con tu cámara')}
            </p>

            {/* Barra de estado de permisos de geolocalización */}
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

          <div className="scanner-section text-center">
            {hasMultipleCameras && (
              <div className="flex justify-center items-center gap-3 mb-4 mx-auto max-w-[340px]">
                <div className="flex-1">
                  <GlassDropdown
                    options={cameras}
                    value={selectedCameraId}
                    onChange={(camId) => setSelectedCameraId(camId)}
                    placeholder={t('dashboard.selectCamera')}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="px-3.5 py-2 rounded-2xl bg-white/70 hover:bg-white text-slate-700 hover:text-[#8a9e29] border border-white/80 shadow-xs transition hover:scale-105 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={t('checkin.switchCamera', 'Alternar Cámara')}
                >
                  <FontAwesomeIcon icon={faCamera} className="text-sm text-[#8a9e29]" />
                  <span className="hidden sm:inline">{t('checkin.switchCamera', 'Alternar')}</span>
                </button>
              </div>
            )}

            {!isScannerReady && (
              <div className="p-8 text-center text-slate-500 mx-auto mb-2 min-h-[260px] flex flex-col justify-center items-center bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                <FontAwesomeIcon icon={faCamera} className="fa-spin mb-3 text-3xl text-slate-400" />
                <p className="mb-0 text-sm font-medium">{t('checkin.startingCamera', 'Iniciando cámara...')}</p>
              </div>
            )}
            <div className="px-1 sm:px-4">
              <div 
                id="qr-reader" 
                className="mx-auto"
                style={{ 
                  width: '100%', 
                  maxWidth: '380px',
                  minHeight: isScannerReady ? '280px' : '0px',
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  border: isScannerReady ? '2px solid rgba(255, 255, 255, 0.6)' : 'none',
                  boxShadow: isScannerReady ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
                  display: isScannerReady ? 'block' : 'none'
                }}
              />
            </div>

            <div className="mt-6 pt-2">
              <button 
                type="button" 
                className="da-btn da-btn-secondary py-3 px-4 w-100 text-xs sm:text-sm" 
                style={{ maxWidth: '350px' }}
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
                {t('checkin.dateLabel', 'Fecha')}: {new Date(formationDetails.formationDate).toLocaleString()}
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