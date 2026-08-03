import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { useQrScanner } from '../../../hooks/useQrScanner';
import { getCleanFileInfo } from '../../../utils/fileUtils';
import GlassDropdown from '../../../components/GlassDropdown';
import ManualCheckinForm from '../../checkin/components/ManualCheckinForm';
import SignatureStep from '../../checkin/components/SignatureStep';
import { useToast } from '../../../components/ToastProvider';

export default function CheckoutModal({ isOpen, onClose, selectedAtt, onSubmitCheckout }) {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [step, setStep] = useState('details'); // 'details' | 'scan' | 'sign'
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [validatedToken, setValidatedToken] = useState('');

  const {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    isScannerReady,
    resetScannerState,
    stopScannerSafely
  } = useQrScanner('checkout-qr-reader', isOpen && step === 'scan' && !isManualCheckout, (decodedText) => {
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed?.token) {
        setValidatedToken(parsed.token);
      }
    } catch (e) {
      console.debug("QR text is not JSON, using raw string:", e);
      setValidatedToken(decodedText);
    }
    setStep('sign');
    toast.success(t('dashboard.qrValidated'));
  });

  const handleClose = () => {
    // Nuke the scanner container *before* React unmounts it to prevent removeChild errors
    const el = document.getElementById('checkout-qr-reader');
    if (el) el.innerHTML = '';
    stopScannerSafely();
    setStep('details');
    setIsManualCheckout(false);
    setValidatedToken('');
    resetScannerState();
    onClose();
  };

  const renderDetailsStep = () => {
    if (!selectedAtt) return null;
    return (
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
              {selectedAtt.formation.documentUrls.map((item, idx) => {
                const fileMeta = getCleanFileInfo(item);

                return (
                  <a
                    key={item}
                    href={fileMeta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ba-btn ba-btn-secondary px-3 py-2 text-truncate"
                    style={{ textDecoration: 'none', maxWidth: '100%' }}
                  >
                    {fileMeta.name}
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
              <span className="badge-glass-success" style={{ fontSize: '0.9rem' }}>{t('dashboard.statusCompleted')}</span>
            ) : (
              <span className="badge-glass-warning text-dark" style={{ fontSize: '0.9rem' }}>{t('dashboard.statusInProgress')}</span>
            )}
          </div>
          {!selectedAtt.checkOutDate && (
            <button type="button" className="ba-btn ba-btn-primary m-0" onClick={() => setStep('scan')}>
              {t('dashboard.checkout')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderScanStep = () => {
    return (
      <div>
        <h5 className="text-center mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('dashboard.scanStep')}</h5>
        {!isManualCheckout ? (
          <>
            {cameras.length > 1 && (
              <div className="mb-3" style={{ maxWidth: '300px', margin: '0 auto' }}>
                <GlassDropdown
                  options={cameras}
                  value={selectedCameraId}
                  onChange={(camId) => setSelectedCameraId(camId)}
                  placeholder={t('dashboard.selectCamera')}
                />
              </div>
            )}
            
            {/* Loading indicator — outside #checkout-qr-reader so React and the library don't conflict */}
            {!isScannerReady && (
              <div className="p-5 text-center text-muted">
                <FontAwesomeIcon icon={faCamera} className="fa-spin mb-2" size="2x" />
                <p className="mb-0">{t('checkin.startingCamera', 'Iniciando cámara...')}</p>
              </div>
            )}

            {/* Stable outer div — React owns this wrapper; the library fully owns #checkout-qr-reader */}
            <div style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', margin: '0 auto 12px' }}>
              {/* This div is intentionally EMPTY from React's perspective. html5-qrcode manages its DOM. */}
              <div id="checkout-qr-reader" style={{ width: '100%' }} />
            </div>

            <div className="text-center mt-3">
              <button 
                type="button" 
                className="ba-btn ba-btn-secondary w-100 py-3" 
                style={{ fontSize: '0.9rem', fontWeight: 600 }}
                onClick={() => setIsManualCheckout(true)}
              >
                {t('dashboard.cameraIssue', '¿Problemas con la cámara? Entrada manual')}
              </button>
            </div>
          </>
        ) : (
          <ManualCheckinForm 
            onSubmit={(code) => {
              setValidatedToken(code);
              setStep('sign');
              toast.success(t('dashboard.codeAccepted'));
            }} 
            onCancel={() => setIsManualCheckout(false)} 
          />
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered style={{ maxWidth: '500px' }}>
      <ModalHeader toggle={handleClose}>
        {selectedAtt ? selectedAtt.formation.name : t('dashboard.formationDetails')}
      </ModalHeader>
      
      <ModalBody className="py-4">
        {step === 'details' && renderDetailsStep()}
        {step === 'scan' && renderScanStep()}
        {step === 'sign' && (
          <SignatureStep 
            onSubmit={(signatureBase64) => {
              onSubmitCheckout(signatureBase64, validatedToken);
              handleClose();
            }} 
            submitLabel={t('dashboard.confirmCheckout')}
          />
        )}
      </ModalBody>
      
      <ModalFooter>
        {step !== 'details' ? (
          step !== 'sign' && <button type="button" className="ba-btn ba-btn-secondary" onClick={() => setStep('details')}>{t('dashboard.backToDetails')}</button>
        ) : (
          <button type="button" className="ba-btn ba-btn-secondary" onClick={handleClose}>{t('dashboard.close')}</button>
        )}
      </ModalFooter>
    </Modal>
  );
}
