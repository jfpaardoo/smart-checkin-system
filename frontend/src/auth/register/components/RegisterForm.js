import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
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
        
        {/* Correo Electrónico */}
        <div className="flex flex-col w-full text-left md:col-span-2">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.email', 'Correo Electrónico')} <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
            type="email"
            id="email"
            name="email"
            placeholder="ejemplo@empresa.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Nombre */}
        <div className="flex flex-col w-full text-left">
          <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.firstName', 'Nombre')} <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
            type="text"
            id="firstName"
            name="firstName"
            placeholder={t('register.firstNamePlaceholder', 'Tu nombre')}
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Apellidos */}
        <div className="flex flex-col w-full text-left">
          <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.lastName', 'Apellidos')} <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
            type="text"
            id="lastName"
            name="lastName"
            placeholder={t('register.lastNamePlaceholder', 'Tus apellidos')}
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Nombre de Usuario */}
        <div className="flex flex-col w-full text-left">
          <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.username', 'Nombre de Usuario')} <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
            type="text"
            id="username"
            name="username"
            placeholder={t('register.usernamePlaceholder', 'nombredeusuario')}
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        {/* Código Personal */}
        <div className="flex flex-col w-full text-left">
          <label htmlFor="personalCode" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.personalCode', 'Código Personal (4 dígitos)')} <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
            type="text"
            id="personalCode"
            name="personalCode"
            placeholder="1234"
            autoComplete="off"
            maxLength={4}
            value={form.personalCode}
            onChange={handleChange}
            required
          />
        </div>

        {/* Empresa */}
        <div className="flex flex-col w-full text-left md:col-span-1">
          <label 
            htmlFor="companyId" 
            className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1"
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
        <div className="flex flex-col w-full text-left md:col-span-1">
          <label 
            htmlFor="locator" 
            className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1"
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
        <div className="flex flex-col w-full text-left">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.password', 'Contraseña')} <span className="text-rose-500">*</span>
          </label>
          <div className="relative w-full">
            <input
              className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] transition-colors p-1 bg-transparent border-0 cursor-pointer"
              tabIndex="-1"
              aria-label={showPassword ? t('register.hidePasswordVisibility', 'Ocultar contraseña') : t('register.showPasswordVisibility', 'Mostrar contraseña')}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div className="flex flex-col w-full text-left">
          <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t('register.confirmPassword', 'Confirmar Contraseña')} <span className="text-rose-500">*</span>
          </label>
          <div className="relative w-full">
            <input
              className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] transition-colors p-1 bg-transparent border-0 cursor-pointer"
              tabIndex="-1"
              aria-label={showConfirmPassword ? t('register.hidePasswordVisibility', 'Ocultar contraseña') : t('register.showPasswordVisibility', 'Mostrar contraseña')}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Cloudflare Turnstile Captcha */}
        <div className="md:col-span-2 flex flex-col items-center justify-center my-2 p-2 bg-white/20 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-white/10 overflow-hidden w-full">
          {captchaComponent}
        </div>

        {/* Aviso Legal y Aceptación de Términos / Privacidad */}
        <div className="md:col-span-2 text-center my-1 px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-0">
            {t('register.legalNoticePrefix', 'Al solicitar el registro, declaras haber leído y aceptas los')}{' '}
            <Link 
              to="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-[#73841e] dark:text-[#d4e84a] hover:underline"
            >
              {t('register.termsLink', 'Términos y Condiciones')}
            </Link>
            {' '}{t('register.legalNoticeAnd', 'y la')}{' '}
            <Link 
              to="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-[#73841e] dark:text-[#d4e84a] hover:underline"
            >
              {t('register.privacyLink', 'Política de Privacidad')}
            </Link>
            .
          </p>
        </div>

        {/* Botón de Envío */}
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={loading || !isCaptchaValid}
            className="w-full da-btn-primary py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : <FaUserPlus />}
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