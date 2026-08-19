import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaSyncAlt, FaTimes, FaRocket } from "react-icons/fa";

export default function PwaUpdateNotification() {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const waitingWorkerRef = useRef(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting;
        setUpdateAvailable(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = newWorker;
            setUpdateAvailable(true);
            setDismissed(false);
          }
        });
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const intervalId = setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(intervalId);
      };
    }).catch((err) => {
      console.warn("ServiceWorker registration error:", err);
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 z-[99999] flex justify-center animate-fade-in">
      <div 
        className="w-full max-w-sm sm:max-w-md p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl transition-all duration-300"
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(179, 195, 76, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(179, 195, 76, 0.2)'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8a9e29] to-[#b3c34c] text-slate-950 flex items-center justify-center text-lg shrink-0 shadow-md">
            <FaRocket className="animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-white mb-0 truncate">
              {t('pwa.updateTitle', '¡Nueva versión disponible!')}
            </p>
            <p className="text-xs text-slate-300 mb-0 truncate">
              {t('pwa.updateDesc', 'Pulsa para aplicar las mejoras')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="da-btn da-btn-primary px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            style={{
              background: '#b3c34c',
              color: '#0f172a',
              border: 'none'
            }}
          >
            <FaSyncAlt className={isUpdating ? "animate-spin text-xs" : "text-xs"} />
            <span>{isUpdating ? t('pwa.updating', 'Actualizando...') : t('pwa.updateBtn', 'Actualizar')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer p-0"
            title={t('common.close', 'Cerrar')}
          >
            <FaTimes className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
