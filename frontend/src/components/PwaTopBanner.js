import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaTimes } from 'react-icons/fa';
import { isAppStandalone, promptDirectInstall, triggerOpenPwaInstall } from '../util/pwaHelper';

/**
 * PwaTopBanner - Cápsula centrada de cristal líquido (Liquid Glass)
 * En flujo de documento natural para desplazar el contenido sin superponer la barra de navegación.
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
      className="relative z-30 mx-auto w-full max-w-[1440px] px-3 sm:px-6 pt-2.5 pb-1 transition-all duration-300 animate-fade-in"
    >
      <div className="flex items-center justify-center">
        {/* Cápsula de Cristal Líquido Centrada */}
        <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/45 dark:bg-slate-900/45 backdrop-blur-2xl border border-white/60 dark:border-white/10 border-t-white/80 dark:border-t-white/20 shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.85)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.08)] max-w-full transition-all duration-300">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close', 'Cerrar')}
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/15 transition-all p-0 border-0 bg-transparent cursor-pointer shrink-0"
          >
            <FaTimes size={11} />
          </button>

          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shadow-xs bg-white/60 dark:bg-white/15 backdrop-blur-md p-0.5 shrink-0 border border-white/70 dark:border-white/20">
            <img
              src="/favicon.png"
              alt="Distribution Academy"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <span className="text-xs font-bold text-slate-800 dark:text-white tracking-tight truncate">
            Distribution Academy
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b3c34c]/20 text-[#687714] dark:text-[#d4e157] border border-[#b3c34c]/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8a9e22] dark:bg-[#b3c34c] animate-pulse"></span>
            {t('pwa.badge', 'App')}
          </span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline truncate">
            {t('pwa.topBannerSubtitle', 'Acceso directo rápido y sin conexión')}
          </span>

          <div className="h-4 w-px bg-slate-300/60 dark:bg-white/15 hidden sm:block shrink-0 mx-0.5"></div>

          <button
            type="button"
            onClick={handleInstall}
            className="group px-3 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-[#b3c34c] to-[#9eb038] hover:from-[#a2b144] hover:to-[#8d9e2e] active:scale-95 text-slate-950 font-bold text-xs shadow-[0_3px_12px_rgba(179,195,76,0.3)] hover:shadow-[0_5px_18px_rgba(179,195,76,0.45)] border border-white/60 dark:border-white/20 transition-all duration-300 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <FaDownload size={10} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="tracking-tight whitespace-nowrap">
              {t('pwa.installBtn', 'Instalar Aplicación')}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
