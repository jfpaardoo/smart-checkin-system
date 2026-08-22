import React from "react";
import { FaLock, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import tokenService from "../../../services/token.service";

export default function PasswordChangeCard({
  passwordForm,
  setPasswordForm,
  handlePasswordChangeSubmit,
  submittingPassword,
  t,
}) {
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const currentUser = tokenService.getUser();

  return (
    <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl rounded-3xl border border-white/60 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/40 dark:border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center shrink-0 shadow-2xs">
            <FaLock size={18} className="text-[#73841e] dark:text-[#d4e84a]" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg m-0 leading-tight">
              {t('profile.changePasswordTitle', 'Modificar Contraseña')}
            </h2>
          </div>
        </div>
        
        <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={currentUser?.username || ""}
            readOnly
            style={{ display: 'none' }}
          />

          {/* Contraseña Actual */}
          <div className="flex flex-col w-full text-left">
            <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              {t('profile.currentPassword', 'Contraseña Actual')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] transition-colors p-1 bg-transparent border-0 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
              >
                {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="flex flex-col w-full text-left">
            <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              {t('profile.newPassword', 'Nueva Contraseña')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] transition-colors p-1 bg-transparent border-0 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
              >
                {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* Repetir Nueva Contraseña */}
          <div className="flex flex-col w-full text-left">
            <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              {t('profile.confirmNewPassword', 'Repetir Nueva Contraseña')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] transition-colors p-1 bg-transparent border-0 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingPassword}
            className="da-btn-primary w-full mt-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer border-0 disabled:opacity-50"
          >
            {submittingPassword ? "..." : (
              <>
                <FaKey className="text-base" />
                <span>{t('profile.updatePasswordBtn', 'Actualizar Contraseña')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
