import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import jwt_decode from "jwt-decode";
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
import QRGeneratorAdmin from "./admin/qr/QRGeneratorAdmin";
import AnalyticsDashboard from "./admin/analytics/AnalyticsDashboard";
import AuditDashboard from "./admin/audit/AuditDashboard";
import ScannerCheckin from "./user/checkin/ScannerCheckin";
import UserDashboard from "./user/dashboard/UserDashboard";
import UserProfile from "./user/profile/UserProfile";
import { ToastProvider } from "./components/ToastProvider";
import CloudSettingsAdmin from "./admin/settings/CloudSettingsAdmin";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

function getRolesFromJWT(jwt) {
  return jwt_decode(jwt).authorities;
}

function App() {
  const jwt = tokenService.getLocalAccessToken();
  let roles = []
  if (jwt) {
    roles = getRolesFromJWT(jwt);
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
  
  if (!jwt) {
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
        <Routes>
          <Route path="/" exact={true} element={<Home />} />
          {publicRoutes}
          {userRoutes}
          {adminRoutes}
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;

