import React, { useState, useRef } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { useQrScanner } from '../../../hooks/useQrScanner';
import GlassDropdown from '../../../components/GlassDropdown';
import ManualCheckinForm from '../../checkin/components/ManualCheckinForm';
import SignatureStep from '../../checkin/components/SignatureStep';
import { useToast } from '../../../components/ToastProvider';

export default function CheckoutModal({ isOpen, onClose, selectedAtt, onSubmitCheckout, initialStep = 'scan' }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [step, setStep] = useState(initialStep); // 'details' | 'scan' | 'sign'
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const validatedTokenRef = useRef('');

  // Sincronizar el paso inicial cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

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
        validatedTokenRef.current = parsed.token;
      }
    } catch (e) {
      console.debug("QR text is not JSON, using raw string:", e);
      validatedTokenRef.current = decodedText;
    }
    setStep('sign');
    toast.success(t('dashboard.qrValidated'));
  });

  const handleClose = () => {
    const el = document.getElementById('checkout-qr-reader');
    if (el) el.innerHTML = '';
    stopScannerSafely();
    setStep(initialStep);
    setIsManualCheckout(false);
    validatedTokenRef.current = '';
    resetScannerState();
    onClose();
  };

;

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
                className="da-btn da-btn-secondary w-full py-2 text-xs font-semibold rounded-full"
                onClick={() => setIsManualCheckout(true)}
              >
                {t('dashboard.cameraIssue', '¿Problemas con la cámara? Entrada manual')}
              </button>
            </div>
          </>
        ) : (
          <ManualCheckinForm
            onSubmit={(code) => {
              validatedTokenRef.current = code;
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
        {step === 'scan' && renderScanStep()}
        {step === 'sign' && (
          <SignatureStep
            onSubmit={(signatureBase64) => {
              onSubmitCheckout(signatureBase64, validatedTokenRef.current);
              handleClose();
            }}
            submitLabel={t('dashboard.confirmCheckout')}
          />
        )}

        <div className="flex justify-end mt-3 pt-2 border-t border-black/5">
          <button type="button" className="da-btn da-btn-secondary m-0 px-3 py-1.5 text-xs rounded-full" onClick={handleClose}>
            {t('dashboard.close')}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}