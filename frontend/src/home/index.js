import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { 
  FaQrcode, 
  FaChartBar, 
  FaUsers, 
  FaGraduationCap, 
  FaSignInAlt, 
  FaShieldAlt, 
  FaUserPlus,
  FaClock,
  FaBriefcase,
  FaCalendarAlt,
  FaAward,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCheckCircle
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import api from '../services/api';
import { CardGhostLoader } from '../components/GhostLoader';

const fetcher = (url) => api.get(url).then((res) => res.data).catch(() => null);

function extractUserRoles(user) {
  if (Array.isArray(user?.roles)) {
    return user.roles;
  }
  if (user?.authority?.authority) {
    return [user.authority.authority];
  }
  if (user?.authority) {
    return [user.authority];
  }
  return [];
}

function HomeHeader({ t }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-white/40 dark:border-white/10 w-full">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-md border border-white/40 dark:border-white/10 bg-white dark:bg-slate-800 shrink-0 p-1">
        <img
          src="/favicon.png"
          alt={t('common.companyLogo', 'Logo de la empresa')}
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-1">
          Distribution Academy
        </h1>
        <p className="text-xs sm:text-sm lg:text-base font-medium text-slate-500 dark:text-slate-400 mb-0">
          {t('home.subtitle', 'Sistema Inteligente de Gestión de Formaciones')}
        </p>
      </div>
    </div>
  );
}

