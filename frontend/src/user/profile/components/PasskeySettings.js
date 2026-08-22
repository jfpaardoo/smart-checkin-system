import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaKey, FaFingerprint, FaTrash, FaPlus, FaLaptop, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';
import api from '../../../services/api';
import { 
  isWebAuthnSupported, 
  registerPasskey, 
  detectDeviceType 
} from '../../../util/webauthnUtil';
import dayjs from 'dayjs';

function getDeviceIcon(deviceType = '') {
  if (deviceType.includes('Apple') || deviceType.includes('Android') || deviceType.includes('Mobile')) {
    return <FaMobileAlt className="text-blue-500 text-lg flex-shrink-0" />;
  }
  if (deviceType.includes('Windows') || deviceType.includes('Mac') || deviceType.includes('Linux')) {
    return <FaLaptop className="text-[#73841e] dark:text-[#d4e84a] text-lg flex-shrink-0" />;
  }
  return <FaKey className="text-amber-500 text-lg flex-shrink-0" />;
}

export default function PasskeySettings({ t, toast }) {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showModal, setShowModal] = useState(false);
  const isSupported = isWebAuthnSupported();

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await api.get('/auth/webauthn/credentials');
      setPasskeys(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching passkeys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleStartRegister = () => {
    setNickname(`Mi ${detectDeviceType()}`);
    setShowModal(true);
  };

  const handleConfirmRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await registerPasskey(nickname.trim());
      toast.success(t('passkeys.registerSuccess', '¡Llave de acceso vinculada con éxito!'));
      setShowModal(false);
      fetchPasskeys();
    } catch (error) {
      console.warn('Passkey registration failed or cancelled:', error);
      if (error.name !== 'NotAllowedError' && !error.message?.includes('cancelled')) {
        toast.error(error.message || t('passkeys.registerError', 'Error al vincular la llave de acceso.'));
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (id, name) => {
    try {
      await api.delete(`/auth/webauthn/credentials/${id}`);
      toast.success(t('passkeys.deleteSuccess', `Llave "${name}" eliminada.`));
      fetchPasskeys();
    } catch (error) {
      console.error('Error deleting passkey:', error);
      toast.error(t('passkeys.deleteError', 'No se pudo eliminar la llave de acceso.'));
    }
  };

  const renderPasskeyList = () => {
    if (loading) {
      return (
        <div className="text-center py-6 text-slate-400 text-xs">
          {t('common.loading', 'Cargando llaves de acceso...')}
        </div>
      );
    }

    if (passkeys.length === 0) {
      return (
        <div className="text-center py-6 px-4 bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/40 dark:border-white/10">
          <FaKey className="text-slate-300 dark:text-slate-600 text-3xl mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 m-0">
            {t('passkeys.empty', 'No tienes ninguna llave de acceso vinculada a tu cuenta.')}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0 mt-1">
            {t('passkeys.emptySub', 'Vincula este dispositivo para iniciar sesión en un solo toque.')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {passkeys.map((pk) => (
          <div 
            key={pk.id} 
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-700/80 border border-white/70 dark:border-white/10 transition-colors shadow-2xs gap-2.5 w-full min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-700 border border-white dark:border-white/10 shadow-2xs flex-shrink-0">
                {getDeviceIcon(pk.deviceType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate" title={pk.nickname}>
                  {pk.nickname}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t('passkeys.created', 'Vinculada:')} {dayjs(pk.createdAt).format('DD/MM/YYYY')} • {pk.deviceType}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDeletePasskey(pk.id, pk.nickname)}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-500/15 transition-colors flex-shrink-0 cursor-pointer border-0 bg-transparent"
              title={t('common.delete', 'Eliminar llave')}
              aria-label={t('common.delete', 'Eliminar llave')}
            >
              <FaTrash size={13} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl rounded-3xl border border-white/60 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Cabecera de la tarjeta */}
        <div className="flex items-center gap-3 mb-3 border-b border-white/40 dark:border-white/10 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <FaFingerprint size={20} className="text-[#73841e] dark:text-[#d4e84a]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg m-0 leading-tight">
              {t('passkeys.title', 'Llaves de Acceso (Passkeys & Biometría)')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              {t('passkeys.subtitle', 'Acceso seguro sin contraseñas mediante Face ID, Touch ID o Windows Hello.')}
            </p>
          </div>
        </div>

        {!isSupported ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs my-3 flex items-center gap-2">
            <FaShieldAlt className="text-amber-600 dark:text-amber-400 text-base flex-shrink-0" />
            <span>{t('passkeys.unsupported', 'Tu navegador o dispositivo actual no admite el estándar FIDO2 / WebAuthn.')}</span>
          </div>
        ) : (
          <div className="space-y-3 my-3">
            {renderPasskeyList()}
          </div>
        )}
      </div>

      {/* Botón de añadir llave */}
      {isSupported && (
        <div className="pt-3 border-t border-white/40 dark:border-white/10">
          <button
            type="button"
            onClick={handleStartRegister}
            disabled={registering}
            className="da-btn-primary w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer border-0"
          >
            <FaPlus size={12} className="flex-shrink-0" />
            <span className="leading-tight">{t('passkeys.addBtn', 'Vincular este dispositivo (Passkey)')}</span>
          </button>
        </div>
      )}

      {/* Modal / Diálogo para asignar nombre a la Passkey */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full border border-white/80 dark:border-white/10 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center flex-shrink-0">
                <FaFingerprint size={20} className="text-[#73841e] dark:text-[#d4e84a]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base m-0">
                  {t('passkeys.modalTitle', 'Vincular Llave de Acceso')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  {t('passkeys.modalSubtitle', 'Introduce un nombre descriptivo para identificar este dispositivo.')}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmRegister} className="space-y-4">
              <div>
                <label htmlFor="passkeyNicknameInput" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t('passkeys.nicknameLabel', 'Nombre de la Llave / Dispositivo')}
                </label>
                <input
                  id="passkeyNicknameInput"
                  name="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 focus:border-[#b3c34c] focus:ring-2 focus:ring-[#b3c34c]/20 outline-none text-xs font-semibold text-slate-800 dark:text-slate-100"
                  placeholder={t('profile.passkeyNamePlaceholder', 'Ej. Mi iPhone, Portátil Trabajo...')}
                  aria-label={t('passkeys.nicknameLabel', 'Nombre de la Llave / Dispositivo')}
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                {t('passkeys.modalPrompt', 'Al pulsar en continuar, tu navegador te pedirá verificar tu identidad mediante Touch ID, Face ID, Windows Hello o PIN del dispositivo.')}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={registering}
                  className="px-4 py-2 rounded-full font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer border-0 bg-transparent"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={registering || !nickname.trim()}
                  className="px-5 py-2 rounded-full font-bold text-xs text-slate-950 bg-[#b3c34c] hover:bg-[#a1b140] transition-colors duration-200 shadow-xs flex items-center gap-2 cursor-pointer border-0"
                >
                  <FaKey size={11} />
                  <span>{registering ? t('passkeys.registering', 'Verificando...') : t('common.continue', 'Continuar')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
