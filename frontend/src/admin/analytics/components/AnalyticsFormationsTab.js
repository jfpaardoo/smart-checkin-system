import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'reactstrap';
import GlassSearchBar from '../../../components/GlassSearchBar';
import GlassDropdown from '../../../components/GlassDropdown';
import GlassPagination from '../../../components/GlassPagination';

const getProgressColor = (percentage) => {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

const matchesFormationDate = (formationDate, dateFilter) => {
  if (!dateFilter || dateFilter === 'ALL') return true;
  if (!formationDate) return false;

  const fDate = new Date(formationDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (dateFilter === 'UPCOMING') return fDate > endOfToday;
  if (dateFilter === 'TODAY') return fDate >= startOfToday && fDate <= endOfToday;
  if (dateFilter === 'PAST') return fDate < startOfToday;
  return true;
};

const matchesFormationPerf = (percentage, perfFilter) => {
  if (!perfFilter || perfFilter === 'ALL') return true;
  if (perfFilter === 'HIGH') return percentage >= 80;
  if (perfFilter === 'MEDIUM') return percentage >= 50 && percentage < 80;
  if (perfFilter === 'LOW') return percentage < 50;
  return true;
};

const FormationTableRow = ({ formation, t }) => {
  const { formationName, formationDate, totalExpected, totalAttended, attendancePercentage } = formation;
  const formattedDate = formationDate ? new Date(formationDate).toLocaleDateString() : '-';
  const progressColor = getProgressColor(attendancePercentage);

  return (
    <tr key={formation.formationId} className="hover:bg-white/50 transition duration-150">
      <td style={{ paddingLeft: '1.25rem' }} className="font-bold text-slate-800">
        {formationName}
      </td>
      <td className="text-slate-600">
        {formattedDate}
      </td>
      <td className="text-center font-semibold text-slate-700">
        {totalExpected}
      </td>
      <td className="text-center font-semibold text-slate-700">
        {totalAttended}
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-full bg-slate-200/60 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
            <div
              className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-in-out`}
              style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-slate-700 min-w-[3rem]">
            {attendancePercentage}%
          </span>
        </div>
      </td>
    </tr>
  );
};

export default function AnalyticsFormationsTab({ formations = [] }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [perfFilter, setPerfFilter] = useState('ALL');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredFormations = useMemo(() => {
    return formations.filter((f) => {
      // 1. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = f.formationName?.toLowerCase()?.includes(q);
        if (!match) return false;
      }

      // 2. Date filter
      if (!matchesFormationDate(f.formationDate, dateFilter)) {
        return false;
      }

      // 3. Perf filter
      if (!matchesFormationPerf(f.attendancePercentage || 0, perfFilter)) {
        return false;
      }

      return true;
    });
  }, [formations, searchQuery, dateFilter, perfFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, perfFilter, pageSize]);

  const paginatedFormations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFormations.slice(start, start + pageSize);
  }, [filteredFormations, currentPage, pageSize]);

  return (
    <div className="w-full mt-4">
      {/* Barra de Filtros y Búsqueda Liquid Glass */}
      <div className="p-4 rounded-[28px] bg-white/30 backdrop-blur-md border border-white/50 shadow-xs mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-20">
        <div className="md:col-span-6">
          <GlassSearchBar 
            placeholder={t('formations.searchPlaceholderShort', 'Buscar formación por nombre o título...')}
            onSearch={(q) => setSearchQuery(q)}
          />
        </div>

        <div className="md:col-span-3">
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('formations.filterAll', 'Todas las fechas') },
              { value: 'UPCOMING', label: t('formations.filterUpcoming', 'Próximas formaciones') },
              { value: 'TODAY', label: t('formations.filterToday', 'Formaciones de hoy') },
              { value: 'PAST', label: t('formations.filterPast', 'Formaciones pasadas') }
            ]}
            value={dateFilter}
            onChange={(val) => setDateFilter(val)}
            placeholder={t('formations.filterDate', 'Filtrar por fecha')}
            className="w-full"
          />
        </div>

        <div className="md:col-span-3">
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('analytics.allPerf', 'Tasa de Asistencia (Todas)') },
              { value: 'HIGH', label: t('analytics.highPerf', 'Alta (≥ 80%)') },
              { value: 'MEDIUM', label: t('analytics.medPerf', 'Media (50% - 79%)') },
              { value: 'LOW', label: t('analytics.lowPerf', 'Baja (< 50%)') }
            ]}
            value={perfFilter}
            onChange={(val) => setPerfFilter(val)}
            placeholder={t('analytics.filterPerf', 'Asistencia')}
            className="w-full"
          />
        </div>
      </div>

      {filteredFormations.length === 0 ? (
        <div className="text-center p-8 text-slate-500 bg-white/40 rounded-3xl border border-white/40 mt-4">
          <p className="mb-0 text-sm font-semibold">{t('analytics.noFormations', 'No hay datos de formaciones que coincidan con los filtros.')}</p>
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO */}
          <div className="hidden lg:block overflow-x-auto pb-2 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative z-10">
            <Table responsive hover aria-label="formations analytics" className="da-table align-middle w-full mb-0" style={{ tableLayout: 'fixed', minWidth: '850px', fontSize: '0.88rem' }}>
              <thead>
                <tr className="border-b border-white/40 bg-white/50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th style={{ width: '30%', paddingLeft: '1.25rem' }}>{t('analytics.formationName', 'Nombre')}</th>
                  <th style={{ width: '18%' }}>{t('analytics.formationDate', 'Fecha')}</th>
                  <th style={{ width: '16%' }} className="text-center">{t('analytics.totalExpected', 'Esperados')}</th>
                  <th style={{ width: '16%' }} className="text-center">{t('analytics.totalAttended', 'Asistentes')}</th>
                  <th style={{ width: '20%' }}>{t('analytics.attendanceRate', 'Tasa de Asistencia')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-slate-800">
                {paginatedFormations.map((f) => (
                  <FormationTableRow key={f.formationId} formation={f} t={t} />
                ))}
              </tbody>
            </Table>
          </div>

          {/* 2. VISTA MÓVIL / TABLET */}
          <div className="lg:hidden flex flex-col gap-3 mt-2">
            {paginatedFormations.map((f) => {
              const { formationName, formationDate, totalExpected, totalAttended, attendancePercentage } = f;
              const formattedDate = formationDate ? new Date(formationDate).toLocaleDateString() : '-';
              const progressColor = getProgressColor(attendancePercentage);

              return (
                <div key={f.formationId} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[24px] p-5 border border-white/50 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 m-0 text-base">{formationName}</h3>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">{formattedDate}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-xs">
                    <span className="font-semibold text-slate-500">{t('analytics.totalExpected', 'Empleados Esperados')}:</span>
                    <span className="font-bold text-slate-800">{totalExpected}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-xs">
                    <span className="font-semibold text-slate-500">{t('analytics.totalAttended', 'Asistentes')}:</span>
                    <span className="font-bold text-slate-800">{totalAttended}</span>
                  </div>

                  <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-2.5">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-semibold text-slate-500">{t('analytics.attendanceRate', 'Tasa de Asistencia')}</span>
                      <span className="font-bold text-slate-800">{attendancePercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
                      <div className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-in-out`} style={{ width: `${attendancePercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación Liquid Glass */}
          <div className="relative z-10 mt-3">
            <GlassPagination
              currentPage={currentPage}
              totalItems={filteredFormations.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </>
      )}
    </div>
  );
}
