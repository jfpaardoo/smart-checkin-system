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
    <div className="da-container py-5">
      <div className="da-card text-center py-5 px-4 px-md-5 mx-auto" style={{ maxWidth: "480px" }}>
        
        {/* Icono corporativo con tonos verdes de Home */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#8a9e29]/20 to-[#b3c34c]/30 text-[#8a9e29] flex items-center justify-center text-2xl shadow-xs">
          <FaSignOutAlt />
        </div>

        <h3 className="fw-bold mb-2 text-dark" style={{ letterSpacing: "-0.5px" }}>
          {t('common.confirmLogout', '¿Cerrar sesión?')}
        </h3>
        
        <p className="text-muted small mb-4">
          {t('common.logoutWarning', 'Tu sesión se cerrará de forma segura en este dispositivo.')}
        </p>

        <div className="d-flex align-items-center justify-content-center gap-3 w-100 mt-4">
          {/* Botón Cancelar - Estilo Home */}
          <Link
            to="/"
            className="w-50 py-2.5 px-4 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs shadow-xs transition no-underline text-center"
          >
            {t('common.no', 'Cancelar')}
          </Link>
          
          {/* Botón Confirmar - Verde corporativo de Home */}
          <button
            type="button"
            disabled={loading}
            onClick={handleLogout}
            className="w-50 py-2.5 px-4 rounded-xl bg-[#b3c34c] hover:bg-[#8a9e29] text-slate-900 hover:text-white font-bold text-xs shadow-xs transition border-0 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <FaSpinner className="animate-spin text-xs" />}
            <span>{t('common.yes', 'Cerrar Sesión')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
