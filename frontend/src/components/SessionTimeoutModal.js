import React from 'react';
import { FaClock, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import useIdleTimeout from '../hooks/useIdleTimeout';
import tokenService from '../services/token.service';
import api from '../services/api';
import GlassModal from '../components/GlassModal';

const handleServerLogout = async () => {
  try {
    await api.post('/auth/logout?reason=Inactivity+Timeout');
  } catch {
    // Ignorar
  } finally {
    tokenService.removeUser();
    window.location.href = '/login?reason=timeout';
  }
};

// Formato MM:SS
const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function SessionTimeoutModal() {
  const { t } = useTranslation();
  const user = tokenService.getUser();

  const { isWarningModalOpen, remainingSeconds, stayLoggedIn, handleLogout } = useIdleTimeout({
    idleTime: 15 * 60 * 1000, // 15 minutos
    warningTime: 60 * 1000,    // 60 segundos de cuenta atrás
    onTimeout: handleServerLogout
  });

  if (!user || !isWarningModalOpen) return null;

  return (
    <GlassModal
      isOpen={isWarningModalOpen}
      backdrop="static"
      size="sm"
    >
      <div className="text-center text-slate-800 dark:text-slate-100">
        {/* Icono de Seguridad / Reloj */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-2xl shadow-inner animate-pulse">
          <FaClock />
        </div>

        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('session.timeoutTitle', '¿Sigues ahí?')}
        </h4>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 px-2 leading-relaxed">
          {t('session.timeoutDesc', 'Por motivos de seguridad, tu sesión se cerrará automáticamente debido a inactividad en')}
        </p>

        {/* Temporizador */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-800 font-mono font-bold text-2xl mb-6 shadow-xs">
          <FaShieldAlt className="text-amber-500 text-lg" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-full font-semibold text-sm transition text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="text-xs" />
            <span>{t('session.logoutNow', 'Cerrar Sesión')}</span>
          </button>

          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-full font-semibold text-sm text-slate-900 bg-[#b3c34c] hover:bg-[#a1b03e] border-0 shadow-md flex items-center justify-center gap-2"
            onClick={stayLoggedIn}
          >
            <span>{t('session.stayLoggedIn', 'Permanecer Conectado')}</span>
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
