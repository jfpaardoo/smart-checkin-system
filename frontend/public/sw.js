/* eslint-disable no-restricted-globals */
/* Service Worker for BA Distribution Academy PWA */
/* Handles Web Push notifications */

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = (() => {
    try {
      return event.data.json();
    } catch (parseError) {
      console.warn('Push payload not JSON, using as text:', parseError.message);
      return {
        title: 'Distribution Academy',
        body: event.data.text(),
        icon: '/ba-logo-circle.png'
      };
    }
  })();

  const options = {
    body: data.body || '',
    icon: data.icon || '/ba-logo-circle.png',
    badge: '/ba-logo-circle.png',
    vibrate: [200, 100, 200],
    tag: 'ba-notification-' + Date.now(),
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Distribution Academy', options)
  );
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
