import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { useQrScanner } from '../../../hooks/useQrScanner';
import { getCleanFileInfo } from '../../../utils/fileUtils';
import GlassDropdown from '../../../components/GlassDropdown';
import ManualCheckinForm from '../../checkin/components/ManualCheckinForm';
import SignatureStep from '../../checkin/components/SignatureStep';
import { useToast } from '../../../components/ToastProvider';

export default function CheckoutModal({ isOpen, onClose, selectedAtt, onSubmitCheckout, initialStep = 'details' }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [step, setStep] = useState(initialStep); // 'details' | 'scan' | 'sign'
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [validatedToken, setValidatedToken] = useState('');

  useEffect(() => {
    setStep(initialStep);
    setIsManualCheckout(false);
    setValidatedToken('');
  }, [initialStep, isOpen]);

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
      <div className="p-3.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(15px)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' }}>
        <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.descriptionLabel')}</h6>
        <p className="mb-2.5 text-slate-800 text-sm font-medium">{selectedAtt.formation.description || t('dashboard.noDescription')}</p>

        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div>
            <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.formationDate')}</h6>
            <p className="mb-0 text-slate-800 text-xs font-semibold">{new Date(selectedAtt.formation.formationDate).toLocaleString()}</p>
          </div>
          <div>
            <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.checkInTime')}</h6>
            <p className="mb-0 text-slate-800 text-xs font-semibold">{new Date(selectedAtt.checkInDate).toLocaleString()}</p>
          </div>
        </div>

        {selectedAtt.checkOutDate && (
          <div className="mb-2.5">
            <h6 style={{ color: '#64748b', fontSize: '0.8rem' }} className="mb-0.5">{t('dashboard.checkOutTime')}</h6>
            <p className="mb-0 text-slate-800 text-xs font-semibold">{new Date(selectedAtt.checkOutDate).toLocaleString()}</p>
          </div>
        )}

        {selectedAtt.formation.documentUrls && selectedAtt.formation.documentUrls.length > 0 && (
          <div className="mb-3">
            <span className="font-bold text-slate-700 text-xs mb-1.5 block">{t('dashboard.viewDocumentation', 'Ver Documentación')}:</span>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-28 overflow-y-auto p-1">
              {selectedAtt.formation.documentUrls.map((item) => {
                const fileMeta = getCleanFileInfo(item);
                return (
                  <a
                    key={item}
                    href={fileMeta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ba-btn ba-btn-secondary px-2.5 py-1 text-xs text-truncate rounded-full"
                    style={{ textDecoration: 'none', maxWidth: '100%' }}
                  >
                    {fileMeta.name}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-start items-center mt-3 pt-2.5 border-t border-black/5">
          <span style={{ color: '#64748b', fontSize: '0.85rem' }} className="mr-1.5">
            {t('dashboard.statusLabel')}
          </span>

          {selectedAtt.checkOutDate ? (
            <span className="badge-glass-success text-xs px-2.5 py-0.5">
              {t('dashboard.statusCompleted')}
            </span>
          ) : (
            <span className="badge-glass-warning text-dark text-xs px-2.5 py-0.5">
              {t('dashboard.statusInProgress')}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderScanStep = () => {
    return (
      <div>
        <h5 className="text-center mb-2 text-sm font-semibold text-slate-800">{t('dashboard.scanStep')}</h5>
        {!isManualCheckout ? (
          <>
            {cameras.length > 1 && (
              <div className="mb-2" style={{ maxWidth: '250px', margin: '0 auto' }}>
                <GlassDropdown
                  options={cameras}
                  value={selectedCameraId}
                  onChange={(camId) => setSelectedCameraId(camId)}
                  placeholder={t('dashboard.selectCamera')}
                />
              </div>
            )}

            {!isScannerReady && (
              <div className="p-3 text-center text-muted text-xs">
                <FontAwesomeIcon icon={faCamera} className="fa-spin mb-1" size="lg" />
                <p className="mb-0">{t('checkin.startingCamera', 'Iniciando cámara...')}</p>
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '300px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', margin: '0 auto 8px' }}>
              <div id="checkout-qr-reader" style={{ width: '100%' }} />
            </div>

            <div className="text-center mt-2">
              <button
                type="button"
                className="ba-btn ba-btn-secondary w-full py-2 text-xs font-semibold rounded-full"
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
    <Modal isOpen={isOpen} toggle={handleClose} centered style={{ maxWidth: '440px' }}>
      <ModalHeader toggle={handleClose} className="py-2.5 px-4 text-sm font-bold">
        {selectedAtt ? selectedAtt.formation.name : t('dashboard.formationDetails')}
      </ModalHeader>

      <ModalBody className="py-3 px-4">
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

        <div className="flex justify-end mt-3 pt-2 border-t border-black/5">
          {step !== 'details' ? (
            step !== 'sign' && (
              <button type="button" className="ba-btn ba-btn-secondary m-0 px-3 py-1.5 text-xs rounded-full" onClick={() => setStep('details')}>
                {t('dashboard.backToDetails')}
              </button>
            )
          ) : (
            <button type="button" className="ba-btn ba-btn-secondary m-0 px-3 py-1.5 text-xs rounded-full" onClick={handleClose}>
              {t('dashboard.close')}
            </button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}