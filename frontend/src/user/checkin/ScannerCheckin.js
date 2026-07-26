import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Form, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../components/ToastProvider';
import { CardGhostLoader } from '../../components/GhostLoader';
import tokenService from '../../services/token.service';
import '../../static/css/admin/adminPage.css';

export default function ScannerCheckin() {
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();

  const [qrData, setQrData] = useState(null); 
  const [personalCode, setPersonalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(true);
  const [needsSignature, setNeedsSignature] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [formationDetails, setFormationDetails] = useState(null);

  const scannerRef = useRef(null);
  const sigCanvas = useRef({});

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const handleClearError = (e) => {
      toast.error(`Error al limpiar la cámara: ${e.message || e}`);
    };

    const onScanSuccess = (decodedText) => {
      try {
        const parsedData = JSON.parse(decodedText);
        setQrData(parsedData);
      } catch (error) {
        console.debug("El formato del QR no es JSON (usando fallback a texto plano):", error.message);
        toast.info("Formato de QR antiguo detectado.");
        setQrData({ token: decodedText, action: "checkin" });
      }
      setScannerVisible(false);
      
      if (scannerRef.current) {
          scannerRef.current.clear().catch(handleClearError);
      }
    };

    const onScanFailure = () => {
    };

    const initializeScanner = () => {
      if (!isMounted) return;

      const qrElement = document.getElementById("qr-reader");
      if (qrElement) {
          qrElement.innerHTML = "";
      }

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    };

    if (scannerVisible) {
      timer = setTimeout(initializeScanner, 50);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(handleClearError);
      }
    };
  }, [scannerVisible, toast]);

  const handleFormationAttend = async () => {
    if (!qrData.formationId) {
      toast.error("QR Inválido: Falta el ID de la formación.");
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/v1/formations/${qrData.formationId}/attend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify({ personalCode: personalCode }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const data = await response.json();
    setLoading(false);
    setFormationDetails(data); 
    setSuccessModal(true); 
    handleCancel(); 
  };

  const handleNormalCheckin = async () => {
    const response = await fetch("/api/v1/checkins/qr-fichaje", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${jwt}` 
      },
      body: JSON.stringify({ token: qrData.token, personalCode: personalCode }),
    });

    if (response.status === 202) {
      const data = await response.json();
      if (data.needsSignature) {
          setLoading(false);
          setNeedsSignature(true);
          toast.info("Se requiere su firma para registrar la salida.");
          return;
      }
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const data = await response.json();
    setLoading(false);
    const type = data.checkInType === "ENTRADA" ? "Entrada registrada" : "Salida registrada";
    toast.success(`${type} a las ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}`);
    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (personalCode.length !== 4) {
      toast.error("El código personal debe tener 4 dígitos.");
      return;
    }

    setLoading(true);

    try {
      if (qrData.action === "formation") {
        await handleFormationAttend();
      } else {
        await handleNormalCheckin();
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Error procesando la solicitud");
    }
  };

  const handleSignatureSubmit = async () => {
    if (sigCanvas.current.isEmpty()) {
       toast.error("Por favor proporcione su firma.");
       return;
    }
    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    setLoading(true);
    
    try {
      const response = await fetch("/api/v1/checkins/qr-fichaje", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${jwt}` 
          },
          body: JSON.stringify({ token: qrData.token, personalCode: personalCode, signature: signatureBase64 }),
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setLoading(false);
      toast.success(`Salida registrada con firma a las ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}`);
      setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
    } catch (error) {
       setLoading(false);
       toast.error(error.message || "Error al enviar la firma");
    }
  };

  const handleCancel = () => {
    setQrData(null);
    setPersonalCode('');
    setNeedsSignature(false);
    setScannerVisible(true);
  };

  const closeSuccessModal = () => {
    setSuccessModal(false);
    setFormationDetails(null);
    window.location.href = '/dashboard';
  };

  const getDisplayTitle = () => {
    if (!qrData) return "Introduce tu PIN de 4 dígitos";
    return qrData.action === "formation" 
      ? "PIN para Asistencia a Formación" 
      : "PIN para Fichar Turno";
  };

  const renderMainContent = () => {
    if (scannerVisible) {
      return (
        <div>
          <p className="text-center mb-4" style={{ color: '#64748b', fontSize: '1.05rem' }}>
            Apunta con la cámara al código QR proyectado.
          </p>
          <div id="qr-reader"></div>
        </div>
      );
    }

    if (loading) {
      return <CardGhostLoader />;
    }

    if (needsSignature) {
      return (
        <div className="mt-3">
          <h4 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>Firma Requerida para Salida</h4>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)' }}>
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
              Borrar
            </button>
            <button
              type="button"
              className="ba-btn ba-btn-primary"
              style={{ flex: 2 }}
              onClick={handleSignatureSubmit}
            >
              Confirmar Firma
            </button>
          </div>
        </div>
      );
    }

    return (
      <Form onSubmit={handleSubmit} className="mt-3">
        <h4 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>{getDisplayTitle()}</h4>
        <FormGroup className="text-center">
          <Input
            type="number"
            inputMode="numeric"
            name="personalCode"
            id="personalCode"
            placeholder="0000"
            value={personalCode}
            onChange={(e) => {
              if (e.target.value.length <= 4) {
                setPersonalCode(e.target.value);
              }
            }}
            className="ba-input mx-auto"
            style={{ 
              fontSize: '2.2rem', 
              textAlign: 'center', 
              letterSpacing: '15px', 
              width: '220px'
            }}
            autoFocus
          />
        </FormGroup>
        
        <div className="d-flex justify-content-between gap-3 mt-5">
          <button
            type="button"
            className="ba-btn ba-btn-secondary"
            style={{ flex: 1 }}
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="ba-btn ba-btn-primary"
            style={{ flex: 2 }}
            disabled={personalCode.length !== 4}
          >
            Confirmar
          </button>
        </div>
      </Form>
    );
  };

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card home-card my-auto mx-auto" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <h2 className="home-title" style={{ fontSize: '2rem' }}>ShiftSync Scanner</h2>
        </div>

        {renderMainContent()}
      </div>

      <Modal isOpen={successModal} toggle={closeSuccessModal} centered style={{ maxWidth: '450px' }}>
        <ModalHeader toggle={closeSuccessModal}>
          Asistencia Registrada
        </ModalHeader>
        <ModalBody className="text-center py-4">
          {formationDetails && (
            <>
              <h3 className="mb-3" style={{ fontWeight: 600, color: '#2c3e50' }}>{formationDetails.name}</h3>
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
                  Fecha: {new Date(formationDetails.formationDate).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter className="justify-content-center">
          <button className="ba-btn ba-btn-primary" onClick={closeSuccessModal} style={{ width: '160px' }}>
            Ir a Dashboard
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}