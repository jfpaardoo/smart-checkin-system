import React from "react";
import TwoFactorSettings from "./TwoFactorSettings";
import PasswordChangeCard from "./PasswordChangeCard";
import PasskeySettings from "./PasskeySettings";
import ActiveSessionsTab from "./ActiveSessionsTab";
import PrivacyDataTab from "./PrivacyDataTab";

export default function PasswordSecurityTab({
  passwordForm,
  setPasswordForm,
  handlePasswordChangeSubmit,
  submittingPassword,

  userData,
  setUserData,
  t,
  toast,
  handleExportData,
  isExporting,
  handleDeleteAccount,
  isDeleting
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        {/* Card 1: Passkeys / Biometría (FIDO2) */}
        <div>
          <PasskeySettings t={t} toast={toast} />
        </div>

        {/* Card 2: 2FA Configuration (TOTP) */}
        <div>
          <TwoFactorSettings userData={userData} setUserData={setUserData} t={t} toast={toast} />
        </div>

        {/* Card 3: Password Change */}
        <div className="lg:col-span-2">
          <PasswordChangeCard 
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handlePasswordChangeSubmit={handlePasswordChangeSubmit}
            submittingPassword={submittingPassword}
            t={t}
          />
        </div>
      </div>

      {/* Card 4: Sesiones Activas y Revocación Remota (OWASP ASVS L3) */}
      <div className="mb-6">
        <ActiveSessionsTab t={t} toast={toast} />
      </div>

      {/* Sección de Privacidad y Datos (GDPR) */}
      <div className="mt-6">
        <PrivacyDataTab 
          t={t}
          handleExportData={handleExportData}
          isExporting={isExporting}
          handleDeleteAccount={handleDeleteAccount}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}