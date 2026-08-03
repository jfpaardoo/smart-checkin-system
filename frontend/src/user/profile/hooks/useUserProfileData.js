import { useState, useCallback, useEffect } from "react";

export function useUserProfileData(jwt, t, toast) {
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formations, setFormations] = useState([]);

  const fetchProfileData = useCallback(() => {
    setLoadingUser(true);
    fetch("/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('genericError', 'Error al cargar perfil'));
        return res.json();
      })
      .then((data) => {
        setUserData(data);
        setLoadingUser(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoadingUser(false);
      });
  }, [jwt, t, toast]);

  const fetchMyFormations = useCallback(() => {
    setLoadingFormations(true);
    fetch("/api/v1/users/me/formations", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('genericError', 'Error al cargar formaciones'));
        return res.json();
      })
      .then((data) => {
        setFormations(data || []);
        setLoadingFormations(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoadingFormations(false);
      });
  }, [jwt, t, toast]);

  useEffect(() => {
    if (jwt) {
      fetchProfileData();
      fetchMyFormations();
    }
  }, [jwt, fetchProfileData, fetchMyFormations]);

  return { loadingUser, loadingFormations, userData, setUserData, formations, setFormations, fetchProfileData };
}
