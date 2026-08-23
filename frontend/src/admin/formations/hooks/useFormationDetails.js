import { useState, useCallback } from 'react';
import api from '../../../services/api';
import useFetchState from '../../../util/useFetchState';
import tokenService from '../../../services/token.service';
import { useSubscription } from '../../../hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ToastProvider';
import { saveBlobFile } from '../../../util/downloadExportFile';

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
      await saveBlobFile(res.data, `certificate_${attendanceId}.pdf`, 'application/pdf');
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error(t('formationDetails.downloadPdfError', 'Error al descargar el PDF.'));
    }
  };

  const downloadOfficialSheet = async () => {
    try {
      const res = await api.get(`/exports/formations/${id}/official-sheet`, { responseType: 'blob' });
      const safeName = (formation?.name || 'FOR99').replace(/[^a-zA-Z0-9_-]/g, '_');
      await saveBlobFile(res.data, `FOR99_${safeName}_${id}.xls`, 'application/vnd.ms-excel');
      toast.success(t('formationDetails.officialSheetDownloaded', 'Registro oficial FOR 99 descargado con éxito.'));
    } catch (err) {
      console.error("Error downloading official sheet:", err);
      let errorMsg = t('formationDetails.downloadOfficialSheetError', 'Error al descargar el registro oficial FOR 99.');
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch (parseError) {
          console.debug("Could not parse error response blob as JSON:", parseError);
        }
      }
      toast.error(errorMsg);
    }
  };

  const handleCloseFormation = async ({ signature, observations, trainerName, location }) => {
    try {
      const res = await api.post(`/formations/${id}/close`, {
        signature,
        observations,
        trainerName,
        location
      });
      setFormation(res.data);
      toast.success(t('formationDetails.closeSuccess', 'Formación finalizada y certificada con éxito.'));
      return true;
    } catch (err) {
      console.error("Error closing formation:", err);
      const msg = err.response?.data?.message || t('formationDetails.closeError', 'Error al finalizar la formación.');
      toast.error(msg);
      return false;
    }
  };

  const hasAttendees = (formation?.attendances?.length || 0) > 0;
  const allAttendeesCompleted = hasAttendees && formation.attendances.every(
    (a) => a.checkOutDate && a.signature
  );
  const canCloseFormation = !formation?.isClosed && allAttendeesCompleted;

  return {
    formation,
    allUsers,
    isAddingUser,
    handleAddUser,
    handleRemoveUser,
    handleDeleteFormation,
    downloadSignaturePdf,
    downloadOfficialSheet,
    handleCloseFormation,
    allAttendeesCompleted,
    canCloseFormation
  };
}
