import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';

export const getOptimizedSignatureBase64 = (canvasRef) => {
  if (!canvasRef?.current || canvasRef.current.isEmpty()) {
    return null;
  }
  try {
    // 1. Recorte Bounding Box automático (elimina márgenes transparentes/blancos sobrantes)
    const trimmedCanvas = canvasRef.current.getTrimmedCanvas();
    if (!trimmedCanvas) {
      return canvasRef.current.getCanvas().toDataURL('image/png');
    }

    // 2. Normalización de dimensiones máximas para reducir el tamaño medio a <8 KB
    const maxWidth = 340;
    const maxHeight = 140;
    let targetWidth = trimmedCanvas.width;
    let targetHeight = trimmedCanvas.height;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.max(1, Math.round(targetWidth * scale));
      targetHeight = Math.max(1, Math.round(targetHeight * scale));
    }

    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = targetWidth;
    compressedCanvas.height = targetHeight;
    const ctx = compressedCanvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(trimmedCanvas, 0, 0, targetWidth, targetHeight);

    return compressedCanvas.toDataURL('image/png');
  } catch (error) {
    // Fallback al canvas completo sin recortar en caso de fallo inesperado de renderizado
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Error optimizando firma digital canvas:', error);
    }
    return canvasRef.current?.getCanvas ? canvasRef.current.getCanvas().toDataURL('image/png') : null;
  }
};

const SignatureStep = forwardRef(({ onSubmit, onCancel, submitLabel }, ref) => {
  const { t } = useTranslation();
  const toast = useToast();
  const sigCanvas = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => sigCanvas.current?.clear(),
    isEmpty: () => sigCanvas.current?.isEmpty(),
    getSignatureBase64: () => getOptimizedSignatureBase64(sigCanvas)
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
    const signatureBase64 = getOptimizedSignatureBase64(sigCanvas);
    onSubmit(signatureBase64);
  };

  return (
    <div className="text-center p-2 w-full">
      <h3 className="text-base sm:text-lg font-bold mb-3 text-slate-800 dark:text-slate-100">
        {t('checkin.signStepTitle', 'Por favor, firme abajo para finalizar')}
      </h3>
      
      <div 
        ref={containerRef}
        className="mx-auto mb-3 w-full bg-white rounded-2xl border border-white/80 shadow-md overflow-hidden"
      >
        <SignatureCanvas 
          penColor="#1e3a8a"
          canvasProps={{ className: 'sigCanvas w-full h-[160px] block cursor-crosshair' }}
          ref={sigCanvas}
        />
      </div>

      <div className="text-center mb-4">
        <button 
          type="button" 
          className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline bg-transparent border-0 cursor-pointer" 
          onClick={() => sigCanvas.current.clear()}
        >
          {t('dashboard.clearSignature', 'Borrar Firma')}
        </button>
      </div>

      <div className="flex justify-center items-center gap-3">
        {onCancel && (
          <button 
            type="button" 
            className="da-btn da-btn-secondary py-2.5 px-5 rounded-xl font-semibold text-xs sm:text-sm" 
            onClick={onCancel}
          >
            {t('checkin.cancel', 'Cancelar')}
          </button>
        )}
        <button 
          type="button" 
          className="da-btn da-btn-primary py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-md" 
          onClick={handleSubmit}
        >
          {submitLabel || t('dashboard.confirmCheckout', 'Confirmar')}
        </button>
      </div>
    </div>
  );
});

export default SignatureStep;