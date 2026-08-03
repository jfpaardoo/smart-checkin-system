import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faKeyboard, faCamera, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../components/ToastProvider';
import { CardGhostLoader } from '../../components/GhostLoader';
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
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <CardGhostLoader />
      </div>
    );
  }

  return (
    <div className="ba-container d-flex flex-column justify-content-center min-vh-100 py-5">
      <div className="ba-card mx-auto" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
        
        <div style={{ display: (!isManualInput && !needsSignature) ? 'block' : 'none' }}>
          <div className="text-center mb-4">
            <FontAwesomeIcon icon={faQrcode} size="3x" style={{ color: 'var(--ba-primary)' }} className="mb-3" />
            <h2 style={{ color: '#2c3e50', fontWeight: 'bold' }}>
              {t('checkin.scanQr', 'Escanear Código QR')}
            </h2>
            <p className="text-muted">
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
              <div className="p-4 text-center text-muted mx-auto mb-2">
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
                className="ba-btn ba-btn-secondary py-3 px-4 w-100" 
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
            <div className="text-center mb-4">
              <FontAwesomeIcon icon={faKeyboard} size="3x" style={{ color: 'var(--ba-primary)' }} className="mb-3" />
              <h2 style={{ color: '#2c3e50', fontWeight: 'bold' }}>
                {t('checkin.manualCheckin', 'Check-in Manual')}
              </h2>
              <p className="text-muted">
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

      <Modal isOpen={successModal} toggle={() => { setSuccessModal(false); resetScanner(); }} centered>
        <ModalHeader toggle={() => { setSuccessModal(false); resetScanner(); }} className="border-0 pb-0" style={{ backgroundColor: '#2c3e50', color: 'white' }}>
          {t('checkin.successTitle', '¡Proceso Completado!')}
        </ModalHeader>
        <ModalBody className="text-center py-5" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="mb-4">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(179, 195, 76, 0.15)', color: 'var(--ba-primary)' }}>
              <FontAwesomeIcon icon={faQrcode} size="3x" />
            </div>
          </div>
          <h4 style={{ color: '#2c3e50', fontWeight: 600 }} className="mb-2">
            {formationDetails?.description}
          </h4>
          <p className="text-muted mb-3">
            {t('checkin.formationLabel', 'Formación')}: <strong>{formationDetails?.name}</strong>
          </p>
          {formationDetails?.formationDate && (
            <div className="p-3 mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
              <p className="mb-0" style={{ fontWeight: 500, color: '#2c3e50' }}>
                <FontAwesomeIcon icon={faCalendarCheck} className="me-2" style={{ color: 'var(--ba-primary)' }} />
                {t('checkin.dateLabel', 'Fecha')}: {new Date(formationDetails.formationDate).toLocaleString()}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-0 pt-0 justify-content-center" style={{ backgroundColor: '#f4f6fa' }}>
          <button 
            type="button" 
            className="ba-btn ba-btn-primary px-5 py-2" 
            onClick={() => { setSuccessModal(false); resetScanner(); }}
            style={{ borderRadius: '30px' }}
          >
            {t('checkin.close', 'Cerrar')}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}