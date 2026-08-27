import React, { useState, useEffect, useCallback } from "react";
import { FaClock, FaSignInAlt, FaSignOutAlt, FaCalendarCheck } from "react-icons/fa";
import { TableGhostLoader } from "../../../components/GhostLoader";
import GlassPagination from "../../../components/GlassPagination";
import GlassEmptyState from "../../../components/GlassEmptyState";
import api from "../../../services/api";
import { formatDate } from "../../../utils/dateUtils";

export default function CheckinsTab({ t }) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchCheckins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/checkins/my-history`, {
        params: {
          page: currentPage - 1,
          size: pageSize,
        },
      });

      if (res.data && res.data.content && Array.isArray(res.data.content)) {
        setCheckins(res.data.content);
        setTotalElements(res.data.totalElements || 0);
      } else if (Array.isArray(res.data)) {
        setCheckins(res.data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        setTotalElements(res.data.length);
      } else {
        setCheckins([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error("Error fetching checkin history", err);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  if (loading && checkins.length === 0) {
    return <TableGhostLoader rows={5} columns={4} />;
  }

  return (
    <div className="p-1 sm:p-2 space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-bold m-0 flex items-center text-slate-800 dark:text-slate-100">
          <FaClock className="me-2 text-[#8a9e29] dark:text-[#d4e84a]" />
          {t("profile.checkinHistory", "Historial de Fichajes y Jornada")}
        </h5>
        {totalElements > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {totalElements} {t("profile.totalRecords", "registros")}
          </span>
        )}
      </div>

      {checkins.length === 0 ? (
        <GlassEmptyState
          icon={FaCalendarCheck}
          title={t("profile.noCheckinsYet", "No hay fichajes registrados")}
          description={t("profile.noCheckinsDesc", "Tus registros de entrada y salida aparecerán listados aquí.")}
        />
      ) : (
        <>
          {/* Vista Escritorio */}
          <div className="hidden md:block w-full overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
            <table className="w-full text-left border-collapse align-middle" style={{ minWidth: "600px" }}>
              <thead>
                <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-5">{t("checkin.type", "Tipo de Registro")}</th>
                  <th className="py-4 px-5">{t("checkin.dateTime", "Fecha y Hora")}</th>
                  <th className="py-4 px-5 text-center">{t("checkin.signatureStatus", "Firma")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
                {checkins.map((item) => {
                  const isEntry = item.checkInType === "ENTRADA";
                  return (
                    <tr key={item.id} className="hover:bg-white/30 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400">#{item.id}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                            isEntry
                              ? "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                              : "bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {isEntry ? <FaSignInAlt size={12} /> : <FaSignOutAlt size={12} />}
                          {isEntry ? t("checkin.entry", "ENTRADA") : t("checkin.exit", "SALIDA")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs sm:text-sm">
                        {formatDate(item.checkInDate)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {item.signature ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ {t("profile.signed", "Firmado")}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil */}
          <div className="md:hidden flex flex-col gap-2.5">
            {checkins.map((item) => {
              const isEntry = item.checkInType === "ENTRADA";
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isEntry
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isEntry ? <FaSignInAlt size={15} /> : <FaSignOutAlt size={15} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {isEntry ? t("checkin.entry", "ENTRADA") : t("checkin.exit", "SALIDA")}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(item.checkInDate)}
                      </div>
                    </div>
                  </div>
                  {item.signature && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {t("profile.signed", "Firmado")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginación Reactiva */}
          {totalElements > pageSize && (
            <GlassPagination
              currentPage={currentPage}
              totalItems={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
