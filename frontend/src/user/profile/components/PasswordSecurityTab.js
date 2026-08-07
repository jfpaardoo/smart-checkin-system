import React from "react";
import { Row, Col } from "reactstrap";
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
    <div className="p-3">
      <Row className="g-4 mb-4">
        {/* Card: 2FA Configuration */}
        <Col xs={12} lg={6}>
          <TwoFactorSettings userData={userData} setUserData={setUserData} t={t} toast={toast} />
        </Col>

        {/* Card: Password Change */}
        <Col xs={12} lg={6}>
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
        </Col>
      </Row>

      {/* Sección de Privacidad y Datos debajo con su diseño original exacto */}
      <div className="mt-4">
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