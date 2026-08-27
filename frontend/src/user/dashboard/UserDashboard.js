import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../components/ToastProvider';
import tokenService from '../../services/token.service';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';
import UserFormationsTable from './components/UserFormationsTable';
import CheckoutModal from './components/CheckoutModal';
import FormationDetailsModal from './components/FormationDetailsModal';

export default function UserDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const user = tokenService.getUser();

  const [attendances, setAttendances] = useState([]);
  const [allPublishedFormations, setAllPublishedFormations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback((showGhost = false) => {
    if (showGhost) setIsLoading(true);
    Promise.all([
      api.get("/users/me/formations").catch(() => ({ data: [] })),
      api.get("/formations").catch(() => ({ data: [] }))
    ]).then(([attRes, formRes]) => {
      setAttendances(attRes.data || []);
      setAllPublishedFormations(formRes.data || []);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Sincronización en tiempo real vía WebSockets (STOMP)
  useSubscription('/topic/formations', () => loadData(false));
  useSubscription(user?.username ? `/topic/notifications/${user.username}` : null, () => loadData(false));

  const [detailsModal, setDetailsModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState(null);

  const openDetails = (item) => {
    setSelectedAtt(item);
    setDetailsModal(true);
  };

  const handleOpenCheckout = (item) => {
    setSelectedAtt(item);
    setCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (signatureBase64, manualCheckoutCode) => {
    try {
      const payload = {
        signature: signatureBase64,
        token: manualCheckoutCode || undefined
      };

      await api.post(`/formations/${selectedAtt.formation.id}/checkout`, payload);

      toast.success(t('dashboard.checkoutSuccess', '¡Checkout completado con éxito!'));
      setCheckoutModal(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message 
        || (typeof error.response?.data === 'string' ? error.response.data : null) 
        || error.message 
        || t('dashboard.checkoutError', 'Error al realizar el checkout.');
      toast.error(msg);
    }
  };

  return (
    <div className="da-container">
      <div className="da-card">
        {/* Header de Bienvenida Premium */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-6 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#b3c34c]/30 to-emerald-500/20 text-[#677717] dark:text-[#d4e84a] flex items-center justify-center text-xl shadow-xs border border-white/60 dark:border-white/10 shrink-0">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 m-0 tracking-tight">
                {t('dashboard.hello', 'Hola')}, <span className="text-[#73841e] dark:text-[#d4e84a]">{user?.firstName || user?.username}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                {t('dashboard.welcomeSub', 'Consulta tus próximas convocatorias, sesiones en curso y descarga tus diplomas.')}
              </p>
            </div>
          </div>

          <Link 
            to="/checkin" 
            className="da-btn-primary px-6 py-3 text-xs sm:text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-decoration-none shrink-0 w-full sm:w-auto"
          >
            <FontAwesomeIcon icon={faQrcode} className="text-base" />
            <span>{t('dashboard.scannerButton', 'Escanear QR para Fichar')}</span>
          </Link>
        </div>

        {/* Sección de Formaciones del Empleado */}
        <UserFormationsTable 
          attendances={attendances}
          allPublishedFormations={allPublishedFormations}
          isLoading={isLoading} 
          onOpenDetails={openDetails} 
          onCheckout={handleOpenCheckout}
        />
      </div>

      <FormationDetailsModal 
        isOpen={detailsModal}
        onClose={() => setDetailsModal(false)}
        selectedAtt={selectedAtt}
      />

      <CheckoutModal 
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        selectedAtt={selectedAtt}
        onSubmitCheckout={handleCheckoutSubmit}
      />
    </div>
  );
}