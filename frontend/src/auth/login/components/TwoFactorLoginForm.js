import React, { useState } from "react";
import { FaShieldAlt } from "react-icons/fa";

export default function TwoFactorLoginForm({
  username2FA,
  loading,
  onVerify,
  t,
  glassButtonClass
}) {
  const [totpCode, setTotpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(totpCode, useBackupCode);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <FaShieldAlt className="text-4xl text-[#b3c34c] mx-auto mb-3 drop-shadow-sm" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">{t('login.twoFactorHeader', 'Verificación en dos pasos')}</h2>
        <p className="text-sm text-slate-600">
          {t('login.twoFactorPrompt', 'Autenticación de Doble Factor (2FA) requerida para')} <strong className="text-slate-800">{username2FA}</strong>
        </p>
      </div>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="totpCode" className="text-sm font-semibold text-slate-700 ml-1 flex justify-between items-center">
          <span>{useBackupCode ? 'Código de Recuperación (8 caracteres)' : t('login.totpCodeLabel', 'Código de 6 dígitos')}</span>
          <button
            type="button"
            onClick={() => { setUseBackupCode(!useBackupCode); setTotpCode(""); }}
            className="text-xs text-[#73841e] hover:underline font-normal"
          >
            {useBackupCode ? 'Usar código de app / email' : 'Usar código de recuperación'}
          </button>
        </label>
        <input
          type="text"
          inputMode={useBackupCode ? "text" : "numeric"}
          maxLength={useBackupCode ? 9 : 6}
          id="totpCode"
          placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
          value={totpCode}
          onChange={(e) => {
            if (useBackupCode) {
              setTotpCode(e.target.value.toUpperCase());
            } else {
              setTotpCode(e.target.value.replace(/\D/g, ""));
            }
          }}
          required
          className="w-full text-center text-3xl tracking-[0.4rem] py-4 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition font-mono text-slate-800 shadow-inner"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className={`${glassButtonClass} disabled:opacity-50`}
      >
        {loading && t('common.loading', 'Verificando...')}
        {!loading && useBackupCode && 'Acceder con Código'}
        {!loading && !useBackupCode && t('login.verifyAndEnter', 'Verificar y Acceder')}
      </button>
    </form>
  );
}
