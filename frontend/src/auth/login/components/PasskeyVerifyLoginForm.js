import React from "react";
import PropTypes from "prop-types";
import { FaFingerprint, FaKey, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

export default function PasskeyVerifyLoginForm({
  username,
  loading,
  onVerify,
  canFallbackTo2FA,
  onFallbackTo2FA,
  onCancel,
  t,
  glassButtonClass
}) {
  return (
    <div className="flex flex-col gap-5 text-center">
      <div>
        <div className="w-16 h-16 rounded-3xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center mx-auto mb-3 text-[#73841e] dark:text-[#d4e84a] text-3xl shadow-inner">
          <FaFingerprint />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          {t('login.passkeyRequiredHeader', 'Verificación de Llave de Acceso')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 m-0 max-w-sm mx-auto leading-relaxed">
          {t('login.passkeyRequiredPrompt', 'Tu cuenta tiene configurada una Llave de Acceso (Passkey). Por seguridad, verifica tu identidad en este dispositivo para entrar como')} <strong className="text-slate-800 dark:text-slate-100">{username}</strong>.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 text-left">
        <p className="m-0 leading-relaxed">
          {t('login.passkeyVerificationHint', 'Pulsa en el botón inferior para activar Touch ID, Face ID, Windows Hello o tu llave de seguridad USB.')}
        </p>
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={loading}
        className={`${glassButtonClass} disabled:opacity-50`}
      >
        <FaKey className="text-sm" />
        <span>{loading ? t('passkeys.registering', 'Verificando...') : t('login.verifyPasskeyBtn', 'Verificar con Llave de Acceso')}</span>
      </button>

      <div className="flex flex-col gap-2 pt-1">
        {canFallbackTo2FA && (
          <button
            type="button"
            onClick={onFallbackTo2FA}
            disabled={loading}
            className="text-xs text-[#73841e] dark:text-[#d4e84a] hover:underline font-semibold flex items-center justify-center gap-1.5 border-0 bg-transparent cursor-pointer"
          >
            <FaShieldAlt className="text-[11px]" />
            <span>{t('login.use2FAInstead', '¿No tienes tu llave? Usar código de verificación 2FA')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 border-0 bg-transparent cursor-pointer pt-1"
        >
          <FaArrowLeft className="text-[10px]" />
          <span>{t('login.backToLogin', 'Volver al inicio de sesión')}</span>
        </button>
      </div>
    </div>
  );
}

PasskeyVerifyLoginForm.propTypes = {
  username: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onVerify: PropTypes.func.isRequired,
  canFallbackTo2FA: PropTypes.bool,
  onFallbackTo2FA: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  glassButtonClass: PropTypes.string
};
