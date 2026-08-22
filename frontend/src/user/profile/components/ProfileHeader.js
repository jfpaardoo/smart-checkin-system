import React from "react";
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

export default function ProfileHeader({ userData, t }) {
  return (
    <div className="p-5 sm:p-6 mb-6 rounded-3xl da-glass-card shadow-lg border border-white/60 dark:border-white/10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        
        <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md flex-shrink-0 bg-gradient-to-br from-slate-800 to-slate-950 text-[#d4e84a] border-2 border-[#b3c34c]"
          >
            {getAvatarInitial(userData)}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-0">
                {getUserFullName(userData)}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#b3c34c] text-slate-950 shadow-xs">
                {userData?.authority?.authority || "USER"}
              </span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">@{userData?.username}</span>
              <span>•</span>
              <span>{t('users.personalCode', 'Código Personal')}: <strong className="text-slate-800 dark:text-slate-200 font-bold">{userData?.personalCode || "----"}</strong></span>
              <span>•</span>
              <span className={`da-badge ${userData?.isWorking ? 'da-badge-active' : 'da-badge-inactive'}`}>
                {userData?.isWorking ? t('users.working', 'En formación') : t('users.offDuty', 'Fuera de formación')}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            to="/checkin"
            className="da-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-decoration-none shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FaQrcode />
            <span>{t('profile.scanQR', 'Escanear QR')}</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
