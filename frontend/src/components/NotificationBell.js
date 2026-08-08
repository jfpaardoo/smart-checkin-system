import React, { useState, useEffect, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import tokenService from '../services/token.service';

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

export default function NotificationBell({ isMobile = false, isOpen = false, onToggle = null }) {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleAlert = useCallback((message) => {
    if (message.body) {
      const newNotif = {
        id: Date.now(),
        text: message.body,
        timestamp: new Date(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  useSubscription('/topic/alerts', handleAlert);

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event?.data?.type === 'PUSH_RECEIVED') {
        const payload = event.data.payload;
        const newNotif = {
          id: Date.now(),
          text: payload.body || payload.title || 'Nueva notificación',
          timestamp: new Date(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
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

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const response = await fetch('/api/v1/push/vapid-key', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!response.ok) return;
      const { publicKey } = await response.json();

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(subscription.toJSON())
      });
    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  }, [jwt]);

  useEffect(() => {
    if (jwt) {
      subscribeToPush();
    }
  }, [jwt, subscribeToPush]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
    setUnreadCount(0);
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
        className="relative flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-all focus:outline-none"
        onClick={handleToggle}
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[0.65rem] font-bold px-[5px] py-[2px] rounded-full leading-none shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Solo renderiza el flotante desplegable en escritorio usando la prop isOpen del padre */}
      {!isMobile && (
        <div 
          className={`absolute right-0 top-full mt-3 w-[300px] sm:w-[320px] ba-nav-dropdown-container transition-all duration-300 origin-top-right z-[100] ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}
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