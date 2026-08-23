import React, { Suspense } from "react";
import "./App.css";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import AppNavbar from "./AppNavbar";
import Home from "./home";
import PrivateRoute from "./privateRoute";
import { ToastProvider } from "./components/ToastProvider";
import { NotificationProvider } from "./context/NotificationContext";
import SessionTimeoutModal from "./components/SessionTimeoutModal";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
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
    <div role="alert" className="p-4 text-center max-w-md mx-auto my-8 bg-white/80 backdrop-blur-md rounded-2xl border border-red-200 shadow-md">
      <p className="fw-bold text-danger text-lg mb-2">
        {isChunkError ? t('common.appUpdated', 'Nueva versión disponible') : t('common.somethingWentWrong', 'Algo salió mal:')}
      </p>
      <p className="text-muted text-sm mb-3">
        {isChunkError 
          ? t('common.appUpdatedDesc', 'Se ha desplegado una actualización de la aplicación. Por favor, recarga la página.')
          : error.message}
      </p>
      <div className="flex gap-2 justify-center">
        {isChunkError ? (
          <button type="button" className="btn btn-primary" onClick={handleReload}>
            {t('common.reloadApp', 'Recargar aplicación')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={resetErrorBoundary}>
            {t('common.tryAgain', 'Reintentar')}
          </button>
        )}
      </div>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="da-container" style={{ paddingTop: '24px' }}>
      <div className="da-ghost-card">
        <div className="da-ghost-element da-ghost-title" />
        <div className="da-ghost-element da-ghost-subtitle" />
        <div style={{ marginTop: '24px' }}>
          <div className="da-ghost-element da-ghost-row" />
          <div className="da-ghost-element da-ghost-row" />
          <div className="da-ghost-element da-ghost-row" />
          <div className="da-ghost-element da-ghost-row" />
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas de Usuario Autenticado / Empleado */}
            <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />

            {/* Rutas de Administración */}
            <Route path="/users" element={<PrivateRoute><UserListAdmin /></PrivateRoute>} />
            <Route path="/users/:id" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
            <Route path="/users/:username" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
            <Route path="/formations" element={<PrivateRoute><FormationListAdmin /></PrivateRoute>} />
            <Route path="/formations/new" element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id" element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id/edit" element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
            <Route path="/formations/:id/details" element={<PrivateRoute><FormationDetailsAdmin /></PrivateRoute>} />
            <Route path="/companies" element={<PrivateRoute><CompanyListAdmin /></PrivateRoute>} />
            <Route path="/companies/new" element={<PrivateRoute><CompanyEditAdmin /></PrivateRoute>} />
            <Route path="/companies/:id" element={<PrivateRoute><CompanyEditAdmin /></PrivateRoute>} />
            <Route path="/qr-generator" element={<PrivateRoute><QRGeneratorAdmin /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
            <Route path="/audit" element={<PrivateRoute><AuditDashboard /></PrivateRoute>} />
            <Route path="/admin/cloud-settings" element={<PrivateRoute><CloudSettingsAdmin /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><CloudSettingsAdmin /></PrivateRoute>} />
            <Route path="/docs" element={<PrivateRoute><SwaggerDocs /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <SWRConfig value={{ provider: localStorageProvider, revalidateOnFocus: false, dedupingInterval: 10000 }}>
      <ToastProvider>
        <NotificationProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <AppNavbar />
            <SessionTimeoutModal />
            <PwaInstallPrompt />
            <PwaUpdateNotification />
            <AnimatedRoutes />
          </ErrorBoundary>
        </NotificationProvider>
      </ToastProvider>
    </SWRConfig>
  );
}

export default App;