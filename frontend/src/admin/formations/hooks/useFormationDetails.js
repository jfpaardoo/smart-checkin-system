import { useState, useCallback } from 'react';
import api from '../../../services/api';
import useFetchState from '../../../util/useFetchState';
import tokenService from '../../../services/token.service';
import { useSubscription } from '../../../hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';

export function useFormationDetails(id) {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getUser();

  const [formation, setFormation] = useFetchState(
    null,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
    id
  );

  const [allUsers] = useFetchState(
    [],
    `/api/v1/users`,
    jwt,
    null,
    null
  );

  const [isAddingUser, setIsAddingUser] = useState(false);

  const reloadFormation = useCallback(() => {
    api.get(`/formations/${id}`)
      .then((response) => setFormation(response.data))
      .catch((e) => console.error("Error refreshing formation", e));
  }, [id, setFormation]);

  useSubscription(`/topic/formations/${id}`, reloadFormation);
  useSubscription('/topic/formations', reloadFormation);

  const handleAddUser = async (userId) => {
    if (!userId || isAddingUser) return;
    setIsAddingUser(true);
    try {
      await api.post(`/formations/${id}/attendances`, { userId: Number(userId) });
      toast.success(t('formationDetails.userAdded', 'Usuario añadido correctamente.'));
      reloadFormation();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || t('formationDetails.userAddError', 'Error al añadir usuario.');
      toast.error(msg);
      return false;
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = (userId) => {
    toast.confirm(t('formationDetails.userRemoveConfirm', '¿Seguro que deseas eliminar este usuario de la formación?'), async () => {
      try {
        await api.delete(`/formations/${id}/attendances/${userId}`);
        toast.success(t('formationDetails.userRemoved', 'Usuario eliminado correctamente.'));
        reloadFormation();
      } catch (err) {
        const msg = err.response?.data?.message || t('formationDetails.userRemoveError', 'Error al eliminar usuario.');
        toast.error(msg);
      }
    });
  };

  const handleDeleteFormation = () => {
    toast.confirm(t('formations.deleteConfirm', '¿Seguro que deseas eliminar esta formación?'), async () => {
      try {
        await api.delete(`/formations/${id}`);
        toast.success(t('formations.deleted', 'Formación eliminada correctamente'));
        window.location.href = "/formations";
      } catch (err) {
        const msg = err.response?.data?.message || t('formations.deleteError', 'Error al eliminar la formación');
        toast.error(msg);
      }
    });
  };

  const downloadSignaturePdf = async (attendanceId) => {
    try {
      const res = await api.get(`/certificates/attendance/${attendanceId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${attendanceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error(t('formationDetails.downloadPdfError', 'Error al descargar el PDF.'));
    }
  };

  return {
    formation,
    allUsers,
    isAddingUser,
    handleAddUser,
    handleRemoveUser,
    handleDeleteFormation,
    downloadSignaturePdf
  };
}
