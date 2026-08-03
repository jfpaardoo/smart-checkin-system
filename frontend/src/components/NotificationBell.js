import React, { useState, useEffect, useCallback } from 'react';
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
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

export default function NotificationBell() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Escuchar WebSockets (Para Alertas de Seguridad Globales)
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

  // 2. Escuchar mensajes internos desde el Service Worker (Para Push locales como Formaciones)
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

  // 3. Suscripción a Web Push
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

  return (
    <UncontrolledDropdown direction="down">
      <DropdownToggle tag="div" className="position-relative d-inline-flex align-items-center cursor-pointer" onClick={markAllRead}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            color="danger"
            pill
            className="position-absolute"
            style={{ top: '0', right: '-5px', fontSize: '0.65rem', padding: '2px 5px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </DropdownToggle>
      <DropdownMenu className="ba-dropdown-menu shadow-lg border-0 rounded-4" end style={{ minWidth: '300px', maxWidth: '90vw', maxHeight: '60vh', overflowY: 'auto', padding: 0 }}>
        <DropdownItem header className="border-bottom border-light" style={{ padding: '12px 16px', margin: 0 }}>
          <div className="d-flex justify-content-between align-items-center w-100">
            <strong className="text-dark">{t('notifications.title', 'Notificaciones')}</strong>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-3 text-primary fw-medium text-decoration-none"
                onClick={clearAll}
              >
                {t('notifications.clearAll', 'Limpiar todo')}
              </button>
            )}
          </div>
        </DropdownItem>
        {notifications.length === 0 ? (
          <DropdownItem disabled className="text-center py-4 bg-transparent">
            <FaBell className="mb-2 text-secondary opacity-25" style={{ fontSize: '2rem' }} />
            <div className="small mt-1 text-muted">{t('notifications.empty', 'Sin notificaciones')}</div>
          </DropdownItem>
        ) : (
          notifications.map(n => (
            <DropdownItem 
              key={n.id} 
              className={`py-3 px-3 border-bottom border-light ${!n.read ? 'bg-light' : 'bg-transparent'}`}
              style={{ 
                whiteSpace: 'normal', 
                wordBreak: 'break-word', 
                transition: 'background-color 0.2s ease'
              }}
            >
              <div className={`small mb-1 ${!n.read ? 'fw-bold text-dark' : 'fw-medium text-secondary'}`} style={{ lineHeight: '1.4' }}>
                {n.text}
              </div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                {n.timestamp.toLocaleTimeString()}
              </div>
            </DropdownItem>
          ))
        )}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}