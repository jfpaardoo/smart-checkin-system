import React from "react";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
import { Spinner } from "reactstrap";

const ActionButton = ({ variant, isLoading, icon: Icon, children, ...props }) => (
  <button
    type="button"
    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${variant === 'danger' ? 'da-btn-danger' : 'da-btn-primary'}`}
    {...props}
  >
    {isLoading ? <Spinner size="sm" /> : <Icon className="text-sm" />}
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
      <div className="da-glass-panel p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md shadow-sm">
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
      <div className="da-glass-panel p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md shadow-sm">
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
    </div>
  );
}