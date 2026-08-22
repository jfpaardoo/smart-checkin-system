import React, { useState } from "react";
import { FaUser, FaEnvelope, FaBell, FaMobileAlt, FaIdBadge, FaShieldAlt } from "react-icons/fa";
import { CardGhostLoader } from "../../../components/GhostLoader";
import { useToast } from "../../../components/ToastProvider";
import api from "../../../services/api";

export default function PersonalDataTab({ loadingUser, userData, setUserData, t }) {
  const toast = useToast();
  const [updating, setUpdating] = useState(false);

  if (loadingUser) {
    return <CardGhostLoader />;
  }

  const handleToggleNotification = async (field) => {
    if (updating || !userData) return;
    setUpdating(true);
    
    const newValue = !userData[field];
    const updatedUser = { ...userData, [field]: newValue };

    try {
      const res = await api.put("/users/me", updatedUser);
      setUserData(res.data);
      toast.success(t('profile.preferencesUpdated', 'Preferencias actualizadas'));
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.preferencesUpdateError', 'Error al actualizar preferencias');
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const infoFields = [
    {
      icon: FaUser,
      label: t('users.username', 'Usuario'),
      value: userData?.username || "-"
    },
    {
      icon: FaEnvelope,
      label: t('users.email', 'Correo Electrónico'),
      value: userData?.email || "-"
    },
    {
      icon: FaUser,
      label: t('users.firstName', 'Nombre'),
      value: userData?.firstName || "-"
    },
    {
      icon: FaUser,
      label: t('users.lastName', 'Apellidos'),
      value: userData?.lastName || "-"
    },
    {
      icon: FaIdBadge,
      label: t('users.personalCode', 'Código Personal'),
      value: userData?.personalCode || "-"
    },
    {
      icon: FaShieldAlt,
      label: t('users.roleAuthority', 'Rol / Autoridad'),
      value: userData?.authority?.authority || "USER"
    }
  ];

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center text-slate-800 dark:text-slate-100">
          <FaUser className="mr-2.5 text-[#73841e] dark:text-[#d4e84a]" /> 
          <span>{t('profile.personalInformation', 'Información Personal del Usuario')}</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {infoFields.map((field, idx) => {
            const Icon = field.icon;
            return (
              <div key={idx} className="p-3.5 da-glass-panel flex items-center gap-3.5 rounded-2xl transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    {field.label}
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={field.value}>
                    {field.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center text-slate-800 dark:text-slate-100">
          <FaBell className="mr-2.5 text-[#73841e] dark:text-[#d4e84a]" /> 
          <span>{t('profile.notificationPreferences', 'Preferencias de Notificación')}</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 da-glass-panel flex items-center justify-between gap-3 rounded-2xl">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1 text-sm">
                <FaEnvelope className="text-[#73841e] dark:text-[#d4e84a] flex-shrink-0" /> 
                <span className="truncate">{t('profile.emailNotifications', 'Notificaciones por Correo')}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs leading-tight">
                {t('profile.notifyEmailDesc', 'Recibir avisos en tu bandeja de entrada')}
              </div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('emailNotificationsEnabled')}
              disabled={updating}
              aria-label={t('profile.toggleEmailAria', 'Alternar notificaciones por correo')}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50 ${userData?.emailNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${userData?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-4 da-glass-panel flex items-center justify-between gap-3 rounded-2xl">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1 text-sm">
                <FaMobileAlt className="text-[#73841e] dark:text-[#d4e84a] flex-shrink-0" /> 
                <span className="truncate">{t('profile.pushNotifications', 'Notificaciones Push')}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs leading-tight">
                {t('profile.notifyPushDesc', 'Recibir avisos en tu dispositivo')}
              </div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('pushNotificationsEnabled')}
              disabled={updating}
              aria-label={t('profile.togglePushAria', 'Alternar notificaciones push')}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50 ${userData?.pushNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${userData?.pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
