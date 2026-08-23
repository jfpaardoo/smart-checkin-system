import React, { useState, useRef } from "react";
import { FaUser, FaGraduationCap, FaShieldAlt, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import { useToast } from "../../components/ToastProvider";
import ProfileHeader from "./components/ProfileHeader";
import PersonalDataTab from "./components/PersonalDataTab";
import FormationsTab from "./components/FormationsTab";
import PasswordSecurityTab from "./components/PasswordSecurityTab";
import GlassModal from "../../components/GlassModal";
import { useUserProfileData } from "./hooks/useUserProfileData";
import { usePasswordSecurity } from "./hooks/usePasswordSecurity";
import api from "../../services/api";
import { saveBlobFile } from "../../util/downloadExportFile";

export default function UserProfile() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getUser();

  const [activeTab, setActiveTab] = useState("1");
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const { loadingUser, loadingFormations, userData, setUserData, formations } = useUserProfileData(jwt, t, toast);
  const passwordProps = usePasswordSecurity(jwt, t, toast);

  const toggleTab = (tab) => { if (activeTab !== tab) setActiveTab(tab); };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.get("/exports/me/export", { responseType: 'blob' });
      await saveBlobFile(res.data, "user_data_export.json", "application/json");
      toast.success(t("profile.exportSuccess", "Tus datos se han exportado correctamente."));
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error(t("profile.exportError", "No se pudieron exportar tus datos."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => { setDeleteModalOpen(true); };

  const confirmDeleteAccount = async () => {
    if (isDeletingRef.current) return;
    if (deleteConfirmationText !== "ELIMINAR") {
      toast.error(t("profile.deleteTypeConfirmError", "Debes escribir ELIMINAR para confirmar."));
      return;
    }
    
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      await api.delete("/users/me");
      toast.success(t("profile.deleteSuccess", "Tu cuenta ha sido eliminada."));
      setTimeout(() => {
        tokenService.removeUser();
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || t("profile.deleteError", "Error al eliminar la cuenta.");
      toast.error(msg);
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmationText("");
    }
  };

  const deleteModalTitle = (
    <div className="flex items-center text-red-600 font-bold">
      <FaTrash className="mr-2 inline-block" />
      <span className="text-slate-900 dark:text-slate-100 font-semibold">{t("profile.deleteConfirmTitle", "Eliminar Cuenta Permanentemente")}</span>
    </div>
  );

  return (
    <div className="da-container">
      <div className="mx-auto w-full max-w-[1000px]">
        <ProfileHeader userData={userData} formations={formations} t={t} />

        <div className="px-1 mb-6">
          <nav className="flex flex-col sm:flex-row justify-center gap-3 w-full" aria-label="Profile tabs">
            <button 
              type="button"
              className={`px-4 py-3 flex flex-row sm:flex-col items-center justify-center gap-2 text-center w-full sm:min-w-[180px] rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === "1" ? "bg-white dark:bg-slate-800 text-[#73841e] dark:text-[#d4e84a] shadow-md ring-2 ring-[#b3c34c]/60 font-bold" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-white/50 dark:border-white/10 font-semibold"}`} 
              onClick={() => toggleTab("1")} 
            >
              <FaUser size={18} className={activeTab === "1" ? "text-[#73841e] dark:text-[#d4e84a]" : "text-slate-400"} />
              <span className="text-xs sm:text-sm">{t("profile.personalData", "Datos Personales")}</span>
            </button>
            <button 
              type="button"
              className={`px-4 py-3 flex flex-row sm:flex-col items-center justify-center gap-2 text-center w-full sm:min-w-[180px] rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === "2" ? "bg-white dark:bg-slate-800 text-[#73841e] dark:text-[#d4e84a] shadow-md ring-2 ring-[#b3c34c]/60 font-bold" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-white/50 dark:border-white/10 font-semibold"}`} 
              onClick={() => toggleTab("2")} 
            >
              <FaGraduationCap size={18} className={activeTab === "2" ? "text-[#73841e] dark:text-[#d4e84a]" : "text-slate-400"} />
              <span className="text-xs sm:text-sm">{t("profile.myFormations", "Mis Formaciones")}</span>
            </button>
            <button 
              type="button"
              className={`px-4 py-3 flex flex-row sm:flex-col items-center justify-center gap-2 text-center w-full sm:min-w-[180px] rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === "3" ? "bg-white dark:bg-slate-800 text-[#73841e] dark:text-[#d4e84a] shadow-md ring-2 ring-[#b3c34c]/60 font-bold" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-white/50 dark:border-white/10 font-semibold"}`} 
              onClick={() => toggleTab("3")} 
            >
              <FaShieldAlt size={18} className={activeTab === "3" ? "text-[#73841e] dark:text-[#d4e84a]" : "text-slate-400"} />
              <span className="text-xs sm:text-sm">{t("profile.securityPassword", "Seguridad y Contraseña")}</span>
            </button>
          </nav>
        </div>

        <div className="p-0 border-0 bg-transparent">
          {activeTab === "1" && (
            <div className="da-fade-in">
              <PersonalDataTab loadingUser={loadingUser} userData={userData} setUserData={setUserData} t={t} />
            </div>
          )}
          {activeTab === "2" && (
            <div className="da-fade-in">
              <FormationsTab loadingFormations={loadingFormations} formations={formations} t={t} />
            </div>
          )}
          {activeTab === "3" && (
            <div className="da-fade-in">
              <PasswordSecurityTab 
                {...passwordProps} 
                userData={userData} 
                setUserData={setUserData} 
                t={t} 
                toast={toast}
                handleExportData={handleExportData}
                isExporting={isExporting}
                handleDeleteAccount={handleDeleteAccount}
                isDeleting={isDeleting}
              />
            </div>
          )}
        </div>
      </div>

      <GlassModal
        isOpen={deleteModalOpen}
        toggle={() => setDeleteModalOpen(false)}
        title={deleteModalTitle}
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0 cursor-pointer" onClick={() => setDeleteModalOpen(false)}>
              {t("common.cancel", "Cancelar")}
            </button>
            <button
              type="button"
              className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-600/20 border-0 cursor-pointer"
              disabled={deleteConfirmationText.trim().toUpperCase() !== t("profile.deletePlaceholder", "ELIMINAR").toUpperCase() || isDeleting}
              onClick={confirmDeleteAccount}
            >
              {isDeleting ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <FaTrash className="mr-2" />}
              {t("profile.deleteConfirmBtn", "Eliminar Cuenta")}
            </button>
          </div>
        }
      >
        <div className="text-center py-2">
          <FaTrash size={44} className="text-red-500/80 mx-auto mb-3" />
          <h5 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{t("profile.areYouSure", "¿Estás completamente seguro?")}</h5>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t("profile.deleteWarningText", "Esta acción eliminará permanentemente todos tus datos.")}</p>
          <input
            className="w-full mt-4 px-4 py-2.5 text-center text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-none placeholder:text-slate-400"
            placeholder={t("profile.deletePlaceholder", "ELIMINAR")}
            aria-label={t("profile.deleteConfirmationAria", "Escribe ELIMINAR para confirmar")}
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
          />
        </div>
      </GlassModal>
    </div>
  );
}