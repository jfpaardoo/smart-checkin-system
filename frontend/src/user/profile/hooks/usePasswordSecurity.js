import { useState, useRef, useEffect } from "react";
import api from "../../../services/api";
import tokenService from "../../../services/token.service";

export function usePasswordSecurity(jwt, t, toast) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Estabilizar t y toast con refs para no crear funciones nuevas en cada render
  const tRef = useRef(t);
  const toastRef = useRef(toast);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      toastRef.current.error(tRef.current('profile.enterCurrentPassword', 'Introduce la contraseña actual'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toastRef.current.error(tRef.current('profile.passwordMinLength', 'La nueva contraseña debe tener al menos 6 caracteres'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toastRef.current.error(tRef.current('profile.passwordsDoNotMatch', 'Las contraseñas no coinciden'));
      return;
    }

    setSubmittingPassword(true);
    api.put("/users/me/password", { currentPassword, newPassword, confirmPassword })
      .then(() => {
        toastRef.current.success(tRef.current('profile.passwordSuccessLogout', 'Contraseña actualizada. Por seguridad, debes iniciar sesión de nuevo.'));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          tokenService.removeUser();
          window.location.href = "/login";
        }, 1500);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || tRef.current('profile.changePasswordError', 'Error al cambiar contraseña');
        toastRef.current.error(msg);
        setSubmittingPassword(false);
      });
  };

  return {
    passwordForm,
    setPasswordForm,
    submittingPassword,
    handlePasswordChangeSubmit,
  };
}
