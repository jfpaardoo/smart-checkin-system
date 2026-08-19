import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaTimes, FaSyncAlt, FaShareSquare } from 'react-icons/fa';

export default function PwaInstallPrompt() {
  const { t } = useTranslation();
  const deferredPromptRef = useRef(null);
  const waitingWorkerRef = useRef(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Limpiar descartes anteriores para garantizar que se muestre siempre
    try {
      localStorage.removeItem('da_pwa_dismissed_until');
    } catch {
      // Ignore
    }

    // 1. Comprobar si ya está instalada en modo app independiente (standalone)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true || 
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Capturar evento de instalación nativa en Android / Chrome / Edge / PC
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detección de iOS (iPhone / iPad) no instalado
    const isIos = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !window.MSStream;
    if (isIos && !isStandalone) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 4. Detección de nueva versión del Service Worker (Auto-Update como en Play Store)
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
      });
    }
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    // Se oculta solo durante la sesión actual (vuelve a salir en próximas visitas mientras no esté instalada)
    setShowInstallPrompt(false);
    setShowIosPrompt(false);
  };

  const handleUpdate = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  // Banner de Actualización Disponible (Prioritario)
  if (showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-slate-900/90 text-white backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
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
          className="px-4 py-2 bg-[#b3c34c] hover:bg-[#a2b144] text-slate-900 font-bold text-xs rounded-xl shadow transition"
        >
          {t('pwa.updateBtn', 'Actualizar')}
        </button>
      </div>
    );
  }

  // Banner de Instalación (Android / Desktop Chrome / Edge)
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 shadow-sm shrink-0 flex items-center justify-center">
              <img src="/favicon.png" alt="Distribution Academy" className="w-8 h-8 object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                {t('pwa.installTitle', 'Instalar Distribution Academy')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-white/70 m-0">
                {t('pwa.installDesc', 'Instala la app en tu móvil para fichar y acceder más rápido.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1"
          >
            <FaTimes size={14} />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition"
          >
            {t('pwa.dismiss', 'Ahora no')}
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-1.5 bg-[#b3c34c] hover:bg-[#a2b144] text-slate-900 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <FaDownload size={12} />
            {t('pwa.installBtn', 'Instalar App')}
          </button>
        </div>
      </div>
    );
  }

  // Banner informativo para iOS Safari
  if (showIosPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Distribution Academy" className="w-8 h-8 rounded-full shadow-sm shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                {t('pwa.iosTitle', 'Instala la App en iPhone')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-white/70 m-0 flex items-center gap-1 mt-1">
                <span>{t('pwa.iosInstructions', 'Pulsa Compartir')}</span>
                <FaShareSquare className="text-blue-500 inline" size={14} />
                <span>{t('pwa.iosInstructions2', 'y luego "Añadir a pantalla de inicio"')}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
