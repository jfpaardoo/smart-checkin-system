import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSignOutAlt, FaSpinner } from "react-icons/fa";
import tokenService from "../../services/token.service";

export default function Logout() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error("Error logging out on server", error);
    } finally {
      tokenService.removeUser();
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-100px)] w-full px-4 py-8 my-auto">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] p-6 md:p-8 border border-white/60 text-center flex flex-col items-center justify-center">
        
        {/* Icono corporativo estilo cápsula */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-[#8a9e29]/20 to-[#b3c34c]/30 text-[#68771b] flex items-center justify-center text-2xl shadow-xs border border-[#b3c34c]/30">
          <FaSignOutAlt />
        </div>

        <h3 className="text-xl md:text-2xl font-bold mb-2 text-slate-800" style={{ letterSpacing: "-0.5px" }}>
          {t('common.confirmLogout', '¿Seguro que deseas cerrar sesión?')}
        </h3>
        
        <p className="text-slate-600 text-sm mb-6 max-w-xs">
          {t('common.logoutWarning', 'Tu sesión se cerrará de forma segura en este dispositivo.')}
        </p>

        <div className="flex items-center justify-center gap-3 w-full">
          {/* Botón Cancelar - Cápsula Secundaria */}
          <Link
            to="/"
            className="w-1/2 h-[48px] rounded-full font-bold text-slate-800 bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_25px_0_rgba(0,0,0,0.06)] hover:bg-white transition-all duration-200 active:scale-95 flex items-center justify-center text-sm no-underline"
          >
            {t('common.no', 'No')}
          </Link>
          
          {/* Botón Confirmar - Cápsula Primaria */}
          <button
            type="button"
            disabled={loading}
            onClick={handleLogout}
            className="w-1/2 h-[48px] rounded-full font-bold text-slate-900 bg-[#b3c34c]/80 hover:bg-[#b3c34c] backdrop-blur-md border border-white/50 shadow-[0_8px_25px_0_rgba(179,195,76,0.35)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
          >
            {loading && <FaSpinner className="animate-spin text-sm" />}
            <span>{t('common.yes', 'Sí')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
