import { useState } from 'react';
import useFetchState from '../../../util/useFetchState';
import useFetchData from '../../../util/useFetchData';
import { parseApiError } from '../../../util/apiUtils';
import api from '../../../services/api';

const emptyItem = {
  id: null,
  username: "",
  password: "",
  email: "",
  personalCode: "",
  firstName: "",
  lastName: "",
  isWorking: false,
  authority: null,
};

export const useUserEdit = (id, jwt, toast, t) => {

  const [user, setUser, loading] = useFetchState(
    emptyItem,
    `/api/v1/users/${id}`,
    jwt,
    null,
    null,
    id
  );
  
  const auths = useFetchData(`/api/v1/users/authorities`, jwt);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    
    if (name === "personalCode") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    if (name === "authority") {
      const auth = auths.find((a) => a.id === Number(value));
      setUser({ ...user, authority: auth });
    } else {
      setUser({ ...user, [name]: value });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSaving(true);

    api.request({
      url: "/api/v1/users" + (user.id ? "/" + user.id : ""),
      method: user.id ? "PUT" : "POST",
      data: user,
      headers: {
        Accept: "application/json",
      }
    })
      .then((response) => {
        const json = response.data;
        if (json.message) {
          toast.error(parseApiError(json.message, t, { 'authority': t('users.role') }));
          setIsSaving(false);
        } else {
          toast.success(user.id ? t('users.updated') : t('users.created'));
          setTimeout(() => { window.location.href = "/users"; }, 1200);
        }
      })
      .catch(() => {
        toast.error(t('users.connectionError'));
        setIsSaving(false);
      });
  };

  return {
    user,
    auths,
    loading,
    isSaving,
    handleChange,
    handleSubmit
  };
};
