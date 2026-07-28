import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Button } from 'reactstrap';
import { FaQrcode, FaChartBar, FaUsers, FaGraduationCap, FaUser, FaSignInAlt, FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import '../App.css';

export default function Home() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (jwt) {
      fetch("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) setUserData(data);
        })
        .catch(() => {});
    }
  }, [jwt]);

  const isAdmin = user?.authority?.authority === 'ADMIN' || user?.roles?.includes('ADMIN');

  return (
    <div className="ba-container">
      <div className="ba-card home-card text-center py-4 px-4 px-md-5" style={{ maxWidth: '1080px', margin: '1.5rem auto' }}>
        
        {/* LOGO & TITLE HEADER */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom border-light">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center shadow-xs border bg-white flex-shrink-0"
              style={{ width: '56px', height: '56px' }}
            >
              <img
                src="/ba-logo.png"
                alt="BA Glass"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }}
              />
            </div>
            <div className="text-start">
              <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                BA Distribution Academy
              </h2>
              <span className="text-muted small fw-semibold">
                {t('home.subtitle', 'Sistema Inteligente de Fichaje y Gestión de Formaciones')}
              </span>
            </div>
          </div>
        </div>

        {/* LOGGED IN - ADMIN HUB */}
        {jwt && isAdmin && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 text-start">
              <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                <FaShieldAlt style={{ color: 'var(--ba-primary)' }} /> {t('home.quickActions', 'Acciones Rápidas')}
              </h5>
              <span className="text-muted small">
                {t('home.sessionStartedAs', 'Sesión iniciada como:')} <strong className="text-dark">@{user?.username}</strong>
              </span>
            </div>

            <Row className="g-3 align-items-stretch">
              <Col md={6} lg={3}>
                <Link to="/admin/qr" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaQrcode size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.projectQR', 'Generar Código QR')}</h6>
                      <p className="small text-muted mb-0">{t('home.projectQRDesc', 'Proyectar QR para asistencia a formación')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.projectQRBtn', 'Proyectar QR →')}
                    </span>
                  </div>
                </Link>
              </Col>

              <Col md={6} lg={3}>
                <Link to="/admin/analytics" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaChartBar size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.viewAnalytics', 'Analíticas y Reportes')}</h6>
                      <p className="small text-muted mb-0">{t('home.viewAnalyticsDesc', 'Descargar informes Excel y PDF')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewDataBtn', 'Ver Datos →')}
                    </span>
                  </div>
                </Link>
              </Col>

              <Col md={6} lg={3}>
                <Link to="/admin/formations" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaGraduationCap size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.manageFormations', 'Gestionar Formaciones')}</h6>
                      <p className="small text-muted mb-0">{t('home.manageFormationsDesc', 'Crear y administrar convocatorias')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.manageBtn', 'Administrar →')}
                    </span>
                  </div>
                </Link>
              </Col>

              <Col md={6} lg={3}>
                <Link to="/admin/users" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaUsers size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.manageUsers', 'Gestionar Usuarios')}</h6>
                      <p className="small text-muted mb-0">{t('home.manageUsersDesc', 'Administrar plantilla de empleados')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewEmployeesBtn', 'Ver Empleados →')}
                    </span>
                  </div>
                </Link>
              </Col>
            </Row>
          </div>
        )}

        {/* LOGGED IN - EMPLOYEE USER HUB */}
        {jwt && !isAdmin && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 text-start">
              <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                <FaUser style={{ color: 'var(--ba-primary)' }} /> {t('home.employeeQuickAccess', 'Acceso Rápido del Empleado')}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{t('home.statusLabel', 'Tu estado actual:')}</span>
                <span className={`ba-badge ${userData?.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'} fs-6 py-1 px-3`}>
                  {userData?.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
                </span>
              </div>
            </div>

            <Row className="g-3 align-items-stretch">
              {/* Card 1: Fichaje Directo QR */}
              <Col md={4}>
                <Link to="/checkin" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaQrcode size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.directQRCheckin', 'Fichaje Directo QR')}</h6>
                      <p className="small text-muted mb-0">{t('home.directQRCheckinDesc', 'Escanea el código QR del aula para registrar asistencia')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.scanQRBtn', 'Escanear QR →')}
                    </span>
                  </div>
                </Link>
              </Col>

              {/* Card 2: Mi Perfil */}
              <Col md={4}>
                <Link to="/profile" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaUser size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.myProfileBtn', 'Ver Mi Perfil')}</h6>
                      <p className="small text-muted mb-0">{t('home.myProfileDesc', 'Consultar datos personales y cambiar contraseña')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.goToProfileBtn', 'Ir a Mi Perfil →')}
                    </span>
                  </div>
                </Link>
              </Col>

              {/* Card 3: Mis Formaciones */}
              <Col md={4}>
                <Link to="/dashboard" className="text-decoration-none d-block h-100">
                  <div className="ba-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="ba-action-icon-wrapper">
                        <FaGraduationCap size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.myFormationsBtn', 'Ver Mis Formaciones')}</h6>
                      <p className="small text-muted mb-0">{t('home.myFormationsDesc', 'Historial y estado de tus capacitaciones')}</p>
                    </div>
                    <span className="ba-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewFormationsBtn', 'Ver Formaciones →')}
                    </span>
                  </div>
                </Link>
              </Col>
            </Row>
          </div>
        )}

        {/* NOT LOGGED IN - GUEST LANDING */}
        {!jwt && (
          <div className="text-center py-4">
            <div className="mb-4">
              <h3 className="fw-bold text-dark mb-2">{t('home.guestWelcomeTitle', 'Portal de Asistencia y Formaciones')}</h3>
              <p className="text-muted mx-auto fs-6" style={{ maxWidth: '540px' }}>
                {t('home.guestWelcomeSub', 'Acceso rápido y seguro a convocatorias, control de asistencia QR y firma digital.')}
              </p>
            </div>

            <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
              <Button
                tag={Link}
                to="/login"
                className="ba-btn-primary px-5 py-3 fs-6 d-inline-flex align-items-center gap-2"
              >
                <FaSignInAlt /> {t('nav.login', 'Iniciar Sesión')}
              </Button>
              <Button
                tag={Link}
                to="/register"
                className="ba-btn-secondary px-4 py-3 fs-6 d-inline-flex align-items-center gap-2"
              >
                <FaUserPlus /> {t('nav.register', 'Solicitar Registro')}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}