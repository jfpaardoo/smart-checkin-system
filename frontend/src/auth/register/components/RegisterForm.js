import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import { Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import GlassDropdown from '../../../components/GlassDropdown';

const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

export default function RegisterForm({ form, companies = [], handleChange, handleSubmit, loading, isCaptchaValid, t, captchaComponent }) {
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
            placeholder=" "
            autoComplete="email"
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
            placeholder=" "
            autoComplete="given-name"
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
            placeholder=" "
            autoComplete="family-name"
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
            placeholder=" "
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
            placeholder=" "
            autoComplete="off"
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

        {/* Empresa */}
        <div className="relative md:col-span-1">
          <label 
            htmlFor="companyId" 
            className="block text-[11px] font-semibold text-slate-500 mb-1.5 ms-1"
          >
            {t('register.company', 'Empresa / Centro de Trabajo')}
          </label>
          <GlassDropdown
            options={[
              { value: '', label: t('register.selectCompany', '-- Selecciona tu Empresa --') },
              ...companies.map((comp) => ({
                value: comp.id,
                label: comp.name
              }))
            ]}
            value={form.companyId || ''}
            onChange={(val) => handleChange({ target: { name: 'companyId', value: val } })}
            placeholder={t('register.selectCompany', '-- Selecciona tu Empresa --')}
            searchable={companies.length > 3}
            className="w-full"
          />
        </div>

        {/* Localizador del Usuario */}
        <div className="relative md:col-span-1">
          <label 
            htmlFor="locator" 
            className="block text-[11px] font-semibold text-slate-500 mb-1.5 ms-1"
          >
            {t('register.locator', 'Localizador / Sede')}
          </label>
          <GlassDropdown
            options={[
              { value: '', label: t('register.noLocator', '-- Sin Localizador --') },
              ...PREDEFINED_LOCATORS.map((loc) => ({ value: loc, label: `Sede ${loc}` }))
            ]}
            value={form.locator || ''}
            onChange={(val) => handleChange({ target: { name: 'locator', value: val } })}
            placeholder={t('register.selectLocator', '-- Selecciona tu Localizador --')}
            searchable={true}
            className="w-full"
          />
        </div>

        {/* Contraseña */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            placeholder=" "
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
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
            tabIndex="-1"
            aria-label={showPassword ? t('register.hidePasswordVisibility', 'Ocultar contraseña') : t('register.showPasswordVisibility', 'Mostrar contraseña')}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Confirmar Contraseña */}
        <div className="relative">
          <input
            className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-4 pt-5 pb-2 pe-12 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm placeholder-transparent peer"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            placeholder=" "
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
          <label 
            htmlFor="confirmPassword" 
            className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#8fa228] pointer-events-none"
          >
            {t('register.confirmPassword', 'Confirmar Contraseña')}
          </label>
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
            tabIndex="-1"
            aria-label={showConfirmPassword ? t('register.hidePasswordVisibility', 'Ocultar contraseña') : t('register.showPasswordVisibility', 'Mostrar contraseña')}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Cloudflare Turnstile Captcha */}
        <div className="md:col-span-2 flex flex-col items-center justify-center my-2 p-2 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden w-full">
          {captchaComponent}
        </div>

        {/* Botón de Envío */}
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={loading || !isCaptchaValid}
            className="w-full da-btn-primary py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner size="sm" /> : <FaUserPlus />}
            <span>{loading ? t('register.sending', 'Enviando...') : t('register.submit', 'Solicitar Registro')}</span>
          </button>
        </div>

      </form>

      <div className="text-center mt-6 pt-4 border-t border-white/40">
        <p className="text-xs text-slate-500 mb-0">
          {t('register.alreadyHaveAccount', '¿Ya tienes una cuenta activada?')}{' '}
          <Link to="/login" className="font-bold text-[#8fa228] hover:underline">
            {t('register.loginLink', 'Inicia Sesión')}
          </Link>
        </p>
      </div>
    </div>
  );
}