import React from "react";
import { Row, Col } from "reactstrap";
import TwoFactorSettings from "./TwoFactorSettings";
import PasswordChangeCard from "./PasswordChangeCard";

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
  toast
}) {
  return (
    <div className="p-3">
      <Row className="g-4">
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
    </div>
  );
}
