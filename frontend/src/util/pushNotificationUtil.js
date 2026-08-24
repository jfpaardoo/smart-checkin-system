function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.codePointAt(i);
  }
  return outputArray;
}

export function getPushSupportStatus() {
  if (typeof window === 'undefined') return { supported: false, permission: 'denied' };
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  if (isIOS && !isStandalone) {
    return {
      supported: false,
      isIOS: true,
      needsInstall: true,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      reason: 'En iPhone/iPad es obligatorio añadir la app a la Pantalla de Inicio (Compartir > Añadir a la pantalla de inicio) para poder recibir notificaciones push.'
    };
  }

  const supported = ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  return {
    supported,
    isIOS,
    needsInstall: false,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  };
}

export async function registerPushNotifications(interactive = false) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('[Push] ServiceWorker or PushManager is not supported in this browser.');
    return false;
  }

  const status = getPushSupportStatus();
  if (status.needsInstall) {
    console.info('[Push] iOS requires PWA installation for push notifications.');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    console.info('[Push] ServiceWorker ready.');

    let permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    if (permission === 'default') {
      if (!interactive) {
        // Do not trigger unprompted permission request on background load (fails on iOS / strict browsers)
        return false;
      }
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('[Push] Notification permission not granted:', permission);
      return false;
    }

    const response = await fetch('/api/v1/push/vapid-key', { credentials: 'include' });
    if (!response.ok) {
      console.warn('[Push] Could not fetch VAPID key from backend, status:', response.status);
      return false;
    }
    const { publicKey } = await response.json();
    if (!publicKey || publicKey === 'defaultPublicKey') {
      console.warn('[Push] Invalid or default VAPID public key received:', publicKey);
      return false;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.info('[Push] New push subscription created.');
    }

    if (subscription) {
      const subRes = await fetch('/api/v1/push/subscribe', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (subRes.ok) {
        console.info('[Push] Push subscription synced with backend successfully.');
        return true;
      } else {
        console.warn('[Push] Failed to sync subscription with backend:', subRes.status);
      }
    }
  } catch (err) {
    console.warn('[Push] Push registration error:', err);
  }
  return false;
}
