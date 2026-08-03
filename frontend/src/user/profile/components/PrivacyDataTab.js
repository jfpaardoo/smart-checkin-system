import React from "react";
import { Row, Col, Button, Spinner } from "reactstrap";
import { FaShieldAlt, FaDownload, FaTrash } from "react-icons/fa";

export default function PrivacyDataTab({ t, handleDeleteAccount, isDeleting, handleExportData, isExporting }) {
  return (
    <div className="p-3">
      <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
        <FaShieldAlt className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.privacyData', 'Privacidad y Datos')}
      </h5>

      <Row className="g-4 mt-1">
        <Col md={12}>
          <div className="p-4 ba-glass-card-sm text-start">
            <h6 className="fw-bold mb-2 text-dark"><FaDownload className="me-2 text-success" /> {t('profile.exportData', 'Exportar Mis Datos (GDPR)')}</h6>
            <p className="text-muted small mb-3">
              {t('profile.exportDataDesc', 'Tienes derecho a solicitar una copia de todos tus datos personales almacenados en nuestro sistema, incluyendo tu historial de fichajes y formaciones, en un formato estructurado y legible.')}
            </p>
            <Button 
              onClick={handleExportData} 
              disabled={isExporting}
              className="ba-btn-primary mt-2"
            >
              {isExporting ? <Spinner size="sm" className="me-2" /> : <FaDownload className="me-2" />}
              {t('profile.exportDataBtn', 'Solicitar Exportación')}
            </Button>
          </div>
        </Col>

        <Col md={12}>
          <div className="p-4 ba-glass-card-sm text-start" style={{ background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.4) 0%, rgba(255, 255, 255, 0.4) 100%)', borderColor: 'rgba(252, 165, 165, 0.6)' }}>
            <h6 className="fw-bold text-danger mb-2"><FaTrash className="me-2" /> {t('profile.deleteAccount', 'Eliminar Cuenta')}</h6>
            <p className="text-muted small mb-3">
              {t('profile.deleteAccountDesc', 'Eliminar tu cuenta es una acción irreversible. Todos tus datos personales, historial de fichajes y formaciones serán eliminados de forma permanente de nuestros servidores.')}
            </p>
            <Button 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="ba-btn-danger mt-2"
            >
              {isDeleting ? <Spinner size="sm" className="me-2" /> : <FaTrash className="me-2" />}
              {t('profile.deleteAccountBtn', 'Eliminar Mi Cuenta')}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
