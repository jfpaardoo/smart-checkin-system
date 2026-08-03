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
      <div className="ba-card home-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="home-title mb-4" style={{ color: '#2c3e50' }}>{t('dashboard.hello')}, {user?.username}</h2>
        
        <div className="d-flex justify-content-center mb-5">
          <Link to="/checkin" className="ba-btn ba-btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px' }}>
            {t('dashboard.scannerButton')}
          </Link>
        </div>

        <h3 className="mb-3" style={{ color: '#2c3e50', fontWeight: 600 }}>{t('dashboard.myFormations')}</h3>
        
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