import React, { useState } from "react";
import { FaShieldAlt, FaRedo } from "react-icons/fa";
import api from "../../../services/api";
import TwoFactorBackupCodesView from "./TwoFactorBackupCodesView";
import { TwoFactorSetupStart, TwoFactorSetupVerify } from "./TwoFactorSetupStep";

export default function TwoFactorSettings({ userData, setUserData, t, toast }) {
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [selectedType, setSelectedType] = useState("APP");
  
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const [backupCodes, setBackupCodes] = useState(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleStartSetup = async () => {
    setLoading2FA(true);
    try {
      const res = await api.post(`/users/2fa/setup?type=${selectedType}`);
      const data = res.data;
      setSetupData({ ...data, type: selectedType });
      if (selectedType === 'EMAIL') {
        toast.info(t('profile.emailSentCode', "Te hemos enviado un correo con el código de confirmación."));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.twoFactorSetupError', 'Error al iniciar configuración 2FA.');
      toast.error(msg);
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
      const res = await api.post("/users/2fa/enable", { code: verificationCode, type: setupData.type });
      setUserData({ ...userData, twoFactorEnabled: true, twoFactorType: setupData.type });
      setSetupData(null);
      setVerificationCode("");
      if (res.data?.backupCodes?.length > 0) {
        setBackupCodes(res.data.backupCodes);
      }
      toast.success(t('profile.twoFactorEnabledSuccess', 'Autenticación en dos pasos activada con éxito.'));
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.twoFactorInvalidCode', 'Código inválido o expirado.');
      toast.error(msg);
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
      await api.post("/users/2fa/disable", { code: disableCode });
      setUserData({ ...userData, twoFactorEnabled: false, twoFactorType: null });
      setShowDisablePrompt(false);
      setDisableCode("");
      toast.success(t('profile.twoFactorDisabledSuccess', 'Autenticación en dos pasos desactivada.'));
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.twoFactorDisableError', 'Código incorrecto. No se pudo desactivar 2FA.');
      toast.error(msg);
    } finally {
      setLoading2FA(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const code = window.prompt(t('profile.enter2FACodeToRegenerate', 'Introduce tu código 2FA de 6 dígitos para generar nuevos códigos de recuperación:'));
    if (code?.trim().length !== 6) {
      if (code !== null) toast.error(t('profile.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    setLoading2FA(true);
    try {
      const res = await api.post("/users/2fa/backup-codes/regenerate", { code: code.trim() });
      if (res.data?.backupCodes?.length > 0) {
        setBackupCodes(res.data.backupCodes);
        toast.success(t('profile.backupCodesRegenerated', 'Nuevos códigos de recuperación generados con éxito.'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.backupCodesRegenerateError', 'Error al regenerar códigos. Verifica tu código 2FA.');
      toast.error(msg);
    } finally {
      setLoading2FA(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (!backupCodes) return;
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    toast.success(t('profile.backupCodesCopied', 'Códigos de recuperación copiados al portapapeles.'));
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes) return;
    const text = `DISTRIBUTION ACADEMY - CÓDIGOS DE RECUPERACIÓN (2FA)\nGenerados el: ${new Date().toLocaleString()}\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nGuarda estos códigos en un lugar seguro. Cada uno solo puede usarse una vez.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-codes-distribution-academy-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const glassButtonClass = "da-btn-primary w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer border-0";
  const glassButtonDangerClass = "w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all active:scale-98 text-center flex items-center justify-center gap-2 cursor-pointer border-0";
  const glassButtonSecondaryClass = "py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 border border-white/60 dark:border-white/10 shadow-xs transition-all active:scale-98 text-center flex items-center justify-center gap-2 cursor-pointer";
  const glassButtonPrimarySmallClass = "da-btn-primary py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 shadow-xs transition-all active:scale-98 text-center flex items-center justify-center gap-1.5 cursor-pointer border-0";

  const renderActiveState = () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
          ✓
        </div>
        <div>
          <h6 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0">
            {t('profile.twoFactorActive', '2FA está actualmente activado')}
          </h6>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-0">
            {t('profile.twoFactorMethodLabel', 'Método:')} <strong className="text-slate-700 dark:text-slate-200">{userData.twoFactorType === 'EMAIL' ? t('profile.twoFactorEmailOption', 'Correo Electrónico') : t('profile.twoFactorAppOption', 'App de Autenticación')}</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button type="button"
          className={`${glassButtonPrimarySmallClass} flex-1`}
          onClick={handleRegenerateBackupCodes}
          disabled={loading2FA}
        >
          <FaRedo size={12} />
          <span>{t('profile.regenerateBackupCodes', 'Regenerar Códigos')}</span>
        </button>
        <button type="button"
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer border-0 bg-transparent"
          onClick={() => setShowDisablePrompt(true)}
          disabled={loading2FA}
        >
          {t('profile.disable2FA', 'Desactivar 2FA')}
        </button>
      </div>

      {showDisablePrompt && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-3">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-0">
            {t('profile.disablePromptMsg', 'Para desactivar 2FA, introduce un código de verificación actual:')}
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
            className="w-full text-center text-xl tracking-[0.3rem] py-2.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 focus:border-rose-400 outline-none transition font-mono"
          />
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

  const renderContent = () => {
    if (backupCodes && backupCodes.length > 0) {
      return (
        <TwoFactorBackupCodesView
          backupCodes={backupCodes}
          copiedCodes={copiedCodes}
          onCopy={handleCopyBackupCodes}
          onDownload={handleDownloadBackupCodes}
          onFinish={() => setBackupCodes(null)}
          t={t}
          glassButtonClass={glassButtonClass}
          glassButtonPrimarySmallClass={glassButtonPrimarySmallClass}
          glassButtonSecondaryClass={glassButtonSecondaryClass}
        />
      );
    }
    if (userData?.twoFactorEnabled) {
      return renderActiveState();
    }
    if (!setupData) {
      return (
        <TwoFactorSetupStart
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          onStartSetup={handleStartSetup}
          loading2FA={loading2FA}
          t={t}
          glassButtonClass={glassButtonClass}
        />
      );
    }
    return (
      <TwoFactorSetupVerify
        setupData={setupData}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        onConfirmEnable={handleConfirmEnable}
        onCancel={() => setSetupData(null)}
        loading2FA={loading2FA}
        t={t}
        glassButtonClass={glassButtonClass}
        glassButtonSecondaryClass={glassButtonSecondaryClass}
      />
    );
  };

  return (
    <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl rounded-3xl border border-white/60 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center shrink-0 shadow-2xs">
            <FaShieldAlt size={18} className="text-[#73841e] dark:text-[#d4e84a]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg m-0 leading-tight">
              {t('profile.twoFactorTitle', 'Autenticación de Doble Factor (2FA)')}
            </h3>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
