import React, { useState } from "react";
import { Button, FormGroup, Input, Label, Form, Spinner } from "reactstrap";
import { FaShieldVirus } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import tokenService from "../../../services/token.service";

export default function TwoFactorSettings({ userData, setUserData, t, toast }) {
  const jwt = tokenService.getLocalAccessToken();

  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableCode, setDisableCode] = useState("");

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
    if (disableCode.length !== 6) {
      toast.error(t('profile.codeMustBe6Digits', 'El código debe tener 6 dígitos.'));
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/v1/users/2fa/disable", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: disableCode })
      });
      if (res.ok) {
        setUserData({ ...userData, twoFactorEnabled: false });
        setShowDisablePrompt(false);
        setDisableCode("");
        toast.success(t('profile.twoFactorDisableSuccess', '2FA desactivado correctamente.'));
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

  return (
    <div className="p-4 ba-glass-card mb-4 h-100">
      <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
        <FaShieldVirus className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.twoFactorTitle', 'Autenticación de Doble Factor (2FA)')}
      </h5>

      {userData?.twoFactorEnabled ? (
        <div>
          <p className="text-success fw-bold mb-3 small">{t('profile.twoFactorActive', '✓ El doble factor está actualmente activado en tu cuenta.')}</p>
          {!showDisablePrompt ? (
            <Button className="ba-btn-danger w-100 py-2 fw-bold" style={{ borderRadius: "12px" }} onClick={() => setShowDisablePrompt(true)}>
              {t('profile.disable2FA', 'Desactivar 2FA')}
            </Button>
          ) : (
            <div className="ba-glass-card p-4 mt-3">
              <p className="fw-bold mb-2 small text-dark">{t('profile.disable2FAPrompt', 'Introduce el código 2FA para confirmar desactivación:')}</p>
              <FormGroup>
                <Input 
                  type="text" 
                  placeholder="000000"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="ba-glass-input text-center fs-5 fw-bold tracking-widest"
                />
              </FormGroup>
              <div className="d-flex gap-2">
                <Button className="ba-btn-secondary w-50 py-2 fw-bold" style={{ borderRadius: "12px" }} onClick={() => { setShowDisablePrompt(false); setDisableCode(""); }}>
                  {t('common.cancel', 'Cancelar')}
                </Button>
                <Button className="ba-btn-danger w-50 py-2 fw-bold" style={{ borderRadius: "12px" }} onClick={handleDisable} disabled={disableCode.length !== 6 || loading2FA}>
                  {loading2FA ? <Spinner size="sm"/> : t('common.confirm', 'Confirmar')}
                </Button>
              </div>
            </div>
          )}
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
  );
}
