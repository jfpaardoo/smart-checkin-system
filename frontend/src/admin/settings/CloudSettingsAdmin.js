import React, { useState } from "react";
import { Button, Form, FormGroup, Label, Input, Row, Col } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import useFetchState from "../../util/useFetchState";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader } from "../../components/GhostLoader";
import "../../static/css/admin/adminPage.css";
import { FaCloudUploadAlt, FaSave, FaDatabase } from "react-icons/fa";

export default function CloudSettingsAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const toast = useToast();
  const [settings, setSettings, loading] = useFetchState(
    { provider: "ONEDRIVE", oneDriveClientId: "", oneDriveClientSecret: "", oneDriveTenantId: "", oneDriveRefreshToken: "" },
    "/api/v1/cloud-settings",
    jwt
  );
  
  const [backingUp, setBackingUp] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setSettings({ ...settings, [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    fetch("/api/v1/cloud-settings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    })
      .then((res) => {
        if (res.ok) {
          toast.success(t('cloudSettings.saveSuccess', 'Ajustes de nube guardados correctamente'));
        } else {
          toast.error(t('cloudSettings.saveError', 'Error al guardar ajustes'));
        }
      })
      .catch(() => toast.error(t('cloudSettings.connectionError', 'Error de conexión')));
  }

  function handleBackup() {
    setBackingUp(true);
    fetch("/api/v1/cloud-settings/backup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          toast.success(t('cloudSettings.backupSuccess', 'Copia de seguridad realizada y subida a la nube'));
        } else {
          res.text().then(text => toast.error(text || t('cloudSettings.backupError', 'Error al realizar el backup')));
        }
      })
      .catch(() => toast.error(t('cloudSettings.connectionError', 'Error de conexión')))
      .finally(() => setBackingUp(false));
  }

  if (loading) return <CardGhostLoader />;

  return (
    <div className="ba-container">
      <div className="ba-card p-4 p-md-5 mx-auto" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <h2 className="mb-0 text-dark fw-bold">
            <FaCloudUploadAlt className="me-2" style={{ color: 'var(--ba-primary)' }} /> {t('cloudSettings.title', 'Ajustes de Nube')}
          </h2>
          <Button className="ba-btn-primary d-flex align-items-center gap-2" onClick={handleBackup} disabled={backingUp}>
            <FaDatabase /> {backingUp ? t('cloudSettings.backingUp', 'Respaldando...') : t('cloudSettings.forceBackupBtn', 'Forzar Backup DB')}
          </Button>
        </div>

        <p className="text-muted mb-4">
          {t('cloudSettings.description', 'Configura aquí las credenciales para conectar la plataforma con la API de OneDrive (Microsoft Graph). Estas credenciales se utilizarán para subir los documentos de las formaciones y los backups de la base de datos.')}
        </p>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="provider">{t('cloudSettings.providerLabel', 'Proveedor de Nube Activo')}</Label>
                <Input
                  type="text"
                  name="provider"
                  id="provider"
                  value="Microsoft OneDrive"
                  disabled
                />
              </FormGroup>
            </Col>
          </Row>

          <h5 className="mt-4 mb-3 fw-bold text-dark border-bottom pb-2">{t('cloudSettings.azureCredentials', 'Credenciales de Microsoft Entra (Azure)')}</h5>
          
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="oneDriveTenantId">{t('cloudSettings.tenantIdLabel', 'Tenant ID')}</Label>
                <Input
                  type="text"
                  name="oneDriveTenantId"
                  id="oneDriveTenantId"
                  value={settings.oneDriveTenantId || ""}
                  onChange={handleChange}
                  placeholder="ej. 8a7c2b3d-..."
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="oneDriveClientId">{t('cloudSettings.clientIdLabel', 'Client ID (App ID)')}</Label>
                <Input
                  type="text"
                  name="oneDriveClientId"
                  id="oneDriveClientId"
                  value={settings.oneDriveClientId || ""}
                  onChange={handleChange}
                  placeholder="ej. 1f2b3c4d-..."
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="oneDriveClientSecret">{t('cloudSettings.clientSecretLabel', 'Client Secret')}</Label>
                <Input
                  type="password"
                  name="oneDriveClientSecret"
                  id="oneDriveClientSecret"
                  value={settings.oneDriveClientSecret || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="oneDriveRefreshToken">{t('cloudSettings.refreshTokenLabel', 'Refresh Token (Larga duración)')}</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="oneDriveRefreshToken"
                  id="oneDriveRefreshToken"
                  value={settings.oneDriveRefreshToken || ""}
                  onChange={handleChange}
                />
                <small className="text-muted">
                  {t('cloudSettings.refreshTokenHelp', 'Este token se usará para obtener Access Tokens automáticamente de la Graph API sin intervención del usuario.')}
                </small>
              </FormGroup>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button type="submit" className="ba-btn-primary d-flex align-items-center gap-2 px-4 py-2">
              <FaSave /> {t('cloudSettings.saveBtn', 'Guardar Ajustes')}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}