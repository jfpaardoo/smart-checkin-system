import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Input } from 'reactstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../components/ToastProvider';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { CardGhostLoader } from '../../components/GhostLoader';
import '../../static/css/admin/adminPage.css';

export default function UserDashboard() {
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();

  const [attendances, setAttendances, isLoading] = useFetchState(
    [],
    "/api/v1/users/me/formations",
    jwt
  );

  const [checkoutModal, setCheckoutModal] = useState(false);
  const [activeFormationId, setActiveFormationId] = useState(null);
  const [step, setStep] = useState('scan'); // 'scan' or 'sign'
  const [personalCode, setPersonalCode] = useState('');
  
  const toast = useToast();
  const scannerRef = useRef(null);
  const sigCanvas = useRef({});

  // Clean up scanner on unmount or step change
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log("Error clearing scanner", e));
      }
    };
  }, []);

  useEffect(() => {
    if (checkoutModal && step === 'scan') {
      const timer = setTimeout(() => {
        const qrElement = document.getElementById("checkout-qr-reader");
        if (qrElement) qrElement.innerHTML = "";

        scannerRef.current = new Html5QrcodeScanner(
          "checkout-qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.action === 'formation' && data.formationId === activeFormationId) {
                if (scannerRef.current) scannerRef.current.clear();
                setStep('sign');
              } else {
                toast.error("El QR no corresponde a esta formación.");
              }
            } catch (e) {
              toast.error("Formato QR inválido.");
            }
          },
          () => {}
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [checkoutModal, step, activeFormationId, toast]);

  const openCheckout = (formationId) => {
    setActiveFormationId(formationId);
    setStep('scan');
    setPersonalCode('');
    setCheckoutModal(true);
  };

  const closeCheckout = () => {
    if (scannerRef.current) scannerRef.current.clear().catch(e => console.error("Error clearing scanner on close", e));
    setCheckoutModal(false);
    setActiveFormationId(null);
  };

  const handleCheckoutSubmit = async () => {
    if (personalCode.length !== 4) {
      toast.error("Introduzca su PIN de 4 dígitos.");
      return;
    }
    if (sigCanvas.current.isEmpty()) {
      toast.error("Por favor proporcione su firma.");
      return;
    }

    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    
    try {
      const response = await fetch(`/api/v1/formations/${activeFormationId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${jwt}` 
        },
        body: JSON.stringify({ personalCode, signature: signatureBase64 }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      toast.success("Checkout completado con éxito.");
      closeCheckout();
      
      // Reload attendances
      const res = await fetch("/api/v1/users/me/formations", { headers: { "Authorization": `Bearer ${jwt}` } });
      const data = await res.json();
      setAttendances(data);

    } catch (error) {
      toast.error(error.message || "Error registrando salida");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <CardGhostLoader />;
    }

    if (attendances && attendances.length > 0) {
      return (
        <div className="table-responsive">
          <table className="table table-dark table-hover ba-table align-middle">
            <thead>
              <tr>
                <th>Formation</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att) => {
                const f = att.formation;
                const isCompleted = !!att.checkOutDate;
                return (
                  <tr key={att.id}>
                    <td>{f.name}</td>
                    <td>{new Date(f.formationDate).toLocaleString()}</td>
                    <td>
                      {isCompleted ? (
                        <span className="badge bg-success">Completada</span>
                      ) : (
                        <span className="badge bg-warning text-dark">En Curso</span>
                      )}
                    </td>
                    <td>
                      {!isCompleted && (
                        <button className="ba-btn ba-btn-primary btn-sm m-0" onClick={() => openCheckout(f.id)}>
                          Hacer Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="text-center p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '15px' }}>
        <p className="text-white mb-0">No has asistido a ninguna formación todavía.</p>
      </div>
    );
  };

  return (
    <div className="ba-container">
      <div className="ba-card home-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="home-title mb-4">Hello, {user?.username}</h2>
        
        <div className="d-flex justify-content-center mb-5">
          <Link to="/checkin" className="ba-btn ba-btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px' }}>
            Open QR Scanner (Work Check In / Out)
          </Link>
        </div>

        <h3 className="mb-3 text-white">My Formations</h3>
        
        {renderContent()}
      </div>

      {/* Checkout Modal */}
      <Modal isOpen={checkoutModal} toggle={closeCheckout} centered size="lg">
        <ModalHeader toggle={closeCheckout} style={{ backgroundColor: '#2c3e50', color: 'white', borderBottom: 'none' }}>
          Formation Checkout
        </ModalHeader>
        <ModalBody className="py-4" style={{ backgroundColor: '#f4f6fa' }}>
          {step === 'scan' ? (
            <div>
              <h5 className="text-center mb-3" style={{ color: '#2c3e50' }}>1. Escanea el QR de la Formación</h5>
              <div id="checkout-qr-reader" style={{ width: '100%', borderRadius: '15px', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.1)' }}></div>
            </div>
          ) : (
            <div>
              <h5 className="text-center mb-3" style={{ color: '#2c3e50' }}>2. Introduce tu PIN y Firma</h5>
              
              <FormGroup className="text-center mb-4">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="PIN 0000"
                  value={personalCode}
                  onChange={(e) => {
                    if (e.target.value.length <= 4) setPersonalCode(e.target.value);
                  }}
                  className="ba-input mx-auto"
                  style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '10px', width: '150px' }}
                />
              </FormGroup>

              <div style={{ backgroundColor: '#fff', borderRadius: '15px', border: '2px solid rgba(0,0,0,0.1)', overflow: 'hidden', width: 'fit-content', margin: '0 auto' }}>
                <SignatureCanvas 
                  penColor="blue"
                  canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                  ref={sigCanvas}
                />
              </div>
              <div className="text-center mt-2">
                <button type="button" className="btn btn-link text-danger" onClick={() => sigCanvas.current.clear()}>Borrar firma</button>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter style={{ borderTop: 'none', backgroundColor: '#f4f6fa' }}>
          <Button color="secondary" onClick={closeCheckout} style={{ borderRadius: '20px' }}>Cancelar</Button>
          {step === 'sign' && (
            <Button className="ba-btn-primary" onClick={handleCheckoutSubmit} style={{ borderRadius: '20px' }}>
              Confirmar Checkout
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
