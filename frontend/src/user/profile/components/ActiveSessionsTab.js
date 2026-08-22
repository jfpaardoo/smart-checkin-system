import React, { useState, useEffect, useCallback } from "react";
import { FaDesktop, FaMobileAlt, FaLaptop, FaSignOutAlt, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import api from "../../../services/api";
import { formatDate } from "../../../utils/dateUtils";

const getDeviceIcon = (deviceInfo, userAgent) => {
  const info = (deviceInfo || userAgent || "").toLowerCase();
  if (info.includes("ios") || info.includes("android") || info.includes("iphone") || info.includes("mobile")) {
    return <FaMobileAlt className="text-xl text-[#8a9e29] dark:text-[#d4e84a]" />;
  }
  if (info.includes("macos") || info.includes("macintosh") || info.includes("laptop")) {
    return <FaLaptop className="text-xl text-[#8a9e29] dark:text-[#d4e84a]" />;
  }
  return <FaDesktop className="text-xl text-[#8a9e29] dark:text-[#d4e84a]" />;
};

export default function ActiveSessionsTab({ t, toast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const revokingIdRef = React.useRef(null);
  const isRevokingOtherRef = React.useRef(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/me/sessions");
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar sesiones activas:", err);
      toast.error(t("profile.sessionsLoadError", "Error al cargar las sesiones activas."));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId) => {
    if (revokingIdRef.current || revokingId) return;
    revokingIdRef.current = sessionId;
    setRevokingId(sessionId);
    try {
      await api.delete(`/users/me/sessions/${sessionId}`);
      toast.success(t("profile.sessionRevokedSuccess", "Sesión remota cerrada correctamente."));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error al revocar sesión:", err);
      toast.error(t("profile.sessionRevokeError", "No se pudo cerrar la sesión remota."));
    } finally {
      revokingIdRef.current = null;
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (isRevokingOtherRef.current || revokingAll) return;
    if (!window.confirm(t("profile.confirmRevokeOthers", "¿Estás seguro de que deseas cerrar sesión en todos los demás dispositivos?"))) {
      return;
    }
    isRevokingOtherRef.current = true;
    setRevokingAll(true);
    try {
      const res = await api.delete("/users/me/sessions/others");
      toast.success(res.data?.message || t("profile.otherSessionsRevoked", "Se han cerrado las demás sesiones activas."));
      await fetchSessions();
    } catch (err) {
      console.error("Error al cerrar otras sesiones:", err);
      toast.error(t("profile.otherSessionsRevokeError", "Error al cerrar las demás sesiones."));
    } finally {
      isRevokingOtherRef.current = false;
      setRevokingAll(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  const renderSessionsList = () => {
    if (loading && sessions.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          {t("profile.loadingSessions", "Cargando dispositivos activos...")}
        </div>
      );
    }
    if (sessions.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
          {t("profile.noActiveSessions", "No hay sesiones activas registradas.")}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id || session.tokenHash}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full overflow-hidden ${
              session.isCurrent
                ? "bg-[#b3c34c]/15 border-[#b3c34c]/40 shadow-xs"
                : "bg-white/50 dark:bg-slate-800/60 border-white/60 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 w-full min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-700/70 border border-white/80 dark:border-white/10 shadow-xs flex-shrink-0 mt-0.5 sm:mt-0">
                {getDeviceIcon(session.deviceInfo, session.userAgent)}
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm break-words leading-tight">
                    {session.deviceInfo || t("profile.unknownDevice", "Dispositivo Desconocido")}
                  </span>
                  {session.isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#b3c34c] text-slate-900 shadow-xs flex-shrink-0">
                      {t("profile.currentSessionBadge", "Esta sesión")}
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex flex-col xs:flex-row xs:flex-wrap gap-x-3 gap-y-0.5 leading-tight break-words mt-0.5">
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300">IP:</strong> {session.ipAddress || "Local / Proxy"}
                  </span>
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300">{t("profile.lastActive", "Última actividad")}:</strong> {formatDate(session.lastActivityAt)}
                  </span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <button
                type="button"
                onClick={() => handleRevokeSession(session.id)}
                disabled={revokingId === session.id}
                className="w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-700/60 hover:bg-rose-500/20 text-rose-500 hover:text-rose-700 border border-white/80 dark:border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto flex-shrink-0 shadow-xs hover:scale-105 active:scale-95"
              >
                <FaSignOutAlt className="flex-shrink-0" />
                <span>{revokingId === session.id ? "..." : t("profile.revokeSession", "Cerrar sesión")}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[28px] sm:rounded-[32px] border border-white/60 dark:border-white/10 mb-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h5 className="text-xl font-bold flex items-center text-slate-800 dark:text-slate-100 drop-shadow-sm mb-1">
            <FaShieldAlt className="mr-3 text-[#8a9e29] dark:text-[#d4e84a] text-2xl flex-shrink-0" />
            <span>{t("profile.activeSessionsTitle", "Sesiones Activas y Dispositivos")}</span>
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
            {t("profile.activeSessionsSubtitle", "Controla y revoca accesos activos en otros navegadores o dispositivos (OWASP ASVS L3).")}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchSessions}
            disabled={loading}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-white/60 dark:bg-slate-700/60 hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-white/80 dark:border-white/10 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            title={t("profile.refreshSessions", "Actualizar sesiones")}
          >
            <FaSyncAlt className={loading ? "animate-spin text-[#8a9e29] dark:text-[#d4e84a]" : "text-[#8a9e29] dark:text-[#d4e84a]"} />
            <span>{t("profile.refresh", "Actualizar")}</span>
          </button>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={revokingAll}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-center hover:scale-105 active:scale-95"
            >
              <FaSignOutAlt className="flex-shrink-0" />
              <span className="leading-tight">{revokingAll ? "..." : t("profile.revokeOtherSessions", "Cerrar las demás sesiones")}</span>
            </button>
          )}
        </div>
      </div>

      {renderSessionsList()}
    </div>
  );
}
