import { useState } from 'react';
import useFetchState from '../../../util/useFetchState';
import { parseApiError } from '../../../util/apiUtils';
import api from '../../../services/api';

const emptyItem = {
  id: null,
  name: "",
  description: "",
  formationDate: "",
  location: "BA VILLAFRANCA",
  trainer: "VICTOR PARDO",
  documentUrls: [],
};

export const useFormationEdit = (id, jwt, toast, t) => {
  const [formation, setFormation, loading] = useFetchState(
    emptyItem,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
    id
  );
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    setFormation({ ...formation, [name]: value });
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const handleRemoveNewFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveExistingFile = (urlToRemove) => {
    setFormation({
      ...formation,
      documentUrls: (formation.documentUrls || []).filter(url => url !== urlToRemove)
    });
  };

  const handleSubmit = (event, targetStatus = 'DRAFT') => {
    if (event) event.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    const payload = {
      ...formation,
      status: targetStatus,
      publishImmediately: targetStatus === 'PUBLISHED',
      existingDocumentUrls: formation.documentUrls || []
    };
    formData.append("formation", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    files.forEach(file => {
      formData.append("files", file);
    });

    api.request({
      url: "/formations" + (formation.id ? "/" + formation.id : ""),
      method: formation.id ? "PUT" : "POST",
      data: formData,
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      }
    })
      .then((response) => {
        const json = response.data;
        if (json.message) {
          toast.error(parseApiError(json.message, t));
          setIsSaving(false);
        } else {
          let successMsg;
          if (formation.id && formation.status !== 'DRAFT') {
            successMsg = t('formations.updated', 'Formación actualizada correctamente.');
          } else if (targetStatus === 'PUBLISHED') {
            successMsg = t('formations.publishedSuccess', '¡Formación guardada y publicada! Se ha notificado a los empleados.');
          } else if (formation.id) {
            successMsg = t('formations.updated', 'Formación actualizada correctamente.');
          } else {
            successMsg = t('formations.savedAsDraft', 'Formación guardada como borrador.');
          }
          toast.success(successMsg);
          setTimeout(() => { window.location.href = "/formations"; }, 1200);
        }
      })
      .catch((error) => {
        if (error?.response?.status === 400 && error?.response?.data?.message) {
          toast.error(error?.response?.data?.message);
        } else {
          toast.error(t('formations.connectionError'));
        }
        setIsSaving(false);
      });
  };

  return {
    formation,
    loading,
    isSaving,
    files,
    handleChange,
    handleFileChange,
    handleRemoveNewFile,
    handleRemoveExistingFile,
    handleSubmit
  };
};