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
  const glassInputClass = "w-full px-4 pt-6 pb-2 rounded-2xl border border-white/50 bg-white/60 focus:border-[#b3c34c] focus:bg-white/90 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-colors transition-shadow font-medium text-slate-800 shadow-inner peer";
  const glassLabelClass = "absolute text-sm text-slate-500 transition-transform duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-semibold pointer-events-none";
  const glassButtonClass = "w-full mt-4 py-3.5 rounded-full font-bold text-slate-900 bg-[#b3c34c]/60 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c]/80 hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition duration-300 active:scale-95 flex justify-center items-center gap-2";

  return (
    <div className="p-6 bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] border border-white/60 h-full flex flex-col justify-between">
      <div>
        <h5 className="text-xl font-bold mb-6 flex items-center text-slate-800 drop-shadow-sm">
          <FaLock className="mr-3 text-[#8a9e29] text-2xl" /> 
          {t('profile.changePasswordTitle', 'Modificar Contraseña')}
        </h5>
        
        <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-5">
          {/* Campo username oculto: requerido para accesibilidad y gestores de contraseñas */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={currentUser?.username || ""}
            readOnly
            style={{ display: 'none' }}
          />
          {/* Contraseña Actual */}
          <div className="relative group">
            <input
              className={glassInputClass}
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              placeholder=" "
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
            <label htmlFor="currentPassword" className={glassLabelClass}>
              {t('profile.currentPassword', 'Contraseña Actual')}
            </label>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] transition-colors p-1"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
            >
              {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Nueva Contraseña */}
          <div className="relative group">
            <input
              className={glassInputClass}
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              placeholder=" "
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={6}
            />
            <label htmlFor="newPassword" className={glassLabelClass}>
              {t('profile.newPassword', 'Nueva Contraseña')}
            </label>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] transition-colors p-1"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
            >
              {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Repetir Nueva Contraseña */}
          <div className="relative group">
            <input
              className={glassInputClass}
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder=" "
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
            <label htmlFor="confirmPassword" className={glassLabelClass}>
              {t('profile.confirmNewPassword', 'Repetir Nueva Contraseña')}
            </label>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#b3c34c] transition-colors p-1"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={t('common.togglePasswordVisibility', 'Mostrar/Ocultar contraseña')}
            >
              {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submittingPassword}
            className={`${glassButtonClass} disabled:opacity-50`}
          >
            {submittingPassword ? "..." : (
              <>
                <FaKey className="text-lg" /> {t('profile.updatePasswordBtn', 'Actualizar Contraseña')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
