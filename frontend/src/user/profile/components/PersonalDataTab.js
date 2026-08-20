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

  return (
    <div className="p-1 p-md-3">
      <h5 className="text-xl font-bold mb-4 flex items-center text-slate-800 drop-shadow-sm">
        <FaUser className="mr-3 text-[#8a9e29] text-2xl" /> 
        {t('profile.personalInformation', 'Información Personal del Usuario')}
      </h5>
      
      <div className="row g-3 mb-5">
        
        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaUser size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.username', 'Usuario')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate">{userData?.username || "-"}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaEnvelope size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.email', 'Correo Electrónico')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate" title={userData?.email || "-"}>{userData?.email || "-"}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaUser size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.firstName', 'Nombre')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate">{userData?.firstName || "-"}</div>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaUser size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.lastName', 'Apellidos')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate">{userData?.lastName || "-"}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaIdBadge size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.personalCode', 'Código Personal')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate">{userData?.personalCode || "-"}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-2 px-md-3 da-glass-panel d-flex align-items-center gap-2 h-100">
            <div className="p-2 rounded-circle bg-light text-[#8a9e29] flex-shrink-0">
              <FaShieldAlt size={18} />
            </div>
            <div className="overflow-hidden w-100">
              <div className="text-muted fw-semibold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>{t('users.roleAuthority', 'Rol / Autoridad')}</div>
              <div className="fs-6 fw-bold text-dark text-truncate">{userData?.authority?.authority || "USER"}</div>
            </div>
          </div>
        </div>

      </div>

      <h5 className="text-xl font-bold mb-4 flex items-center text-slate-800 drop-shadow-sm">
        <FaBell className="mr-3 text-[#8a9e29] text-2xl" /> 
        {t('profile.notificationPreferences', 'Preferencias de Notificación')}
      </h5>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <div className="p-3.5 da-glass-panel flex items-center justify-between gap-3 h-full rounded-2xl">
            <div className="flex-1 min-w-0 pr-1">
              <div className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-sm sm:text-base">
                <FaEnvelope className="text-[#8a9e29] flex-shrink-0" /> 
                <span className="truncate">{t('profile.emailNotifications', 'Notificaciones por Correo')}</span>
              </div>
              <div className="text-slate-500 text-xs sm:text-sm leading-tight">{t('profile.notifyEmailDesc', 'Recibir avisos en tu bandeja de entrada')}</div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('emailNotificationsEnabled')}
              disabled={updating}
              aria-label={t('profile.toggleEmailAria', 'Alternar notificaciones por correo')}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50 ${userData?.emailNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${userData?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div>
          <div className="p-3.5 da-glass-panel flex items-center justify-between gap-3 h-full rounded-2xl">
            <div className="flex-1 min-w-0 pr-1">
              <div className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-sm sm:text-base">
                <FaMobileAlt className="text-[#8a9e29] flex-shrink-0" /> 
                <span className="truncate">{t('profile.pushNotifications', 'Notificaciones Push')}</span>
              </div>
              <div className="text-slate-500 text-xs sm:text-sm leading-tight">{t('profile.notifyPushDesc', 'Recibir avisos en tu dispositivo')}</div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('pushNotificationsEnabled')}
              disabled={updating}
              aria-label={t('profile.togglePushAria', 'Alternar notificaciones push')}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#b3c34c]/50 ${userData?.pushNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${userData?.pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
