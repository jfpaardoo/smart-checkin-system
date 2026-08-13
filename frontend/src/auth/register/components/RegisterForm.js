import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import { Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';

export default function RegisterForm({ form, handleChange, handleSubmit, loading, t }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        
        {/* Email */}
        <div className="relative md:col-span-2">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
            type="email"
            id="email"
            name="email"
            placeholder="Correo Electrónico"
            value={form.email}
            onChange={handleChange}
            required
          />
          <label 
            htmlFor="email" 
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.email', 'Correo Electrónico')}
          </label>
        </div>

        {/* Nombre */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
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
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.firstName', 'Nombre')}
          </label>
        </div>

        {/* Apellidos */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
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
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.lastName', 'Apellidos')}
          </label>
        </div>

        {/* Nombre de Usuario */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
            type="text"
            id="username"
            name="username"
            placeholder="Nombre de Usuario"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <label 
            htmlFor="username" 
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.username', 'Nombre de Usuario')}
          </label>
        </div>

        {/* Código Personal */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
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
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.personalCode', 'Código Personal (4 dígitos)')}
          </label>
        </div>

        {/* Contraseña */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            placeholder="Contraseña"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <label 
            htmlFor="password" 
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.password', 'Contraseña')}
          </label>
          <button
            type="button"
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={t('common.togglePassword', 'Mostrar/Ocultar contraseña')}
          >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        {/* Repetir Contraseña */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
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
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.confirmPassword', 'Repetir Contraseña')}
          </label>
          <button
            type="button"
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={t('common.togglePassword', 'Mostrar/Ocultar contraseña')}
          >
            {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        {/* Contenedor del Botón (Ocupa 2 columnas en PC) */}
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-slate-900 bg-[#b3c34c]/60 hover:bg-[#b3c34c]/80 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_20px_rgba(179,195,76,0.3)] transition duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" className="me-2" /> : <FaUserPlus className="me-2" />}
            {t('register.submitBtn', 'Enviar Solicitud de Registro')}
          </button>
        </div>

        {/* Enlace para ir al Login */}
        <div className="text-center md:col-span-2">
          <span className="text-xs text-slate-500">{t('register.alreadyHaveAccount', '¿Ya tienes cuenta activa?')} </span>
          <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-slate-900 underline decoration-[#b3c34c] decoration-2 underline-offset-4">
            {t('register.loginHere', 'Iniciar Sesión')}
          </Link>
        </div>

      </form>
    </div>
  );
}
