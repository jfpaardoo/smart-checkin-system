import React from "react";
import { QRCodeSVG } from "qrcode.react";
import GlassDropdown from "../../../components/GlassDropdown";

export function TwoFactorSetupStart({
  selectedType,
  setSelectedType,
  onStartSetup,
  loading2FA,
  t,
  glassButtonClass
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-600 text-sm mb-2">
        {t('profile.twoFactorProtectPrompt', 'Protege tu cuenta activando la verificación en dos pasos.')}
      </p>
      
      <div className="flex flex-col gap-2 mb-2">
        <label htmlFor="verificationType" className="text-sm font-semibold text-slate-700 ml-1">
          {t('profile.twoFactorMethod', 'Método de Verificación')}
        </label>
        <GlassDropdown
          options={[
            { value: "APP", label: t('profile.twoFactorAppOption', 'App de Autenticación (Google Auth, Authy)') },
            { value: "EMAIL", label: t('profile.twoFactorEmailOption', 'Correo Electrónico') }
          ]}
          value={selectedType}
          onChange={(val) => setSelectedType(val)}
          placeholder={t('profile.twoFactorMethodSelect', 'Seleccionar Método')}
          className="w-full text-slate-700"
        />
      </div>

      <button type="button"
        className={glassButtonClass} 
        onClick={onStartSetup} 
        disabled={loading2FA}
      >
        {loading2FA ? "..." : t('profile.setup2FA', 'Configurar 2FA')}
      </button>
    </div>
  );
}

export function TwoFactorSetupVerify({
  setupData,
  verificationCode,
  setVerificationCode,
  onConfirmEnable,
  onCancel,
  loading2FA,
  t,
  glassButtonClass,
  glassButtonSecondaryClass
}) {
  return (
    <div className="text-center flex flex-col gap-4">
      {setupData.type === 'APP' ? (
        <>
          <p className="font-bold text-sm text-slate-700">
            {t('profile.twoFactorStep1', '1. Escanea este código QR con tu app de autenticación:')}
          </p>
          <div className="bg-white p-4 inline-block rounded-2xl shadow-sm mx-auto border border-gray-100">
            <QRCodeSVG value={setupData.qrUri} size={150} />
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {t('profile.twoFactorSecretManual', 'O introduce la clave secreta manualmente:')} <br />
            <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono mt-1 inline-block">{setupData.secret}</code>
          </p>
        </>
      ) : (
        <>
          <p className="font-bold text-sm text-slate-700">
            {t('profile.twoFactorCheckInbox', 'Revisa tu bandeja de entrada')}
          </p>
          <p className="text-slate-500 text-xs">
            {t('profile.twoFactorCodeSentEmail', 'Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico.')}
          </p>
        </>
      )}
      
      <form onSubmit={onConfirmEnable} className="mx-auto w-full mt-2">
        <div className="mb-4 text-start flex flex-col gap-2">
          <label htmlFor="verificationCode" className="text-sm font-semibold text-slate-700 ml-1">
            {setupData.type === 'APP' ? '2. ' : ''}{t('profile.twoFactorEnterCode', 'Introduce el código de 6 dígitos:')}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            id="verificationCode"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            required
            className="w-full text-center text-3xl tracking-[0.5rem] py-4 rounded-2xl border border-white/50 bg-white/60 focus:border-[#b3c34c] focus:bg-white/90 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition font-mono text-slate-800 shadow-inner"
          />
        </div>
        <div className="flex gap-3 justify-center">
          <button 
            className={`${glassButtonSecondaryClass} !py-3.5`} 
            type="button" 
            onClick={onCancel}
          >
            {t('profile.cancel', 'Cancelar')}
          </button>
          <button 
            className={`${glassButtonClass} !mt-0`} 
            type="submit" 
            disabled={loading2FA}
          >
            {t('profile.confirmAndEnable', 'Confirmar')}
          </button>
        </div>
      </form>
    </div>
  );
}
