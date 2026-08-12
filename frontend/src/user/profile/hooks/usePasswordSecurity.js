import { useState } from "react";
import tokenService from "../../../services/token.service";

export function usePasswordSecurity(jwt, t, toast) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      toast.error(t('profile.enterCurrentPassword', 'Introduce la contraseña actual'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength', 'La nueva contraseña debe tener al menos 6 caracteres'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch', 'Las contraseñas no coinciden'));
      return;
    }

    setSubmittingPassword(true);
    fetch("/api/v1/users/me/password", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || t('profile.changePasswordError', 'Error al cambiar contraseña'));
        }
        toast.success(t('profile.passwordSuccessLogout', 'Contraseña actualizada con éxito. Por seguridad, debes iniciar sesión de nuevo.'));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          tokenService.removeUser();
          window.location.href = "/login";
        }, 1500);
      })
      .catch((err) => {
        toast.error(err.message);
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
