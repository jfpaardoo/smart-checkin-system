import { useState } from 'react';
import useFetchState from '../../../util/useFetchState';
import { parseApiError } from '../../../util/apiUtils';
import api from '../../../services/api';

const emptyItem = {
  id: null,
  name: "",
  description: "",
  formationDate: "",
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

  const handleRemoveExistingFile = (urlToRemove) => {
    setFormation({
      ...formation,
      documentUrls: (formation.documentUrls || []).filter(url => url !== urlToRemove)
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    const payload = {
      ...formation,
      existingDocumentUrls: formation.documentUrls || []
    };
    formData.append("formation", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    files.forEach(file => {
      formData.append("files", file);
    });

    api.request({
      url: "/api/v1/formations" + (formation.id ? "/" + formation.id : ""),
      method: formation.id ? "PUT" : "POST",
      data: formData,
      headers: {
        Accept: "application/json",
      }
    })
      .then((response) => {
        const json = response.data;
        if (json.message) {
          toast.error(parseApiError(json.message, t));
          setIsSaving(false);
        } else {
          toast.success(formation.id ? t('formations.updated') : t('formations.created'));
          setTimeout(() => { window.location.href = "/formations"; }, 1200);
        }
      })
      .catch(() => {
        toast.error(t('formations.connectionError'));
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
    handleRemoveExistingFile,
    handleSubmit
  };
};
