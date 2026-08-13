import { useState, useCallback, useEffect, useRef } from "react";
import api from "../../../services/api";

export function useUserProfileData(jwt, t, toast) {
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formations, setFormations] = useState([]);

  // Estabilizar t y toast con refs para que no sean dependencias del useCallback
  const tRef = useRef(t);
  const toastRef = useRef(toast);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const fetchProfileData = useCallback(() => {
    setLoadingUser(true);
    api.get("/users/me")
      .then((res) => {
        setUserData(res.data);
        setLoadingUser(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || tRef.current('genericError', 'Error al cargar perfil');
        toastRef.current.error(msg);
        setLoadingUser(false);
      });
  }, []); // Sin dependencias externas — siempre estable

  const fetchMyFormations = useCallback(() => {
    setLoadingFormations(true);
    api.get("/users/me/formations")
      .then((res) => {
        setFormations(res.data || []);
        setLoadingFormations(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || tRef.current('genericError', 'Error al cargar formaciones');
        toastRef.current.error(msg);
        setLoadingFormations(false);
      });
  }, []); // Sin dependencias externas — siempre estable

  // Usar jwt.username (string) como dep estable en vez del objeto entero
  const usernameKey = jwt?.username ?? null;

  useEffect(() => {
    if (usernameKey) {
      fetchProfileData();
      fetchMyFormations();
    }
  }, [usernameKey, fetchProfileData, fetchMyFormations]);

  return { loadingUser, loadingFormations, userData, setUserData, formations, setFormations, fetchProfileData };
}
