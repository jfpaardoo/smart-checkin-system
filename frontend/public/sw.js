/* eslint-disable no-restricted-globals */
const CURRENT_CACHE_NAME = 'da-cache-v1.2.3';

self.addEventListener('message', function(event) {
  if (event.origin && event.origin !== self.location.origin) {
    return;
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHES') {
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    });
  }
});

self.addEventListener('push', function(event) {
  if (!event.data) return;  
  
  const data = (() => {
    try {
      return event.data.json();
    } catch (parseError) {
      return {
        title: 'Distribution Academy',
        body: event.data.text(),
        icon: '/favicon.png?v=7'
      };
    }
  })();

  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.png?v=7',
    badge: '/favicon.png?v=7',
    vibrate: [200, 100, 200],
    tag: 'da-notification-' + Date.now(),
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
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName !== CURRENT_CACHE_NAME;
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
