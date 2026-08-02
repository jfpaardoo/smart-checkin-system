import React, { useState, useEffect, useCallback } from 'react';
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { FaBell } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import tokenService from '../services/token.service';

/**
 * Converts a VAPID Base64URL-encoded public key to a Uint8Array
 * required by the PushManager.subscribe() API.
 */
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

  // Use the existing useSubscription hook to listen for WebSocket alerts
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

  // Subscribe to Web Push on mount (once, when jwt is available)
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const response = await fetch('/api/v1/push/vapid-key', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!response.ok) return;
      const { publicKey } = await response.json();

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // Send subscription to backend
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
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav className="ba-nav-link position-relative d-inline-flex align-items-center" onClick={markAllRead}>
        <FaBell size={18} />
        {unreadCount > 0 && (
          <Badge
            color="danger"
            pill
            className="position-absolute"
            style={{ top: '2px', right: '-2px', fontSize: '0.65rem', padding: '2px 5px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </DropdownToggle>
      <DropdownMenu className="ba-dropdown-menu" end style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
        <DropdownItem header className="d-flex justify-content-between align-items-center">
          <strong>{t('notifications.title', 'Notificaciones')}</strong>
          {notifications.length > 0 && (
            <button
              type="button"
              className="btn btn-link btn-sm text-primary p-0"
              onClick={clearAll}
            >
              {t('notifications.clearAll', 'Limpiar todo')}
            </button>
          )}
        </DropdownItem>
        <DropdownItem divider />
        {notifications.length === 0 ? (
          <DropdownItem disabled className="text-center text-muted py-3">
            <FaBell className="mb-1" style={{ opacity: 0.3, fontSize: '1.5rem' }} />
            <div className="small mt-1">{t('notifications.empty', 'Sin notificaciones')}</div>
          </DropdownItem>
        ) : (
          notifications.map(n => (
            <DropdownItem 
              key={n.id} 
              className={`py-2 ${!n.read ? 'bg-light' : ''}`}
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            >
              <div className="small fw-semibold" style={{ color: !n.read ? '#e74c3c' : '#2c3e50' }}>
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
