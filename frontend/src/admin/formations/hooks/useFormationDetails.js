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
  const jwt = tokenService.getLocalAccessToken();

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
    api.get(`/api/v1/formations/${id}`)
      .then((response) => setFormation(response.data))
      .catch((e) => console.error("Error refreshing formation", e));
  }, [id, setFormation]);

  useSubscription(`/topic/formations/${id}`, reloadFormation);
  useSubscription('/topic/formations', reloadFormation);

  const handleAddUser = async (userId) => {
    if (!userId || isAddingUser) return;
    setIsAddingUser(true);
    try {
      const response = await fetch(`/api/v1/formations/${id}/attendances`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: Number(userId) }),
      });
      if (response.ok) {
        toast.success(t('formationDetails.userAdded', 'Usuario añadido correctamente.'));
        reloadFormation();
        return true;
      } else {
        const json = await response.json();
        toast.error(json.message || t('formationDetails.userAddError', 'Error al añadir usuario.'));
        return false;
      }
    } catch {
      toast.error(t('formationDetails.userAddError', 'Error al añadir usuario.'));
      return false;
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = (userId) => {
    toast.confirm(t('formationDetails.userRemoveConfirm', '¿Seguro que deseas eliminar este usuario de la formación?'), async () => {
      try {
        const response = await fetch(`/api/v1/formations/${id}/attendances/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          toast.success(t('formationDetails.userRemoved', 'Usuario eliminado correctamente.'));
          reloadFormation();
        } else {
          toast.error(t('formationDetails.userRemoveError', 'Error al eliminar usuario.'));
        }
      } catch {
        toast.error(t('formationDetails.userRemoveError', 'Error al eliminar usuario.'));
      }
    });
  };

  const handleDeleteFormation = () => {
    toast.confirm(t('formations.deleteConfirm', '¿Seguro que deseas eliminar esta formación?'), async () => {
      try {
        const response = await fetch(`/api/v1/formations/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          toast.success(t('formations.deleted', 'Formación eliminada correctamente'));
          window.location.href = "/formations";
        } else {
          toast.error(t('formations.deleteError', 'Error al eliminar la formación'));
        }
      } catch {
        toast.error(t('formations.deleteError', 'Error al eliminar la formación'));
      }
    });
  };

  const downloadSignaturePdf = async (attendanceId) => {
    try {
      const response = await fetch(`/api/v1/certificates/attendance/${attendanceId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${attendanceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        toast.error(t('formationDetails.downloadPdfError', 'Error al descargar el PDF.'));
      }
    } catch (error) {
      console.error("Error downloading PDF", error);
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
