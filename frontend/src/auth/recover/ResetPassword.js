import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthService from '../../services/auth.service';

export default function ResetPassword() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ text: t('recover.passwordsDontMatch', 'Las contraseñas no coinciden'), type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await AuthService.resetPassword(token, newPassword, confirmPassword);
            setMessage({ text: response.data?.message || t('recover.resetSuccess', 'Contraseña restablecida con éxito.'), type: 'success' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || t('recover.defaultError', 'Ocurrió un error. Inténtalo de nuevo.'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Estilo de botón cápsula idéntico al del ForgotPassword y Login
    const glassButtonClass = "w-full mt-2 h-[52px] rounded-full font-bold text-slate-900 bg-[#b3c34c]/80 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c] hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition-all duration-300 active:scale-95 flex justify-center items-center gap-2 box-border cursor-pointer";

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)] w-full px-4 overflow-hidden">
                <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60 text-center">
                    <h2 className="mb-4 text-2xl font-extrabold text-slate-800">{t('recover.invalidLink', 'Enlace inválido')}</h2>
                    <p className="mb-6 text-sm text-slate-600 font-medium">{t('recover.noTokenFound', 'No se encontró ningún token de recuperación en la URL.')}</p>
                    <Link to="/login" className={`${glassButtonClass} no-underline`}>
                        {t('recover.backToHome', 'Volver al inicio')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)] w-full px-4 overflow-hidden">
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 drop-shadow-sm text-center">
                {t('recover.resetTitle', 'Restablecer Contraseña')}
            </h1>
            
            <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60">
                <p className="mb-6 text-sm text-center text-slate-600 font-medium">
                    {t('recover.enterNewPassword', 'Introduce tu nueva contraseña de acceso.')}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="newPassword" className="text-sm font-semibold text-slate-700 ml-1">
                            {t('recover.newPassword', 'Nueva Contraseña')}
                        </label>
                        <input 
                            id="newPassword"
                            type="password" 
                            required 
                            minLength={6}
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            disabled={loading}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition text-slate-800 placeholder-slate-400 shadow-inner disabled:opacity-50"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 ml-1">
                            {t('recover.confirmPassword', 'Confirmar Contraseña')}
                        </label>
                        <input 
                            id="confirmPassword"
                            type="password" 
                            required 
                            minLength={6}
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            disabled={loading}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition text-slate-800 placeholder-slate-400 shadow-inner disabled:opacity-50"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`${glassButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? t('recover.saving', 'Guardando...') : t('recover.changePassword', 'Cambiar Contraseña')}
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