import React, { useState, useRef } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCameraRotate } from '@fortawesome/free-solid-svg-icons';
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
    toggleCamera,
    facingMode,
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

  const renderScanStep = () => {
    return (
      <div>
        <h5 className="text-center mb-2 text-sm font-semibold text-slate-800">{t('dashboard.scanStep')}</h5>
        {!isManualCheckout ? (
          <>
            <div className="mb-2 mx-auto flex items-center justify-center gap-2" style={{ maxWidth: '300px' }}>
              {cameras && cameras.length > 1 && (
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <GlassDropdown
                    options={cameras}
                    value={selectedCameraId}
                    onChange={(camId) => setSelectedCameraId(camId)}
                    placeholder={t('dashboard.selectCamera', 'Seleccionar cámara')}
                  />
                </div>
              )}
              <button 
                type="button" 
                className="da-btn da-btn-secondary px-2.5 py-2 rounded-full text-xs font-semibold shrink-0 d-inline-flex align-items-center gap-1.5" 
                onClick={toggleCamera}
                title={facingMode === 'environment' ? 'Cambiar a frontal' : 'Cambiar a trasera'}
              >
                <FontAwesomeIcon icon={faCameraRotate} />
                <span className="text-[11px]">
                  {facingMode === 'environment' ? 'Frontal' : 'Trasera'}
                </span>
              </button>
            </div>

            <div 
              className="relative mx-auto rounded-2xl overflow-hidden shadow-sm flex items-center justify-center border border-white/20"
              style={{ 
                width: '100%', 
                maxWidth: '280px', 
                aspectRatio: '1 / 1', 
                borderRadius: '16px', 
                margin: '0 auto 8px',
                backgroundColor: '#000000'
              }}
            >
              {!isScannerReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-200 p-3">
                  <FontAwesomeIcon icon={faCamera} className="fa-spin text-2xl text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-300 mb-0">{t('checkin.startingCamera', 'Iniciando cámara...')}</p>
                </div>
              )}
              <div id="checkout-qr-reader" style={{ width: '100%', height: '100%' }} />
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