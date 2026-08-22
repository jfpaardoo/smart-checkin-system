import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaGraduationCap } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { TableGhostLoader } from '../../../components/GhostLoader';

export default function FormationTable({ formations, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return <TableGhostLoader columns={5} rows={4} />;
  }

  if (formations.length === 0) {
    return (
      <div className="text-center p-6 text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/40 dark:border-white/10 mt-4 backdrop-blur-xl">
        {t('formations.noFormations', 'No se encontraron formaciones.')}
      </div>
    );
  }

  return (
    <div className="w-full mt-2">
      {/* 1. VISTA ESCRITORIO (md y superior) */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        <table aria-label="formations" className="w-full text-left border-collapse align-middle">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-5" style={{ width: '28%' }}>{t('formations.name', 'Formación')}</th>
              <th className="py-4 px-5" style={{ width: '28%' }}>{t('formations.description', 'Descripción')}</th>
              <th className="py-4 px-5" style={{ width: '18%' }}>{t('formations.dateTime', 'Fecha y Hora')}</th>
              <th className="py-4 px-5 text-center" style={{ width: '16%' }}>{t('formations.attendees', 'Asistentes')}</th>
              <th className="py-4 px-5 text-right" style={{ width: '10%' }}>{t('common.actions', 'Acciones')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
            {formations.map((formation) => {
              const total = formation.attendances ? formation.attendances.length : 0;
              const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
              const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

              return (
                <tr key={formation.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                        <FaGraduationCap size={16} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{formation.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                    <span className="block max-w-[240px] truncate" title={formation.description}>
                      {formation.description || <span className="text-slate-400 dark:text-slate-500 italic text-xs">{t('common.noDescription', 'Sin descripción')}</span>}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">
                    {dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="inline-flex flex-wrap gap-1 items-center justify-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200">
                        {total} {t('formations.total', 'Total')}
                      </span>
                      {completed > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#b3c34c]/30 text-[#4c590b] dark:text-[#d4e84a]">
                          {completed} {t('formations.completed', 'Completados')}
                        </span>
                      )}
                      {inProgress > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/30 text-amber-800 dark:text-amber-300">
                          {inProgress} {t('formations.inProgress', 'En Curso')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex gap-2 justify-end items-center">
                      <Link
                        to={`/formations/${formation.id}/details`}
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-[#73841e] dark:text-[#d4e84a] hover:text-[#525f0e] dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer text-decoration-none"
                        aria-label={"details-" + formation.id}
                        title={t('dashboard.viewDetails', 'Ver Detalles')}
                      >
                        <FaUsers size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. VISTA MÓVIL */}
      <div className="md:hidden flex flex-col gap-3 mt-2">
        {formations.map((formation) => {
          const total = formation.attendances ? formation.attendances.length : 0;
          const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
          const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

          return (
            <div key={formation.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                    <FaGraduationCap size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base leading-tight break-words">{formation.name}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      {dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-[#73841e] dark:text-[#d4e84a] hover:bg-white inline-flex items-center justify-center shadow-xs text-decoration-none"
                    aria-label={"details-" + formation.id}
                    to={"/formations/" + formation.id + "/details"}
                    title={t('dashboard.viewDetails', 'Ver Detalles')}
                  >
                    <FaUsers size={15} />
                  </Link>
                </div>
              </div>

              {formation.description && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2.5 border border-white/50 dark:border-white/10 shadow-inner break-words">
                  {formation.description}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200">
                  {total} {t('formations.total', 'Total')}
                </span>
                {completed > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#b3c34c]/30 text-[#4c590b] dark:text-[#d4e84a]">
                    {completed} {t('formations.completed', 'Completados')}
                  </span>
                )}
                {inProgress > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/30 text-amber-800 dark:text-amber-300">
                    {inProgress} {t('formations.inProgress', 'En Curso')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}