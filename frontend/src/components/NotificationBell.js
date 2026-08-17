import React, { useState, useEffect, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import tokenService from '../services/token.service';
import { registerPushNotifications } from '../util/pushNotificationUtil';

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

export default function NotificationBell({ isMobile = false, isOpen = false, onToggle = null }) {
  const { t } = useTranslation();
  const user = tokenService.getUser();
  const [notifications, setNotifications] = useState([]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAlert = useCallback((message) => {
    if (!message?.body) return;
    const text = message.body;

    // Disparar efecto secundario (notificación nativa del SO) fuera del updater
    triggerNativeNotification(text);

    setNotifications(prev => {
      // Evitar notificaciones duplicadas en un intervalo de 3 segundos
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

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(e);
    }
    if (unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative notif-dropdown-container inline-flex items-center">
      <button 
        type="button" 
        className="relative flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition focus:outline-none"
        onClick={handleToggle}
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[0.65rem] font-bold px-[5px] py-[2px] rounded-full leading-none shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {!isMobile && (
        <div 
          className={`absolute right-0 top-full mt-3 w-[300px] sm:w-[320px] da-nav-dropdown-container transition-all duration-300 origin-top-right z-[100] ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}
        >
          <div className="py-2" role="menu">
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 mb-2">
              <strong className="text-white text-[11px] uppercase tracking-widest">
                {t('notifications.title', 'Notificaciones')}
              </strong>
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-white/60 hover:text-white transition-colors uppercase font-bold"
                  onClick={clearAll}
                >
                  {t('notifications.clearAll', 'Limpiar todo')}
                </button>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <FaBell className="mx-auto mb-3 text-white/20" size={32} />
                  <div className="text-xs text-white/50">{t('notifications.empty', 'Sin notificaciones')}</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`block px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${!n.read ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  >
                    <div className={`text-sm mb-1 leading-snug break-words ${!n.read ? 'font-semibold text-white' : 'font-medium text-white/70'}`}>
                      {n.text}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {n.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}