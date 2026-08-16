import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FaQrcode, FaChartBar, FaUsers, FaGraduationCap, FaUser, FaSignInAlt, FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import { CardGhostLoader } from '../components/GhostLoader';
import '../App.css';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.ok ? r.json() : null);

export default function Home() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const user = tokenService.getUser();

  const { data: userData, isLoading: isSWRloading } = useSWR(
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
                alt="la empresa"
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

        {/* LOGGED IN - EMPLOYEE HUB (LIQUID GLASS) */}
        {jwt && !isAdmin && (
          <div className="w-full text-start">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3 pb-3 border-b border-slate-200/70">
              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-2 text-xl mb-1">
                  <FaUser className="text-[#8a9e29]" /> {t('home.employeeQuickAccess', 'Acceso Rápido')}
                </h5>
                <span className="text-xs text-slate-500 font-semibold">
                  {t('home.sessionStartedAs', 'Sesión iniciada como:')} <strong className="text-slate-700">@{user?.username}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">{t('home.statusLabel', 'Estado:')}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                    userData?.isWorking
                      ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-200/70 text-slate-600 border border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${userData?.isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {userData?.isWorking ? t('users.working', 'En formación / Activo') : t('users.offDuty', 'Fuera de formación')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Fichaje Directo QR */}
              <Link to="/checkin" className="no-underline group">
                <div className="h-full p-6 rounded-[28px] bg-white/60 hover:bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_16px_40px_0_rgba(138,158,41,0.18)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8a9e29]/20 to-[#b3c34c]/30 text-[#8a9e29] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-[#8a9e29] group-hover:text-white transition-all duration-300 shadow-xs">
                      <FaQrcode />
                    </div>
                    <h6 className="font-bold text-slate-800 text-base mb-1 group-hover:text-[#8a9e29] transition">
                      {t('home.directQRCheckin', 'Fichaje Directo QR')}
                    </h6>
                    <p className="text-xs text-slate-500 mb-0">
                      {t('home.directQRCheckinDesc', 'Escanea el código QR del aula para registrar tu entrada o salida')}
                    </p>
                  </div>
                  <span className="w-full mt-5 py-2.5 px-4 rounded-xl bg-white/80 group-hover:bg-[#8a9e29] text-slate-800 group-hover:text-white border border-slate-200 font-bold text-xs shadow-xs transition-all duration-300">
                    {t('home.scanQRBtn', 'Escanear QR →')}
                  </span>
                </div>
              </Link>

              {/* Card 2: Mis Formaciones */}
              <Link to="/dashboard" className="no-underline group">
                <div className="h-full p-6 rounded-[28px] bg-white/60 hover:bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_16px_40px_0_rgba(138,158,41,0.18)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8a9e29]/20 to-[#b3c34c]/30 text-[#8a9e29] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-[#8a9e29] group-hover:text-white transition-all duration-300 shadow-xs">
                      <FaGraduationCap />
                    </div>
                    <h6 className="font-bold text-slate-800 text-base mb-1 group-hover:text-[#8a9e29] transition">
                      {t('home.myFormationsBtn', 'Mis Formaciones')}
                    </h6>
                    <p className="text-xs text-slate-500 mb-0">
                      {t('home.myFormationsDesc', 'Consulta el estado de asistencia, firmas y convocatorias asignadas')}
                    </p>
                  </div>
                  <span className="w-full mt-5 py-2.5 px-4 rounded-xl bg-white/80 group-hover:bg-[#8a9e29] text-slate-800 group-hover:text-white border border-slate-200 font-bold text-xs shadow-xs transition-all duration-300">
                    {t('home.viewFormationsBtn', 'Ver Formaciones →')}
                  </span>
                </div>
              </Link>

              {/* Card 3: Mi Perfil & Seguridad */}
              <Link to="/profile" className="no-underline group">
                <div className="h-full p-6 rounded-[28px] bg-white/60 hover:bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_16px_40px_0_rgba(138,158,41,0.18)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8a9e29]/20 to-[#b3c34c]/30 text-[#8a9e29] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-[#8a9e29] group-hover:text-white transition-all duration-300 shadow-xs">
                      <FaUser />
                    </div>
                    <h6 className="font-bold text-slate-800 text-base mb-1 group-hover:text-[#8a9e29] transition">
                      {t('home.myProfileBtn', 'Mi Perfil & Seguridad')}
                    </h6>
                    <p className="text-xs text-slate-500 mb-0">
                      {t('home.myProfileDesc', 'Gestiona tus Passkeys biométricas, 2FA y sesiones activas')}
                    </p>
                  </div>
                  <span className="w-full mt-5 py-2.5 px-4 rounded-xl bg-white/80 group-hover:bg-[#8a9e29] text-slate-800 group-hover:text-white border border-slate-200 font-bold text-xs shadow-xs transition-all duration-300">
                    {t('home.goToProfileBtn', 'Ir a Mi Perfil →')}
                  </span>
                </div>
              </Link>
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
      <div className="text-center mt-4 pb-4" style={{ zIndex: 10 }}>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Distribution Academy |{' '}
        </span>
        <Link 
          to="/privacy-policy" 
          className="text-muted fw-bold text-decoration-none" 
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