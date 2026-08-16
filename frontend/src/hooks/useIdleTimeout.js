import { useState, useEffect, useCallback } from 'react';
import tokenService from '../services/token.service';

const ACTIVITY_KEY = 'da_last_user_activity';
const LOGOUT_SYNC_KEY = 'da_cross_tab_logout';

/**
 * Hook de gestión de inactividad de sesión (OWASP Idle Timeout).
 * 
 * @param {Object} options
 * @param {number} options.idleTime - Tiempo de inactividad total antes de cerrar sesión (ms). Defecto: 15 min.
 * @param {number} options.warningTime - Tiempo de aviso antes de cerrar sesión (ms). Defecto: 60 seg.
 * @param {Function} options.onTimeout - Callback ejecutado al agotar el tiempo.
 */
export default function useIdleTimeout({
  idleTime = 15 * 60 * 1000,   // 15 minutos de inactividad total
  warningTime = 60 * 1000,      // 60 segundos de modal de aviso
  onTimeout
}) {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.round(warningTime / 1000));
  const isLogged = !!tokenService.getUser();

  const handleLogout = useCallback(() => {
    // Sincronizar logout con otras pestañas
    try {
      localStorage.setItem(LOGOUT_SYNC_KEY, Date.now().toString());
    } catch {
      // Ignorar si storage falla
    }
    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  const stayLoggedIn = useCallback(() => {
    setIsWarningModalOpen(false);
    setRemainingSeconds(Math.round(warningTime / 1000));
    try {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    } catch {
      // Ignorar
    }
  }, [warningTime]);

  // Manejador de eventos de interacción del usuario
  const handleUserActivity = useCallback(() => {
    if (!isLogged) return;
    
    // Si el modal de aviso está abierto, solo se descarta si interactúa activamente pulsando quedarse
    if (!isWarningModalOpen) {
      const now = Date.now();
      try {
        localStorage.setItem(ACTIVITY_KEY, now.toString());
      } catch {
        // Ignorar
      }
    }
  }, [isLogged, isWarningModalOpen]);

  useEffect(() => {
    if (!isLogged) {
      setIsWarningModalOpen(false);
      return;
    }

    // Inicializar timestamp de actividad si no existe
    if (!localStorage.getItem(ACTIVITY_KEY)) {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    }

    // Escuchar eventos de actividad del usuario
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    
    let lastThrottledTime = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 2000) { // Throttle de 2 segundos para no sobrecargar el CPU
        lastThrottledTime = now;
        handleUserActivity();
      }
    };

    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, throttledActivity, { passive: true });
    });

    // Escuchar sincronización de otras pestañas
    const handleStorageEvent = (event) => {
      if (event.key === LOGOUT_SYNC_KEY) {
        // Otra pestaña cerró sesión -> cerrar aquí inmediatamente
        tokenService.removeUser();
        window.location.href = '/login?reason=multi_tab_logout';
      } else if (event.key === ACTIVITY_KEY) {
        // Otra pestaña tuvo actividad -> si estamos en aviso, cerrar aviso y continuar
        setIsWarningModalOpen(false);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Bucle de comprobación periódico cada segundo
    const checkInterval = setInterval(() => {
      const lastActivity = Number.parseInt(localStorage.getItem(ACTIVITY_KEY) || Date.now().toString(), 10);
      const timeSinceLastActivity = Date.now() - lastActivity;
      const warningThreshold = idleTime - warningTime;

      if (timeSinceLastActivity >= idleTime) {
        // Tiempo agotado por inactividad
        clearInterval(checkInterval);
        setIsWarningModalOpen(false);
        handleLogout();
      } else if (timeSinceLastActivity >= warningThreshold) {
        // Entrar en fase de aviso / countdown
        const timeLeftMs = Math.max(0, idleTime - timeSinceLastActivity);
        setRemainingSeconds(Math.ceil(timeLeftMs / 1000));
        setIsWarningModalOpen(true);
      } else {
        // Usuario activo
        setIsWarningModalOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, throttledActivity);
      });
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(checkInterval);
    };
  }, [isLogged, idleTime, warningTime, handleUserActivity, handleLogout]);

  return {
    isWarningModalOpen,
    remainingSeconds,
    stayLoggedIn,
    handleLogout
  };
}
