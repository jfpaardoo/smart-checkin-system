import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';

const SignatureStep = forwardRef(({ onSubmit, onCancel, submitLabel }, ref) => {
  const { t } = useTranslation();
  const toast = useToast();
  const sigCanvas = useRef({});

  // Allow parent to access canvas methods if needed, though we handle submit here
  useImperativeHandle(ref, () => ({
    clear: () => sigCanvas.current?.clear(),
    isEmpty: () => sigCanvas.current?.isEmpty(),
    getSignatureBase64: () => sigCanvas.current?.getCanvas().toDataURL('image/png')
  }));

  const handleSubmit = () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error(t('checkin.provideSignature', 'Por favor proporcione su firma.'));
      return;
    }
    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
    onSubmit(signatureBase64);
  };

  return (
    <div className="text-center p-2">
      <h5 className="mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>
        {t('checkin.signStepTitle', 'Por favor, firme abajo para finalizar')}
      </h5>
      
      <div 
        className="mx-auto mb-3"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '20px', 
          border: '1.5px solid rgba(255, 255, 255, 0.8)', 
          overflow: 'hidden', 
          width: 'fit-content',
          boxShadow: '0 8px 25px rgba(0,0,0,0.05)' 
        }}
      >
        <SignatureCanvas 
          penColor="blue"
          canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
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
