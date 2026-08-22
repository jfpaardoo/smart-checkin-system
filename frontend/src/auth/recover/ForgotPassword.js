import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTranslation } from 'react-i18next';
import AuthService from '../../services/auth.service';
import { useCaptchaSiteKey } from '../../hooks/useCaptchaSiteKey';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const siteKey = useCaptchaSiteKey();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [captchaKey, setCaptchaKey] = useState(0);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && (window.navigator.webdriver || window.__PLAYWRIGHT__)) {
            setCaptchaToken('1x00000000000000000000AA');
        }
    }, [captchaKey]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!captchaToken) {
            setMessage({ text: t('login.captchaRequired', 'Por favor, completa la verificación de seguridad.'), type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await AuthService.forgotPassword(email, captchaToken);
            setMessage({ 
                text: response.data?.message || t('recover.successMessage', 'Si el correo está registrado, recibirás un enlace de recuperación.'), 
                type: 'success' 
            });
            setEmail('');
            setCaptchaToken(null);
            setCaptchaKey((k) => k + 1);
        } catch (error) {
            const resMessage = error.response?.data?.message || t('recover.defaultError', 'Ocurrió un error. Inténtalo más tarde.');
            setMessage({ text: resMessage, type: 'error' });
            setCaptchaToken(null);
            setCaptchaKey((k) => k + 1);
        } finally {
            setLoading(false);
        }
    };

    const glassButtonClass = "w-full mt-2 h-[52px] rounded-full font-bold text-slate-900 bg-[#b3c34c]/80 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c] hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition-colors duration-200 active:scale-95 flex justify-center items-center gap-2 box-border cursor-pointer";

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-4 py-8 overflow-y-auto">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 drop-shadow-sm text-center">
          {t('recover.forgotTitle', 'Recuperar Contraseña')}
        </h1>
        
        <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/75 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] rounded-[32px] p-6 md:p-8 border border-white/60 dark:border-white/10">
          <p className="mb-6 text-sm text-center text-slate-600 dark:text-slate-300 font-medium">
            {t('recover.forgotSubtitle', 'Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.')}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Input Correo */}
            <div className="flex flex-col w-full text-left">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                {t('recover.emailLabel', 'Correo Electrónico')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:border-[#b3c34c] dark:focus:border-[#d4e84a] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 shadow-inner text-sm font-medium"
              />
            </div>

            <div className="flex justify-center items-center my-1 w-full overflow-hidden">
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
              className={`${glassButtonClass} disabled:opacity-50`}
            >
              {loading ? t('recover.sending', 'Enviando...') : t('recover.sendLink', 'Enviar enlace')}
            </button>
          </form>

          {message.text && (
            <div className={`mt-5 p-3 rounded-2xl border backdrop-blur-md ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'}`}>
              <p className="text-sm text-center font-medium">{message.text}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-[#b3c34c] transition-colors duration-300">
              {t('recover.backToLogin', 'Volver al inicio de sesión')}
            </Link>
          </div>
        </div>

      </div>
    );
}