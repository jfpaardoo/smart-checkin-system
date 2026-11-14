import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { FaSyncAlt, FaTimes, FaRocket } from "react-icons/fa";

export default function PwaUpdateNotification() {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const waitingWorkerRef = useRef(null);
  const currentBuildTimeRef = useRef(null);

  // 1. Verificación de version.json periódica y al volver a enfocar la app
  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (!currentBuildTimeRef.current) {
          currentBuildTimeRef.current = data.buildTime || data.version;
        } else if (data.buildTime && data.buildTime !== currentBuildTimeRef.current) {
          if (isMounted) {
            setUpdateAvailable(true);
            setDismissed(false);
          }
        }
      } catch (err) {
        console.debug("PWA version check network info:", err);
      }
    };

    // Comprobar al iniciar
    void checkVersion();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(checkVersion, 5 * 60 * 1000); // cada 5 minutos

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  // 2. Detección por Service Worker Lifecycle
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
      }, 10 * 60 * 1000);

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

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map(key => window.caches.delete(key)));
      }
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (e) {
      console.warn("Error purging caches on update:", e);
    } finally {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {updateAvailable && !dismissed && (
          <m.div
            key="pwa-update-toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 z-[99999] flex justify-center transform-gpu"
          >
            <div
              className="w-full max-w-sm sm:max-w-md p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 dark:border-[#b3c34c]/40 shadow-[0_20px_50px_rgba(15,23,42,0.15),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_20px_rgba(179,195,76,0.2)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8a9e29] to-[#b3c34c] text-slate-950 flex items-center justify-center text-lg shrink-0 shadow-md">
                  <FaRocket className="animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-0 truncate">
                    {t('pwa.updateTitle', '¡Nueva versión disponible!')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mb-0 truncate">
                    {t('pwa.updateDesc', 'Pulsa para aplicar las mejoras')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border-0 bg-gradient-to-r from-[#b3c34c] to-[#9eb038] hover:from-[#a2b144] hover:to-[#8d9e2e] text-slate-950"
                >
                  <FaSyncAlt className={isUpdating ? "animate-spin text-xs" : "text-xs"} />
                  <span>{isUpdating ? t('pwa.updating', 'Actualizando...') : t('pwa.updateBtn', 'Actualizar')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer p-0"
                  title={t('common.close', 'Cerrar')}
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
