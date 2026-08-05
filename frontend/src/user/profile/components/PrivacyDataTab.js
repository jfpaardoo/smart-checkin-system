import React from "react";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
import { Spinner } from "reactstrap";

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
      <div className="ba-glass-panel p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md shadow-sm">
        {/* Cabecera con Icono al lado del Título */}
        <div className="flex items-center gap-2.5 mb-2">
          <FaDownload className="text-[#82a328] text-lg flex-shrink-0" />
          <h5 className="font-bold text-gray-800 text-lg m-0 p-0 leading-none">
            {t("profile.exportDataTitle", "Exportar Mis Datos (GDPR)")}
          </h5>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          {t(
            "profile.exportDataDesc",
            "Tienes derecho a solicitar una copia de todos tus datos personales almacenados en nuestro sistema, incluyendo tu historial de fichajes y formaciones, en un formato estructurado y legible."
          )}
        </p>

        <button
          type="button"
          className="ba-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all"
          disabled={isExporting}
          onClick={handleExportData}
        >
          {isExporting ? (
            <Spinner size="sm" />
          ) : (
            <FaDownload className="text-sm" />
          )}
          <span>{t("profile.exportDataBtn", "Solicitar Exportación")}</span>
        </button>
      </div>

      {/* Tarjeta 2: Eliminación de Cuenta */}
      <div className="ba-glass-panel p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md shadow-sm">
        {/* Cabecera con Icono al lado del Título */}
        <div className="flex items-center gap-2.5 mb-2">
          <FaTrashAlt className="text-red-600 text-lg flex-shrink-0" />
          <h5 className="font-bold text-red-600 text-lg m-0 p-0 leading-none">
            {t("profile.deleteAccountTitle", "Eliminar Cuenta")}
          </h5>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          {t(
            "profile.deleteAccountDesc",
            "Eliminar tu cuenta es una acción irreversible. Todos tus datos personales, historial de fichajes y formaciones serán eliminados de forma permanente de nuestros servidores."
          )}
        </p>

        <button
          type="button"
          className="ba-btn-danger flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all"
          disabled={isDeleting}
          onClick={handleDeleteAccount}
        >
          {isDeleting ? (
            <Spinner size="sm" />
          ) : (
            <FaTrashAlt className="text-sm" />
          )}
          <span>{t("profile.deleteAccountBtn", "Eliminar Mi Cuenta")}</span>
        </button>
      </div>
    </div>
  );
}