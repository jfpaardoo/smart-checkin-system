import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Input } from 'reactstrap';
import { Html5Qrcode } from 'html5-qrcode';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../components/ToastProvider';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { CardGhostLoader } from '../../components/GhostLoader';
import GlassDropdown from '../../components/GlassDropdown';
import { useSubscription } from '../../hooks/useSubscription';
import '../../static/css/admin/adminPage.css';

export default function UserDashboard() {
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();

  const [attendances, setAttendances, isLoading] = useFetchState(
    [],
    "/api/v1/users/me/formations",
    jwt
  );

  const reloadUserFormations = () => {
    fetch("/api/v1/users/me/formations", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setAttendances(data))
      .catch((e) => console.error("Error updating user formations via WS", e));
  };

  useSubscription('/topic/formations', reloadUserFormations);

  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState(null);
  const [step, setStep] = useState('details');
  
  const toast = useToast();
  const html5QrcodeRef = useRef(null);
  const sigCanvas = useRef({});

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [manualCheckoutCode, setManualCheckoutCode] = useState('');

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
      console.debug("Safe scanner stop suppressed exception", err);
    }
  };

  useEffect(() => {
    return () => {
      stopScannerSafely(html5QrcodeRef.current);
    };
  }, []);

  useEffect(() => {
    if (detailsModal && step === 'scan' && !isManualCheckout) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          const camOptions = devices.map(d => ({
            value: d.id,
            label: d.label || `Cámara ${d.id}`
          }));
          setCameras(camOptions);
          setSelectedCameraId(prev => prev || devices[0].id);
        }
      }).catch(err => console.error("Error getting cameras", err));
    }
  }, [detailsModal, step, isManualCheckout]);

  useEffect(() => {
    let isScanning = false;
    let activeScanner = null;

    if (detailsModal && step === 'scan' && !isManualCheckout && selectedCameraId && selectedAtt) {
      const html5Qrcode = new Html5Qrcode("checkout-qr-reader");
      html5QrcodeRef.current = html5Qrcode;
      activeScanner = html5Qrcode;

      html5Qrcode.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScannerSafely(activeScanner);
          setStep('sign');
          toast.success("Código QR validado. Por favor proporcione su firma.");
        },
        () => {}
      ).then(() => {
        isScanning = true;
      }).catch(err => {
        console.error("Error starting checkout scanner:", err);
      });

      return () => {
        if (isScanning) {
          stopScannerSafely(activeScanner);
        }
      };
    }
  }, [detailsModal, step, isManualCheckout, selectedCameraId, selectedAtt, toast]);

  const openDetails = (attendance) => {
    setSelectedAtt(attendance);
    setStep('details');
    setIsManualCheckout(false);
    setManualCheckoutCode('');
    setDetailsModal(true);
  };

  const closeDetails = () => {
    if (html5QrcodeRef.current?.isScanning) {
      html5QrcodeRef.current.stop().catch(e => console.error("Error clearing scanner on close", e));
    }
    setDetailsModal(false);
    setSelectedAtt(null);
    setIsManualCheckout(false);
    setManualCheckoutCode('');
  };

  const handleCheckoutSubmit = async () => {
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
        body: JSON.stringify({ signature: signatureBase64 }),
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
          <table className="table table-hover ba-table align-middle">
            <thead>
              <tr>
                <th style={{ color: '#2c3e50' }}>Formación</th>
                <th style={{ color: '#2c3e50' }}>Fecha</th>
                <th style={{ color: '#2c3e50' }}>Estado</th>
                <th style={{ color: '#2c3e50' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttendances.map((att) => {
                const f = att.formation;
                const isCompleted = !!att.checkOutDate;
                return (
                  <tr key={att.id}>
                    <td style={{ color: '#2c3e50', fontWeight: 600 }}>{f.name}</td>
                    <td style={{ color: '#64748b' }}>{new Date(f.formationDate).toLocaleString()}</td>
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
      <div className="text-center p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)' }}>
        <p className="mb-0" style={{ color: '#64748b', fontWeight: 500 }}>No has asistido a ninguna formación todavía.</p>
      </div>
    );
  };

  return (
    <div className="ba-container">
      <div className="ba-card home-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="home-title mb-4" style={{ color: '#2c3e50' }}>Hola, {user?.username}</h2>
        
        <div className="d-flex justify-content-center mb-5">
          <Link to="/checkin" className="ba-btn ba-btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px' }}>
            Escáner QR (Fichar Turno / Asistencia)
          </Link>
        </div>

        <h3 className="mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>Mis Formaciones</h3>
        
        {renderContent()}
      </div>

      <Modal isOpen={detailsModal} toggle={closeDetails} centered style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={closeDetails}>
          {selectedAtt ? selectedAtt.formation.name : 'Detalles de la Formación'}
        </ModalHeader>
        <ModalBody className="py-4">
          {selectedAtt && (
            <>
              {step === 'details' && (
                <div className="p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(15px)', borderRadius: '24px', border: '1.5px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">Descripción:</h6>
                  <p className="lead mb-4" style={{ color: '#2c3e50', fontSize: '1.1rem' }}>{selectedAtt.formation.description || 'Sin descripción.'}</p>
                  
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">Fecha de la formación:</h6>
                  <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.formation.formationDate).toLocaleString()}</p>
                  
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">Hora de entrada (Check-in):</h6>
                  <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.checkInDate).toLocaleString()}</p>

                  {selectedAtt.checkOutDate && (
                    <>
                      <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">Hora de salida (Check-out):</h6>
                      <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.checkOutDate).toLocaleString()}</p>
                    </>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <span style={{ color: '#64748b' }} className="mr-2">Estado: </span>
                      {selectedAtt.checkOutDate ? (
                        <span className="badge bg-success" style={{ fontSize: '0.9rem' }}>Completada</span>
                      ) : (
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.9rem' }}>En Curso</span>
                      )}
                    </div>
                    {!selectedAtt.checkOutDate && (
                      <button className="ba-btn ba-btn-primary m-0" onClick={() => setStep('scan')}>
                        Hacer Checkout
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'scan' && (
                <div>
                  <h5 className="text-center mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>1. Validación de Formación</h5>
                  {!isManualCheckout ? (
                    <>
                      {cameras.length > 1 && (
                        <div className="mb-3">
                          <GlassDropdown
                            options={cameras}
                            value={selectedCameraId}
                            onChange={(camId) => setSelectedCameraId(camId)}
                            placeholder="Seleccionar Cámara..."
                          />
                        </div>
                      )}
                      <div id="checkout-qr-reader"></div>
                      <div className="text-center mt-3">
                        <button 
                          type="button" 
                          className="ba-btn ba-btn-secondary w-100 py-3" 
                          style={{ fontSize: '0.9rem', fontWeight: 600 }}
                          onClick={() => {
                            setIsManualCheckout(true);
                            toast.info("Modo manual activado: Introduce el código de 6 dígitos.");
                          }}
                        >
                          ¿Problemas con la cámara? Introducir código manualmente
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="mb-3" style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Introduce el código de 6 dígitos proyectado para esta formación.
                      </p>
                      <FormGroup className="mb-4">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          value={manualCheckoutCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 6) setManualCheckoutCode(val);
                          }}
                          className="ba-input mx-auto"
                          style={{
                            fontSize: '2rem',
                            textAlign: 'center',
                            letterSpacing: '10px',
                            width: '220px'
                          }}
                          autoFocus
                        />
                      </FormGroup>
                      <div className="d-flex justify-content-between gap-3">
                        <button
                          type="button"
                          className="ba-btn ba-btn-secondary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            setIsManualCheckout(false);
                            setManualCheckoutCode('');
                            toast.info("Cámara reactivada.");
                          }}
                        >
                          Usar Cámara
                        </button>
                        <button
                          type="button"
                          className="ba-btn ba-btn-primary"
                          style={{ flex: 2 }}
                          disabled={manualCheckoutCode.length !== 6}
                          onClick={() => {
                            if (manualCheckoutCode.length === 6) {
                              setStep('sign');
                              toast.success("Código aceptado. Por favor proporcione su firma.");
                            } else {
                              toast.error("El código debe tener 6 dígitos.");
                            }
                          }}
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'sign' && (
                <div>
                  <h5 className="text-center mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>2. Firma del Usuario</h5>
                  
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden', width: 'fit-content', margin: '0 auto', boxShadow: '0 8px 25px rgba(0,0,0,0.05)' }}>
                    <SignatureCanvas 
                      penColor="blue"
                      canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                      ref={sigCanvas}
                    />
                  </div>
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-link text-muted" onClick={() => sigCanvas.current.clear()}>Borrar firma</button>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {step !== 'details' ? (
            <button type="button" className="ba-btn ba-btn-secondary" onClick={() => setStep('details')}>Volver a Detalles</button>
          ) : (
            <button type="button" className="ba-btn ba-btn-secondary" onClick={closeDetails}>Cerrar</button>
          )}
          {step === 'sign' && (
            <button type="button" className="ba-btn ba-btn-primary" onClick={handleCheckoutSubmit}>
              Confirmar Checkout
            </button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
