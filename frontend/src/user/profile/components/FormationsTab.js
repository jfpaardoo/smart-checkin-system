import React from "react";
import { FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaAward, FaClock, FaFilePdf } from "react-icons/fa";
import { TableGhostLoader } from "../../../components/GhostLoader";
import api from "../../../services/api";
import { calculateDuration, formatDate } from "../../../utils/dateUtils";
import { saveBlobFile } from "../../../util/downloadExportFile";

const handleDownloadCertificate = async (attendanceId) => {
  try {
    const res = await api.get(`/certificates/attendance/${attendanceId}`, { responseType: 'blob' });
    await saveBlobFile(res.data, `certificate_${attendanceId}.pdf`, 'application/pdf');
  } catch (error) {
    console.error("Error downloading PDF", error);
  }
};

export default function FormationsTab({ loadingFormations, formations, t }) {
  if (loadingFormations) {
    return <TableGhostLoader rows={4} columns={6} />;
  }

  const completedFormations = formations.filter(f => f.checkOutDate && f.signature).length;
  const totalMinutes = formations.reduce((acc, f) => {
    if (f.checkInDate && f.checkOutDate) {
      const diff = new Date(f.checkOutDate) - new Date(f.checkInDate);
      return acc + (diff > 0 ? Math.floor(diff / 60000) : 0);
    }
    return acc;
  }, 0);

  const formattedHours = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : `${totalMinutes} min`;

  return (
    <div className="p-1 sm:p-2">
      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div>
          <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
              <FaGraduationCap size={22} />
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('profile.totalFormations', 'Total Registradas')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formations.length}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs flex-shrink-0">
              <FaAward size={22} />
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('profile.completedSigned', 'Completadas y Firmadas')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{completedFormations}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs flex-shrink-0">
              <FaClock size={22} />
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('profile.accumulatedTime', 'Tiempo Acumulado')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formattedHours}</div>
            </div>
          </div>
        </div>
      </div>

      <h5 className="font-bold mb-3 flex items-center text-slate-800 dark:text-slate-100">
        <FaGraduationCap className="me-2 text-[#8a9e29] dark:text-[#d4e84a]" /> {t('profile.myFormationHistory', 'Historial de Formaciones')}
      </h5>

      {formations.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10">
          <FaGraduationCap size={48} className="block mx-auto mb-3 opacity-50 text-[#8a9e29]" />
          <h6>{t('profile.noFormationsYet', 'No tienes ninguna formación registrada todavía.')}</h6>
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO (Tabla unificada Liquid Glass) */}
          <div className="hidden lg:block w-full overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
            <table className="w-full text-left border-collapse align-middle" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5" style={{ width: '25%' }}>{t('formations.name', 'Nombre')}</th>
                  <th className="py-4 px-5" style={{ width: '18%' }}>{t('formations.scheduled', 'Fecha Programada')}</th>
                  <th className="py-4 px-5" style={{ width: '15%' }}>{t('formations.checkin', 'Entrada')}</th>
                  <th className="py-4 px-5" style={{ width: '15%' }}>{t('formations.checkout', 'Salida')}</th>
                  <th className="py-4 px-5 text-center" style={{ width: '12%' }}>{t('formations.duration', 'Duración')}</th>
                  <th className="py-4 px-5 text-center" style={{ width: '15%' }}>{t('formations.signature', 'Firma Digital')}</th>
                  <th className="py-4 px-5 text-right" style={{ width: '10%' }}>{t('common.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
                {formations.map((att) => {
                  const isSigned = Boolean(att.signature);
                  return (
                    <tr key={att.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                            <FaGraduationCap size={15} />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {att.formation?.name || "Formación"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(att.formation?.formationDate)}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(att.checkInDate)}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(att.checkOutDate)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="da-badge da-badge-inactive text-xs font-mono">
                          {calculateDuration(att.checkInDate, att.checkOutDate)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isSigned ? (
                          <span className="da-badge da-badge-active text-xs">
                            <FaCheckCircle className="mr-1" /> {t('profile.signed', 'Firmado')}
                          </span>
                        ) : (
                          <span className="da-badge da-badge-warning text-xs">
                            <FaExclamationTriangle className="mr-1" /> {t('profile.pendingSignature', 'Pendiente')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {isSigned ? (
                          <button 
                            type="button" 
                            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer" 
                            onClick={() => handleDownloadCertificate(att.id)} 
                            title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}
                            aria-label={t('profile.downloadCertificate', 'Descargar Certificado PDF')}
                          >
                            <FaFilePdf size={14} />
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. VISTA MÓVIL / TABLET */}
          <div className="lg:hidden flex flex-col gap-3 mt-2">
            {formations.map((att) => {
              const isSigned = Boolean(att.signature);
              return (
                <div key={att.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3">
                  
                  {/* Cabecera: Fecha y Badge */}
                  <div className="flex justify-between items-center gap-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                      {formatDate(att.formation?.formationDate) || "SIN FECHA"}
                    </span>
                    <div className="flex-shrink-0">
                      {isSigned ? (
                        <span className="da-badge da-badge-active text-[11px]">
                          <FaCheckCircle className="mr-1" /> {t('profile.signed', 'Firmado')}
                        </span>
                      ) : (
                        <span className="da-badge da-badge-warning text-[11px]">
                          <FaExclamationTriangle className="mr-1" /> {t('profile.pendingSignature', 'Pendiente')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título de la Formación */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                      <FaGraduationCap size={14} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-sm sm:text-base leading-snug break-words">
                      {att.formation?.name || "Formación"}
                    </h3>
                  </div>

                  {/* Cuerpo: Detalles de Entrada, Salida y Duración */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2.5 border border-white/40 dark:border-white/10 flex flex-col gap-1.5 font-mono">
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 font-sans text-[11px]">{t('formations.checkin', 'Entrada')}:</span>
                      <span className="text-xs">{formatDate(att.checkInDate) || '-'}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 font-sans text-[11px]">{t('formations.checkout', 'Salida')}:</span>
                      <span className="text-xs">{formatDate(att.checkOutDate) || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mt-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 font-sans text-[11px]">{t('formations.duration', 'Duración')}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{calculateDuration(att.checkInDate, att.checkOutDate)}</span>
                    </div>
                  </div>

                  {/* Pie de tarjeta: Botón PDF (Solo si está firmado) */}
                  {isSigned && (
                    <div className="flex items-center justify-end pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button 
                        type="button" 
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
                        onClick={() => handleDownloadCertificate(att.id)}
                        title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}
                      >
                        <FaFilePdf size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}