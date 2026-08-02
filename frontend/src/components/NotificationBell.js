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
    <UncontrolledDropdown nav inNavbar direction="down">
      <DropdownToggle nav className="ba-nav-link position-relative d-inline-flex align-items-center" onClick={markAllRead}>
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
      <DropdownMenu className="ba-dropdown-menu" end style={{ minWidth: '320px', maxHeight: '60vh', overflowY: 'auto', position: 'absolute', padding: 0 }}>
        <DropdownItem header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', margin: 0 }}>
          <div className="d-flex justify-content-between align-items-center w-100">
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{t('notifications.title', 'Notificaciones')}</strong>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-3"
                style={{ color: '#4db8ff', textDecoration: 'none', fontWeight: 500 }}
                onClick={clearAll}
              >
                {t('notifications.clearAll', 'Limpiar todo')}
              </button>
            )}
          </div>
        </DropdownItem>
        {notifications.length === 0 ? (
          <DropdownItem disabled className="text-center py-4" style={{ backgroundColor: 'transparent' }}>
            <FaBell className="mb-2" style={{ opacity: 0.2, fontSize: '2rem', color: 'rgba(255,255,255,0.6)' }} />
            <div className="small mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('notifications.empty', 'Sin notificaciones')}</div>
          </DropdownItem>
        ) : (
          notifications.map(n => (
            <DropdownItem 
              key={n.id} 
              className={`py-3 px-3`}
              style={{ 
                whiteSpace: 'normal', 
                wordBreak: 'break-word', 
                backgroundColor: !n.read ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'background-color 0.2s ease'
              }}
            >
              <div className="small fw-semibold mb-1" style={{ color: !n.read ? '#ffffff' : 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                {n.text}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                {n.timestamp.toLocaleTimeString()}
              </div>
            </DropdownItem>
          ))
        )}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}