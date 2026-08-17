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

export async function registerPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('[Push] ServiceWorker or PushManager is not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    console.info('[Push] ServiceWorker registered successfully.');

    const response = await fetch('/api/v1/push/vapid-key', { credentials: 'include' });
    if (!response.ok) {
      console.warn('[Push] Could not fetch VAPID key from backend, status:', response.status);
      return;
    }
    const { publicKey } = await response.json();
    if (!publicKey || publicKey === 'defaultPublicKey') {
      console.warn('[Push] Invalid or default VAPID public key received:', publicKey);
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('[Push] Notification permission not granted:', permission);
      return;
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
      } else {
        console.warn('[Push] Failed to sync subscription with backend:', subRes.status);
      }
    }
  } catch (err) {
    console.warn('[Push] Push registration error:', err);
  }
}
