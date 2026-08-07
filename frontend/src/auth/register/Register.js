import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { Spinner } from 'reactstrap';
import { useToast } from '../../components/ToastProvider';
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
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-100 via-white to-slate-200">
      
      {/* Tarjeta con efecto Glassmorphic profundo */}
      <div className="w-full max-w-lg bg-white/55 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] p-8 sm:p-10 transition-all duration-300">
        
        {submittedSuccess ? (
          /* Pantalla de Éxito Centrada y Limpia */
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div 
              className="inline-flex items-center justify-center p-5 rounded-full mb-5 shadow-sm" 
              style={{ background: 'rgba(179, 195, 76, 0.2)', color: '#8fa228' }}
            >
              <FaCheckCircle className="text-5xl" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {t('register.receivedTitle', '¡Solicitud Enviada!')}
            </h3>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed max-w-sm">
              {t('register.receivedDesc', 'Tu solicitud ha sido registrada correctamente. Un administrador la revisará y activará tu perfil para que puedas iniciar sesión.')}
            </p>
            
            {/* BOTÓN CON LIQUID GLASS MEJORADO */}
            <Link 
              to="/login" 
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-slate-900 bg-[#b3c34c]/60 hover:bg-[#b3c34c]/80 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_20px_rgba(179,195,76,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 no-underline"
            >
              {t('register.goToLogin', 'Volver al Inicio de Sesión')}
            </Link>
          </div>
        ) : (
          /* Formulario de Registro */
          <div>
            <div className="text-center mb-6">
              <div 
                className="inline-flex items-center justify-center p-4 rounded-full mb-3 shadow-sm" 
                style={{ background: 'rgba(179, 195, 76, 0.2)', color: '#8fa228' }}
              >
                <FaUserPlus className="text-2xl" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                {t('register.title', 'Solicitud de Registro')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {t('register.subtitle', 'Introduce tus datos de empleado para solicitar acceso a la plataforma')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nombre */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Nombre"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                <label 
                  htmlFor="firstName" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.firstName', 'Nombre')}
                </label>
              </div>

              {/* Apellidos */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Apellidos"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
                <label 
                  htmlFor="lastName" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.lastName', 'Apellidos')}
                </label>
              </div>

              {/* Nombre de Usuario */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Nombre de Usuario"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
                <label 
                  htmlFor="username" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.username', 'Nombre de Usuario')}
                </label>
              </div>

              {/* Código Personal */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type="text"
                  id="personalCode"
                  name="personalCode"
                  placeholder="Código Personal"
                  maxLength={4}
                  value={form.personalCode}
                  onChange={handleChange}
                  required
                />
                <label 
                  htmlFor="personalCode" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.personalCode', 'Código Personal (4 dígitos)')}
                </label>
              </div>

              {/* Contraseña */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <label 
                  htmlFor="password" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.password', 'Contraseña')}
                </label>
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {/* Repetir Contraseña */}
              <div className="relative">
                <input
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition-all shadow-sm placeholder-transparent peer"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Repetir Contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <label 
                  htmlFor="confirmPassword" 
                  className="absolute left-4 top-3 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
                >
                  {t('register.confirmPassword', 'Repetir Contraseña')}
                </label>
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {/* Botón de Enviar con Liquid Glass */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-slate-900 bg-[#b3c34c]/60 hover:bg-[#b3c34c]/80 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_20px_rgba(179,195,76,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Spinner size="sm" className="me-2" /> : <FaUserPlus className="me-2" />}
                {t('register.submitBtn', 'Enviar Solicitud de Registro')}
              </button>

              {/* Enlace para ir al Login */}
              <div className="text-center mt-4">
                <span className="text-xs text-slate-500">{t('register.alreadyHaveAccount', '¿Ya tienes cuenta activa?')} </span>
                <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-slate-900 underline decoration-[#b3c34c] decoration-2 underline-offset-4">
                  {t('register.loginHere', 'Iniciar Sesión')}
                </Link>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}