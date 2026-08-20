import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FaQrcode, FaChartBar, FaUsers, FaGraduationCap, FaUser, FaSignInAlt, FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import { CardGhostLoader } from '../components/GhostLoader';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.ok ? r.json() : null);

export default function Home() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const user = tokenService.getUser();

  const { isLoading: isSWRloading } = useSWR(
    jwt ? "/api/v1/users/me" : null,
    fetcher
  );

  const loadingUser = jwt ? isSWRloading : false;

  const isAdmin = user?.authority?.authority === 'ADMIN' || user?.roles?.includes('ADMIN');

  if (jwt && loadingUser) {
    return <CardGhostLoader />;
  }

  return (
    <div className="da-container">
      <div className="da-card home-card text-center py-4 px-4 px-md-5" style={{ maxWidth: '1080px', margin: '1.5rem auto' }}>
        
        {/* LOGO & TITLE HEADER (Centrado en móvil, en fila en PC) */}
        <div className="da-home-header mb-4">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-center text-center text-md-start gap-2 gap-md-3">
            <div className="da-home-logo mb-2 mb-md-0">
              <img
                src="/favicon.png"
                alt={t('common.companyLogo', 'Logo de la empresa')}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }}
              />
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                Distribution Academy
              </h2>
              <span className="text-muted small fw-semibold d-block mt-1 mt-md-0">
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
                <FaShieldAlt style={{ color: 'var(--da-primary)' }} /> {t('home.quickActions', 'Acciones Rápidas')}
              </h5>
              <span className="text-muted small">
                {t('home.sessionStartedAs', 'Sesión iniciada como:')} <strong className="text-dark">@{user?.username}</strong>
              </span>
            </div>

            <div className="da-home-grid-4">
              <div>
                <Link to="/qr-generator" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaQrcode size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.projectQR', 'Generar Código QR')}</h6>
                      <p className="small text-muted mb-0">{t('home.projectQRDesc', 'Proyectar QR para asistencia a formación')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.projectQRBtn', 'Proyectar QR →')}
                    </span>
                  </div>
                </Link>
              </div>

              <div>
                <Link to="/analytics" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaChartBar size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.viewAnalytics', 'Analíticas y Reportes')}</h6>
                      <p className="small text-muted mb-0">{t('home.viewAnalyticsDesc', 'Descargar informes Excel y PDF')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewDataBtn', 'Ver Datos →')}
                    </span>
                  </div>
                </Link>
              </div>

              <div>
                <Link to="/formations" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaGraduationCap size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.manageFormations', 'Gestionar Formaciones')}</h6>
                      <p className="small text-muted mb-0">{t('home.manageFormationsDesc', 'Crear y administrar convocatorias')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.manageBtn', 'Administrar →')}
                    </span>
                  </div>
                </Link>
              </div>

              <div>
                <Link to="/users" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaUsers size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.manageUsers', 'Gestionar Usuarios')}</h6>
                      <p className="small text-muted mb-0">{t('home.manageUsersDesc', 'Administrar plantilla de empleados')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewEmployeesBtn', 'Ver Empleados →')}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* LOGGED IN - EMPLOYEE HUB */}
        {jwt && !isAdmin && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 text-start">
              <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                <FaUser style={{ color: 'var(--da-primary)' }} /> {t('home.employeeQuickAccess', 'Acceso Rápido')}
              </h5>
              <span className="text-muted small">
                {t('home.sessionStartedAs', 'Sesión iniciada como:')} <strong className="text-dark">@{user?.username}</strong>
              </span>
            </div>

            <div className="da-home-grid-3">
              <div>
                <Link to="/checkin" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaQrcode size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.directQRCheckin', 'Fichaje Directo QR')}</h6>
                      <p className="small text-muted mb-0">{t('home.directQRCheckinDesc', 'Escanear el código QR del aula para registrar asistencia')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.scanQRBtn', 'Escanear QR →')}
                    </span>
                  </div>
                </Link>
              </div>

              <div>
                <Link to="/dashboard" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaGraduationCap size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.myFormationsBtn', 'Ver Mis Formaciones')}</h6>
                      <p className="small text-muted mb-0">{t('home.myFormationsDesc', 'Historial y estado de tus capacitaciones')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.viewFormationsBtn', 'Ver Formaciones →')}
                    </span>
                  </div>
                </Link>
              </div>

              <div>
                <Link to="/profile" className="text-decoration-none d-block h-100">
                  <div className="da-action-card h-100 d-flex flex-column align-items-center justify-content-between text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="da-action-icon-wrapper">
                        <FaUser size={30} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{t('home.myProfileBtn', 'Ver Mi Perfil')}</h6>
                      <p className="small text-muted mb-0">{t('home.myProfileDesc', 'Consultar datos personales y cambiar contraseña')}</p>
                    </div>
                    <span className="da-btn-primary w-100 mt-4 text-dark font-weight-bold" style={{ fontSize: '0.88rem' }}>
                      {t('home.goToProfileBtn', 'Ir a Mi Perfil →')}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
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

            {/* CONTENEDOR FLEX EN COLUMNA CON BOTONES AL 100% DE ANCHO */}
            <div className="d-flex flex-column align-items-center gap-3 w-100 mx-auto px-2 mt-4" style={{ maxWidth: '280px' }}>
              <Button
                tag={Link}
                to="/login"
                className="da-btn-primary d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm border-0 w-100"
                style={{ padding: '12px 10px', fontSize: '1rem' }}
              >
                <FaSignInAlt /> 
                <span>{t('nav.login', 'Iniciar Sesión')}</span>
              </Button>
              
              <Button
                tag={Link}
                to="/register"
                className="da-btn-secondary d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm border-0 w-100"
                style={{ padding: '12px 10px', fontSize: '1rem' }}
              >
                <FaUserPlus /> 
                <span>{t('nav.register', 'Solicitar Registro')}</span>
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER PÚBLICO HOME - POLÍTICA DE PRIVACIDAD */}
      <div className="w-full text-center mt-4 pb-4 px-4 relative z-10">
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Distribution Academy |{' '}
        </span>
        <Link 
          to="/privacy-policy" 
          className="text-muted fw-bold text-decoration-none inline-block" 
          style={{ fontSize: '0.85rem', transition: 'color 0.2s' }}
          onMouseOver={(e) => e.target.style.color = '#88982a'}
          onMouseOut={(e) => e.target.style.color = '#6c757d'}
        >
          Política de Privacidad
        </Link>
      </div>

    </div>
  );
}