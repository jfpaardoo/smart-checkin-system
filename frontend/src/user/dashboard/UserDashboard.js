import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Input } from 'reactstrap';
import { Html5Qrcode } from 'html5-qrcode';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { CardGhostLoader } from '../../components/GhostLoader';
import GlassDropdown from '../../components/GlassDropdown';
import { useSubscription } from '../../hooks/useSubscription';
import '../../App.css';
import '../../static/css/admin/adminPage.css';

export default function UserDashboard() {
  const { t } = useTranslation();
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
            label: d.label || `${t('dashboard.camera')} ${d.id}`
          }));
          setCameras(camOptions);
          setSelectedCameraId(prev => prev || devices[0].id);
        }
      }).catch(err => console.error("Error getting cameras", err));
    }
  }, [detailsModal, step, isManualCheckout, t]);

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
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed?.token) {
              setManualCheckoutCode(parsed.token);
            }
          } catch (e) {
            console.debug("QR text is not JSON, using raw string:", e);
            setManualCheckoutCode(decodedText);
          }
          setStep('sign');
          toast.success(t('dashboard.qrValidated'));
        },
        (errorMessage) => {
          console.debug("Buscando código QR...", errorMessage);
        }
      ).then(() => {
        isScanning = true;
      }).catch(err => {
        console.error("Error al iniciar el escáner de checkout:", err);
      });

      return () => {
        if (isScanning) {
          stopScannerSafely(activeScanner);
        }
      };
    }
  }, [detailsModal, step, isManualCheckout, selectedCameraId, selectedAtt, toast, t]);

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
      toast.error(t('dashboard.signatureRequired'));
      return;
    }

    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    
    try {
      // 🚀 COMPORTAMIENTO CLONADO DEL QR:
      // Se envía SIEMPRE el formationId, sin importar si es manual o cámara.
      const payload = {
        signature: signatureBase64,
        token: manualCheckoutCode,
        formationId: selectedAtt?.formation?.id
      };

      const response = await fetch('/api/v1/checkins/qr-fichaje', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${jwt}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('dashboard.checkoutError'));
      }

      toast.success(t('dashboard.checkoutSuccess'));
      closeDetails();
      reloadUserFormations();

    } catch (error) {
      toast.error(error.message || t('dashboard.checkoutError'));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <CardGhostLoader />;
    }

    if (attendances && attendances.length > 0) {
      const sortedAttendances = [...attendances].sort((a, b) => {
        const aCompleted = !!a.checkOutDate;
        const bCompleted = !!b.checkOutDate;
        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1;
        }
        return new Date(b.formation.formationDate) - new Date(a.formation.formationDate);
      });

      return (
        <div className="table-responsive">
          <table className="table table-hover ba-table align-middle">
            <thead>
              <tr>
                <th style={{ color: '#2c3e50' }}>{t('dashboard.formation')}</th>
                <th style={{ color: '#2c3e50' }}>{t('dashboard.date')}</th>
                <th style={{ color: '#2c3e50' }}>{t('dashboard.status')}</th>
                <th style={{ color: '#2c3e50' }}>{t('dashboard.action')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttendances.map((att) => {
                const f = att.formation;
                const isCompleted = !!att.checkOutDate;
                return (
                  <tr key={att.id}>
                    <td style={{ color: '#2c3e50', fontWeight: 600 }}>
                      {f.name} <small className="text-muted">(ID: {f.id})</small>
                    </td>
                    <td style={{ color: '#64748b' }}>{new Date(f.formationDate).toLocaleString()}</td>
                    <td>
                      {isCompleted ? (
                        <span className="badge bg-success">{t('dashboard.statusCompleted')}</span>
                      ) : (
                        <span className="badge bg-warning text-dark">{t('dashboard.statusInProgress')}</span>
                      )}
                    </td>
                    <td>
                      <button className="ba-btn ba-btn-primary btn-sm m-0" onClick={() => openDetails(att)}>
                        {t('dashboard.viewDetails')}
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
        <p className="mb-0" style={{ color: '#64748b', fontWeight: 500 }}>{t('dashboard.noFormations')}</p>
      </div>
    );
  };

  return (
    <div className="ba-container">
      <div className="ba-card home-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="home-title mb-4" style={{ color: '#2c3e50' }}>{t('dashboard.hello')}, {user?.username}</h2>
        
        <div className="d-flex justify-content-center mb-5">
          <Link to="/checkin" className="ba-btn ba-btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px' }}>
            {t('dashboard.scannerButton')}
          </Link>
        </div>

        <h3 className="mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('dashboard.myFormations')}</h3>
        
        {renderContent()}
      </div>

      <Modal isOpen={detailsModal} toggle={closeDetails} centered style={{ maxWidth: '500px' }}>
        <ModalHeader toggle={closeDetails}>
          {selectedAtt ? selectedAtt.formation.name : t('dashboard.formationDetails')}
        </ModalHeader>
        <ModalBody className="py-4">
          {selectedAtt && (
            <>
              {step === 'details' && (
                <div className="p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(15px)', borderRadius: '24px', border: '1.5px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">{t('dashboard.descriptionLabel')}</h6>
                  <p className="lead mb-4" style={{ color: '#2c3e50', fontSize: '1.1rem' }}>{selectedAtt.formation.description || t('dashboard.noDescription')}</p>
                  
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">{t('dashboard.formationDate')}</h6>
                  <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.formation.formationDate).toLocaleString()}</p>
                  
                  <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">{t('dashboard.checkInTime')}</h6>
                  <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.checkInDate).toLocaleString()}</p>

                  {selectedAtt.checkOutDate && (
                    <>
                      <h6 style={{ color: '#64748b', fontSize: '0.9rem' }} className="mb-1">{t('dashboard.checkOutTime')}</h6>
                      <p className="mb-4" style={{ color: '#2c3e50', fontWeight: '500' }}>{new Date(selectedAtt.checkOutDate).toLocaleString()}</p>
                    </>
                  )}

                  {selectedAtt.formation.documentUrls && selectedAtt.formation.documentUrls.length > 0 && (
                    <div className="mb-4 text-center">
                      <span className="fw-bold text-dark mb-2 d-block text-start">{t('dashboard.viewDocumentation', 'Ver Documentación')}:</span>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {selectedAtt.formation.documentUrls.map((url, idx) => {
                          const decodedUrl = decodeURIComponent(url);
                          const parts = decodedUrl.split('/');
                          const rawFileName = parts.at(-1) || `Documento ${idx + 1}`;
                          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
                          const fileName = rawFileName.replace(uuidRegex, '').split('?')[0];

                          return (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ba-btn ba-btn-secondary px-3 py-2 text-truncate"
                              style={{ textDecoration: 'none', maxWidth: '100%' }}
                            >
                              {fileName}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <span style={{ color: '#64748b' }} className="mr-2">{t('dashboard.statusLabel')} </span>
                      {selectedAtt.checkOutDate ? (
                        <span className="badge bg-success" style={{ fontSize: '0.9rem' }}>{t('dashboard.statusCompleted')}</span>
                      ) : (
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.9rem' }}>{t('dashboard.statusInProgress')}</span>
                      )}
                    </div>
                    {!selectedAtt.checkOutDate && (
                      <button className="ba-btn ba-btn-primary m-0" onClick={() => setStep('scan')}>
                        {t('dashboard.checkout')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'scan' && (
                <div>
                  <h5 className="text-center mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('dashboard.scanStep')}</h5>
                  {!isManualCheckout ? (
                    <>
                      {cameras.length > 1 && (
                        <div className="mb-3">
                          <GlassDropdown
                            options={cameras}
                            value={selectedCameraId}
                            onChange={(camId) => setSelectedCameraId(camId)}
                            placeholder={t('dashboard.selectCamera')}
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
                            toast.info(t('dashboard.manualActivated'));
                          }}
                        >
                          {t('dashboard.cameraIssue')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="mb-3" style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        {t('dashboard.manualCode')}
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
                            toast.info(t('dashboard.cameraReactivated'));
                          }}
                        >
                          {t('dashboard.useCamera')}
                        </button>
                        <button
                          type="button"
                          className="ba-btn ba-btn-primary"
                          style={{ flex: 2 }}
                          disabled={manualCheckoutCode.length !== 6}
                          onClick={() => {
                            if (manualCheckoutCode.length === 6) {
                              setStep('sign');
                              toast.success(t('dashboard.codeAccepted'));
                            } else {
                              toast.error(t('dashboard.codeInvalid'));
                            }
                          }}
                        >
                          {t('dashboard.continue')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'sign' && (
                <div>
                  <h5 className="text-center mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('dashboard.signStep')}</h5>
                  
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden', width: 'fit-content', margin: '0 auto', boxShadow: '0 8px 25px rgba(0,0,0,0.05)' }}>
                    <SignatureCanvas 
                      penColor="blue"
                      canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                      ref={sigCanvas}
                    />
                  </div>
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-link text-muted" onClick={() => sigCanvas.current.clear()}>{t('dashboard.clearSignature')}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {step !== 'details' ? (
            <button type="button" className="ba-btn ba-btn-secondary" onClick={() => setStep('details')}>{t('dashboard.backToDetails')}</button>
          ) : (
            <button type="button" className="ba-btn ba-btn-secondary" onClick={closeDetails}>{t('dashboard.close')}</button>
          )}
          {step === 'sign' && (
            <button type="button" className="ba-btn ba-btn-primary" onClick={handleCheckoutSubmit}>
              {t('dashboard.confirmCheckout')}
            </button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}