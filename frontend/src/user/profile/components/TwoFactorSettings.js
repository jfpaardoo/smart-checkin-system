import React, { useState } from "react";
import { FaShieldAlt } from "react-icons/fa";
import GlassDropdown from "../../../components/GlassDropdown";
import { QRCodeSVG } from "qrcode.react";
import tokenService from "../../../services/token.service";

export default function TwoFactorSettings({ userData, setUserData, t, toast }) {
  const jwt = tokenService.getLocalAccessToken();

  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [selectedType, setSelectedType] = useState("APP");
  
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const handleStartSetup = async () => {
    setLoading2FA(true);
    try {
      const res = await fetch(`/api/v1/users/2fa/setup?type=${selectedType}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSetupData({ ...data, type: selectedType });
        if (selectedType === 'EMAIL') {
          toast.info(t('profile.emailSentCode', "Te hemos enviado un correo con el código de confirmación."));
        }
      } else {
        toast.error(data.message || t('profile.twoFactorSetupError', 'Error al iniciar configuración 2FA.'));
      }
    } catch (err) {
      toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirmEnable = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error(t('profile.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }

    setLoading2FA(true);
    try {
      const res = await fetch("/api/v1/users/2fa/enable", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: verificationCode, type: setupData.type })
      });
      if (res.ok) {
        setUserData({ ...userData, twoFactorEnabled: true, twoFactorType: setupData.type });
        setSetupData(null);
        setVerificationCode("");
        toast.success(t('profile.twoFactorEnableSuccess', '¡Autenticación de Doble Factor activada con éxito!'));
      } else {
        const data = await res.json();
        toast.error(data.message || t('profile.incorrectCode', 'Código incorrecto.'));
      }
    } catch (err) {
      toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast.error(t('profile.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/v1/users/2fa/disable", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: disableCode })
      });
      if (res.ok) {
        setUserData({ ...userData, twoFactorEnabled: false, twoFactorType: null });
        setShowDisablePrompt(false);
        setDisableCode("");
        toast.success(t('profile.twoFactorDisableSuccess', '2FA desactivado correctamente.'));
      } else {
        const data = await res.json();
        toast.error(data.message || t('profile.incorrectCode', 'Código incorrecto.'));
      }
    } catch (err) {
      toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setLoading2FA(false);
    }
  };

  const glassButtonClass = "w-full mt-2 py-3.5 rounded-full font-bold text-slate-900 bg-[#b3c34c]/60 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c]/80 hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition duration-300 active:scale-95 flex justify-center items-center gap-2";
  const glassButtonDangerClass = "w-full py-3 rounded-2xl font-bold text-white bg-red-500/80 backdrop-blur-md border border-red-400/50 shadow-[0_8px_25px_0_rgba(239,68,68,0.35)] hover:bg-red-600/90 hover:shadow-[0_8px_30px_0_rgba(239,68,68,0.55)] transition duration-300 active:scale-95 flex justify-center items-center gap-2";
  const glassButtonSecondaryClass = "w-full py-3 rounded-2xl font-bold text-slate-700 bg-slate-200/60 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(148,163,184,0.25)] hover:bg-slate-300/80 hover:shadow-[0_8px_30px_0_rgba(148,163,184,0.45)] transition duration-300 active:scale-95 flex justify-center items-center gap-2";

  const renderActiveState = () => (
    <div className="flex flex-col gap-4">
      <div className="bg-green-100/50 border border-green-200 rounded-2xl p-4">
        <p className="text-green-700 font-bold text-sm m-0">
          {t('profile.twoFactorActive', 'El doble factor está actualmente activado en tu cuenta.')} 
          ({userData.twoFactorType === 'EMAIL' ? 'Correo Electrónico' : 'App de Autenticación'})
        </p>
      </div>
      
      {!showDisablePrompt ? (
        <button type="button"
          className={glassButtonDangerClass} 
          onClick={() => setShowDisablePrompt(true)}
        >
          {t('profile.disable2FA', 'Desactivar 2FA')}
        </button>
      ) : (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border border-white mt-2 shadow-inner">
          <label htmlFor="disableCode" className="font-bold mb-3 text-sm text-slate-700 block">
            {t('profile.disable2FAPrompt', 'Introduce el código 2FA para confirmar desactivación:')}
          </label>
          <div className="mb-4">
            <input 
              id="disableCode"
              type="text" 
              placeholder="000000"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.4rem] py-3 rounded-xl border border-white/50 bg-white/60 focus:border-red-400 focus:bg-white/90 focus:ring-4 focus:ring-red-400/20 outline-none transition font-mono text-slate-800 shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button type="button"
              className={glassButtonSecondaryClass} 
              onClick={() => { setShowDisablePrompt(false); setDisableCode(""); }}
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button type="button"
              className={glassButtonDangerClass} 
              onClick={handleDisable} 
              disabled={disableCode.length !== 6 || loading2FA}
            >
              {loading2FA ? "..." : t('common.confirm', 'Confirmar')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSetupStart = () => (
    <div className="flex flex-col gap-4">
      <p className="text-slate-600 text-sm mb-2">
        Protege tu cuenta activando la verificación en dos pasos.
      </p>
      
      <div className="flex flex-col gap-2 mb-2">
        <label htmlFor="verificationType" className="text-sm font-semibold text-slate-700 ml-1">Método de Verificación</label>
        <GlassDropdown
          options={[
            { value: "APP", label: "App de Autenticación (Google Auth, Authy)" },
            { value: "EMAIL", label: "Correo Electrónico" }
          ]}
          value={selectedType}
          onChange={(val) => setSelectedType(val)}
          placeholder="Seleccionar Método"
          className="w-full text-slate-700"
        />
      </div>

      <button type="button"
        className={glassButtonClass} 
        onClick={handleStartSetup} 
        disabled={loading2FA}
      >
        {loading2FA ? "..." : t('profile.setup2FA', 'Configurar 2FA')}
      </button>
    </div>
  );

  const renderSetupVerify = () => (
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
            Revisa tu bandeja de entrada
          </p>
          <p className="text-slate-500 text-xs">
            Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico.
          </p>
        </>
      )}
      
      <form onSubmit={handleConfirmEnable} className="mx-auto w-full mt-2">
        <div className="mb-4 text-start flex flex-col gap-2">
          <label htmlFor="verificationCode" className="text-sm font-semibold text-slate-700 ml-1">
            {setupData.type === 'APP' ? '2.' : ''} Introduce el código de 6 dígitos:
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
            onClick={() => setSetupData(null)}
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

  const renderContent = () => {
    if (userData?.twoFactorEnabled) {
      return renderActiveState();
    }
    if (!setupData) {
      return renderSetupStart();
    }
    return renderSetupVerify();
  };

  return (
    <div className="p-6 bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] border border-white/60 mb-6 h-full flex flex-col justify-between">
      <div>
        <h5 className="text-xl font-bold mb-4 flex items-center text-slate-800 drop-shadow-sm">
          <FaShieldAlt className="mr-3 text-[#8a9e29] text-2xl" /> 
          {t('profile.twoFactorTitle', 'Autenticación de Doble Factor (2FA)')}
        </h5>

        {renderContent()}
      </div>
    </div>
  );
}
