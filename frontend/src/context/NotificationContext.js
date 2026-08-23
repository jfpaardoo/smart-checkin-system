import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import tokenService from '../services/token.service';
import { registerPushNotifications } from '../util/pushNotificationUtil';

import soundAndHaptics from '../util/soundAndHaptics';

const NotificationContext = createContext(null);

function triggerNativeNotification(text) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  let notifTitle = 'Distribution Academy';
  let notifBody = text;
  if (text.startsWith('[')) {
    const closingBracket = text.indexOf(']');
    if (closingBracket > 1) {
      notifTitle = text.substring(1, closingBracket);
      notifBody = text.substring(closingBracket + 1).trim();
    }
  }

  const options = {
    body: notifBody,
    icon: '/favicon.png?v=5',
    badge: '/favicon.png?v=5',
    tag: 'da-alert-' + Date.now()
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.ready
      .then(reg => {
        reg.showNotification(notifTitle, options);
      })
      .catch(() => {
        try {
          new Notification(notifTitle, options);
        } catch (e) {
          console.debug('[Push] Fallback notification failed:', e);
        }
      });
  } else {
    try {
      new Notification(notifTitle, options);
    } catch (e) {
      console.debug('[Push] Notification constructor failed:', e);
    }
  }
}

export function NotificationProvider({ children }) {
  const user = tokenService.getUser();
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAlert = useCallback((message) => {
    if (!message?.body) return;
    const text = message.body;

    triggerNativeNotification(text);
    soundAndHaptics.playInfo();

    setNotifications(prev => {
      const isDuplicate = prev.some(n => n.text === text && (Date.now() - n.id) < 3000);
      if (isDuplicate) return prev;

      const newNotif = {
        id: Date.now(),
        text: text,
        timestamp: new Date(),
        read: false
      };

      return [newNotif, ...prev].slice(0, 50);
    });
  }, []);

  const username = user?.username;
  useSubscription(username ? `/topic/notifications/${username}` : '/topic/alerts', handleAlert);

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event?.data?.type === 'PUSH_RECEIVED') {
        const payload = event.data.payload;
        const text = payload.body || payload.title || 'Nueva notificación';
        soundAndHaptics.playInfo();
        setNotifications(prev => {
          const isDuplicate = prev.some(n => n.text === text && (Date.now() - n.id) < 3000);
          if (isDuplicate) return prev;

          const newNotif = {
            id: Date.now(),
            text: text,
            timestamp: new Date(),
            read: false
          };
          return [newNotif, ...prev].slice(0, 50);
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const isLoggedIn = !!user?.username;
  useEffect(() => {
    if (isLoggedIn) {
      registerPushNotifications();
    }
  }, [isLoggedIn]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback((e) => {
    if (e?.stopPropagation) e.stopPropagation();
    setNotifications([]);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAllRead,
    clearAll
  }), [notifications, unreadCount, markAllRead, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return { notifications: [], unreadCount: 0, markAllRead: () => {}, clearAll: () => {} };
  }
  return ctx;
}
