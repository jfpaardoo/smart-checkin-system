import React, { useState } from 'react';
import { Form, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { useToast } from '../../components/ToastProvider';
import '../../App.css';
import '../../components/formGenerator/css/formGenerator.css';
import '../../static/css/auth/authPage.css';
import '../../static/css/admin/adminPage.css';

export default function Register() {
  const { t } = useTranslation();
  const toast = useToast();

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    personalCode: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'personalCode') {
      const numeric = value.replace(/\D/g, '');
      if (numeric.length <= 4) {
        setForm({ ...form, personalCode: numeric });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          personalCode: form.personalCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
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

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-3 fs-3" style={{ background: 'rgba(179, 195, 76, 0.15)', color: 'var(--ba-dark)' }}>
            <FaUserPlus />
          </div>
          <h2 className="fw-bold text-dark mb-1">{t('register.title', 'Solicitud de Registro')}</h2>
          <p className="text-muted small">
            {t('register.subtitle', 'Introduce tus datos de empleado para solicitar acceso a la plataforma')}
          </p>
        </div>

              {submittedSuccess ? (
                <div className="text-center py-4">
                  <FaCheckCircle className="text-success display-3 mb-3" />
                  <h4 className="fw-bold text-dark mb-2">{t('register.receivedTitle', '¡Solicitud Enviada!')}</h4>
                  <p className="text-muted mb-4">
                    {t('register.receivedDesc', 'Tu solicitud ha sido registrada correctamente. Un administrador la revisará y activará tu perfil para que puedas iniciar sesión.')}
                  </p>
                  <Button className="ba-btn-primary w-100" tag={Link} to="/login">
                    {t('register.goToLogin', 'Volver al Inicio de Sesión')}
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <div className="class-form-group mb-3">
                    <input
                      className="class-form-input"
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder=" "
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="firstName" className="class-form-label">
                      {t('register.firstName', 'Nombre')}
                    </label>
                  </div>

                  <div className="class-form-group mb-3">
                    <input
                      className="class-form-input"
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder=" "
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="lastName" className="class-form-label">
                      {t('register.lastName', 'Apellidos')}
                    </label>
                  </div>

                  <div className="class-form-group mb-3">
                    <input
                      className="class-form-input"
                      type="text"
                      id="username"
                      name="username"
                      placeholder=" "
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="username" className="class-form-label">
                      {t('register.username', 'Nombre de Usuario')}
                    </label>
                  </div>

                  <div className="class-form-group mb-3">
                    <input
                      className="class-form-input"
                      type="text"
                      id="personalCode"
                      name="personalCode"
                      placeholder=" "
                      maxLength={4}
                      value={form.personalCode}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="personalCode" className="class-form-label">
                      {t('register.personalCode', 'Código Personal (4 dígitos)')}
                    </label>
                  </div>

                  <div className="class-form-group mb-3 position-relative">
                    <input
                      className="class-form-input pe-5"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder=" "
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <label htmlFor="password" className="class-form-label">
                      {t('register.password', 'Contraseña')}
                    </label>
                    <button
                      type="button"
                      className="password-eye-btn text-secondary me-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>

                  <div className="class-form-group mb-4 position-relative">
                    <input
                      className="class-form-input pe-5"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder=" "
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <label htmlFor="confirmPassword" className="class-form-label">
                      {t('register.confirmPassword', 'Repetir Contraseña')}
                    </label>
                    <button
                      type="button"
                      className="password-eye-btn text-secondary me-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>

                  <Button className="ba-btn-primary w-100 py-3 mb-3 fw-bold" type="submit" disabled={loading}>
                    {loading ? <Spinner size="sm" className="me-2" /> : <FaUserPlus className="me-2" />}
                    {t('register.submitBtn', 'Enviar Solicitud de Registro')}
                  </Button>

                  <div className="text-center mt-3">
                    <span className="text-muted small">{t('register.alreadyHaveAccount', '¿Ya tienes cuenta activa?')} </span>
                    <Link to="/login" className="fw-bold text-primary text-decoration-none">
                      {t('register.loginHere', 'Iniciar Sesión')}
                    </Link>
                  </div>
                </Form>
              )}
      </div>
    </div>
  );
}