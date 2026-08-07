/* eslint-disable no-restricted-globals */
/* Service Worker for BA Distribution Academy PWA */

self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = (() => {
    try {
      return event.data.json();
    } catch (parseError) {
      return {
        title: 'Distribution Academy',
        body: event.data.text(),
        icon: '/ba-logo.png'
      };
    }
  })();

  const options = {
    body: data.body || '',
    icon: data.icon || '/ba-logo.png',
    badge: '/ba-logo.png',
    vibrate: [200, 100, 200],
    tag: 'ba-notification-' + Date.now(),
    data: {
      url: data.url || '/'
    }
  };

  // 1. Mostrar la notificación nativa en el SO
  const notificationPromise = self.registration.showNotification(data.title || 'Distribution Academy', options);

  // 2. Enviar el mensaje a la pestaña de React para que actualice la campanita
  const notifyReactPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_RECEIVED',
        payload: data
      });
    });
  });

  event.waitUntil(Promise.all([notificationPromise, notifyReactPromise]));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});