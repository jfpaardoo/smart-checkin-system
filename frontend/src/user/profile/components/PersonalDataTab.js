import React from "react";
import { Row, Col } from "reactstrap";
import { FaUser } from "react-icons/fa";
import { CardGhostLoader } from "../../../components/GhostLoader";

export default function PersonalDataTab({ loadingUser, userData, t }) {
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
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">{t('users.username', 'Usuario')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.username || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">{t('users.personalCode', 'Código Personal')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.personalCode || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">{t('users.firstName', 'Nombre')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.firstName || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">{t('users.lastName', 'Apellidos')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.lastName || "-"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">{t('users.roleAuthority', 'Rol / Autoridad')}</div>
            <div className="fs-6 fw-bold text-dark mt-1">{userData?.authority?.authority || "USER"}</div>
          </div>
        </Col>
        <Col md={6}>
          <div className="p-3 ba-glass-card-sm w-100 h-100 d-flex flex-column justify-content-center">
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
