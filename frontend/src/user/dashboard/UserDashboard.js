import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { useSubscription } from '../../hooks/useSubscription';
import UserFormationsTable from './components/UserFormationsTable';
import CheckoutModal from './components/CheckoutModal';
import '../../App.css';
import '../../static/css/admin/adminPage.css';

export default function UserDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();

  const [attendances, setAttendances, isLoading] = useFetchState(
    [],
    "/api/v1/users/me/formations",
    jwt
  );

  const reloadUserFormations = () => {
    fetch("/api/v1/users/me/formations", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setAttendances(data))
      .catch((e) => console.error("Error updating user formations via WS", e));
  };

  useSubscription('/topic/formations', reloadUserFormations);

  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState(null);

  const openDetails = (attendance) => {
    setSelectedAtt(attendance);
    setDetailsModal(true);
  };

  const handleCheckoutSubmit = async (signatureBase64, manualCheckoutCode) => {
    try {
      const payload = {
        signature: signatureBase64,
        token: manualCheckoutCode || undefined
      };

      const response = await fetch(`/api/v1/formations/${selectedAtt.formation.id}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${jwt}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('dashboard.checkoutError'));
      }

      toast.success(t('dashboard.checkoutSuccess'));
      reloadUserFormations();

    } catch (error) {
      toast.error(error.message || t('dashboard.checkoutError'));
    }
  };

  return (
    <div className="ba-container">
      <div className="ba-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="mb-6 text-center font-extrabold text-slate-800 text-3xl drop-shadow-sm">
          {t('dashboard.hello')}, <span className="text-primary">{user?.username}</span>
        </h2>
        
        <div className="flex justify-center mb-10 w-full">
          <Link to="/checkin" className="ba-btn-primary px-8 py-4 text-lg font-bold rounded-full w-full md:w-auto text-center shadow-lg hover:shadow-xl transition-all duration-400 ease-out hover:-translate-y-1">
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
        />
      </div>

      <CheckoutModal 
        isOpen={detailsModal}
        onClose={() => setDetailsModal(false)}
        selectedAtt={selectedAtt}
        onSubmitCheckout={handleCheckoutSubmit}
      />
    </div>
  );
}