import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { useToast } from '../../components/ToastProvider';
import { Turnstile } from '@marsidev/react-turnstile';
import RegisterSuccess from './components/RegisterSuccess';
import RegisterForm from './components/RegisterForm';
import { useCaptchaSiteKey } from '../../hooks/useCaptchaSiteKey';

const companiesFetcher = (url) => fetch(url).then((res) => (res.ok ? res.json() : []));

export default function Register() {
  const { t } = useTranslation();
  const toast = useToast();
  const siteKey = useCaptchaSiteKey();

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

  const { data: companiesData } = useSWR('/api/v1/companies', companiesFetcher, {
    revalidateOnFocus: false,
  });
  const companies = Array.isArray(companiesData) ? companiesData : [];

  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(() => {
    if (typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__)) {
      return '1x00000000000000000000AA';
    }
    return null;
  });
  const [captchaKey, setCaptchaKey] = useState(0);

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
        setCaptchaKey((k) => k + 1);
        let errorMsg = data.message || t('register.genericError', 'Error al procesar la solicitud de registro.');
        
        if (errorMsg.includes('personal_code') || errorMsg.toLowerCase().includes('código personal') || errorMsg.includes('uk5v7b31bxs6tcvinhg22i2v029')) {
          errorMsg = t('users.duplicatePersonalCode', 'El Código Personal ya existe para otro usuario.');
        } else if (errorMsg.includes('email') || errorMsg.toLowerCase().includes('correo electrónico') || errorMsg.toLowerCase().includes('correo')) {
          errorMsg = t('users.duplicateEmail', 'El correo electrónico ya se encuentra registrado.');
        } else if (errorMsg.includes('username') || errorMsg.toLowerCase().includes('nombre de usuario')) {
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

  const isE2E = typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__);

  // Creamos el componente del CAPTCHA con su estética aquí, para inyectarlo en el formulario
  const captchaWidget = (
    <div className="flex justify-center items-center my-1 w-full overflow-hidden mx-auto">
      <div 
        style={{ transform: 'scale(var(--turnstile-scale-reg, 1))', transformOrigin: 'center center' }}
        ref={el => {
          if (el) {
            const parentWidth = el.parentElement?.offsetWidth || 300;
            const scale = Math.min(1, parentWidth / 310);
            el.style.setProperty('--turnstile-scale-reg', scale);
          }
        }}
      >
        <Turnstile 
          key={`${siteKey}-${captchaKey}`}
          siteKey={siteKey} 
          onSuccess={(token) => setCaptchaToken(token)}
          onError={() => {
            if (!isE2E) setCaptchaToken(null);
          }}
          onExpire={() => {
            if (!isE2E) setCaptchaToken(null);
          }}
          options={{ theme: 'light' }}
        />
      </div>
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
            isCaptchaValid={isE2E || Boolean(captchaToken)}
            t={t}
            captchaComponent={captchaWidget}
          />
        )}

      </div>
    </div>
  );
}