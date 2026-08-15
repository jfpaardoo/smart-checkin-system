import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await AuthService.forgotPassword(email);
            setMessage({ 
                text: response.data?.message || 'Si el correo está registrado, recibirás un enlace de recuperación.', 
                type: 'success' 
            });
            setEmail('');
        } catch (error) {
            const resMessage = error.response?.data?.message || 'Ocurrió un error. Inténtalo más tarde.';
            setMessage({ text: resMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Estilo de botón cápsula idéntico al del Login
    const glassButtonClass = "w-full mt-2 h-[52px] rounded-full font-bold text-slate-900 bg-[#b3c34c]/80 backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] hover:bg-[#b3c34c] hover:shadow-[0_8px_30px_0_rgba(179,195,76,0.55)] transition-all duration-300 active:scale-95 flex justify-center items-center gap-2 box-border cursor-pointer";

    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full px-4 overflow-hidden">
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 drop-shadow-sm text-center">
          Recuperar Contraseña
        </h1>
        
        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60">
          <p className="mb-6 text-sm text-center text-slate-600 font-medium">
            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl border border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#b3c34c] focus:bg-white/80 focus:ring-4 focus:ring-[#b3c34c]/20 outline-none transition text-slate-800 placeholder-slate-400 shadow-inner"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`${glassButtonClass} disabled:opacity-50`}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          {message.text && (
            <div className={`mt-5 p-3 rounded-2xl border backdrop-blur-md ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'}`}>
              <p className="text-sm text-center font-medium">{message.text}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-[#b3c34c] transition-colors duration-300">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

      </div>
    );
}