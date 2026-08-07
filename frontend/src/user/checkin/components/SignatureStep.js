import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';

const SignatureStep = forwardRef(({ onSubmit, onCancel, submitLabel }, ref) => {
  const { t } = useTranslation();
  const toast = useToast();
  const sigCanvas = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => sigCanvas.current?.clear(),
    isEmpty: () => sigCanvas.current?.isEmpty(),
    getSignatureBase64: () => sigCanvas.current?.getCanvas().toDataURL('image/png')
  }));

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const width = containerRef.current.offsetWidth;
        const height = 160;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        sigCanvas.current.clear();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error(t('checkin.provideSignature', 'Por favor proporcione su firma.'));
      return;
    }
    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    onSubmit(signatureBase64);
  };

  return (
    <div className="text-center p-2 w-full">
      <h5 className="mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>
        {t('checkin.signStepTitle', 'Por favor, firme abajo para finalizar')}
      </h5>
      
      <div 
        ref={containerRef}
        className="mx-auto mb-3 w-full"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '20px', 
          border: '1.5px solid rgba(255, 255, 255, 0.8)', 
          overflow: 'hidden', 
          boxShadow: '0 8px 25px rgba(0,0,0,0.05)' 
        }}
      >
        <SignatureCanvas 
          penColor="blue"
          canvasProps={{ className: 'sigCanvas w-full h-[160px] block cursor-crosshair' }}
          ref={sigCanvas}
        />
      </div>

      <div className="text-center mb-4">
        <button 
          type="button" 
          className="btn btn-link text-muted" 
          onClick={() => sigCanvas.current.clear()}
        >
          {t('dashboard.clearSignature', 'Borrar Firma')}
        </button>
      </div>

      <div className="d-flex justify-content-center gap-3">
        {onCancel && (
          <button 
            type="button" 
            className="ba-btn ba-btn-secondary py-3 px-4" 
            onClick={onCancel}
          >
            {t('checkin.cancel', 'Cancelar')}
          </button>
        )}
        <button 
          type="button" 
          className="ba-btn ba-btn-primary py-3 px-4" 
          onClick={handleSubmit}
        >
          {submitLabel || t('dashboard.confirmCheckout', 'Confirmar')}
        </button>
      </div>
    </div>
  );
});

export default SignatureStep;