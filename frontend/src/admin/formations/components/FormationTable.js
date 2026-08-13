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
            <div key={formation.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 m-0 text-[1.1rem] leading-tight">{formation.name}</h3>
                  <p className="text-xs font-medium text-slate-500 m-0 mt-2">
                    {dayjs(formation.formationDate).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="da-btn-primary"
                  style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0 }}
                  aria-label={"details-" + formation.id}
                  tag={Link}
                  to={"/formations/" + formation.id + "/details"}
                >
                  <FontAwesomeIcon icon={faUsers} />
                </Button>
              </div>

              {formation.description && (
                <div className="text-[0.85rem] text-slate-600 bg-white/40 rounded-xl p-3 mb-4 border border-white/50 shadow-inner">
                  {formation.description}
                </div>
              )}

              {/* Contenedor en fila con formato de cápsulas completas (rounded-full) */}
              <div className="flex flex-row gap-2 items-center justify-between border-t border-slate-200/50 pt-4">
                <span className="flex-1 text-center py-2 px-2 bg-slate-200/80 border border-slate-300/50 shadow-sm text-slate-900 rounded-full text-[0.6rem] font-bold uppercase tracking-wider block">
                  {total} {t('formations.total')}
                </span>
                {completed > 0 && (
                  <span className="flex-1 text-center py-2 px-2 bg-[#e2ec98]/90 border border-[#d2db85]/50 shadow-sm text-slate-900 rounded-full text-[0.6rem] font-bold uppercase tracking-wider block">
                    {completed} {t('formations.completed')}
                  </span>
                )}
                {inProgress > 0 && (
                  <span className="flex-1 text-center py-2 px-2 bg-amber-300/80 border border-amber-400/50 shadow-sm text-slate-900 rounded-full text-[0.6rem] font-bold uppercase tracking-wider block">
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