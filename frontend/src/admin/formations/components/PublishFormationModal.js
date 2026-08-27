import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket,
  faUsers,
  faUserCheck,
  faSearch,
  faBullhorn,
  faCalendarAlt,
  faLocationDot,
  faChalkboardUser,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import GlassModal from '../../../components/GlassModal';
import GlassButton from '../../../components/GlassButton';
import { useToast } from '../../../components/ToastProvider';
import api from '../../../services/api';
import { formatDate } from '../../../utils/dateUtils';

export default function PublishFormationModal({ isOpen, onClose, formation, onPublishSuccess }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [notifyAll, setNotifyAll] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Load available active employees when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      api.get('/users')
        .then((res) => {
          const activeEmployees = (res.data || []).filter(
            (u) => u.authority?.authority !== 'ADMIN' && u.isApproved !== false
          );
          setUsers(activeEmployees);
          // By default, select all active employees
          setSelectedUserIds(activeEmployees.map((u) => u.id));
        })
        .catch((err) => {
          console.error('Error fetching employees for publication:', err);
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    }
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.personalCode?.includes(term)
    );
  }, [users, searchTerm]);

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUserIds(users.map((u) => u.id));
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  const handlePublish = async () => {
    if (!formation?.id) return;
    if (!notifyAll && selectedUserIds.length === 0) {
      toast.error(t('formation.selectAtLeastOneUser', 'Debes seleccionar al menos un empleado para convocar.'));
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        notifyAll: notifyAll,
        targetUserIds: notifyAll ? null : selectedUserIds
      };

      const res = await api.post(`/formations/${formation.id}/publish`, payload);
      toast.success(t('formation.publishedSuccess', '¡Formación publicada con éxito! Se han enviado las notificaciones.'));
      if (onPublishSuccess) {
        onPublishSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || t('formation.publishError', 'Error al publicar la formación.');
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const renderEmployeeList = () => {
    if (loadingUsers) {
      return (
        <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span>{t('common.loading', 'Cargando empleados...')}</span>
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <p className="text-center text-xs text-slate-400 py-4 m-0">
          {t('users.noUsersFound', 'No se encontraron empleados coincidentes.')}
        </p>
      );
    }

    return (
      <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {filteredUsers.map((u) => {
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <label
              key={u.id}
              className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'bg-primary/10 border-primary/40 text-slate-900 dark:text-slate-100'
                  : 'bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {u.firstName?.charAt(0) || u.username?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold m-0 truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 m-0 truncate">
                    @{u.username} • Cód: {u.personalCode}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                aria-label={`Seleccionar a ${u.firstName || ''} ${u.lastName || ''} (@${u.username})`}
                onChange={() => handleToggleUser(u.id)}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer ms-2"
              />
            </label>
          );
        })}
      </div>
    );
  };

  if (!formation) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <FontAwesomeIcon icon={faRocket} />
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {t('formation.publishTitle', 'Publicar Formación')}
          </span>
        </div>
      }
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Resumen de la formación */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-white/10 shadow-xs flex flex-col gap-2">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 m-0">
            {formation.name}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-primary" />
              <span>{formatDate(formation.formationDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-rose-500" />
              <span className="truncate">{formation.location || 'BA VILLAFRANCA'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChalkboardUser} className="text-sky-500" />
              <span className="truncate">{formation.trainer || 'VICTOR PARDO'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="text-emerald-500" />
              <span>{users.length} {t('formation.activeEmployees', 'empleados activos')}</span>
            </div>
          </div>
        </div>

        {/* Banner informativo de orquestación multicanal */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3">
          <FontAwesomeIcon icon={faBullhorn} className="text-emerald-600 dark:text-emerald-400 mt-1 shrink-0 text-base" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <p className="font-bold m-0 mb-0.5">{t('formation.publishNoticeTitle', 'Difusión Automática Multi-Canal')}</p>
            <p className="m-0 leading-relaxed text-[11px] opacity-90">
              {t('formation.publishNoticeDesc', 'Al publicar, la formación se hará visible inmediatamente en el Dashboard de los empleados. Se despacharán notificaciones por Web Push, Email y actualización en tiempo real por WebSocket.')}
            </p>
          </div>
        </div>

        {/* Selector de Modo de Destinatarios */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t('formation.targetAudience', 'Destinatarios de la Convocatoria')}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNotifyAll(true)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                notifyAll
                  ? 'bg-primary/15 dark:bg-primary/25 border-primary text-slate-900 dark:text-white font-bold ring-2 ring-primary/40 shadow-xs'
                  : 'bg-white/50 dark:bg-slate-800/50 border-white/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/80'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className={notifyAll ? 'text-primary' : 'text-slate-400'} size="lg" />
              <span className="text-xs">{t('formation.allEmployees', 'Todos los Empleados')}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">({users.length} activos)</span>
            </button>

            <button
              type="button"
              onClick={() => setNotifyAll(false)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                !notifyAll
                  ? 'bg-primary/15 dark:bg-primary/25 border-primary text-slate-900 dark:text-white font-bold ring-2 ring-primary/40 shadow-xs'
                  : 'bg-white/50 dark:bg-slate-800/50 border-white/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/80'
              }`}
            >
              <FontAwesomeIcon icon={faUserCheck} className={!notifyAll ? 'text-primary' : 'text-slate-400'} size="lg" />
              <span className="text-xs">{t('formation.customSelection', 'Personalizar Asistentes')}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">({selectedUserIds.length} seleccionados)</span>
            </button>
          </div>
        </div>

        {/* Panel de selección individual de empleados */}
        {!notifyAll && (
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-white/10 flex flex-col gap-3 da-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder={t('common.search', 'Buscar por nombre, usuario o código...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="da-input pl-8 py-1.5 text-xs w-full rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-primary hover:underline bg-primary/10 rounded-lg cursor-pointer"
                >
                  {t('common.selectAll', 'Todos')}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-500 hover:underline bg-rose-500/10 rounded-lg cursor-pointer"
                >
                  {t('common.deselectAll', 'Ninguno')}
                </button>
              </div>
            </div>

            {renderEmployeeList()}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-white/20 dark:border-white/10">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={publishing}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl"
          >
            {t('common.cancel', 'Cancelar')}
          </GlassButton>
          <GlassButton
            type="button"
            variant="primary"
            onClick={handlePublish}
            loading={publishing}
            loadingText={t('formation.publishing', 'Publicando y notificando...')}
            icon={<FontAwesomeIcon icon={faRocket} />}
            className="px-6 py-2.5 text-xs font-bold rounded-2xl shadow-md"
          >
            {t('formation.confirmPublish', 'Confirmar y Publicar')}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
