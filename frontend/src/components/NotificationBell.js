import React from 'react';
import { FaBell } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ isMobile = false, isOpen = false, onToggle = null }) {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

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
        className="relative flex items-center justify-center w-10 h-10 text-slate-700 dark:text-white hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition focus:outline-none cursor-pointer"
        onClick={handleToggle}
        aria-label={t('notifications.title', 'Notificaciones')}
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[0.65rem] font-bold px-[5px] py-[2px] rounded-full leading-none shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {!isMobile && (
        <div 
          className={`da-nav-dropdown-container top-full mt-2 right-0 w-[300px] sm:w-[320px] transition-all duration-300 origin-top-right z-50 ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}
        >
          <div className="py-1" role="menu">
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-300/40 dark:border-white/10 mb-2">
              <strong className="text-slate-800 dark:text-white text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                <FaBell className="text-[#8fa228] dark:text-[#d4e157] text-xs" />
                {t('notifications.title', 'Notificaciones')}
              </strong>
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors uppercase font-bold cursor-pointer bg-transparent border-0"
                  onClick={clearAll}
                >
                  {t('notifications.clearAll', 'Limpiar todo')}
                </button>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-1 space-y-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <FaBell className="mx-auto mb-2 text-slate-400 dark:text-white/20" size={28} />
                  <div className="text-xs text-slate-500 dark:text-white/50">{t('notifications.empty', 'Sin notificaciones')}</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`block px-3.5 py-2.5 rounded-[18px] transition-all ${!n.read ? 'bg-white/70 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm' : 'hover:bg-white/40 dark:hover:bg-white/10 text-slate-700 dark:text-white/80'}`}
                  >
                    <div className={`text-xs mb-1 leading-snug break-words ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-white/70'}`}>
                      {n.text}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-white/40">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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