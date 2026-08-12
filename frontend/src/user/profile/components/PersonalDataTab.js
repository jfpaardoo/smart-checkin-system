import React, { useState } from "react";
import { FaUser, FaEnvelope, FaBell, FaMobileAlt, FaIdBadge, FaShieldAlt } from "react-icons/fa";
import { CardGhostLoader } from "../../../components/GhostLoader";
import tokenService from "../../../services/token.service";
import { useToast } from "../../../components/ToastProvider";

export default function PersonalDataTab({ loadingUser, userData, setUserData, t }) {
  const jwt = tokenService.getLocalAccessToken();
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
      const res = await fetch(`/api/v1/users/me`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedUser)
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        toast.success(t('profile.preferencesUpdated', 'Preferencias actualizadas'));
      } else {
        toast.error(t('profile.preferencesUpdateError', 'Error al actualizar preferencias'));
      }
    } catch (err) {
      console.error("Error al actualizar preferencias:", err);
      toast.error(t('profile.connectionError', 'Error de conexión'));
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
        Preferencias de Notificación
      </h5>
      
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="p-3 da-glass-panel d-flex items-center justify-content-between h-100">
            <div>
              <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                <FaEnvelope className="text-[#8a9e29]" /> Notificaciones por Correo
              </div>
              <div className="text-muted small">Recibir avisos en tu bandeja de entrada</div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('emailNotificationsEnabled')}
              disabled={updating}
              aria-label="Toggle email notifications"
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${userData?.emailNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${userData?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-3 da-glass-panel d-flex items-center justify-content-between h-100">
            <div>
              <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                <FaMobileAlt className="text-[#8a9e29]" /> Notificaciones Push
              </div>
              <div className="text-muted small">Recibir avisos en tu dispositivo</div>
            </div>
            <button type="button"
              onClick={() => handleToggleNotification('pushNotificationsEnabled')}
              disabled={updating}
              aria-label="Toggle push notifications"
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${userData?.pushNotificationsEnabled ? 'bg-[#b3c34c]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${userData?.pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
