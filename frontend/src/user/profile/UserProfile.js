import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { FaUser, FaGraduationCap, FaShieldAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import { useToast } from "../../components/ToastProvider";

import ProfileHeader from "./components/ProfileHeader";
import PersonalDataTab from "./components/PersonalDataTab";
import FormationsTab from "./components/FormationsTab";
import PasswordSecurityTab from "./components/PasswordSecurityTab";
import PrivacyDataTab from "./components/PrivacyDataTab";
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

  // Custom hooks for logic and state
  const { loadingUser, loadingFormations, userData, setUserData, formations } = useUserProfileData(jwt, t, toast);

  const passwordProps = usePasswordSecurity(jwt, t, toast);

  const toggleTab = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/users/me/export", {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user_data_export.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(t('profile.exportSuccess', 'Tus datos se han exportado correctamente.'));
      } else {
        toast.error(t('profile.exportError', 'No se pudieron exportar tus datos.'));
      }
    } catch (err) {
      console.error("Data export error:", err);
      toast.error(t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.confirmDeleteAlert', '¿Estás completamente seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.'))) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.ok) {
        toast.success(t('profile.deleteSuccess', 'Tu cuenta ha sido eliminada.'));
        setTimeout(() => {
          tokenService.removeUser();
          window.location.href = "/";
        }, 1500);
      } else {
        const body = await res.json();
        toast.error(body.message || t('profile.deleteError', 'Error al eliminar la cuenta.'));
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error(t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="ba-container">
      <div className="mx-auto w-full max-w-[1000px]">

        {/* Profile Header */}
        <ProfileHeader userData={userData} formations={formations} t={t} />

        {/* Tab Navigation */}
        <Nav pills className="ba-nav-pills border-0 mb-4 justify-content-center gap-3">
          <NavItem>
            <NavLink
              className={`px-4 py-2 shadow-sm ${activeTab === "1" ? "active" : ""}`}
              onClick={() => toggleTab("1")}
              style={{ cursor: "pointer" }}
            >
              <FaUser className="me-2" /> {t('profile.personalData', 'Mis Datos')}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={`px-4 py-2 shadow-sm ${activeTab === "2" ? "active" : ""}`}
              onClick={() => toggleTab("2")}
              style={{ cursor: "pointer" }}
            >
              <FaGraduationCap className="me-2" /> {t('profile.myFormations', 'Formaciones')}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={`px-4 py-2 shadow-sm ${activeTab === "3" ? "active" : ""}`}
              onClick={() => toggleTab("3")}
              style={{ cursor: "pointer" }}
            >
              <FaShieldAlt className="me-2" /> {t('profile.securityPassword', 'Seguridad y Privacidad')}
            </NavLink>
          </NavItem>
        </Nav>

        {/* Tab Content */}
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
            />
            <hr className="my-4 text-muted opacity-25" />
            <PrivacyDataTab
              t={t}
              handleDeleteAccount={handleDeleteAccount}
              isDeleting={isDeleting}
              handleExportData={handleExportData}
              isExporting={isExporting}
            />
          </TabPane>

        </TabContent>
      </div>
    </div>
  );
}