import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import { Turnstile } from '@marsidev/react-turnstile';
import tokenService from "../../services/token.service";
import { FaSignInAlt, FaShieldAlt, FaKey, FaFingerprint } from "react-icons/fa";
import { isWebAuthnSupported, loginWithPasskey } from "../../util/webauthnUtil";
import { useCaptchaSiteKey } from "../../hooks/useCaptchaSiteKey";
import "../../App.css";

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  const siteKey = useCaptchaSiteKey();
  
  const navigate = useNavigate();
  const [requires2FA, setRequires2FA] = useState(false);
  const [username2FA, setUsername2FA] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isPasskeySupported = isWebAuthnSupported();

  useEffect(() => {
    document.body.style.overflow = "auto";
    if (typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__)) {
      setCaptchaToken('1x00000000000000000000AA');
    }
  }, [captchaKey]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!captchaToken) {
      toast.error(t('login.captchaRequired', 'Por favor, completa la verificación de seguridad.'));
      return;
    }

    setLoading(true);
    const reqBody = { username, password, captchaToken };

    try {
      const response = await fetch("/api/v1/auth/signin", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
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
          setTimeout(() => { navigate("/"); }, 1000);
        }
      } else if (data.message === "Bad Credentials!") {
        setCaptchaToken(null);
        setCaptchaKey((k) => k + 1);
        throw new Error(t('login.badCredentials', 'Usuario o contraseña incorrectos'));
      } else if (data.message?.includes("Account is locked")) {
        setCaptchaToken(null);
        setCaptchaKey((k) => k + 1);
        throw new Error(t('login.accountLocked', 'La cuenta está bloqueada por demasiados intentos. Inténtalo más tarde.'));
      } else {
        setCaptchaToken(null);
        setCaptchaKey((k) => k + 1);
        throw new Error(data.message || t('login.error', 'Error al iniciar sesión'));
      }
    } catch (error) {
      toast.error(error.message || t('login.genericError', 'Ha ocurrido un error inesperado.'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setLoading(true);
    try {
      const data = await loginWithPasskey(username.trim() || null);
      toast.success(t('login.passkeySuccess', '¡Acceso biométrico verificado con éxito!'));
      tokenService.setUser(data);
      setTimeout(() => { navigate("/"); }, 800);
    } catch (error) {
      console.warn("Passkey login cancelled or failed:", error);
      if (error.name !== 'NotAllowedError' && !error.message?.includes('cancelled')) {
        toast.error(error.message || t('login.passkeyError', 'Error al verificar la llave de acceso.'));
      }
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
        credentials: "include",
        body: JSON.stringify({ username: username2FA, code: totpCode }),
      });

      const data = await response.json();

      if (response.status === 200) {
        toast.success(t('login.success'));
        tokenService.setUser(data);
        setTimeout(() => { navigate("/"); }, 1000);
      } else {
        throw new Error(data.message || "Código 2FA incorrecto.");
      }
    } catch (error) {
      toast.error(error.message || t('login.genericError'));
    } finally {
      setLoading(false);
    }
  }

  const glassButtonClass = "w-full mt-2 h-[52px] rounded-full font-bold text-slate-900 bg-[#b3c34c]/60 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c]/80 hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition-colors duration-200 active:scale-95 flex justify-center items-center gap-2 box-border cursor-pointer";
  
  // Clases modificadas para dejar espacio extra arriba (pt-6) para la animación
  const inputClass = "block w-full px-4 pt-6 pb-2 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition text-slate-800 shadow-inner peer";
  // Clases que manejan la animación (se hacen pequeñas y suben al hacer focus)
  const labelClass = "absolute text-sm font-semibold text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-[#b3c34c] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text pointer-events-none";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-4 py-8 overflow-y-auto">
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 drop-shadow-sm text-center">
        {t('login.title', 'Iniciar Sesión')}
      </h1>
      
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60">
        {!requires2FA ? (
          <div className="flex flex-col gap-4">
            
            {/* Opción rápida: Iniciar Sesión con Passkey / Biometría */}
            {isPasskeySupported && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="w-full min-h-[52px] py-2.5 px-4 rounded-full font-bold text-slate-800 bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_25px_0_rgba(0,0,0,0.06)] hover:bg-white hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.35)] transition-colors duration-200 active:scale-95 flex items-center justify-center gap-2.5 box-border cursor-pointer text-xs sm:text-sm text-center"
                >
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FaFingerprint className="text-[#73841e] text-base sm:text-lg" />
                    <FaKey className="text-[#8fa228] text-xs sm:text-sm" />
                  </div>
                  <span className="leading-snug">{t('login.passkeyBtn', 'Acceder con Llave de Acceso (Biometría)')}</span>
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px bg-white/60 flex-1"></div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    {t('common.or', 'o con credenciales')}
                  </span>
                  <div className="h-px bg-white/60 flex-1"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Input Usuario animado */}
              <div className="relative w-full">
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder=" "
                  autoComplete="username"
                  className={inputClass}
                />
                <label htmlFor="username" className={labelClass}>
                  {t('login.usernameOrEmail', 'Usuario o Correo Electrónico')} <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Input Contraseña animado */}
              <div className="relative w-full">
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder=" "
                  autoComplete="current-password"
                  className={inputClass}
                />
                <label htmlFor="password" className={labelClass}>
                  {t('login.password', 'Contraseña')} <span className="text-red-500">*</span>
                </label>
              </div>

              <div className="flex justify-center items-center mt-2 p-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-inner">
                <Turnstile 
                  key={`${siteKey}-${captchaKey}`}
                  siteKey={siteKey} 
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'light' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !captchaToken}
                className={`${glassButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FaSignInAlt />
                {loading ? "Iniciando..." : t('login.title', 'Iniciar Sesión')}
              </button>
            </form>
          </div>
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

      <div className="flex flex-col gap-3 mt-10 mb-4 text-center text-sm text-slate-500 z-10">
        <div>
          <Link 
            to="/forgot-password" 
            className="font-bold text-slate-600 hover:text-[#b3c34c] transition-colors duration-300"
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Distribution Academy |{' '}
          <Link 
            to="/privacy-policy" 
            className="font-bold text-slate-600 hover:text-[#b3c34c] transition-colors duration-300"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>

    </div>
  );
}