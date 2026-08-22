import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEye, FaSignOutAlt, FaGraduationCap } from 'react-icons/fa';
import { TableGhostLoader } from '../../../components/GhostLoader';
import GlassPagination from '../../../components/GlassPagination';
import GlassDropdown from '../../../components/GlassDropdown';
import { formatDate } from '../../../utils/dateUtils';

export default function UserFormationsTable({
  attendances,
  isLoading,
  onOpenDetails,
  onCheckout
}) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAttendances = useMemo(() => {
    if (!attendances) return [];
    
    return attendances
      .filter((att) => {
        if (statusFilter === 'COMPLETED' && !att.checkOutDate) return false;
        if (statusFilter === 'IN_PROGRESS' && (!att.checkInDate || att.checkOutDate)) return false;
        return true;
      })
      .sort((a, b) => {
        const aCompleted = !!a.checkOutDate;
        const bCompleted = !!b.checkOutDate;

        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1;
        }

        return (
          new Date(b.formation?.formationDate) -
          new Date(a.formation?.formationDate)
        );
      });
  }, [attendances, statusFilter]);

  const paginatedAttendances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendances.slice(start, start + pageSize);
  }, [filteredAttendances, currentPage, pageSize]);

  if (isLoading) {
    return <TableGhostLoader />;
  }

  if (!attendances || attendances.length === 0) {
    return (
      <div className="text-center p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400">
        <p className="mb-0 font-medium">
          {t('dashboard.noFormations', 'No tienes formaciones asignadas.')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filtro de Estado para el usuario */}
      <div className="flex justify-end mb-3 relative z-30">
        <div className="w-full sm:w-64">
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('dashboard.filterAllFormations', 'Todas las formaciones') },
              { value: 'IN_PROGRESS', label: t('dashboard.statusInProgress', 'En curso / Pendiente salida') },
              { value: 'COMPLETED', label: t('dashboard.statusCompleted', 'Completadas') }
            ]}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            placeholder={t('dashboard.filterStatus', 'Filtrar estado')}
            className="w-full"
          />
        </div>
      </div>

      {/* 1. VISTA ESCRITORIO (md y superior) */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        <table className="w-full text-left border-collapse align-middle">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-5" style={{ width: '40%' }}>{t('dashboard.formation', 'Formación')}</th>
              <th className="py-4 px-5" style={{ width: '25%' }}>{t('dashboard.date', 'Fecha')}</th>
              <th className="py-4 px-5 text-center" style={{ width: '20%' }}>{t('dashboard.status', 'Estado')}</th>
              <th className="py-4 px-5 text-right" style={{ width: '15%' }}>{t('dashboard.action', 'Acciones')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
            {paginatedAttendances.map((att) => {
              const f = att.formation;

              let statusBadge = null;
              if (att.checkOutDate) {
                statusBadge = (
                  <span className="da-badge da-badge-active">
                    {t('dashboard.statusCompleted', 'Completada')}
                  </span>
                );
              } else if (att.checkInDate) {
                statusBadge = (
                  <span className="da-badge da-badge-warning">
                    {t('dashboard.statusInProgress', 'En curso')}
                  </span>
                );
              }

              return (
                <tr key={att.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                        <FaGraduationCap size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                          {f.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          ID: {f.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">
                    {formatDate(f.formationDate)}
                  </td>

                  <td className="py-4 px-5 text-center">
                    {statusBadge}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex gap-2 justify-end items-center">
                      <button
                        type="button"
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
                        onClick={() => onOpenDetails(att)}
                        title={t('dashboard.viewDetails', 'Ver Detalles')}
                        aria-label={t('dashboard.viewDetails', 'Ver Detalles')}
                      >
                        <FaEye size={14} />
                      </button>

                      {!att.checkOutDate && (
                        <button
                          type="button"
                          className="p-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-800 dark:text-amber-300 border border-amber-400/30 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
                          onClick={() => onCheckout(att)}
                          title={t('dashboard.checkout', 'Hacer Checkout')}
                          aria-label={t('dashboard.checkout', 'Hacer Checkout')}
                        >
                          <FaSignOutAlt size={14} />
                        </button>
                      )}
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
        {paginatedAttendances.map((att) => {
          const f = att.formation;

          let statusBadge = null;
          if (att.checkOutDate) {
            statusBadge = (
              <span className="da-badge da-badge-active">
                {t('dashboard.statusCompleted', 'Completada')}
              </span>
            );
          } else if (att.checkInDate) {
            statusBadge = (
              <span className="da-badge da-badge-warning">
                {t('dashboard.statusInProgress', 'En curso')}
              </span>
            );
          }

          return (
            <div key={att.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                    <FaGraduationCap size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base leading-tight break-words">{f.name}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      {formatDate(f.formationDate)}
                    </p>
                  </div>
                </div>
                <div>{statusBadge}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white inline-flex items-center justify-center shadow-xs cursor-pointer"
                  onClick={() => onOpenDetails(att)}
                  title={t('dashboard.viewDetails', 'Ver Detalles')}
                >
                  <FaEye size={14} />
                </button>

                {!att.checkOutDate && (
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-800 dark:text-amber-300 border border-amber-400/30 inline-flex items-center justify-center shadow-xs cursor-pointer"
                    onClick={() => onCheckout(att)}
                    title={t('dashboard.checkout', 'Hacer Checkout')}
                  >
                    <FaSignOutAlt size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {filteredAttendances.length > 0 && (
        <GlassPagination
          currentPage={currentPage}
          totalItems={filteredAttendances.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => setPageSize(s)}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </div>
  );
}