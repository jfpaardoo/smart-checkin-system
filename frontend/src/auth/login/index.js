import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import FormGenerator from "../../components/formGenerator/formGenerator";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/auth/authButton.css";
import { loginFormInputs } from "./form/loginFormInputs";

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [username2FA, setUsername2FA] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const localizedInputs = loginFormInputs.map(input => {
    if (input.name === 'username') {
      return { ...input, tag: t('login.username', t('users.username', 'Usuario')) };
    }
    if (input.name === 'password') {
      return { ...input, tag: t('login.password', t('users.password', 'Contraseña')) };
    }
    return input;
  });

  async function handleSubmit({ values }) {
    setLoading(true);
    const reqBody = values;
    try {
      const response = await fetch("/api/v1/auth/signin", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(reqBody),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Comprobar si el backend requiere código 2FA
        if (data.requiresTwoFactor) {
          setRequires2FA(true);
          setUsername2FA(data.username);
          toast.info(t('login.2faInfo', "Introduce el código de tu aplicación de autenticación (2FA)."));
        } else {
          toast.success(t('login.success', 'Sesión iniciada con éxito'));
          tokenService.setUser(data);
          tokenService.updateLocalAccessToken(data.token);
          setTimeout(() => { window.location.href = "/"; }, 1000);
        }
      } else if (data.message === "Bad Credentials!") {
        throw new Error(t('login.badCredentials', 'Usuario o contraseña incorrectos'));
      } else if (data.message?.includes("Account is locked")) {
        throw new Error(t('login.accountLocked', 'La cuenta está bloqueada por demasiados intentos. Inténtalo más tarde.'));
      } else {
        throw new Error(data.message || t('login.error', 'Error al iniciar sesión'));
      }
    } catch (error) {
      toast.error(error.message || t('login.genericError', 'Ha ocurrido un error inesperado.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    if (totpCode.length !== 6) {
      toast.error("El código 2FA debe tener 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/verify-2fa", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ username: username2FA, code: totpCode }),
      });

      const data = await response.json();

      if (response.status === 200) {
        toast.success(t('login.success'));
        tokenService.setUser(data);
        tokenService.updateLocalAccessToken(data.token);
        setTimeout(() => { window.location.href = "/"; }, 1000);
      } else {
        throw new Error(data.message || "Código 2FA incorrecto.");
      }
    } catch (error) {
      toast.error(error.message || t('login.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-container">
      <h1>{t('login.title')}</h1>
      <div className="auth-form-container">
        {!requires2FA ? (
          <FormGenerator
            inputs={localizedInputs}
            onSubmit={handleSubmit}
            numberOfColumns={1}
            listenEnterKey
            buttonText={t('login.title')}
            buttonClassName="auth-button"
          />
        ) : (
          <Form onSubmit={handleVerify2FA}>
            <div className="text-center mb-3">
              <p className="text-muted small">
                Autenticación de Doble Factor (2FA) requerida para <strong>{username2FA}</strong>
              </p>
            </div>
            <FormGroup className="mb-4">
              <Label for="totpCode">Código de 6 dígitos</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength="6"
                id="totpCode"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              />
            </FormGroup>
            <Button className="auth-button w-100" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Verificar y Acceder"}
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}