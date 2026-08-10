import React from "react";
import TwoFactorSettings from "./TwoFactorSettings";
import PasswordChangeCard from "./PasswordChangeCard";
import PrivacyDataTab from "./PrivacyDataTab";

export default function PasswordSecurityTab({
  passwordForm,
  setPasswordForm,
  handlePasswordChangeSubmit,
  submittingPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
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
        {/* Card: 2FA Configuration */}
        <div>
          <TwoFactorSettings userData={userData} setUserData={setUserData} t={t} toast={toast} />
        </div>

        {/* Card: Password Change */}
        <div>
          <PasswordChangeCard 
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handlePasswordChangeSubmit={handlePasswordChangeSubmit}
            submittingPassword={submittingPassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            t={t}
          />
        </div>
      </div>

      {/* Sección de Privacidad y Datos */}
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