function EmployeeTrainingStatusCard({ isWorking, t }) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 ${
      isWorking 
        ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30' 
        : 'bg-white/50 dark:bg-slate-800/40 border-white/60 dark:border-white/10'
    }`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          isWorking 
            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          <FaClock className="text-xl" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('home.trainingStatus', 'Estado de Formación')}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              isWorking 
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {isWorking ? t('home.inTraining', 'En Formación') : t('home.noActiveTraining', 'Sin Formación Activa')}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-0 mt-0.5">
            {isWorking 
              ? t('home.inTrainingNotice', 'Tienes una sesión de formación en curso.') 
              : t('home.readyToScanTraining', 'Listo para registrar asistencia a tu sesión de formación.')}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {isWorking ? (
          <Link
            to="/dashboard"
            className="da-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold no-underline w-full md:w-auto text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-transform"
          >
            <span>{t('home.finishTraining', 'Finalizar Asistencia / Firmar')}</span>
            <FaArrowRight className="text-xs" />
          </Link>
        ) : (
          <Link
            to="/checkin"
            className="da-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold no-underline w-full md:w-auto text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-transform"
          >
            <FaQrcode className="text-sm" />
            <span>{t('home.scanTrainingQR', 'Escanear QR de Formación')}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function formatFormationDate(dateString, language, fallbackText) {
  if (!dateString) return fallbackText;
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(language || 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

function EmployeeTrainingHub({ attendances, formations }) {
  const { t, i18n } = useTranslation();
  const totalAttended = attendances.filter(a => a.checkInDate != null).length;
  const completedTrainings = attendances.filter(a => a.checkOutDate || a.signature).length;
  const certificatesIssued = attendances.filter(a => 
    (a.checkOutDate || a.signature) && 
    (a.formation?.isClosed || a.formation?.status === 'CLOSED' || a.checkOutDate)
  ).length;

  const completedFormationIds = new Set(
    attendances
      .filter(a => a.checkOutDate || a.signature)
      .map(a => a.formation?.id)
      .filter(Boolean)
  );

  const candidateFormations = (formations || []).filter(f => {
    if (f.status !== 'IN_PROGRESS' && f.status !== 'PUBLISHED') return false;
    if (f.isClosed || f.status === 'CLOSED') return false;
    if (completedFormationIds.has(f.id)) return false;
    return true;
  });

  candidateFormations.sort((a, b) => {
    if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
    if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
    const dateA = a.formationDate ? new Date(a.formationDate).getTime() : Infinity;
    const dateB = b.formationDate ? new Date(b.formationDate).getTime() : Infinity;
    return dateA - dateB;
  });

  const activeFormation = candidateFormations.length > 0 ? candidateFormations[0] : null;

  return (
    <div className="space-y-6 w-full text-left">
      {/* 3 Métricas clave de Formación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-xl" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              {t('home.totalTrainingsAttended', 'Formaciones Asistidas')}
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {totalAttended}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FaCheckCircle className="text-xl" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              {t('home.completedBadge', 'Completadas')}
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {completedTrainings}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FaAward className="text-xl" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              {t('home.certificatesAvailable', 'Certificados Emitidos')}
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {certificatesIssued}
            </span>
          </div>
        </div>
      </div>

      {/* Próxima sesión convocada */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-slate-500 dark:text-slate-400 text-sm" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-0">
              {t('home.nextUpcomingSession', 'Próxima Sesión Convocada')}
            </h3>
          </div>
          <Link to="/dashboard" className="text-xs font-bold text-[#73841e] dark:text-[#d4e84a] no-underline hover:underline whitespace-nowrap">
            {t('home.viewAllFormations', 'Ver Catálogo Completo')} →
          </Link>
        </div>

        {activeFormation ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {t('home.activeSessionBadge', 'En Convocatoria')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFormationDate(activeFormation.formationDate, i18n.language, t('home.scheduledDate', 'Fecha programada'))}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                {activeFormation.name}
              </h4>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                {activeFormation.location && (
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt /> {activeFormation.location}
                  </span>
                )}
                {activeFormation.trainer && (
                  <span>{t('home.trainer', 'Instructor')}: {activeFormation.trainer}</span>
                )}
              </div>
            </div>

            <Link
              to="/checkin"
              className="da-btn-primary py-2 px-3.5 rounded-xl text-xs font-bold no-underline text-slate-900 shrink-0 hover:scale-102 transition-transform"
            >
              {t('home.scanTrainingQR', 'Fichar Asistencia')}
            </Link>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {t('home.noUpcomingSessions', 'No tienes sesiones programadas para hoy o próximas fechas.')}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffSupervisionHub({ stats, username, isAdmin, t }) {
  const latestStat = Array.isArray(stats) && stats.length > 0 ? stats[0] : null;
  const activeFormationsCount = latestStat?.activeFormations ?? 0;
  const averageHours = latestStat?.averageHoursPerEmployee ? latestStat.averageHoursPerEmployee.toFixed(1) : '0.0';
  const attendanceRate = latestStat?.formationAttendanceRate != null ? `${latestStat.formationAttendanceRate.toFixed(0)}%` : '100%';

  return (
    <div className="space-y-6 w-full text-left">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-3 border-b border-white/40 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]">
            {isAdmin ? <FaShieldAlt className="text-xl" /> : <FaBriefcase className="text-xl" />}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-0">
              {t('home.adminWelcome', 'Panel de Control y Supervisión')}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('home.adminSub', 'Monitorización en tiempo real de actividad, formaciones y métricas.')}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('home.sessionStartedAs', 'Sesión iniciada como:')}{' '}
          <strong className="text-slate-700 dark:text-slate-200">@{username}</strong>
        </span>
      </div>

      {/* 3 Widgets métricos en tiempo real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('home.activeFormationsMetric', 'Formaciones Activas')}
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {activeFormationsCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FaGraduationCap className="text-xl" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('home.averageHoursMetric', 'Horas Promedio')}
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {averageHours}h
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FaClock className="text-xl" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('home.attendanceRateMetric', 'Tasa de Asistencia')}
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {attendanceRate}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FaChartBar className="text-xl" />
          </div>
        </div>
      </div>

      {/* Proyección rápida de QR y gestión activa */}
      <div className="p-5 rounded-2xl sm:rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            {t('home.projectQR', 'Proyectar Código QR de Aula')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
            {t('home.projectQRDesc', 'Genera el QR dinámico rotativo con PIN seguro para registrar alumnos.')}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/qr-generator"
            className="da-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold no-underline w-full sm:w-auto text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-transform"
          >
            <FaQrcode className="text-sm" />
            <span>{t('home.projectQRBtn', 'Proyectar QR →')}</span>
          </Link>
          <Link
            to="/users"
            className="da-btn-secondary flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold no-underline w-full sm:w-auto text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <FaUsers className="text-sm" />
            <span>{t('home.viewEmployeesBtn', 'Plantilla')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function GuestLandingSection({ t }) {
  return (
    <div className="py-6 flex flex-col items-center justify-center">
      <div className="mb-6 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {t('home.guestWelcomeTitle', 'Portal de Asistencia y Formaciones')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-0">
          {t('home.guestWelcomeSub', 'Acceso rápido y seguro a convocatorias, control de asistencia QR y firma digital.')}
        </p>
      </div>

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
  );
}

function HomeFooter({ t }) {
  return (
    <div className="w-full text-center mt-2 pb-4 text-xs text-slate-500 dark:text-slate-400">
      <span>&copy; {new Date().getFullYear()} Distribution Academy | </span>
      <Link 
        to="/terms" 
        className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] text-decoration-none transition-colors ml-1"
      >
        {t('login.termsAndConditions', 'Términos y Condiciones')}
      </Link>
      <span className="mx-1">•</span>
      <Link 
        to="/privacy-policy" 
        className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#b3c34c] dark:hover:text-[#d4e84a] text-decoration-none transition-colors"
      >
        {t('login.privacyPolicy', 'Política de Privacidad')}
      </Link>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const localUser = tokenService.getUser();
  const localRoles = extractUserRoles(localUser);
  const isLocalStaff = localRoles.includes('ADMIN') || localRoles.includes('HR_MANAGER');

  const { data: meUser, isLoading: isSWRloading } = useSWR(
    jwt ? "/users/me" : null,
    fetcher
  );

  const user = meUser || localUser;
  const roles = extractUserRoles(user);
  const isAdmin = roles.includes('ADMIN');
  const isHR = roles.includes('HR_MANAGER');
  const isStaff = isAdmin || isHR;

  const { data: stats } = useSWR(
    jwt && isLocalStaff ? "/analytics" : null,
    fetcher
  );

  const { data: myAttendances } = useSWR(
    jwt && !isLocalStaff ? "/users/me/formations" : null,
    fetcher
  );

  const { data: allFormations } = useSWR(
    jwt && !isLocalStaff ? "/formations" : null,
    fetcher
  );

  if (jwt && isSWRloading) {
    return <CardGhostLoader />;
  }

  const isWorking = Boolean(user?.isWorking);

  return (
    <div className="w-full max-w-[1440px] mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
      <div className="da-card home-card w-full text-center p-5 sm:p-8 md:p-10 my-2 sm:my-4">
        <HomeHeader t={t} />

        {jwt && !isStaff && (
          <>
            <EmployeeTrainingStatusCard isWorking={isWorking} t={t} />
            <EmployeeTrainingHub
              attendances={Array.isArray(myAttendances) ? myAttendances : []}
              formations={Array.isArray(allFormations) ? allFormations : []}
              t={t}
            />
          </>
        )}

        {jwt && isStaff && (
          <StaffSupervisionHub
            stats={stats}
            username={user?.username}
            isAdmin={isAdmin}
            t={t}
          />
        )}

        {!jwt && (
          <GuestLandingSection t={t} />
        )}
      </div>

      <HomeFooter t={t} />
    </div>
  );
}
