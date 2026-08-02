import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Form, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../components/ToastProvider';
import { CardGhostLoader } from '../../components/GhostLoader';
import tokenService from '../../services/token.service';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faKeyboard, faCamera } from '@fortawesome/free-solid-svg-icons';
import '../../App.css';
import '../../static/css/admin/adminPage.css';

// Función auxiliar para detener la cámara de forma segura
const stopScannerSafely = async (scanner) => {
  if (!scanner) return;
  try {
    if (typeof scanner.getState === 'function') {
      const state = scanner.getState();
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } else if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch (err) {
    console.debug('Safe scanner stop suppressed exception', err);
  }
};

export default function ScannerCheckin() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();

  const [loading, setLoading] = useState(false);
  const [needsSignature, setNeedsSignature] = useState(false);
  const [pendingToken, setPendingToken] = useState('');

  const [successModal, setSuccessModal] = useState(false);
  const [formationDetails, setFormationDetails] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const [isManualInput, setIsManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const html5QrcodeRef = useRef(null);
  const sigCanvas = useRef({});
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!isManualInput && !needsSignature) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          const camOptions = devices.map(d => ({
            value: d.id,
            label: d.label || `Cámara ${d.id}`
          }));
          setCameras(camOptions);
          setSelectedCameraId(prev => prev || devices[0].id);
        }
      }).catch(err => {
        console.error('Error al obtener cámaras', err);
      });
    }
  }, [isManualInput, needsSignature]);

  const resetScanner = () => {
    scannedRef.current = false;
    setNeedsSignature(false);
    setPendingToken('');
    setManualCode('');
    setIsManualInput(false);
  };

  // Lógica principal: Procesa tanto el escáner como el código manual
  const handleCheckinExecution = async (rawInput, signature = null) => {
    setLoading(true);
    try {
      let payload = { token: rawInput };
      
      // Si viene del QR, será un JSON con datos extra. Si es manual, fallará el parse y usará solo el token.
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.token) payload.token = parsed.token;
        if (parsed.formationId) payload.formationId = parsed.formationId;
        if (parsed.adminLat) payload.adminLat = parsed.adminLat;
        if (parsed.adminLng) payload.adminLng = parsed.adminLng;
      } catch {
        // Entrada manual (solo 6 números), el backend deducirá el resto.
        payload.token = rawInput;
      }

      if (signature) payload.signature = signature;

      // Intentamos adjuntar la ubicación del empleado
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
      
      // Pintamos la modal de éxito con el nombre real de la formación devuelto por el backend
      setFormationDetails({
        name: data.formationName || t('formations.title', 'Formación'),
        description: data.checkin?.type === 'ENTRADA' ? t('checkin.checkinRecorded', 'Entrada registrada') : t('checkin.checkoutRecorded', 'Salida registrada')
      });
      setSuccessModal(true);
      resetScanner();
    } catch (error) {
      setLoading(false);
      toast.error(error.message || t('checkin.processError', 'Error al procesar la solicitud'));
    }
  };

  useEffect(() => {
    let activeScanner = null;
    scannedRef.current = false;

    const onScanSuccess = (decodedText) => {
      if (scannedRef.current) return;
      scannedRef.current = true;

      stopScannerSafely(html5QrcodeRef.current);
      toast.success(t('checkin.qrDetected', 'Código QR detectado.'));
      handleCheckinExecution(decodedText);
    };

    if (!isManualInput && !needsSignature && selectedCameraId) {
      const html5Qrcode = new Html5Qrcode('qr-reader');
      html5QrcodeRef.current = html5Qrcode;
      activeScanner = html5Qrcode;

      html5Qrcode.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      ).catch(err => {
        console.error('Error al iniciar escáner:', err);
      });

      return () => {
        stopScannerSafely(activeScanner);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManualInput, needsSignature, selectedCameraId]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.length !== 6) {
      toast.error(t('checkin.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    // Pasamos el código puro. El backend buscará a qué formación pertenece.
    handleCheckinExecution(manualCode);
  };

  const handleSignatureSubmit = () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error(t('checkin.provideSignature', 'Por favor proporcione su firma.'));
      return;
    }
    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    handleCheckinExecution(pendingToken, signatureBase64);
  };

  const closeSuccessModal = () => {
    setSuccessModal(false);
    setFormationDetails(null);
    window.location.href = '/dashboard';
  };

  const renderMainContent = () => {
    if (loading) {
      return <CardGhostLoader />;
    }

    if (needsSignature) {
      return (
        <div className="mt-3 text-center">
          <h4 className="mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('checkin.signatureRequired', 'Firma Requerida para Salida')}</h4>
          <div className="mx-auto" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)', maxWidth: '450px' }}>
            <SignatureCanvas
              penColor="blue"
              canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
              ref={sigCanvas}
            />
          </div>
          <div className="d-flex justify-content-between gap-3 mt-4">
            <button
              type="button"
              className="ba-btn ba-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => sigCanvas.current.clear()}
            >
              {t('checkin.clearSignature', 'Borrar')}
            </button>
            <button
              type="button"
              className="ba-btn ba-btn-primary"
              style={{ flex: 2 }}
              onClick={handleSignatureSubmit}
            >
              {t('checkin.confirmSignature', 'Confirmar Firma')}
            </button>
          </div>
        </div>
      );
    }

    if (isManualInput) {
      return (
        <Form onSubmit={handleManualSubmit} className="mt-2 text-center">
          <p className="mb-4" style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
            {t('checkin.manualCodeInstructions', 'Introduce el código de 6 dígitos proyectado junto al QR.')}
          </p>

          <FormGroup className="mb-4 text-start">
            <label htmlFor="manualCodeInput" className="form-label text-muted small fw-bold d-block mb-2">
              {t('checkin.manualCodeLabel', 'Código de 6 Dígitos (del QR)')}
            </label>
            <Input
              id="manualCodeInput"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={manualCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 6) setManualCode(val);
              }}
              className="ba-input mx-auto input-totp-manual text-center"
              style={{ fontSize: '2.5rem', letterSpacing: '12px', padding: '15px' }}
              autoFocus
            />
          </FormGroup>

          <div className="d-flex justify-content-between gap-3 mt-4">
            <button
              type="button"
              className="ba-btn ba-btn-secondary flex-grow-1"
              onClick={() => {
                setIsManualInput(false);
                setManualCode('');
                toast.info(t('dashboard.cameraReactivated', 'Cámara reactivada.'));
              }}
            >
              <FontAwesomeIcon icon={faCamera} className="me-2" />
              {t('checkin.useCamera', 'Usar Cámara')}
            </button>
            <button
              type="submit"
              className="ba-btn ba-btn-primary"
              style={{ flex: 2 }}
              disabled={manualCode.length !== 6}
            >
              {t('checkin.confirmCheckin', 'Confirmar Fichaje')}
            </button>
          </div>
        </Form>
      );
    }

    return (
      <div>
        <p className="text-center mb-3" style={{ color: '#64748b', fontSize: '1.05rem' }}>
          {t('checkin.cameraInstructions', 'Apunta con la cámara al código QR proyectado.')}
        </p>
        
        {cameras.length > 1 && (
          <div className="mb-3 text-start">
             <label className="form-label text-muted small fw-bold d-block mb-2">
              {t('checkin.selectCamera', 'Seleccionar Cámara...')}
            </label>
            <UncontrolledDropdown className="w-100">
              <DropdownToggle
                caret
                className="ba-select-toggle w-100 d-flex align-items-center justify-content-between"
                color="light"
              >
                <span className="text-truncate">
                  {cameras.find(c => c.value === selectedCameraId)?.label || t('checkin.selectCamera')}
                </span>
              </DropdownToggle>
              <DropdownMenu className="ba-dropdown-menu w-100">
                {cameras.map(cam => (
                  <DropdownItem
                    key={cam.value}
                    onClick={() => setSelectedCameraId(cam.value)}
                    active={selectedCameraId === cam.value}
                    className="ba-dropdown-item"
                  >
                    {cam.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
        )}

        <div id="qr-reader"></div>

        <div className="text-center mt-4">
          <button
            type="button"
            className="ba-btn ba-btn-secondary w-100 py-3"
            style={{ fontSize: '0.95rem', fontWeight: 600 }}
            onClick={() => {
              setIsManualInput(true);
              toast.info(t('dashboard.manualActivated', 'Modo manual activado: Introduce el código de 6 dígitos.'));
            }}
          >
            <FontAwesomeIcon icon={faKeyboard} className="me-2" />
            {t('checkin.manualInputPrompt', '¿Problemas con la cámara? Introducir código manualmente')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card p-4 p-md-5 my-auto mx-auto" style={{ maxWidth: '550px' }}>
        <h2 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: 700 }}>
          <FontAwesomeIcon icon={faQrcode} className="me-2" style={{ color: "var(--ba-primary)" }} />
          {t('checkin.scannerTitle', 'Escáner de Fichaje')}
        </h2>

        {renderMainContent()}

        <Modal isOpen={successModal} toggle={closeSuccessModal} centered style={{ maxWidth: '500px' }}>
          <ModalHeader toggle={closeSuccessModal} className="border-0 pb-0">
              <span className="fw-bold" style={{ color: '#2c3e50', fontSize: '1.2rem' }}>Inscripción Confirmada</span>
          </ModalHeader>
          <ModalBody className="text-center py-4">
            {formationDetails && (
              <>
                <h4 style={{ color: '#2c3e50', fontWeight: 600 }} className="mb-3">{formationDetails.name}</h4>
                {formationDetails.description && (
                  <p className="mb-4" style={{ fontSize: '1rem', color: '#64748b' }}>{formationDetails.description}</p>
                )}
                <div 
                  className="p-3 mx-auto" 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px', 
                    display: 'inline-block', 
                    border: '1.5px solid rgba(255, 255, 255, 0.8)' 
                  }}
                >
                  <p className="mb-0" style={{ fontWeight: 500, color: '#2c3e50' }}>
                    Asistencia inscrita a las {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter className="justify-content-center border-0 pt-0">
            <button className="ba-btn ba-btn-primary px-5 py-2 rounded-pill" onClick={closeSuccessModal}>
              Volver al Inicio
            </button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}