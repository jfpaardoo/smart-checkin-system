import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Form, Button, Table, Badge, Spinner, Input, Label, FormGroup } from "reactstrap";
import { FaUser, FaGraduationCap, FaLock, FaKey, FaShieldAlt, FaIdCard, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash, FaQrcode, FaClock, FaAward, FaFilePdf, FaShieldVirus } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader, TableGhostLoader } from "../../components/GhostLoader";
import "../../App.css";
import "../../components/formGenerator/css/formGenerator.css";

function getAvatarInitial(user) {
  if (user?.firstName && user.firstName.trim().length > 0) {
    return user.firstName.trim()[0].toUpperCase();
  }
  if (user?.username && user.username.trim().length > 0) {
    return user.username.trim()[0].toUpperCase();
  }
  return "U";
}

function getUserFullName(user) {
  if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
  return user?.username || "Usuario";
}

function calculateDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "-";
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end - start;
  if (diffMs <= 0) return "0 min";
  const mins = Math.floor(diffMs / 60000);
  return `${mins} min`;
}

/* Sub-component: User Overview Header */
function ProfileHeader({ userData, formations, t }) {
  return (
    <div className="p-4 mb-4 rounded-4 ba-glass-card">
      <div className="d-flex align-items-center flex-wrap gap-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
          style={{
            width: "76px",
            height: "76px",
            fontSize: "30px",
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            color: "#b3c34c",
            border: "2.5px solid #b3c34c",
          }}
        >
          {getAvatarInitial(userData)}
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h3 className="mb-0 text-dark fw-bold">
              {getUserFullName(userData)}
            </h3>
            <Badge pill className="px-3 py-1 fs-6 shadow-xs text-dark" style={{ background: "#b3c34c" }}>
              {userData?.authority?.authority || "USER"}
            </Badge>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap text-muted mt-2">
            <span>@{userData?.username}</span>
            <span>•</span>
            <span>{t('users.personalCode', 'Código Personal')}: <strong>{userData?.personalCode || "----"}</strong></span>
            <span>•</span>
            <span className={`ba-badge ${userData?.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`}>
              {userData?.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
            </span>
          </div>
        </div>
        <div>
          <Button
            tag={Link}
            to="/checkin"
            className="ba-btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-bold"
          >
            <FaQrcode /> {t('profile.scanQR', 'Escanear QR')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Sub-component: Personal Data Tab */
function PersonalDataTab({ loadingUser, userData, t }) {
  if (loadingUser) {
    return <CardGhostLoader />;
  }

  return (
    <div className="p-3">
      <h5 className="fw-bold mb-4 d-flex align-items-center text-dark">
        <FaUser className="me-2 icon-pistachio" /> {t('profile.personalInformation', 'Información Personal del Usuario')}
      </h5>
      <Row className="g-3">
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.username', 'Usuario')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.username || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.personalCode', 'Código Personal')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.personalCode || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.firstName', 'Nombre')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.firstName || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.lastName', 'Apellidos')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.lastName || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.roleAuthority', 'Rol / Autoridad')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.authority?.authority || "USER"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-panel">
            <div className="text-muted small fw-semibold">{t('users.status', 'Estado de Formación')}</div>
            <div className="mt-1">
              <span className={`ba-badge ${userData?.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`}>
                {userData?.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
              </span>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

/* Sub-component: Formations Tab with Summary Analytics Widgets */
function FormationsTab({ loadingFormations, formations, t }) {
  if (loadingFormations) {
    return <TableGhostLoader rows={4} columns={6} />;
  }

  const completedFormations = formations.filter(f => f.checkOutDate && f.signature).length;
  const totalMinutes = formations.reduce((acc, f) => {
    if (f.checkInDate && f.checkOutDate) {
      const diff = new Date(f.checkOutDate) - new Date(f.checkInDate);
      return acc + (diff > 0 ? Math.floor(diff / 60000) : 0);
    }
    return acc;
  }, 0);

  const formattedHours = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : `${totalMinutes} min`;

  const handleDownloadCertificate = async (attendanceId) => {
    try {
      const response = await fetch(`/api/v1/certificates/attendance/${attendanceId}`, {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${attendanceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        console.error("Error fetching certificate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF", error);
    }
  };

  return (
    <div className="p-3">
      {/* Summary Analytics Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-primary">
              <FaGraduationCap size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.totalFormations', 'Total Registradas')}</div>
              <div className="fs-4 fw-bold text-dark">{formations.length}</div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-success">
              <FaAward size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.completedSigned', 'Completadas y Firmadas')}</div>
              <div className="fs-4 fw-bold text-dark">{completedFormations}</div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-warning">
              <FaClock size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.accumulatedTime', 'Tiempo Acumulado')}</div>
              <div className="fs-4 fw-bold text-dark">{formattedHours}</div>
            </div>
          </div>
        </Col>
      </Row>

      <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
        <FaGraduationCap className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.myFormationHistory', 'Historial de Formaciones')}
      </h5>

      {formations.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FaGraduationCap size={48} className="mb-3 opacity-50" />
          <h6>{t('profile.noFormationsYet', 'No tienes ninguna formación registrada todavía.')}</h6>
        </div>
      ) : (
        <div className="table-responsive">
          <Table responsive hover align="middle" className="ba-table">
            <thead>
              <tr>
                <th>{t('formations.name', 'Formación')}</th>
                <th>{t('formations.scheduled', 'Fecha Programada')}</th>
                <th>{t('formations.checkin', 'Entrada')}</th>
                <th>{t('formations.checkout', 'Salida')}</th>
                <th>{t('formations.duration', 'Duración')}</th>
                <th>{t('formations.signature', 'Firma Digital')}</th>
              </tr>
            </thead>
            <tbody>
              {formations.map((att) => {
                const isSigned = Boolean(att.signature);
                return (
                  <tr key={att.id}>
                    <td className="fw-bold text-dark">{att.formation?.name || "Formación"}</td>
                    <td className="small">{att.formation?.formationDate ? new Date(att.formation.formationDate).toLocaleString() : "-"}</td>
                    <td className="small">{att.checkInDate ? new Date(att.checkInDate).toLocaleString() : "-"}</td>
                    <td className="small">{att.checkOutDate ? new Date(att.checkOutDate).toLocaleString() : "-"}</td>
                    <td>
                      <span className="ba-badge ba-badge-inactive fw-bold px-3 py-1 text-dark" style={{ color: '#1e293b' }}>
                        {calculateDuration(att.checkInDate, att.checkOutDate)}
                      </span>
                    </td>
                    <td>
                      {isSigned ? (
                        <Badge color="success" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                          <FaCheckCircle /> {t('profile.signed', 'Firmado')}
                        </Badge>
                      ) : (
                        <Badge color="warning" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                          <FaExclamationTriangle /> {t('profile.pendingSignature', 'Pendiente')}
                        </Badge>
                      )}
                    </td>
                    <td className="text-end">
                      {isSigned && (
                        <Button 
                          size="sm" 
                          outline 
                          color="secondary" 
                          className="ba-action-btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => handleDownloadCertificate(att.id)}
                          title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}
                        >
                          <FaFilePdf className="text-danger" /> PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* Sub-component: Password Security & 2FA Tab */
function PasswordSecurityTab({
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
}) {
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();

  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);

  const handleStartSetup = async () => {
    setLoading2FA(true);
    try {
      const res = await fetch("/api/v1/users/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSetupData(data);
      } else {
        toast.error(data.message || t('profile.twoFactorSetupError', 'Error al iniciar configuración 2FA.'));
      }
    } catch (err) {
      toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirmEnable = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error(t('profile.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/v1/users/2fa/enable", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: verificationCode })
      });
      if (res.ok) {
        setUserData({ ...userData, twoFactorEnabled: true });
        setSetupData(null);
        setVerificationCode("");
        toast.success(t('profile.twoFactorEnableSuccess', '¡Autenticación de Doble Factor activada con éxito!'));
      } else {
        const data = await res.json();
        toast.error(data.message || t('profile.incorrectCode', 'Código incorrecto.'));
      }
    } catch (err) {
      toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable = async () => {
    toast.confirm(t('profile.disable2FAConfirm', '¿Seguro que deseas desactivar la autenticación de doble factor?'), async () => {
      try {
        const res = await fetch("/api/v1/users/2fa/disable", {
          method: "POST",
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          setUserData({ ...userData, twoFactorEnabled: false });
          setSetupData(null);
          toast.success(t('profile.twoFactorDisableSuccess', '2FA desactivado correctamente.'));
        } else {
          toast.error(t('profile.twoFactorDisableError', 'Error al desactivar 2FA.'));
        }
      } catch (err) {
        toast.error(err.message || t('profile.connectionError', 'Error de conexión.'));
      }
    });
  };

  return (
    <div className="p-3">
      <div className="mx-auto" style={{ maxWidth: "560px" }}>
        
        {/* Card: 2FA Configuration */}
        <div className="p-4 ba-glass-card mb-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
            <FaShieldVirus className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.twoFactorTitle', 'Autenticación de Doble Factor (2FA)')}
          </h5>

          {userData?.twoFactorEnabled ? (
            <div>
              <p className="text-success fw-bold mb-3 small">{t('profile.twoFactorActive', '✓ El doble factor está actualmente activado en tu cuenta.')}</p>
              <Button className="ba-btn-danger w-100 py-2 fw-bold" style={{ borderRadius: "12px" }} onClick={handleDisable}>
                {t('profile.disable2FA', 'Desactivar 2FA')}
              </Button>
            </div>
          ) : (
            <div>
              {!setupData ? (
                <div>
                  <p className="text-muted small mb-3">{t('profile.twoFactorDesc', 'Protege tu cuenta añadiendo un código de verificación de 6 dígitos generado por tu app de autenticación (Google Authenticator, Authy).')}</p>
                  <Button className="ba-btn-primary w-100 py-2 fw-bold" style={{ borderRadius: "12px" }} onClick={handleStartSetup} disabled={loading2FA}>
                    {loading2FA ? <Spinner size="sm" /> : t('profile.setup2FA', 'Configurar 2FA')}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="fw-bold mb-2 small text-dark">{t('profile.twoFactorStep1', '1. Escanea este código QR con tu app de autenticación:')}</p>
                  <div className="bg-white p-3 d-inline-block rounded-3 shadow-sm mb-3">
                    <QRCodeSVG value={setupData.qrUri} size={160} />
                  </div>
                  <p className="text-muted small mb-3">{t('profile.twoFactorSecretManual', 'O introduce la clave secreta manualmente:')} <br /><code>{setupData.secret}</code></p>
                  
                  <Form onSubmit={handleConfirmEnable} className="mx-auto">
                    <FormGroup className="mb-3 text-start">
                      <Label for="verificationCode" className="small fw-bold">{t('profile.twoFactorStep2', '2. Introduce el código de 6 dígitos:')}</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        id="verificationCode"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        required
                        style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.3rem', borderRadius: '12px' }}
                      />
                    </FormGroup>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button className="ba-btn-primary py-2 px-3 fw-bold" type="submit" disabled={loading2FA} style={{ borderRadius: '12px' }}>
                        {t('profile.confirmAndEnable', 'Confirmar y Activar')}
                      </Button>
                      <Button className="ba-btn-secondary py-2 px-3" type="button" onClick={() => setSetupData(null)} style={{ borderRadius: '12px' }}>
                        {t('profile.cancel', 'Cancelar')}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card: Password Change */}
        <div className="p-4 ba-glass-card">
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

            <Button
              type="submit"
              disabled={submittingPassword}
              className="w-100 py-3 fw-bold border-0 shadow-sm mt-2"
              style={{
                borderRadius: "16px",
                background: "#cce364",
                color: "#1a1a1a",
                boxShadow: "0 6px 20px rgba(204, 227, 100, 0.4)",
                fontSize: "1rem",
              }}
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
            </Button>
          </Form>
        </div>

      </div>
    </div>
  );
}

/* Main Component: UserProfile */
export default function UserProfile() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();

  const [activeTab, setActiveTab] = useState("1");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formations, setFormations] = useState([]);

  // Form State for Password Change & Visibility Toggles
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fetchProfileData = useCallback(() => {
    setLoadingUser(true);
    fetch("/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('genericError', 'Error al cargar perfil'));
        return res.json();
      })
      .then((data) => {
        setUserData(data);
        setLoadingUser(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoadingUser(false);
      });
  }, [jwt, t, toast]);

  const fetchMyFormations = useCallback(() => {
    setLoadingFormations(true);
    fetch("/api/v1/users/me/formations", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('genericError', 'Error al cargar formaciones'));
        return res.json();
      })
      .then((data) => {
        setFormations(data || []);
        setLoadingFormations(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoadingFormations(false);
      });
  }, [jwt, t, toast]);

  useEffect(() => {
    fetchProfileData();
    fetchMyFormations();
  }, [fetchProfileData, fetchMyFormations]);

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      toast.error(t('profile.enterCurrentPassword', 'Introduce la contraseña actual'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength', 'La nueva contraseña debe tener al menos 6 caracteres'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch', 'Las contraseñas no coinciden'));
      return;
    }

    setSubmittingPassword(true);
    fetch("/api/v1/users/me/password", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || t('profile.changePasswordError', 'Error al cambiar contraseña'));
        }
        toast.success(t('profile.passwordSuccessLogout', 'Contraseña actualizada con éxito. Por seguridad, debes iniciar sesión de nuevo.'));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        tokenService.removeUser();
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      })
      .catch((err) => {
        toast.error(err.message);
        setSubmittingPassword(false);
      });
  };

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header mb-3">
          <h2 className="d-flex align-items-center gap-2 m-0 text-dark fw-bold">
            <FaUser className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.myProfileTitle', 'Mi Perfil')}
          </h2>
        </div>

        <ProfileHeader userData={userData} formations={formations} t={t} />

        <Nav pills className="mb-4 flex-row flex-wrap gap-2 border-0">
          <NavItem>
            <NavLink
              className="px-4 py-2 rounded-pill fw-semibold border-0 d-inline-flex align-items-center"
              style={{
                cursor: "pointer",
                background: activeTab === "1" ? "#cce364" : "rgba(255, 255, 255, 0.7)",
                color: activeTab === "1" ? "#1a1a1a" : "#475569",
                boxShadow: activeTab === "1" ? "0 4px 15px rgba(204, 227, 100, 0.4)" : "none",
                fontWeight: activeTab === "1" ? "700" : "500",
              }}
              onClick={() => setActiveTab("1")}
            >
              <FaIdCard className="me-2" /> {t('profile.personalData', 'Datos Personales')}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className="px-4 py-2 rounded-pill fw-semibold border-0 d-inline-flex align-items-center"
              style={{
                cursor: "pointer",
                background: activeTab === "2" ? "#cce364" : "rgba(255, 255, 255, 0.7)",
                color: activeTab === "2" ? "#1a1a1a" : "#475569",
                boxShadow: activeTab === "2" ? "0 4px 15px rgba(204, 227, 100, 0.4)" : "none",
                fontWeight: activeTab === "2" ? "700" : "500",
              }}
              onClick={() => setActiveTab("2")}
            >
              <FaGraduationCap className="me-2" /> {t('profile.myFormations', 'Mis Formaciones')} ({formations.length})
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className="px-4 py-2 rounded-pill fw-semibold border-0 d-inline-flex align-items-center"
              style={{
                cursor: "pointer",
                background: activeTab === "3" ? "#cce364" : "rgba(255, 255, 255, 0.7)",
                color: activeTab === "3" ? "#1a1a1a" : "#475569",
                boxShadow: activeTab === "3" ? "0 4px 15px rgba(204, 227, 100, 0.4)" : "none",
                fontWeight: activeTab === "3" ? "700" : "500",
              }}
              onClick={() => setActiveTab("3")}
            >
              <FaShieldAlt className="me-2" /> {t('profile.securityPassword', 'Seguridad y Contraseña')}
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <PersonalDataTab loadingUser={loadingUser} userData={userData} t={t} />
          </TabPane>
          <TabPane tabId="2">
            <FormationsTab loadingFormations={loadingFormations} formations={formations} t={t} />
          </TabPane>
          <TabPane tabId="3">
            <PasswordSecurityTab
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
              userData={userData}
              setUserData={setUserData}
              t={t}
            />
          </TabPane>
        </TabContent>
      </div>
    </div>
  );
}