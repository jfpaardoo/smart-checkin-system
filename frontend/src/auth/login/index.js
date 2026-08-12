import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import FormGenerator from "../../components/formGenerator/formGenerator";
import tokenService from "../../services/token.service";
import { loginFormInputs } from "./form/loginFormInputs";
import { FaSignInAlt, FaShieldAlt } from "react-icons/fa";
import "../../App.css";

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [username2FA, setUsername2FA] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Bloqueamos el scroll de toda la ventana mientras estamos en el Login
  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    // Cleanup: Al salir del componente, restauramos el scroll a su estado original
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const localizedInputs = loginFormInputs.map(input => {
    if (input.name === 'username') {
      return { ...input, tag: t('login.usernameOrEmail', 'Usuario o Correo Electrónico') };
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
      toast.error(t('profile.codeMustBe6Digits', "El código debe tener 6 dígitos."));
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

  // Estilo Glassmorphism para los botones extraído en una variable para mantener el código limpio
  const glassButtonClass = "w-full mt-2 py-3.5 rounded-full font-bold text-slate-900 bg-[#b3c34c]/60 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c]/80 hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition-all duration-300 active:scale-95 flex justify-center items-center gap-2";

  return (
    // Altura controlada al máximo posible dentro de la vista para evitar cortes raros si redimensionan
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full px-4 overflow-hidden">
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 drop-shadow-sm text-center">
        {t('login.title')}
      </h1>
      
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60">
        {!requires2FA ? (
          <FormGenerator
            inputs={localizedInputs}
            onSubmit={handleSubmit}
            numberOfColumns={1}
            listenEnterKey
            buttonText={
              <span className="flex items-center justify-center gap-2">
                <FaSignInAlt />
                {t('login.title')}
              </span>
            }
            // Inyectamos nuestra clase de botón Glassmorphic
            buttonClassName={glassButtonClass + " border-0"}
          />
        ) : (
          <form onSubmit={handleVerify2FA} className="flex flex-col gap-5">
            <div className="text-center">
              <FaShieldAlt className="text-4xl text-[#b3c34c] mx-auto mb-3 drop-shadow-sm" />
              <h2 className="text-xl font-bold text-slate-800 mb-1">Verificación en dos pasos</h2>
              <p className="text-sm text-slate-600">
                Autenticación de Doble Factor (2FA) requerida para <strong className="text-slate-800">{username2FA}</strong>
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="totpCode" className="text-sm font-semibold text-slate-700 ml-1">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                id="totpCode"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="w-full text-center text-3xl tracking-[0.5rem] py-4 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition font-mono text-slate-800 shadow-inner"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`${glassButtonClass} disabled:opacity-50`}
            >
              {loading ? "Verificando..." : "Verificar y Acceder"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}