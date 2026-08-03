import React from "react";
import { Badge, Button } from "reactstrap";
import { FaQrcode } from "react-icons/fa";
import { Link } from "react-router-dom";

function getAvatarInitial(user) {
  if (user?.firstName && user.firstName.trim().length > 0) {
    return user.firstName.trim()[0].toUpperCase();
  }
  if (user?.username && user.username.trim().length > 0) {
    return user.username.trim()[0].toUpperCase();
  }
  return "U";
}

function getUserFullName(user) {
  if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
  return user?.username || "Usuario";
}

export default function ProfileHeader({ userData, formations, t }) {
  return (
    <div className="p-4 mb-4 rounded-4 ba-glass-card profile-header-container">
      <div className="d-flex align-items-center flex-wrap gap-4 profile-header-content">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
          style={{
            width: "76px",
            height: "76px",
            fontSize: "30px",
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            color: "#b3c34c",
            border: "2.5px solid #b3c34c",
          }}
        >
          {getAvatarInitial(userData)}
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h3 className="mb-0 text-dark fw-bold">
              {getUserFullName(userData)}
            </h3>
            <Badge pill className="px-3 py-1 fs-6 shadow-xs text-dark" style={{ background: "#b3c34c" }}>
              {userData?.authority?.authority || "USER"}
            </Badge>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap text-muted mt-2">
            <span>@{userData?.username}</span>
            <span>•</span>
            <span>{t('users.personalCode', 'Código Personal')}: <strong>{userData?.personalCode || "----"}</strong></span>
            <span>•</span>
            <span className={`ba-badge ${userData?.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`}>
              {userData?.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
            </span>
          </div>
        </div>
        <div>
          <Button
            tag={Link}
            to="/checkin"
            className="ba-btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-bold"
          >
            <FaQrcode /> {t('profile.scanQR', 'Escanear QR')}
          </Button>
        </div>
      </div>
    </div>
  );
}
