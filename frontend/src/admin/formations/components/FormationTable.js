import React from 'react';
import { Table, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
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
      <div className="text-center p-4 text-muted bg-white/40 rounded-2xl border border-white/20 mt-4">
        {t('formations.noFormations', 'No se encontraron formaciones.')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto">
        <Table responsive aria-label="formations" className="da-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>{t('formations.name')}</th>
              <th>{t('formations.description')}</th>
              <th>{t('formations.dateTime')}</th>
              <th className="text-center">{t('formations.attendees')}</th>
              <th className="text-center">{t('formations.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {formations.map((formation) => {
              const total = formation.attendances ? formation.attendances.length : 0;
              const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
              const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

              return (
                <tr key={formation.id}>
                  <td className="font-semibold">{formation.name}</td>
                  <td className="max-w-[200px] truncate">{formation.description}</td>
                  <td>{dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}</td>
                  <td>
                    <div className="flex flex-col gap-1.5 items-center justify-center">
                      <span className="w-[130px] text-center inline-block py-1.5 px-3 bg-slate-200/80 border border-slate-300/50 shadow-sm text-slate-900 font-bold text-xs rounded-full">
                        {total} {t('formations.total')}
                      </span>
                      {completed > 0 && (
                        <span className="w-[130px] text-center inline-block py-1.5 px-3 bg-[#e2ec98]/90 border border-[#d2db85]/50 shadow-sm text-slate-900 font-bold text-xs rounded-full">
                          {completed} {t('formations.completed')}
                        </span>
                      )}
                      {inProgress > 0 && (
                        <span className="w-[130px] text-center inline-block py-1.5 px-3 bg-amber-300/80 border border-amber-400/50 shadow-sm text-slate-900 font-bold text-xs rounded-full">
                          {inProgress} {t('formations.inProgress')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      className="da-btn-primary btn-icon-expand"
                      aria-label={"details-" + formation.id}
                      tag={Link}
                      to={"/formations/" + formation.id + "/details"}
                    >
                      <FontAwesomeIcon icon={faUsers} />
                      <span className="btn-expand-label">{t('dashboard.viewDetails', 'Ver Detalles')}</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* 2. VISTA MÓVIL (Con diseño de cápsulas unificadas y perfectamente alineadas) */}
      <div className="md:hidden flex flex-col gap-4 mt-2">
        {formations.map((formation) => {
          const total = formation.attendances ? formation.attendances.length : 0;
          const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
          const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

          return (
            <div key={formation.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-4 sm:p-5 border border-white/40">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 m-0 text-base sm:text-[1.1rem] leading-tight break-words">{formation.name}</h3>
                  <p className="text-xs font-medium text-slate-500 m-0 mt-1">
                    {dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    className="da-btn-primary flex items-center justify-center shadow-xs"
                    style={{ width: '40px', height: '40px', borderRadius: '12px', padding: 0 }}
                    aria-label={"details-" + formation.id}
                    tag={Link}
                    to={"/formations/" + formation.id + "/details"}
                  >
                    <FontAwesomeIcon icon={faUsers} />
                  </Button>
                </div>
              </div>

              {formation.description && (
                <div className="text-xs sm:text-[0.85rem] text-slate-600 bg-white/40 rounded-xl p-3 mb-3 border border-white/50 shadow-inner break-words">
                  {formation.description}
                </div>
              )}

              {/* Contenedor con cápsulas apiladas verticalmente en móvil y con truncado seguro */}
              <div className="flex flex-col gap-1.5 w-full border-t border-slate-200/50 pt-3">
                <span 
                  className="w-full text-center py-1.5 px-3 bg-slate-200/80 border border-slate-300/50 shadow-2xs text-slate-900 rounded-full text-xs font-bold uppercase tracking-wider block truncate overflow-hidden"
                  title={`${total} ${t('formations.total')}`}
                >
                  {total} {t('formations.total')}
                </span>
                {completed > 0 && (
                  <span 
                    className="w-full text-center py-1.5 px-3 bg-[#e2ec98]/90 border border-[#d2db85]/50 shadow-2xs text-slate-900 rounded-full text-xs font-bold uppercase tracking-wider block truncate overflow-hidden"
                    title={`${completed} ${t('formations.completed')}`}
                  >
                    {completed} {t('formations.completed')}
                  </span>
                )}
                {inProgress > 0 && (
                  <span 
                    className="w-full text-center py-1.5 px-3 bg-amber-300/80 border border-amber-400/50 shadow-2xs text-slate-900 rounded-full text-xs font-bold uppercase tracking-wider block truncate overflow-hidden"
                    title={`${inProgress} ${t('formations.inProgress')}`}
                  >
                    {inProgress} {t('formations.inProgress')}
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