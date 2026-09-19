import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaFingerprint, FaKey } from 'react-icons/fa';
import GlassModal from '../../../components/GlassModal';
import GlassButton from '../../../components/GlassButton';

export default function PasskeyPromptModal({
  isOpen,
  deviceType = 'Windows Hello',
  loading = false,
  onAccept,
  onDismiss,
  t
}) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleDismiss = () => {
    onDismiss(dontAskAgain);
  };

  const handleAccept = () => {
    onAccept();
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center flex-shrink-0 text-[#73841e] dark:text-[#d4e84a]">
        <FaFingerprint size={20} />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base m-0 leading-tight">
          {t('passkeys.promptTitle', '¿Activar acceso biométrico?')}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
          {deviceType} {t('passkeys.detected', 'detectado')}
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex justify-end gap-2.5 w-full">
      <GlassButton
        variant="secondary"
        type="button"
        onClick={handleDismiss}
        disabled={loading}
        className="text-xs px-4 py-2 font-bold rounded-xl"
      >
        {t('passkeys.promptDismiss', 'Ahora no')}
      </GlassButton>

      <GlassButton
        variant="primary"
        type="button"
        onClick={handleAccept}
        loading={loading}
        loadingText={t('passkeys.registering', 'Verificando...')}
        icon={FaKey}
        className="text-xs px-5 py-2 font-bold rounded-xl shadow-md"
      >
        {t('passkeys.promptAccept', 'Vincular este dispositivo')}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={loading ? undefined : handleDismiss}
      title={modalTitle}
      footer={modalFooter}
      size="sm"
      backdrop={loading ? 'static' : true}
    >
      <div className="space-y-4 text-left py-1">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
          {t('passkeys.promptSubtitle', {
            device: deviceType,
            defaultValue: `Hemos detectado que este dispositivo admite autenticación biométrica (${deviceType}). Puedes vincularlo ahora para iniciar sesión en un solo toque sin tener que teclear tu contraseña.`
          })}
        </p>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
          {t('passkeys.modalPrompt', 'Al pulsar en continuar, tu navegador te pedirá verificar tu identidad mediante Touch ID, Face ID, Windows Hello o PIN del dispositivo.')}
        </div>

        <label className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border-slate-300 text-[#b3c34c] focus:ring-[#b3c34c] dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
          />
          <span>{t('passkeys.promptDontAskAgain', 'No volver a sugerir en este dispositivo')}</span>
        </label>
      </div>
    </GlassModal>
  );
}

PasskeyPromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  deviceType: PropTypes.string,
  loading: PropTypes.bool,
  onAccept: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};
