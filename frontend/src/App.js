import React from "react";
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
import SwaggerDocs from "./public/swagger";
import UserListAdmin from "./admin/users/UserListAdmin";
import UserEditAdmin from "./admin/users/UserEditAdmin";
import FormationListAdmin from "./admin/formations/FormationListAdmin";
import FormationEditAdmin from "./admin/formations/FormationEditAdmin";
import FormationDetailsAdmin from "./admin/formations/FormationDetailsAdmin";
import CompanyListAdmin from "./admin/companies/CompanyListAdmin";
import CompanyEditAdmin from "./admin/companies/CompanyEditAdmin";
import QRGeneratorAdmin from "./admin/qr/QRGeneratorAdmin";
import AnalyticsDashboard from "./admin/analytics/AnalyticsDashboard";
import AuditDashboard from "./admin/audit/AuditDashboard";
import ScannerCheckin from "./user/checkin/ScannerCheckin";
import UserDashboard from "./user/dashboard/UserDashboard";
import UserProfile from "./user/profile/UserProfile";
import { ToastProvider } from "./components/ToastProvider";
import CloudSettingsAdmin from "./admin/settings/CloudSettingsAdmin";
import PrivacyPolicy from "./legal/PrivacyPolicy";
import ForgotPassword from "./auth/recover/ForgotPassword";
import ResetPassword from "./auth/recover/ResetPassword";

import SessionTimeoutModal from "./components/SessionTimeoutModal";

import { useTranslation } from "react-i18next";

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

function App() {
  useLocation();
  const user = tokenService.getUser();
  let roles = []
  if (user?.roles) {
    roles = user.roles;
  }

  let adminRoutes = <></>;
  let userRoutes = <></>;
  let publicRoutes = <></>;

  roles.forEach((role) => {
    if (role === "ADMIN") {
      adminRoutes = (
        <>
          <Route path="/users" exact={true} element={<PrivateRoute><UserListAdmin /></PrivateRoute>} />
          <Route path="/users/:id" exact={true} element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
          <Route path="/companies" exact={true} element={<PrivateRoute><CompanyListAdmin /></PrivateRoute>} />
          <Route path="/companies/:id" exact={true} element={<PrivateRoute><CompanyEditAdmin /></PrivateRoute>} />
          <Route path="/formations" exact={true} element={<PrivateRoute><FormationListAdmin /></PrivateRoute>} />
          <Route path="/formations/:id" exact={true} element={<PrivateRoute><FormationEditAdmin /></PrivateRoute>} />
          <Route path="/formations/:id/details" exact={true} element={<PrivateRoute><FormationDetailsAdmin /></PrivateRoute>} />
          <Route path="/qr-generator" exact={true} element={<PrivateRoute><QRGeneratorAdmin /></PrivateRoute>} />
          <Route path="/analytics" exact={true} element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
          <Route path="/audit" exact={true} element={<PrivateRoute><AuditDashboard /></PrivateRoute>} />
          <Route path="/admin/cloud-settings" exact={true} element={<PrivateRoute><CloudSettingsAdmin /></PrivateRoute>} />
          <Route path="/docs" element={<PrivateRoute><SwaggerDocs /></PrivateRoute>} />
        </>)
    }
  })
  
  if (!user) {
    publicRoutes = (
      <>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </>
    )
  } else {
    userRoutes = (
      <>
        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkin" element={<ScannerCheckin />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      </>
    )
  }

  return (
    <ToastProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback} >
        <AppNavbar />
        <SessionTimeoutModal />
        <Routes>
          <Route path="/" exact={true} element={<Home />} />
          <Route path="/privacy-policy" exact={true} element={<PrivacyPolicy />} />
          <Route path="/forgot-password" exact={true} element={<ForgotPassword />} />
          <Route path="/reset-password" exact={true} element={<ResetPassword />} />
          {publicRoutes}
          {userRoutes}
          {adminRoutes}
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;