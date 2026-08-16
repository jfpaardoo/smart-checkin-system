import React, { useState, useEffect, useCallback } from "react";
import { FaDesktop, FaMobileAlt, FaLaptop, FaSignOutAlt, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import api from "../../../services/api";

export default function ActiveSessionsTab({ t, toast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);

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
    try {
      setRevokingId(sessionId);
      await api.delete(`/users/me/sessions/${sessionId}`);
      toast.success(t("profile.sessionRevokedSuccess", "Sesión remota cerrada correctamente."));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error al revocar sesión:", err);
      toast.error(t("profile.sessionRevokeError", "No se pudo cerrar la sesión remota."));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm(t("profile.confirmRevokeOthers", "¿Estás seguro de que deseas cerrar sesión en todos los demás dispositivos?"))) {
      return;
    }
    try {
      setRevokingAll(true);
      const res = await api.delete("/users/me/sessions/others");
      toast.success(res.data?.message || t("profile.otherSessionsRevoked", "Se han cerrado las demás sesiones activas."));
      fetchSessions();
    } catch (err) {
      console.error("Error al cerrar otras sesiones:", err);
      toast.error(t("profile.otherSessionsRevokeError", "Error al cerrar las demás sesiones."));
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceInfo, userAgent) => {
    const info = (deviceInfo || userAgent || "").toLowerCase();
    if (info.includes("ios") || info.includes("android") || info.includes("iphone") || info.includes("mobile")) {
      return <FaMobileAlt className="text-xl text-[#8a9e29]" />;
    }
    if (info.includes("macos") || info.includes("macintosh") || info.includes("laptop")) {
      return <FaLaptop className="text-xl text-[#8a9e29]" />;
    }
    return <FaDesktop className="text-xl text-[#8a9e29]" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  const renderSessionsList = () => {
    if (loading && sessions.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500 text-sm">
          {t("profile.loadingSessions", "Cargando dispositivos activos...")}
        </div>
      );
    }
    if (sessions.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 text-sm">
          {t("profile.noActiveSessions", "No hay sesiones activas registradas.")}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id || session.tokenHash}
            className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
              session.isCurrent
                ? "bg-[#b3c34c]/10 border-[#b3c34c]/40 shadow-xs"
                : "bg-white/60 border-white/80 hover:bg-white/80"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-white/80 border border-white shadow-xs flex-shrink-0">
                {getDeviceIcon(session.deviceInfo, session.userAgent)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-sm">
                    {session.deviceInfo || t("profile.unknownDevice", "Dispositivo Desconocido")}
                  </span>
                  {session.isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#b3c34c] text-slate-900 shadow-xs">
                      {t("profile.currentSessionBadge", "Esta sesión")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>
                    <strong>IP:</strong> {session.ipAddress || "Local / Proxy"}
                  </span>
                  <span>
                    <strong>{t("profile.lastActive", "Última actividad")}:</strong> {formatDate(session.lastActivityAt)}
                  </span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <button
                type="button"
                onClick={() => handleRevokeSession(session.id)}
                disabled={revokingId === session.id}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition flex items-center gap-1.5 self-end sm:self-center cursor-pointer"
              >
                <FaSignOutAlt />
                {revokingId === session.id ? "..." : t("profile.revokeSession", "Cerrar sesión")}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[32px] border border-white/60 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h5 className="text-xl font-bold flex items-center text-slate-800 drop-shadow-sm mb-1">
            <FaShieldAlt className="mr-3 text-[#8a9e29] text-2xl" />
            {t("profile.activeSessionsTitle", "Sesiones Activas y Dispositivos")}
          </h5>
          <p className="text-xs text-slate-500 mb-0">
            {t("profile.activeSessionsSubtitle", "Controla y revoca accesos activos en otros navegadores o dispositivos (OWASP ASVS L3).")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchSessions}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white/60 hover:bg-white text-slate-700 text-xs font-semibold border border-white/80 transition flex items-center gap-2 shadow-xs cursor-pointer"
            title={t("profile.refreshSessions", "Actualizar sesiones")}
          >
            <FaSyncAlt className={loading ? "animate-spin text-[#8a9e29]" : "text-[#8a9e29]"} />
            {t("profile.refresh", "Actualizar")}
          </button>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={revokingAll}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FaSignOutAlt />
              {revokingAll ? "..." : t("profile.revokeOtherSessions", "Cerrar las demás sesiones")}
            </button>
          )}
        </div>
      </div>

      {renderSessionsList()}
    </div>
  );
}
