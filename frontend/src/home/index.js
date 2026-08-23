import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
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
    <div className="w-full max-w-[1440px] mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-3 sm:py-6 px-2 sm:px-6 lg:px-8">
      <div className="da-card home-card w-full text-center p-5 sm:p-8 md:p-10 lg:p-12 2xl:p-16 my-2 sm:my-4">
        
        {/* LOGO & TITLE HEADER */}
        <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8 lg:mb-10 pb-5 sm:pb-6 lg:pb-8 border-b border-white/40 dark:border-white/10 w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 2xl:w-20 2xl:h-20 rounded-2xl 2xl:rounded-3xl overflow-hidden flex items-center justify-center shadow-md border border-white/40 dark:border-white/10 bg-white dark:bg-slate-800 shrink-0 p-1">
            <img
              src="/favicon.png"
              alt={t('common.companyLogo', 'Logo de la empresa')}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-1">
              Distribution Academy
            </h1>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-slate-500 dark:text-slate-400 mb-0">
              {t('home.subtitle', 'Sistema Inteligente de Fichaje y Gestión de Formaciones')}
            </p>
          </div>
        </div>

        {/* LOGGED IN - ADMIN HUB */}
        {jwt && isAdmin && (
          <div className="space-y-6 lg:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <div className="p-2 2xl:p-3 rounded-xl 2xl:rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]">
                  <FaShieldAlt className="text-lg 2xl:text-2xl" />
                </div>
                <h2 className="text-lg sm:text-xl 2xl:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-0">
                  {t('home.quickActions', 'Acciones Rápidas')}
                </h2>
              </div>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t('home.sessionStartedAs', 'Sesión iniciada como:')}{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-bold">@{user?.username}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 2xl:gap-8 w-full">
              <Link to="/qr-generator" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaQrcode className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.projectQR', 'Generar Código QR')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.projectQRDesc', 'Proyectar QR para asistencia a formación')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.projectQRBtn', 'Proyectar QR →')}
                  </span>
                </div>
              </Link>

              <Link to="/analytics" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaChartBar className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.viewAnalytics', 'Analíticas y Reportes')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.viewAnalyticsDesc', 'Descargar informes Excel y PDF')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.viewDataBtn', 'Ver Datos →')}
                  </span>
                </div>
              </Link>

              <Link to="/formations" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaGraduationCap className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.manageFormations', 'Gestionar Formaciones')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.manageFormationsDesc', 'Crear y administrar convocatorias')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.manageBtn', 'Administrar →')}
                  </span>
                </div>
              </Link>

              <Link to="/users" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaUsers className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.manageUsers', 'Gestionar Usuarios')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.manageUsersDesc', 'Administrar plantilla de empleados')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.viewEmployeesBtn', 'Ver Empleados →')}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* LOGGED IN - EMPLOYEE HUB */}
        {jwt && !isAdmin && (
          <div className="space-y-6 lg:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <div className="p-2 2xl:p-3 rounded-xl 2xl:rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]">
                  <FaUser className="text-lg 2xl:text-2xl" />
                </div>
                <h2 className="text-lg sm:text-xl 2xl:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-0">
                  {t('home.employeeQuickAccess', 'Acceso Rápido')}
                </h2>
              </div>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t('home.sessionStartedAs', 'Sesión iniciada como:')}{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-bold">@{user?.username}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 2xl:gap-8 w-full">
              <Link to="/checkin" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaQrcode className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.directQRCheckin', 'Fichaje Directo QR')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.directQRCheckinDesc', 'Escanear el código QR del aula para registrar asistencia')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.scanQRBtn', 'Escanear QR →')}
                  </span>
                </div>
              </Link>

              <Link to="/dashboard" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaGraduationCap className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.myFormationsBtn', 'Ver Mis Formaciones')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.myFormationsDesc', 'Historial y estado de tus capacitaciones')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.viewFormationsBtn', 'Ver Formaciones →')}
                  </span>
                </div>
              </Link>

              <Link to="/profile" className="text-decoration-none block h-full group w-full">
                <div className="da-action-card w-full h-full flex flex-col items-center justify-between text-center p-4 sm:p-5 lg:p-6 2xl:p-8 rounded-2xl sm:rounded-3xl 2xl:rounded-[32px] transition-all duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div className="da-action-icon-wrapper mb-3 2xl:mb-4 2xl:w-20 2xl:h-20">
                      <FaUser className="text-2xl 2xl:text-4xl" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base 2xl:text-lg mb-1">
                      {t('home.myProfileBtn', 'Ver Mi Perfil')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0">
                      {t('home.myProfileDesc', 'Consultar datos personales y cambiar contraseña')}
                    </p>
                  </div>
                  <span className="da-btn-primary w-full mt-4 2xl:mt-6 py-2 2xl:py-3 px-3 rounded-xl 2xl:rounded-2xl text-xs sm:text-sm font-bold block text-center shadow-xs">
                    {t('home.goToProfileBtn', 'Ir a Mi Perfil →')}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* NOT LOGGED IN - GUEST LANDING */}
        {!jwt && (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="mb-6 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {t('home.guestWelcomeTitle', 'Portal de Asistencia y Formaciones')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-0">
                {t('home.guestWelcomeSub', 'Acceso rápido y seguro a convocatorias, control de asistencia QR y firma digital.')}
              </p>
            </div>

            {/* CONTENEDOR FLEX EN COLUMNA CON BOTONES SEPARADOS Y ESTILIZADOS */}
            <div className="flex flex-col items-center gap-3 w-full max-w-xs px-2 mt-2">
              <Link
                to="/login"
                className="da-btn-primary flex items-center justify-center gap-2 rounded-2xl w-full py-3 px-4 text-sm font-bold text-decoration-none shadow-md hover:scale-102 active:scale-98 transition-all"
              >
                <FaSignInAlt />
                <span>{t('nav.login', 'Iniciar Sesión')}</span>
              </Link>

              <Link
                to="/register"
                className="da-btn-secondary flex items-center justify-center gap-2 rounded-2xl w-full py-3 px-4 text-sm font-bold text-decoration-none shadow-sm hover:scale-102 active:scale-98 transition-all"
              >
                <FaUserPlus />
                <span>{t('nav.register', 'Solicitar Registro')}</span>
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER PÚBLICO HOME */}
      <div className="w-full text-center mt-2 pb-4 text-xs text-slate-500 dark:text-slate-400">
        <span>&copy; {new Date().getFullYear()} Distribution Academy | </span>
        <Link 
          to="/privacy-policy" 
          className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] text-decoration-none transition-colors ml-1"
        >
          Política de Privacidad
        </Link>
      </div>

    </div>
  );
}