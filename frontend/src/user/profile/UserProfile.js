import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane, Modal, ModalHeader, ModalBody, ModalFooter, Spinner } from "reactstrap";
import { FaUser, FaGraduationCap, FaShieldAlt, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import { useToast } from "../../components/ToastProvider";
import ProfileHeader from "./components/ProfileHeader";
import PersonalDataTab from "./components/PersonalDataTab";
import FormationsTab from "./components/FormationsTab";
import PasswordSecurityTab from "./components/PasswordSecurityTab";
import { useUserProfileData } from "./hooks/useUserProfileData";
import { usePasswordSecurity } from "./hooks/usePasswordSecurity";
import "../../App.css";
import "../../components/formGenerator/css/formGenerator.css";

export default function UserProfile() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();

  const [activeTab, setActiveTab] = useState("1");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const { loadingUser, loadingFormations, userData, setUserData, formations } = useUserProfileData(jwt, t, toast);
  const passwordProps = usePasswordSecurity(jwt, t, toast);

  const toggleTab = (tab) => { if (activeTab !== tab) setActiveTab(tab); };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/exports/me/export", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "user_data_export.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(t("profile.exportSuccess", "Tus datos se han exportado correctamente."));
      } else {
        toast.error(t("profile.exportError", "No se pudieron exportar tus datos."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("profile.connectionError", "Error de conexión."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => { setDeleteModalOpen(true); };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmationText !== "ELIMINAR") {
      toast.error(t("profile.deleteTypeConfirmError", "Debes escribir ELIMINAR para confirmar."));
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        toast.success(t("profile.deleteSuccess", "Tu cuenta ha sido eliminada."));
        setTimeout(() => {
          tokenService.removeUser();
          window.location.href = "/";
        }, 1200);
      } else {
        const body = await res.json();
        toast.error(body.message || t("profile.deleteError", "Error al eliminar la cuenta."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("profile.connectionError", "Error de conexión."));
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmationText("");
    }
  };

  return (
    <div className="ba-container">
      <div className="mx-auto w-full max-w-[1000px]">
        <ProfileHeader userData={userData} formations={formations} t={t} />

        <Nav pills className="ba-nav-pills border-0 mb-4 justify-content-center gap-3">
          <NavItem>
            <NavLink className={`px-4 py-2 shadow-sm ${activeTab === "1" ? "active" : ""}`} onClick={() => toggleTab("1")} style={{ cursor: "pointer" }}>
              <FaUser className="me-2" />{t("profile.personalData", "Mis Datos")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className={`px-4 py-2 shadow-sm ${activeTab === "2" ? "active" : ""}`} onClick={() => toggleTab("2")} style={{ cursor: "pointer" }}>
              <FaGraduationCap className="me-2" />{t("profile.myFormations", "Formaciones")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className={`px-4 py-2 shadow-sm ${activeTab === "3" ? "active" : ""}`} onClick={() => toggleTab("3")} style={{ cursor: "pointer" }}>
              <FaShieldAlt className="me-2" />{t("profile.securityPassword", "Seguridad")}
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab} className="p-0 border-0 bg-transparent">
          <TabPane tabId="1" className="ba-fade-in">
            <PersonalDataTab loadingUser={loadingUser} userData={userData} t={t} />
          </TabPane>
          <TabPane tabId="2" className="ba-fade-in">
            <FormationsTab loadingFormations={loadingFormations} formations={formations} t={t} />
          </TabPane>
          <TabPane tabId="3" className="ba-fade-in">
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
          </TabPane>
        </TabContent>
      </div>

      <Modal isOpen={deleteModalOpen} toggle={() => setDeleteModalOpen(false)} centered contentClassName="!bg-white/95 !backdrop-blur-md !border !border-gray-100 !rounded-2xl !shadow-2xl">
        <ModalHeader toggle={() => setDeleteModalOpen(false)} className="border-b-0 pb-0 flex items-center text-red-600 font-bold">
          <FaTrash className="mr-2 inline-block" />
          <span className="text-gray-900 font-semibold">{t("profile.deleteConfirmTitle", "Eliminar Cuenta Permanentemente")}</span>
        </ModalHeader>
        <ModalBody className="text-center px-6 py-4">
          <FaTrash size={44} className="text-red-500/80 mx-auto mb-3" />
          <h5 className="font-bold text-gray-800 text-lg mb-1">{t("profile.areYouSure", "¿Estás completamente seguro?")}</h5>
          <p className="text-gray-500 text-sm">{t("profile.deleteWarningText", "Esta acción eliminará permanentemente todos tus datos.")}</p>
          <input
            className="w-full mt-4 px-4 py-2.5 text-center text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-red-500 hover:border-gray-400 transition-colors shadow-none placeholder:text-gray-400"
            placeholder="ELIMINAR"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
          />
        </ModalBody>
        <ModalFooter className="border-t-0 flex justify-end gap-3 px-6 pb-6 pt-2">
          <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => setDeleteModalOpen(false)}>
            {t("common.cancel", "Cancelar")}
          </button>
          <button
            type="button"
            className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-600/20"
            disabled={deleteConfirmationText !== "ELIMINAR" || isDeleting}
            onClick={confirmDeleteAccount}
          >
            {isDeleting ? <Spinner size="sm" className="mr-2" /> : <FaTrash className="mr-2" />}
            {t("profile.deleteConfirmBtn", "Eliminar Cuenta")}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}