import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';
import soundAndHaptics from '../../../util/soundAndHaptics';

export default function ManualCheckinForm({ onSubmit, onCancel }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.length !== 6) {
      toast.error(t('checkin.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    onSubmit(manualCode);
  };

  return (
    <div className="text-center p-4">
      <h4 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        {t('checkin.enterCodeManually', 'Ingresar Código Manualmente')}
      </h4>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        {t('checkin.enter6DigitCode', 'Introduce el código de 6 dígitos de la formación.')}
      </p>
      
      <form onSubmit={handleManualSubmit} className="mb-4 w-full">
        <div className="mb-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={manualCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 6) {
                if (val.length > manualCode.length) {
                  soundAndHaptics.playClick();
                }
                setManualCode(val);
              }
            }}
            className="da-input mx-auto w-full max-w-[260px] py-3 px-2 box-border text-center font-mono font-bold text-[clamp(1.5rem,6vw,2.3rem)] tracking-[clamp(4px,1.8vw,10px)]"
            autoFocus
          />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2.5 w-full max-w-[320px] mx-auto">
          <button
            type="button"
            className="da-btn da-btn-secondary py-2.5 px-4 w-full sm:flex-1 text-xs sm:text-sm font-semibold rounded-full"
            onClick={onCancel}
          >
            {t('checkin.cancel', 'Cancelar')}
          </button>
          
          <button
            type="submit"
            className="da-btn da-btn-primary py-2.5 px-4 w-full sm:flex-1 text-xs sm:text-sm font-semibold rounded-full"
            disabled={manualCode.length !== 6}
          >
            {t('checkin.validate', 'Validar Código')}
          </button>
        </div>
      </form>
    </div>
  );
}
