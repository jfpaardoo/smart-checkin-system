import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import { Turnstile } from '@marsidev/react-turnstile';
import tokenService from "../../services/token.service";
import { FaSignInAlt, FaKey, FaFingerprint } from "react-icons/fa";
import { isWebAuthnSupported, loginWithPasskey } from "../../util/webauthnUtil";
import { useCaptchaSiteKey } from "../../hooks/useCaptchaSiteKey";
import { useTheme } from "../../context/ThemeContext";
import TwoFactorLoginForm from "./components/TwoFactorLoginForm";

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  const siteKey = useCaptchaSiteKey();
  const { isDark } = useTheme();
  
  const navigate = useNavigate();
  const [requires2FA, setRequires2FA] = useState(false);
  const [username2FA, setUsername2FA] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isPasskeySupported = isWebAuthnSupported();
  const notifiedReasonRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");

    if (reason && !notifiedReasonRef.current) {
      notifiedReasonRef.current = true;
      if (reason === "timeout") {
        toast.info(t('session.timeoutNotice', 'Tu sesión se ha cerrado automáticamente por inactividad.'));
      } else if (reason === "multi_tab_logout") {
        toast.info(t('session.multiTabLogoutNotice', 'Has cerrado sesión en otra pestaña.'));
      }
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__)) {
      setCaptchaToken('1x00000000000000000000AA');
    }
  }, [toast, t]);

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

  async function handleVerify2FA(totpCode, useBackupCode) {
    const cleanCode = totpCode.trim().toUpperCase();
    if (!useBackupCode && cleanCode.length !== 6) {
      toast.error(t('profile.codeMustBe6Digits', "El código debe tener 6 dígitos."));
      return;
    }
    if (useBackupCode && cleanCode.length < 8) {
      toast.error(t('login.backupCodeInvalidFormat', "El código de recuperación debe tener el formato XXXX-XXXX."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/verify-2fa", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username: username2FA, code: cleanCode }),
      });

      const data = await response.json();

      if (response.status === 200) {
        toast.success(t('login.success'));
        tokenService.setUser(data);
        setTimeout(() => { navigate("/"); }, 1000);
      } else {
        throw new Error(data.message || "Código 2FA o código de recuperación incorrecto.");
      }
    } catch (error) {
      toast.error(error.message || t('login.genericError'));
    } finally {
      setLoading(false);
    }
  }

  const glassButtonClass = "w-full mt-2 h-[50px] rounded-2xl font-bold text-slate-950 dark:text-slate-950 bg-[#b3c34c] hover:bg-[#a3b33d] shadow-[0_8px_25px_rgba(179,195,76,0.35)] transition-all duration-200 active:scale-95 flex justify-center items-center gap-2 cursor-pointer border-0";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-4 py-8 overflow-y-auto">
      
      <div className="w-full max-w-md bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-[32px] p-6 sm:p-8 border border-white/60 dark:border-white/10">
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 drop-shadow-sm text-center">
          {t('login.title', 'Iniciar Sesión')}
        </h1>

        {!requires2FA ? (
          <div className="flex flex-col gap-4">
            
            {/* Iniciar Sesión con Passkey */}
            {isPasskeySupported && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="w-full min-h-[48px] py-2.5 px-3.5 rounded-2xl font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm text-center"
                >
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FaFingerprint className="text-[#73841e] dark:text-[#d4e84a] text-base sm:text-lg" />
                    <FaKey className="text-[#8fa228] dark:text-[#d4e84a] text-xs sm:text-sm" />
                  </div>
                  <span className="leading-tight">{t('login.passkeyBtn', 'Acceder con Llave de Acceso (Biometría)')}</span>
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px bg-white/40 dark:bg-white/10 flex-1"></div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {t('common.or', 'o con credenciales')}
                  </span>
                  <div className="h-px bg-white/40 dark:bg-white/10 flex-1"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Input Usuario */}
              <div className="flex flex-col w-full text-left">
                <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  {t('login.usernameOrEmail', 'Usuario o Correo Electrónico')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder={t('login.usernamePlaceholder', 'Introduce tu usuario o correo')}
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
                />
              </div>

              {/* Input Contraseña */}
              <div className="flex flex-col w-full text-left">
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('login.password', 'Contraseña')} <span className="text-rose-500">*</span>
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#68771b] dark:text-[#d4e84a] hover:underline font-semibold">
                    {t('login.forgotPassword', '¿Olvidaste tu contraseña?')}
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
                />
              </div>

              <div className="flex justify-center items-center my-1 w-full overflow-hidden rounded-2xl">
                <div style={{ transform: 'scale(var(--turnstile-scale, 1))', transformOrigin: 'center center' }}
                  ref={el => {
                    if (el) {
                      const parentWidth = el.parentElement?.offsetWidth || 300;
                      const scale = Math.min(1, parentWidth / 310);
                      el.style.setProperty('--turnstile-scale', scale);
                      document.documentElement.style.setProperty('--turnstile-scale', scale);
                    }
                  }}
                >
                  <Turnstile 
                    key={`${siteKey}-${captchaKey}-${isDark ? 'dark' : 'light'}`}
                    siteKey={siteKey} 
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => setCaptchaToken(null)}
                    onExpire={() => setCaptchaToken(null)}
                    options={{ theme: isDark ? 'dark' : 'light' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !captchaToken}
                className={`${glassButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FaSignInAlt />
                <span>{loading ? t('common.loading', 'Iniciando...') : t('login.title', 'Iniciar Sesión')}</span>
              </button>
            </form>
          </div>
        ) : (
          <TwoFactorLoginForm
            username2FA={username2FA}
            loading={loading}
            onVerify={handleVerify2FA}
            t={t}
            glassButtonClass={glassButtonClass}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 mt-8 text-center text-xs text-slate-500 dark:text-slate-400 z-10">
        <div>
          &copy; {new Date().getFullYear()} Distribution Academy |{' '}
          <Link 
            to="/privacy-policy" 
            className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#73841e] dark:hover:text-[#d4e84a] transition-colors"
          >
            {t('login.privacyPolicy', 'Política de Privacidad')}
          </Link>
        </div>
      </div>

    </div>
  );
}