import React, { useState } from 'react';
import { Form, FormGroup, Input } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';

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
      <h4 className="mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>
        {t('checkin.enterCodeManually', 'Ingresar Código Manualmente')}
      </h4>
      <p className="mb-4 text-muted">
        {t('checkin.enter6DigitCode', 'Introduce el código de 6 dígitos de la formación.')}
      </p>
      
      <Form onSubmit={handleManualSubmit} className="mb-4 w-full">
        <FormGroup className="mb-4">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={manualCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 6) setManualCode(val);
            }}
            className="da-input mx-auto max-w-full"
            style={{
              fontSize: 'clamp(1.5rem, 6vw, 2.3rem)',
              textAlign: 'center',
              letterSpacing: 'clamp(4px, 1.8vw, 10px)',
              width: '100%',
              maxWidth: '260px',
              padding: '12px 8px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </FormGroup>
        
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
      </Form>
    </div>
  );
}
