import React, { Suspense } from "react";
import "./App.css";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import AppNavbar from "./AppNavbar";
import BottomTabBar from "./components/BottomTabBar";
import Home from "./home";
import PrivateRoute from "./privateRoute";
import { ToastProvider } from "./components/ToastProvider";
import { NotificationProvider } from "./context/NotificationContext";
import SessionTimeoutModal from "./components/SessionTimeoutModal";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import PwaTopBanner from "./components/PwaTopBanner";
import PwaUpdateNotification from "./components/PwaUpdateNotification";
import PageTransition from "./components/PageTransition";
import { useTranslation } from "react-i18next";
import lazyWithRetry from "./util/lazyWithRetry";
import { localStorageProvider } from "./util/swrCacheProvider";

// Lazy-loaded Views (Code-Splitting with auto-recovery for stale chunks)
const Login = lazyWithRetry(() => import("./auth/login"));
const Logout = lazyWithRetry(() => import("./auth/logout"));
const Register = lazyWithRetry(() => import("./auth/register/Register"));
const ScannerCheckin = lazyWithRetry(() => import("./user/checkin/ScannerCheckin"));
const UserDashboard = lazyWithRetry(() => import("./user/dashboard/UserDashboard"));
const UserProfile = lazyWithRetry(() => import("./user/profile/UserProfile"));
const SwaggerDocs = lazyWithRetry(() => import("./public/swagger"));
const UserListAdmin = lazyWithRetry(() => import("./admin/users/UserListAdmin"));
const UserEditAdmin = lazyWithRetry(() => import("./admin/users/UserEditAdmin"));
const FormationListAdmin = lazyWithRetry(() => import("./admin/formations/FormationListAdmin"));
const FormationEditAdmin = lazyWithRetry(() => import("./admin/formations/FormationEditAdmin"));
const FormationDetailsAdmin = lazyWithRetry(() => import("./admin/formations/FormationDetailsAdmin"));
const CompanyListAdmin = lazyWithRetry(() => import("./admin/companies/CompanyListAdmin"));
const CompanyEditAdmin = lazyWithRetry(() => import("./admin/companies/CompanyEditAdmin"));
const QRGeneratorAdmin = lazyWithRetry(() => import("./admin/qr/QRGeneratorAdmin"));
const AnalyticsDashboard = lazyWithRetry(() => import("./admin/analytics/AnalyticsDashboard"));
const AuditDashboard = lazyWithRetry(() => import("./admin/audit/AuditDashboard"));
const CloudSettingsAdmin = lazyWithRetry(() => import("./admin/settings/CloudSettingsAdmin"));
const PrivacyPolicy = lazyWithRetry(() => import("./legal/PrivacyPolicy"));
const TermsAndConditions = lazyWithRetry(() => import("./legal/TermsAndConditions"));
const ForgotPassword = lazyWithRetry(() => import("./auth/recover/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./auth/recover/ResetPassword"));

function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useTranslation();
  const isChunkError = error?.name === 'ChunkLoadError' || (error?.message.includes('Loading chunk'));

  const handleReload = () => {
    window.sessionStorage.removeItem('retry-lazy-refreshed');
    window.location.reload();
  };

  return (
    <div
      role="alert"
      className="p-6 text-center max-w-md mx-auto my-10 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-red-200/80 dark:border-red-500/30 shadow-[0_20px_50px_rgba(15,23,42,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">
        {isChunkError ? t('common.appUpdated', 'Nueva versión disponible') : t('common.somethingWentWrong', 'Algo salió mal:')}
      </p>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 leading-relaxed">
        {isChunkError 
          ? t('common.appUpdatedDesc', 'Se ha desplegado una actualización de la aplicación. Por favor, recarga la página.')
          : error.message}
      </p>
      <div className="flex gap-3 justify-center">
        {isChunkError ? (
          <button
            type="button"
            className="px-5 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#b3c34c] to-[#9eb038] hover:from-[#a2b144] hover:to-[#8d9e2e] text-slate-950 shadow-md hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer border-0"
            onClick={handleReload}
          >
            {t('common.reloadApp', 'Recargar aplicación')}
          </button>
        ) : (
          <button
            type="button"
            className="px-5 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#b3c34c] to-[#9eb038] hover:from-[#a2b144] hover:to-[#8d9e2e] text-slate-950 shadow-md hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer border-0"
            onClick={resetErrorBoundary}
          >
            {t('common.tryAgain', 'Reintentar')}
          </button>
        )}
      </div>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 animate-pulse" aria-busy="true">
      <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-2xl rounded-3xl p-6 border border-white/70 dark:border-white/10 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <div className="h-7 w-48 sm:w-64 rounded-xl bg-slate-300/60 dark:bg-slate-700/60 mb-3" />
        <div className="h-4 w-72 sm:w-96 max-w-full rounded-lg bg-slate-300/45 dark:bg-slate-700/45" />
        <div className="mt-6 space-y-3">
          <div className="h-14 w-full rounded-2xl bg-slate-300/40 dark:bg-slate-800/60" />
          <div className="h-14 w-full rounded-2xl bg-slate-300/40 dark:bg-slate-800/60" />
          <div className="h-14 w-full rounded-2xl bg-slate-300/40 dark:bg-slate-800/60" />
          <div className="h-14 w-full rounded-2xl bg-slate-300/40 dark:bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes location={location}>
            {/* Rutas Públicas y de Autenticación */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkin" element={<PrivateRoute><ScannerCheckin /></PrivateRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas de Usuario Autenticado / Empleado */}
            <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />

            {/* Rutas de Administración */}
            <Route path="/users" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><UserListAdmin /></PrivateRoute>} />
            <Route path="/users/:id" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><UserEditAdmin /></PrivateRoute>} />
            <Route path="/formations" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><FormationListAdmin /></PrivateRoute>} />
            <Route path="/formations/new" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id/edit" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id/details" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><FormationDetailsAdmin /></PrivateRoute>} />
            <Route path="/companies" element={<PrivateRoute roles={['ADMIN']}><CompanyListAdmin /></PrivateRoute>} />
            <Route path="/companies/new" element={<PrivateRoute roles={['ADMIN']}><CompanyEditAdmin /></PrivateRoute>} />
            <Route path="/companies/:id" element={<PrivateRoute roles={['ADMIN']}><CompanyEditAdmin /></PrivateRoute>} />
            <Route path="/qr-generator" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><QRGeneratorAdmin /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute roles={['ADMIN', 'HR_MANAGER']}><AnalyticsDashboard /></PrivateRoute>} />
            <Route path="/audit" element={<PrivateRoute roles={['ADMIN']}><AuditDashboard /></PrivateRoute>} />
            <Route path="/admin/cloud-settings" element={<PrivateRoute roles={['ADMIN']}><CloudSettingsAdmin /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute roles={['ADMIN']}><CloudSettingsAdmin /></PrivateRoute>} />
            <Route path="/docs" element={<PrivateRoute roles={['ADMIN']}><SwaggerDocs /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <SWRConfig value={{ provider: localStorageProvider, revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 10000 }}>
      <ToastProvider>
        <NotificationProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <PwaTopBanner />
            <AppNavbar />
            <SessionTimeoutModal />
            <PwaInstallPrompt />
            <PwaUpdateNotification />
            <main className="pb-20 md:pb-6">
              <AnimatedRoutes />
            </main>
            <BottomTabBar />
          </ErrorBoundary>
        </NotificationProvider>
      </ToastProvider>
    </SWRConfig>
  );
}

export default App;