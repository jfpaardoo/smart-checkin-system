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
      
      <Form onSubmit={handleManualSubmit} className="mb-4">
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
            className="da-input mx-auto"
            style={{
              fontSize: '2.5rem',
              textAlign: 'center',
              letterSpacing: '12px',
              width: '260px',
              padding: '15px'
            }}
            autoFocus
          />
        </FormGroup>
        
        <div className="d-flex justify-content-center gap-3">
          <button
            type="button"
            className="da-btn da-btn-secondary py-3 px-4"
            onClick={onCancel}
            style={{ flex: 1, maxWidth: '200px' }}
          >
            {t('checkin.cancel', 'Cancelar')}
          </button>
          
          <button
            type="submit"
            className="da-btn da-btn-primary py-3 px-4"
            disabled={manualCode.length !== 6}
            style={{ flex: 1, maxWidth: '200px' }}
          >
            {t('checkin.validate', 'Validar Código')}
          </button>
        </div>
      </Form>
    </div>
  );
}
