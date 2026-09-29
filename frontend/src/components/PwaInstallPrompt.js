import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaTimes, FaSyncAlt, FaEllipsisV, FaCheckCircle, FaArrowDown } from 'react-icons/fa';
import { isAppStandalone, getDevicePlatform, getDeferredPrompt, promptDirectInstall } from '../util/pwaHelper';

export default function PwaInstallPrompt() {
  const { t } = useTranslation();
  const deferredPromptRef = useRef(getDeferredPrompt());
  const waitingWorkerRef = useRef(null);

  const [platform, setPlatform] = useState('desktop');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(Boolean(getDeferredPrompt()));
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Si ya está ejecutándose como PWA instalada, no mostrar nada
    if (isAppStandalone()) {
      return;
    }

    const detectedPlatform = getDevicePlatform();
    setPlatform(detectedPlatform);

    // Si ya había un prompt diferido capturado
    const existingPrompt = getDeferredPrompt();
    if (existingPrompt) {
      deferredPromptRef.current = existingPrompt;
      setHasNativePrompt(true);
    }

    // Comprobar si el usuario ya descartó el aviso en esta sesión
    const isDismissed = sessionStorage.getItem('da_pwa_dismissed') === 'true';

    // 1. En iOS no hay evento beforeinstallprompt, por lo que se muestra el aviso guiado si no se ha descartado
    if (detectedPlatform === 'ios' && !isDismissed) {
      setIsOpen(true);
    }

    // 2. En Android, si no se descarta, mostrar el aviso
    if (detectedPlatform === 'android' && !isDismissed) {
      setIsOpen(true);
    }

    // 3. Capturar evento nativo de instalación en Android / Desktop Chrome / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setHasNativePrompt(true);
      if (!sessionStorage.getItem('da_pwa_dismissed')) {
        setIsOpen(true);
      }
    };

    const handlePromptAvailable = () => {
      const p = getDeferredPrompt();
      if (p) {
        deferredPromptRef.current = p;
        setHasNativePrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('da-pwa-prompt-available', handlePromptAvailable);

    // 4. Escuchar evento para abrir manualmente desde la barra de navegación o perfil
    const handleManualOpen = () => {
      setIsOpen(true);
      setShowManualSteps(true);
    };

    window.addEventListener('da-open-pwa-install', handleManualOpen);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('da-pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('da-open-pwa-install', handleManualOpen);
    };
  }, []);

  // Detección de actualización del Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                waitingWorkerRef.current = newWorker;
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      }).catch(() => {});
    }
  }, []);

  const handleInstallClick = async () => {
    const installed = await promptDirectInstall();
    if (installed) {
      setIsOpen(false);
      setHasNativePrompt(false);
      return;
    }

    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsOpen(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      deferredPromptRef.current = null;
      setHasNativePrompt(false);
    } else {
      setShowManualSteps(true);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('da_pwa_dismissed', 'true');
    } catch {
      // Ignorar errores de almacenamiento
    }
  };

  const handleUpdate = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  // Banner prioritario de Actualización Disponible
  if (showUpdatePrompt) {
    return (
      <aside
        role="alert"
        aria-label={t('pwa.updateTitle', 'Nueva versión disponible')}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-slate-900/95 text-white backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#b3c34c]/30 text-[#b3c34c] flex items-center justify-center shrink-0">
            <FaSyncAlt className="animate-spin" size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold m-0 text-white">
              {t('pwa.updateTitle', 'Nueva versión disponible')}
            </h4>
            <p className="text-xs text-white/70 m-0">
              {t('pwa.updateDesc', 'Hay mejoras listas. Actualiza para aplicarlas.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-2 bg-[#b3c34c] hover:bg-[#a2b144] text-slate-900 font-bold text-xs rounded-xl shadow transition cursor-pointer border-0"
        >
          {t('pwa.updateBtn', 'Actualizar')}
        </button>
      </aside>
    );
  }

  if (!isOpen || isAppStandalone()) {
    return null;
  }

  // --- Renderizado para iPhone / iPad (iOS) ---
  if (platform === 'ios') {
    return (
      <aside
        aria-label={t('pwa.iosTitle', 'Instalar App en iPhone')}
        className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 w-auto sm:w-[410px] max-w-full z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-4 sm:p-5 transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-white/10 border border-slate-200/70 dark:border-white/15 p-1 shadow-sm shrink-0 flex items-center justify-center">
              <img src="/favicon.png" alt="Distribution Academy" className="w-8 h-8 rounded-xl object-contain" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0 leading-snug">
                {t('pwa.iosTitle', 'Instalar App en iPhone')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-tight">
                {t('pwa.iosSubtitle', 'Acceso directo y uso a pantalla completa')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition shrink-0 border-0 bg-transparent cursor-pointer"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Pasos visuales claros e individuales para iOS */}
        <div className="space-y-2.5 my-3 text-slate-700 dark:text-slate-200 text-xs">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <span className="flex-1 leading-snug">
              {t('pwa.iosStep1Prefix', 'Pulsa el botón')}{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {t('pwa.iosStep1Highlight', 'Compartir')}
              </strong>{' '}
              {t('pwa.iosStep1Suffix', 'en la barra inferior de Safari.')}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <span className="flex-1 leading-snug">
              {t('pwa.iosStep2Prefix', 'Baja en el menú y selecciona')}{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {t('pwa.iosStep2Highlight', 'Añadir a pantalla de inicio')}
              </strong>.
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <span className="flex-1 leading-snug">
              {t('pwa.iosStep3Prefix', 'Pulsa')}{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {t('pwa.iosStep3Highlight', 'Añadir')}
              </strong>{' '}
              {t('pwa.iosStep3Suffix', 'en la esquina superior derecha para confirmar.')}
            </span>
            <div className="px-2 py-0.5 rounded-md bg-[#b3c34c]/25 text-[#7a8a18] dark:text-[#d4e157] font-bold text-[11px] shrink-0">
              {t('pwa.iosStep3Btn', 'Añadir')}
            </div>
          </div>
        </div>

        {/* Guía inferior con flecha hacia la barra de Safari */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
            <span>{t('pwa.iosBottomHint', 'El botón Compartir está abajo en Safari')}</span>
            <FaArrowDown className="text-blue-500 animate-bounce" size={11} />
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:opacity-90 transition cursor-pointer border-0 shadow-sm"
          >
            {t('pwa.understood', 'Entendido')}
          </button>
        </div>
      </aside>
    );
  }

  // --- Renderizado para Android ---
  if (platform === 'android') {
    return (
      <aside
        aria-label={t('pwa.androidTitle', 'Instalar App en Android')}
        className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 w-auto sm:w-[410px] max-w-full z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-4 sm:p-5 transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-white/10 border border-slate-200/70 dark:border-white/15 p-1 shadow-sm shrink-0 flex items-center justify-center">
              <img src="/favicon.png" alt="Distribution Academy" className="w-8 h-8 rounded-xl object-contain" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0 leading-snug">
                {t('pwa.androidTitle', 'Instalar App en Android')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-tight">
                {t('pwa.androidSubtitle', 'Acceso directo con un solo toque y sin conexión')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition shrink-0 border-0 bg-transparent cursor-pointer"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Si el navegador soporta instalación directa con 1 clic */}
        {hasNativePrompt && !showManualSteps ? (
          <div className="space-y-3 my-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
              {t(
                'pwa.androidPromptDesc',
                'Instala la aplicación en tu móvil para registrar asistencia más rápido, recibir avisos y usarla a pantalla completa.'
              )}
            </p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 bg-[#b3c34c] hover:bg-[#a2b144] active:scale-[0.99] text-slate-900 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition cursor-pointer border-0"
            >
              <FaDownload size={15} />
              <span>{t('pwa.installBtn', 'Instalar Aplicación')}</span>
            </button>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowManualSteps(true)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline bg-transparent border-0 cursor-pointer p-0"
              >
                {t('pwa.viewManualSteps', '¿Ver pasos manuales?')}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                {t('pwa.dismiss', 'Ahora no')}
              </button>
            </div>
          </div>
        ) : (
          /* Pasos manuales guiados para Android (Chrome / Samsung / Firefox) */
          <div className="my-3 space-y-2.5 text-slate-700 dark:text-slate-200 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span className="flex-1 leading-snug">
                {t('pwa.androidStep1Prefix', 'Pulsa el menú de opciones')}{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {t('pwa.androidStep1Highlight', 'tres puntos (⋮)')}
                </strong>{' '}
                {t('pwa.androidStep1Suffix', 'en la esquina superior derecha del navegador.')}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white shrink-0">
                <FaEllipsisV size={14} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span className="flex-1 leading-snug">
                {t('pwa.androidStep2Prefix', 'Selecciona')}{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {t('pwa.androidStep2Highlight', 'Instalar aplicación')}
                </strong>{' '}
                {t('pwa.androidStep2Suffix', 'o "Añadir a pantalla de inicio".')}
              </span>
              <div className="p-1.5 rounded-lg bg-[#b3c34c]/20 text-[#7a8a18] dark:text-[#d4e157] shrink-0">
                <FaDownload size={13} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span className="flex-1 leading-snug">
                {t('pwa.androidStep3Prefix', 'Confirma pulsando')}{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {t('pwa.androidStep3Highlight', 'Instalar')}
                </strong>{' '}
                {t('pwa.androidStep3Suffix', 'en el diálogo del sistema.')}
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 shrink-0">
                <FaCheckCircle size={14} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
              {hasNativePrompt && (
                <button
                  type="button"
                  onClick={() => setShowManualSteps(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline bg-transparent border-0 cursor-pointer p-0"
                >
                  {t('pwa.backToDirect', 'Volver al botón directo')}
                </button>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="ml-auto px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:opacity-90 transition cursor-pointer border-0 shadow-sm"
              >
                {t('pwa.understood', 'Entendido')}
              </button>
            </div>
          </div>
        )}
      </aside>
    );
  }

  // --- Renderizado para Escritorio / Desktop (Chrome / Edge) ---
  return (
    <aside
      aria-label={t('pwa.desktopTitle', 'Instalar Distribution Academy')}
      className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 w-auto sm:w-[410px] max-w-full z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-4 sm:p-5 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-white/10 border border-slate-200/70 dark:border-white/15 p-1 shadow-sm shrink-0 flex items-center justify-center">
            <img src="/favicon.png" alt="Distribution Academy" className="w-8 h-8 rounded-xl object-contain" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0 leading-snug">
              {t('pwa.desktopTitle', 'Instalar Distribution Academy')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-tight">
              {t('pwa.desktopSubtitle', 'Acceso directo como aplicación de escritorio')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('common.close', 'Cerrar')}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition shrink-0 border-0 bg-transparent cursor-pointer"
        >
          <FaTimes size={13} />
        </button>
      </div>

      <div className="space-y-3 my-3">
        <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
          {hasNativePrompt
            ? t('pwa.desktopPromptDesc', 'Instala la aplicación en tu ordenador para abrirla rápidamente sin depender de pestañas del navegador.')
            : t('pwa.desktopHintDesc', 'Puedes instalar la aplicación pulsando el icono de instalación situado en la barra de direcciones de tu navegador.')}
        </p>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer border-0 bg-transparent"
          >
            {hasNativePrompt ? t('pwa.dismiss', 'Ahora no') : t('pwa.understood', 'Entendido')}
          </button>
          {hasNativePrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 bg-[#b3c34c] hover:bg-[#a2b144] text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer border-0"
            >
              <FaDownload size={12} />
              <span>{t('pwa.installBtn', 'Instalar Aplicación')}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
