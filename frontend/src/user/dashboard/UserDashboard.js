import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';
import UserFormationsTable from './components/UserFormationsTable';
import CheckoutModal from './components/CheckoutModal';
import FormationDetailsModal from './components/FormationDetailsModal';

export default function UserDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getUser();
  const user = tokenService.getUser();

  const [attendances, setAttendances, isLoading] = useFetchState(
    [],
    "/api/v1/users/me/formations",
    jwt
  );

  const reloadUserFormations = () => {
    api.get("/users/me/formations")
      .then((r) => setAttendances(r.data))
      .catch((e) => console.error("Error updating user formations via WS", e));
  };

  useSubscription('/topic/formations', reloadUserFormations);

  const [detailsModal, setDetailsModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState(null);

  const openDetails = (attendance) => {
    setSelectedAtt(attendance);
    setDetailsModal(true);
  };

  const handleOpenCheckout = (attendance) => {
    setSelectedAtt(attendance);
    setCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (signatureBase64, manualCheckoutCode) => {
    try {
      const payload = {
        signature: signatureBase64,
        token: manualCheckoutCode || undefined
      };

      await api.post(`/formations/${selectedAtt.formation.id}/checkout`, payload);

      toast.success(t('dashboard.checkoutSuccess'));
      setCheckoutModal(false);
      reloadUserFormations();

    } catch (error) {
      const msg = error.response?.data?.message || t('dashboard.checkoutError');
      toast.error(msg);
    }
  };

  return (
    <div className="da-container">
      <div className="da-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="mb-6 text-center font-extrabold text-slate-800 text-3xl drop-shadow-sm">
          {t('dashboard.hello')}, <span className="text-primary">{user?.username}</span>
        </h2>
        
        <div className="flex justify-center mb-10 w-full">
          <Link to="/checkin" className="da-btn-primary px-8 py-4 text-lg font-bold rounded-full w-full md:w-auto text-center shadow-lg hover:shadow-xl transition duration-400 ease-out hover:-translate-y-1">
            {t('dashboard.scannerButton')}
          </Link>
        </div>

        <h3 className="mb-4 text-slate-800 font-bold text-xl border-b border-slate-200 pb-3">
          {t('dashboard.myFormations')}
        </h3>
        
        <UserFormationsTable 
          attendances={attendances} 
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