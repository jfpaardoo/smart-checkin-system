import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaTimes } from 'react-icons/fa';
import { isAppStandalone, promptDirectInstall, triggerOpenPwaInstall } from '../util/pwaHelper';

/**
 * PwaTopBanner - Barra superior compacta tipo App Store / Google Play
 * Permite acceso inmediato a la instalación sin tapar elementos inferiores.
 */
export default function PwaTopBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAppStandalone()) {
      return;
    }

    const isTopBannerDismissed = sessionStorage.getItem('da_pwa_top_banner_dismissed') === 'true';
    if (!isTopBannerDismissed) {
      setIsVisible(true);
    }

    const handlePromptAvailable = () => {
      if (!sessionStorage.getItem('da_pwa_top_banner_dismissed')) {
        setIsVisible(true);
      }
    };

    const handleInstalled = () => {
      setIsVisible(false);
    };

    window.addEventListener('da-pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('da-pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('da-pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('da-pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await promptDirectInstall();
    if (installed) {
      setIsVisible(false);
    } else {
      triggerOpenPwaInstall();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('da_pwa_top_banner_dismissed', 'true');
    } catch {
      // Ignorar errores de sessionStorage
    }
  };

  if (!isVisible || isAppStandalone()) {
    return null;
  }

  return (
    <aside
      aria-label={t('pwa.installTitle', 'Instalar Distribution Academy')}
      className="sticky top-0 z-[9990] w-full bg-slate-900/95 text-white backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2 transition-all shadow-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="text-slate-400 hover:text-white transition p-1 rounded-full bg-transparent border-0 cursor-pointer shrink-0"
          >
            <FaTimes size={12} />
          </button>
          <img
            src="/favicon.png"
            alt="Distribution Academy"
            className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white m-0 truncate leading-tight">
              Distribution Academy
            </p>
            <p className="text-[11px] text-slate-300 m-0 truncate leading-tight hidden xs:block">
              {t('pwa.topBannerSubtitle', 'Instala la aplicación para un acceso más rápido')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3.5 py-1.5 bg-[#b3c34c] hover:bg-[#a2b144] active:scale-[0.98] text-slate-900 font-bold text-xs rounded-xl shadow transition cursor-pointer border-0 flex items-center gap-1.5"
          >
            <FaDownload size={11} />
            <span>{t('pwa.installBtn', 'Instalar')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
