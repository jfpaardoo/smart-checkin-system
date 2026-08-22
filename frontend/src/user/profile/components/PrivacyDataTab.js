import React from "react";
import { Link } from "react-router-dom";
import { FaDownload, FaTrashAlt, FaShieldAlt } from "react-icons/fa";

const ActionButton = ({ variant, isLoading, icon: Icon, children, ...props }) => (
  <button
    type="button"
    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50 ${
      variant === 'danger' ? 'da-btn-danger text-white' : 'da-btn-primary text-slate-950'
    }`}
    {...props}
  >
    {isLoading ? (
      <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : <Icon className="text-sm" />}
    <span>{children}</span>
  </button>
);

export default function PrivacyDataTab({
  t,
  handleDeleteAccount,
  isDeleting,
  handleExportData,
  isExporting,
}) {
  return (
    <div className="space-y-6">
      {/* Tarjeta 1: Exportación GDPR */}
      <div className="p-6 rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        {/* Cabecera con Icono al lado del Título */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
            <FaDownload size={16} />
          </div>
          <h5 className="font-bold text-slate-800 dark:text-slate-100 text-lg m-0 p-0 leading-none">
            {t("profile.exportDataTitle", "Exportar Mis Datos (GDPR)")}
          </h5>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
          {t(
            "profile.exportDataDesc",
            "Tienes derecho a solicitar una copia de todos tus datos personales almacenados en nuestro sistema, incluyendo tu historial de fichajes y formaciones, en un formato estructurado y legible."
          )}
        </p>

        <ActionButton
          variant="primary"
          disabled={isExporting}
          onClick={handleExportData}
          isLoading={isExporting}
          icon={FaDownload}
        >
          {t("profile.exportDataBtn", "Solicitar Exportación")}
        </ActionButton>
      </div>

      {/* Tarjeta 2: Eliminación de Cuenta */}
      <div className="p-6 rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        {/* Cabecera con Icono al lado del Título */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs flex-shrink-0">
            <FaTrashAlt size={16} />
          </div>
          <h5 className="font-bold text-rose-600 dark:text-rose-400 text-lg m-0 p-0 leading-none">
            {t("profile.deleteAccountTitle", "Eliminar Cuenta")}
          </h5>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
          {t(
            "profile.deleteAccountDesc",
            "Eliminar tu cuenta es una acción irreversible. Todos tus datos personales, historial de fichajes y formaciones serán eliminados de forma permanente de nuestros servidores."
          )}
        </p>

        <ActionButton
          variant="danger"
          disabled={isDeleting}
          onClick={handleDeleteAccount}
          isLoading={isDeleting}
          icon={FaTrashAlt}
        >
          {t("profile.deleteAccountBtn", "Eliminar Mi Cuenta")}
        </ActionButton>
      </div>

      {/* Enlace a Política de Privacidad */}
      <div className="pt-6 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm m-0 text-center sm:text-left">
          {t("profile.privacyPolicyPrompt", "¿Tienes dudas sobre cómo gestionamos tus datos, firmas y fichajes?")}
        </p>
        <Link
          to="/privacy-policy"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-700/60 hover:bg-white dark:hover:bg-slate-600 shadow-xs whitespace-nowrap w-full sm:w-auto text-decoration-none"
        >
          <FaShieldAlt className="text-[#82a328] dark:text-[#d4e84a]" />
          <span>{t("profile.readPrivacyPolicy", "Leer Política de Privacidad")}</span>
        </Link>
      </div>

    </div>
  );
}