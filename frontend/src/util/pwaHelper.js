/**
 * PWA Helper utilities
 * Detects standalone execution, target platform (iOS vs Android vs Desktop)
 * and dispatches programmatic open events for the install prompt.
 */

export const isAppStandalone = () => {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneDisplay =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;

    const isIosStandalone = window.navigator?.standalone === true;

    const isAndroidAppReferrer = Boolean(document?.referrer?.includes('android-app://'));

    return Boolean(isStandaloneDisplay || isIosStandalone || isAndroidAppReferrer);
  } catch {
    return false;
  }
};

export const getDevicePlatform = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const isIos =
    (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !window.MSStream;
  if (isIos) return 'ios';

  const isAndroid = /Android/i.test(ua);
  if (isAndroid) return 'android';

  return 'desktop';
};

let globalDeferredPrompt = typeof window !== 'undefined' ? window.__DA_DEFERRED_PROMPT__ : null;

if (typeof window !== 'undefined') {
  if (window.__DA_DEFERRED_PROMPT__) {
    globalDeferredPrompt = window.__DA_DEFERRED_PROMPT__;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.__DA_DEFERRED_PROMPT__ = e;
    window.dispatchEvent(new CustomEvent('da-pwa-prompt-available'));
  });

  window.addEventListener('da-pwa-prompt-available', (e) => {
    if (e.detail) {
      globalDeferredPrompt = e.detail;
    } else if (window.__DA_DEFERRED_PROMPT__) {
      globalDeferredPrompt = window.__DA_DEFERRED_PROMPT__;
    }
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.__DA_DEFERRED_PROMPT__ = null;
    window.dispatchEvent(new CustomEvent('da-pwa-installed'));
  });
}

export const getDeferredPrompt = () => globalDeferredPrompt || (typeof window !== 'undefined' ? window.__DA_DEFERRED_PROMPT__ : null);

export const promptDirectInstall = async () => {
  const prompt = getDeferredPrompt();
  if (prompt) {
    prompt.prompt();
    try {
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') {
          window.__DA_DEFERRED_PROMPT__ = null;
        }
        return true;
      }
    } catch (err) {
      console.debug('Error in promptDirectInstall:', err);
    }
  }
  return false;
};

export const executeOrOpenInstall = async () => {
  const prompt = getDeferredPrompt();
  if (prompt) {
    return await promptDirectInstall();
  }
  // Si no está disponible el evento nativo automático (p.ej. iOS Safari o navegador sin soporte automático), abre el modal de ayuda
  triggerOpenPwaInstall();
  return false;
};

export const triggerOpenPwaInstall = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('da-open-pwa-install'));
  }
};
