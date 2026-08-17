import React from "react";
import { FaShieldAlt, FaCopy, FaCheckCircle, FaDownload } from "react-icons/fa";

export default function TwoFactorBackupCodesView({
  backupCodes,
  copiedCodes,
  onCopy,
  onDownload,
  onFinish,
  t,
  glassButtonClass,
  glassButtonPrimarySmallClass,
  glassButtonSecondaryClass
}) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-start">
        <p className="font-bold text-amber-800 text-sm flex items-center gap-2 m-0 mb-1">
          <FaShieldAlt className="text-amber-600" />
          {t('profile.backupCodesKeepSafe', 'Guarda tus códigos de recuperación')}
        </p>
        <p className="text-xs text-amber-700 m-0">
          {t('profile.backupCodesKeepSafeDesc', 'Si pierdes acceso a tu aplicación o correo de autenticación, estos códigos te permitirán acceder a tu cuenta. Cada código es de un solo uso.')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-inner">
        {backupCodes.map((code) => (
          <div 
            key={code} 
            className="font-mono text-sm tracking-wider font-bold py-2 px-3 bg-slate-100/90 text-slate-800 rounded-xl border border-slate-200/60 select-all"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className={`${glassButtonPrimarySmallClass} flex-1`}
        >
          {copiedCodes ? <FaCheckCircle className="text-green-700" /> : <FaCopy />}
          {copiedCodes ? t('profile.copied', 'Copiados') : t('profile.copyAll', 'Copiar todos')}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={`${glassButtonSecondaryClass} !py-2.5 !px-4 !rounded-xl !text-sm flex-1`}
        >
          <FaDownload />
          {t('profile.downloadTxt', 'Descargar .txt')}
        </button>
      </div>

      <button
        type="button"
        onClick={onFinish}
        className={`${glassButtonClass} !mt-2`}
      >
        {t('profile.backupCodesSavedConfirmation', 'He guardado mis códigos')}
      </button>
    </div>
  );
}
