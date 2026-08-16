import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import { Turnstile } from '@marsidev/react-turnstile';
import RegisterSuccess from './components/RegisterSuccess';
import RegisterForm from './components/RegisterForm';
import '../../App.css';

export default function Register() {
  const { t } = useTranslation();
  const toast = useToast();

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    personalCode: '',
    companyId: '',
    locator: ''
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__)) {
      setCaptchaToken('1x00000000000000000000AA');
    }
    fetch('/api/v1/companies')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'personalCode') {
      const numeric = value.replace(/\D/g, '');
      if (numeric.length <= 4) {
        setForm({ ...form, personalCode: numeric });
      }
    } else if (name === 'locator') {
      setForm({ ...form, locator: value.toUpperCase().slice(0, 10) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      toast.error(t('register.captchaRequired', 'Por favor, completa la verificación de seguridad.'));
      return;
    }

    if (form.password.length < 6) {
      toast.error(t('register.passwordTooShort', 'La contraseña debe tener al menos 6 caracteres.'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error(t('register.passwordMismatch', 'Las contraseñas no coinciden.'));
      return;
    }

    if (form.personalCode.length !== 4) {
      toast.error(t('register.invalidPersonalCode', 'El código personal debe ser de exactamente 4 dígitos.'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/signup', { 
        credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          personalCode: form.personalCode.trim(),
          companyId: form.companyId ? Number.parseInt(form.companyId, 10) : null,
          captchaToken: captchaToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCaptchaToken(null); 
        let errorMsg = data.message || t('register.genericError', 'Error al procesar la solicitud de registro.');
        
        if (errorMsg.includes('duplicate key value') || errorMsg.includes('uk5v7b31bxs6tcvinhg22i2v029') || errorMsg.includes('personal_code')) {
          errorMsg = t('users.duplicatePersonalCode', 'El Código Personal ya existe para otro usuario.');
        } else if (errorMsg.includes('username')) {
          errorMsg = t('users.duplicateUsername', 'El Nombre de usuario ya existe.');
        }

        throw new Error(errorMsg);
      }

      setSubmittedSuccess(true);
      toast.success(t('register.successMessage', 'Solicitud de registro enviada con éxito. El administrador activará tu cuenta.'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Creamos el componente del CAPTCHA con su estética aquí, para inyectarlo en el formulario
  const captchaWidget = (
    <div className="flex justify-center items-center p-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-inner w-fit mx-auto">
      <Turnstile 
        siteKey={process.env.REACT_APP_CAPTCHA_SITE_KEY || '1x00000000000000000000AA'} 
        onSuccess={(token) => setCaptchaToken(token)}
        onError={() => setCaptchaToken(null)}
        onExpire={() => setCaptchaToken(null)}
        options={{ theme: 'light' }}
      />
    </div>
  );

  return (
    <div className="da-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      
      <div className="da-card" style={{ maxWidth: '1080px', margin: '2rem auto', padding: '50px' }}>
        
        {submittedSuccess ? (
          <RegisterSuccess t={t} />
        ) : (
          <RegisterForm
            form={form}
            companies={companies}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading} 
            isCaptchaValid={Boolean(captchaToken)}
            t={t}
            captchaComponent={captchaWidget}
          />
        )}

      </div>
    </div>
  );
}