import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faKeyboard, faCamera, faCalendarCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../components/ToastProvider';
import tokenService from '../../services/token.service';
import GlassDropdown from '../../components/GlassDropdown';
import { useQrScanner } from '../../hooks/useQrScanner';
import ManualCheckinForm from './components/ManualCheckinForm';
import SignatureStep from './components/SignatureStep';
import '../../App.css';
import '../../static/css/admin/adminPage.css';

export default function ScannerCheckin() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const jwt = tokenService.getLocalAccessToken();

  const [loading, setLoading] = useState(false);
  const [needsSignature, setNeedsSignature] = useState(false);
  const [pendingToken, setPendingToken] = useState('');

  const [successModal, setSuccessModal] = useState(false);
  const [formationDetails, setFormationDetails] = useState(null);

  const [isManualInput, setIsManualInput] = useState(false);

  // Hook maneja la lógica de las cámaras y validación del código
  const {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    isScannerReady,
    resetScannerState
  } = useQrScanner('qr-reader', !isManualInput && !needsSignature && !successModal, (decodedText) => {
    toast.success(t('checkin.qrDetected', 'Código QR detectado.'));
    handleCheckinExecution(decodedText);
  });

  const resetScanner = () => {
    resetScannerState();
    setNeedsSignature(false);
    setPendingToken('');
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
      let payload = { token: rawInput };
      
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.token) payload.token = parsed.token;
        if (parsed.formationId) payload.formationId = parsed.formationId;
        if (parsed.adminLat) payload.adminLat = parsed.adminLat;
        if (parsed.adminLng) payload.adminLng = parsed.adminLng;
      } catch {
        payload.token = rawInput;
      }

      if (signature) payload.signature = signature;

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
          });
          payload.userLat = pos.coords.latitude;
          payload.userLng = pos.coords.longitude;
        } catch (err) {
          console.warn("Geolocalización del usuario fallida", err);
        }
      }

      const response = await fetch('/api/v1/checkins/qr-fichaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 202) {
        const data = await response.json();
        if (data.needsSignature) {
          setPendingToken(payload.token);
          setNeedsSignature(true);
          toast.info(t('checkin.signatureRequiredInfo', 'Se requiere su firma para registrar la salida.'));
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('checkin.processError', 'Error al procesar la solicitud'));
      }

      const data = await response.json();
      setLoading(false);
      
      setFormationDetails({
        name: data.formationName || t('formations.title', 'Formación'),
        description: data.checkin?.type === 'ENTRADA' ? t('checkin.checkinRecorded', 'Entrada registrada') : t('checkin.checkoutRecorded', 'Salida registrada'),
        formationDate: data.formationDate || data.checkin?.timestamp || new Date().toISOString(),
        type: data.checkin?.type || 'ENTRADA'
      });
      setSuccessModal(true);
      resetScanner();
    } catch (error) {
      setLoading(false);
      resetScannerState(); // Allow scan again if error
      toast.error(error.message || t('checkin.processError', 'Error al procesar la solicitud'));
    }
  };

  if (loading) {
    return (
      <div className="da-container flex justify-center items-center min-h-screen w-full">
        <div className="bg-white/70 backdrop-blur-md rounded-[28px] p-8 border border-white/60 shadow-lg text-center flex flex-col items-center gap-4 max-w-[400px] w-full mx-4">
          <FontAwesomeIcon icon={faSpinner} className="fa-spin text-3xl" style={{ color: 'var(--da-primary)' }} />
          <p className="text-slate-700 font-semibold mb-0 text-lg">
            {t('checkin.processing', 'Procesando registro...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="da-container flex flex-col justify-center min-h-screen py-10">
      <div className="da-card mx-auto w-full max-w-[600px] p-8">
        
        <div style={{ display: (!isManualInput && !needsSignature) ? 'block' : 'none' }}>
          <div className="text-center mb-6">
            <FontAwesomeIcon icon={faQrcode} size="3x" style={{ color: 'var(--da-primary)' }} className="mb-4" />
            <h2 className="text-slate-800 font-bold text-3xl mb-2">
              {t('checkin.scanQr', 'Escanear el QR')}
            </h2>
            <p className="text-slate-600 text-lg">
              {t('checkin.qrSubtitle', 'Enfoca el código QR de la formación con tu cámara')}
            </p>
          </div>

          <div className="scanner-section text-center">
            {cameras.length > 1 && (
              <div className="mb-4" style={{ maxWidth: '300px', margin: '0 auto' }}>
                <GlassDropdown
                  options={cameras}
                  value={selectedCameraId}
                  onChange={(camId) => setSelectedCameraId(camId)}
                  placeholder={t('dashboard.selectCamera')}
                />
              </div>
            )}

            {!isScannerReady && (
              <div className="p-4 text-center text-slate-500 mx-auto mb-2">
                <FontAwesomeIcon icon={faCamera} className="fa-spin mb-2" size="2x" />
                <p className="mb-0">{t('checkin.startingCamera', 'Iniciando cámara...')}</p>
              </div>
            )}
            <div className="px-3 px-md-4">
              <div 
                id="qr-reader" 
                className="mx-auto"
                style={{ 
                  width: '100%', 
                  maxWidth: '400px',
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  border: isScannerReady ? '2px solid rgba(255, 255, 255, 0.5)' : 'none',
                  boxShadow: isScannerReady ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
                  height: isScannerReady ? 'auto' : '0px',
                  opacity: isScannerReady ? 1 : 0
                }}
              />
            </div>

            <div className="mt-4 pt-2">
              <button 
                type="button" 
                className="da-btn da-btn-secondary py-3 px-4 w-100" 
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
            onSubmit={(signatureBase64) => handleCheckinExecution(pendingToken, signatureBase64)}
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