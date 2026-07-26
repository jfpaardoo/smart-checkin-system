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

  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState(null);
  const [step, setStep] = useState('details');
  const [personalCode, setPersonalCode] = useState('');
  
  const toast = useToast();
  const scannerRef = useRef(null);
  const sigCanvas = useRef({});

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Error clearing scanner on unmount", e));
      }
    };
  }, []);

  useEffect(() => {
    if (detailsModal && step === 'scan' && selectedAtt) {
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
              if (data.action === 'formation' && data.formationId === selectedAtt.formation.id) {
                if (scannerRef.current) scannerRef.current.clear();
                setStep('sign');
              } else {
                toast.error("El QR no corresponde a esta formación.");
              }
            } catch (e) {
              console.error(e);
              toast.error("Formato QR inválido.");
            }
          },
          () => {}
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [detailsModal, step, selectedAtt, toast]);

  const openDetails = (attendance) => {
    setSelectedAtt(attendance);
    setStep('details');
    setPersonalCode('');
    setDetailsModal(true);
  };

  const closeDetails = () => {
    if (scannerRef.current) scannerRef.current.clear().catch(e => console.error("Error clearing scanner on close", e));
    setDetailsModal(false);
    setSelectedAtt(null);
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

    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    
    try {
      const response = await fetch(`/api/v1/formations/${selectedAtt.formation.id}/checkout`, {
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
      closeDetails();
      
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
      // Ordenar por fecha de formación más reciente primero (descendente)
      const sortedAttendances = [...attendances].sort(
        (a, b) => new Date(b.formation.formationDate) - new Date(a.formation.formationDate)
      );

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
              {sortedAttendances.map((att) => {
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
                      <button className="ba-btn ba-btn-primary btn-sm m-0" onClick={() => openDetails(att)}>
                        Ver Detalles
                      </button>
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

      <Modal isOpen={detailsModal} toggle={closeDetails} centered style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={closeDetails} style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0' }}>
          {selectedAtt ? selectedAtt.formation.name : 'Detalles de la Formación'}
        </ModalHeader>
        <ModalBody className="py-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', color: 'white' }}>
          {selectedAtt && (
            <>
              {step === 'details' && (
                <div className="p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }} className="mb-1">Descripción:</h6>
                  <p className="lead mb-4 text-white" style={{ fontSize: '1.1rem' }}>{selectedAtt.formation.description || 'Sin descripción.'}</p>
                  
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }} className="mb-1">Fecha de la formación:</h6>
                  <p className="mb-4 text-white" style={{ fontWeight: '500' }}>{new Date(selectedAtt.formation.formationDate).toLocaleString()}</p>
                  
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }} className="mb-1">Hora de entrada (Check-in):</h6>
                  <p className="mb-4 text-white" style={{ fontWeight: '500' }}>{new Date(selectedAtt.checkInDate).toLocaleString()}</p>

                  {selectedAtt.checkOutDate && (
                    <>
                      <h6 style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }} className="mb-1">Hora de salida (Check-out):</h6>
                      <p className="mb-4 text-white" style={{ fontWeight: '500' }}>{new Date(selectedAtt.checkOutDate).toLocaleString()}</p>
                    </>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }} className="mr-2">Estado: </span>
                      {selectedAtt.checkOutDate ? (
                        <span className="badge bg-success" style={{ fontSize: '0.9rem' }}>Completada</span>
                      ) : (
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.9rem' }}>En Curso</span>
                      )}
                    </div>
                    {!selectedAtt.checkOutDate && (
                      <button className="ba-btn ba-btn-primary m-0" style={{ borderRadius: '30px' }} onClick={() => setStep('scan')}>
                        Hacer Checkout
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'scan' && (
                <div>
                  <h5 className="text-center mb-3 text-white">1. Escanea el QR de la Formación</h5>
                  <div id="checkout-qr-reader" style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)' }}></div>
                </div>
              )}

              {step === 'sign' && (
                <div>
                  <h5 className="text-center mb-3 text-white">2. Introduce tu PIN y Firma</h5>
                  
                  <FormGroup className="text-center mb-4">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="PIN"
                      value={personalCode}
                      onChange={(e) => {
                        if (e.target.value.length <= 4) setPersonalCode(e.target.value);
                      }}
                      className="ba-input mx-auto text-white"
                      style={{ 
                        fontSize: '1.8rem', 
                        textAlign: 'center', 
                        letterSpacing: '10px', 
                        width: '180px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '20px'
                      }}
                    />
                  </FormGroup>

                  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', width: 'fit-content', margin: '0 auto', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)' }}>
                    <SignatureCanvas 
                      penColor="blue"
                      canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                      ref={sigCanvas}
                    />
                  </div>
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-link text-white-50" onClick={() => sigCanvas.current.clear()}>Borrar firma</button>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderTop: 'none', borderRadius: '0 0 24px 24px' }}>
          {step !== 'details' ? (
            <Button color="secondary" onClick={() => setStep('details')} style={{ borderRadius: '30px' }}>Volver a Detalles</Button>
          ) : (
            <Button color="secondary" onClick={closeDetails} style={{ borderRadius: '30px' }}>Cerrar</Button>
          )}
          {step === 'sign' && (
            <Button className="ba-btn-primary" onClick={handleCheckoutSubmit} style={{ borderRadius: '30px' }}>
              Confirmar Checkout
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
