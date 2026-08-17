import React, { Suspense, lazy } from "react";
import "./App.css";
import { Route, Routes, useLocation } from "react-router-dom";

import { ErrorBoundary } from "react-error-boundary";
import AppNavbar from "./AppNavbar";
import Home from "./home";
import PrivateRoute from "./privateRoute";
import Login from "./auth/login";
import Logout from "./auth/logout";
import Register from "./auth/register/Register";
import tokenService from "./services/token.service";
import ScannerCheckin from "./user/checkin/ScannerCheckin";
import UserDashboard from "./user/dashboard/UserDashboard";
import { ToastProvider } from "./components/ToastProvider";
import SessionTimeoutModal from "./components/SessionTimeoutModal";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { useTranslation } from "react-i18next";

// Lazy-loaded Views (Code-Splitting for lighter initial bundle)
const UserProfile = lazy(() => import("./user/profile/UserProfile"));
const SwaggerDocs = lazy(() => import("./public/swagger"));
const UserListAdmin = lazy(() => import("./admin/users/UserListAdmin"));
const UserEditAdmin = lazy(() => import("./admin/users/UserEditAdmin"));
const FormationListAdmin = lazy(() => import("./admin/formations/FormationListAdmin"));
const FormationEditAdmin = lazy(() => import("./admin/formations/FormationEditAdmin"));
const FormationDetailsAdmin = lazy(() => import("./admin/formations/FormationDetailsAdmin"));
const CompanyListAdmin = lazy(() => import("./admin/companies/CompanyListAdmin"));
const CompanyEditAdmin = lazy(() => import("./admin/companies/CompanyEditAdmin"));
const QRGeneratorAdmin = lazy(() => import("./admin/qr/QRGeneratorAdmin"));
const AnalyticsDashboard = lazy(() => import("./admin/analytics/AnalyticsDashboard"));
const AuditDashboard = lazy(() => import("./admin/audit/AuditDashboard"));
const CloudSettingsAdmin = lazy(() => import("./admin/settings/CloudSettingsAdmin"));
const PrivacyPolicy = lazy(() => import("./legal/PrivacyPolicy"));
const ForgotPassword = lazy(() => import("./auth/recover/ForgotPassword"));
const ResetPassword = lazy(() => import("./auth/recover/ResetPassword"));

function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="p-4 text-center">
      <p className="fw-bold text-danger">{t('common.somethingWentWrong', 'Algo salió mal:')}</p>
      <pre className="text-muted">{error.message}</pre>
      <button type="button" className="btn btn-primary mt-2" onClick={resetErrorBoundary}>
        {t('common.tryAgain', 'Reintentar')}
      </button>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[350px] text-slate-500 text-sm font-medium">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mr-3"></div>
      Cargando contenido...
    </div>
  );
}

function App() {
  useLocation();

  let adminRoutes = null;
  let userRoutes = null;
  const user = tokenService.getUser();

  if (user) {
    if (user.roles?.includes("ADMIN")) {
      adminRoutes = (
        <>
          <Route path="/users" element={<PrivateRoute><UserListAdmin /></PrivateRoute>} />
          <Route path="/users/:username" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
          <Route path="/formations" element={<PrivateRoute><FormationListAdmin /></PrivateRoute>} />
          <Route path="/formations/new" element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
          <Route path="/formations/:id" element={<PrivateRoute><FormationDetailsAdmin /></PrivateRoute>} />
          <Route path="/formations/:id/edit" element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
          <Route path="/companies" element={<PrivateRoute><CompanyListAdmin /></PrivateRoute>} />
          <Route path="/companies/new" element={<PrivateRoute><CompanyEditAdmin /></PrivateRoute>} />
          <Route path="/companies/:id" element={<PrivateRoute><CompanyEditAdmin /></PrivateRoute>} />
          <Route path="/qr-generator" element={<PrivateRoute><QRGeneratorAdmin /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><AuditDashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><CloudSettingsAdmin /></PrivateRoute>} />
          <Route path="/docs" element={<PrivateRoute><SwaggerDocs /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        </>
      );
    }
    if (user.roles?.includes("EMPLOYEE")) {
      userRoutes = (
        <>
          <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        </>
      );
    }
  }

  let publicRoutes = null;
  if (!user) {
    publicRoutes = (
      <>
        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkin" element={<ScannerCheckin />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </>
    );
  }

  return (
    <ToastProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback} >
        <AppNavbar />
        <SessionTimeoutModal />
        <PwaInstallPrompt />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" exact={true} element={<Home />} />
            <Route path="/privacy-policy" exact={true} element={<PrivacyPolicy />} />
            <Route path="/forgot-password" exact={true} element={<ForgotPassword />} />
            <Route path="/reset-password" exact={true} element={<ResetPassword />} />
            {publicRoutes}
            {userRoutes}
            {adminRoutes}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;