import React from "react";
import { Form, Spinner } from "reactstrap";
import { FaLock, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordChangeCard({
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
  t,
}) {
  return (
    <div className="p-4 ba-glass-card h-100">
      <h5 className="fw-bold mb-4 d-flex align-items-center text-dark">
        <FaLock className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.changePasswordTitle', 'Modificar Contraseña')}
      </h5>
      <Form onSubmit={handlePasswordChangeSubmit}>
        {/* Contraseña Actual */}
        <div className="class-form-group mb-4" style={{ marginTop: "15px" }}>
          <input
            className="class-form-input pe-5"
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            name="currentPassword"
            placeholder=" "
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <label htmlFor="currentPassword" className="class-form-label">
            {t('profile.currentPassword', 'Contraseña Actual')}
          </label>
          <button
            type="button"
            className="password-eye-btn text-secondary me-2"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        {/* Nueva Contraseña */}
        <div className="class-form-group mb-4">
          <input
            className="class-form-input pe-5"
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            placeholder=" "
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            minLength={6}
          />
          <label htmlFor="newPassword" className="class-form-label">
            {t('profile.newPassword', 'Nueva Contraseña')}
          </label>
          <button
            type="button"
            className="password-eye-btn text-secondary me-2"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        {/* Repetir Nueva Contraseña */}
        <div className="class-form-group mb-4">
          <input
            className="class-form-input pe-5"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            placeholder=" "
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            minLength={6}
          />
          <label htmlFor="confirmPassword" className="class-form-label">
            {t('profile.confirmNewPassword', 'Repetir Nueva Contraseña')}
          </label>
          <button
            type="button"
            className="password-eye-btn text-secondary me-2"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={submittingPassword}
          className="ba-btn-primary w-100 py-3 fw-bold mt-3"
        >
          {submittingPassword ? (
            <>
              <Spinner size="sm" className="me-2" /> {t('profile.updatingPassword', 'Actualizando...')}
            </>
          ) : (
            <>
              <FaKey className="me-2" /> {t('profile.updatePasswordBtn', 'Actualizar Contraseña')}
            </>
          )}
        </button>
      </Form>
    </div>
  );
}
