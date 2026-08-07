import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { TableGhostLoader } from '../../../components/GhostLoader';

export default function UserFormationsTable({
  attendances,
  isLoading,
  onOpenDetails,
  onCheckout
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableGhostLoader />;
  }

  if (attendances && attendances.length > 0) {
    const sortedAttendances = [...attendances].sort((a, b) => {
      const aCompleted = !!a.checkOutDate;
      const bCompleted = !!b.checkOutDate;

      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      return (
        new Date(b.formation.formationDate) -
        new Date(a.formation.formationDate)
      );
    });

    return (
      <div className="w-full">
        {/* ESCRITORIO */}
        <div className="hidden lg:block overflow-x-auto pb-2">
          <Table
            responsive
            hover
            className="ba-table align-middle"
            style={{ minWidth: '600px', width: '100%' }}
          >
            <thead>
              <tr>
                <th style={{ color: '#2c3e50', paddingLeft: '1rem' }}>
                  {t('dashboard.formation')}
                </th>
                <th style={{ color: '#2c3e50' }}>
                  {t('dashboard.date')}
                </th>
                <th style={{ color: '#2c3e50' }}>
                  {t('dashboard.status')}
                </th>
                <th
                  style={{ color: '#2c3e50', paddingRight: '1rem' }}
                  className="text-center"
                >
                  {t('dashboard.action')}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedAttendances.map((att) => {
                const f = att.formation;

                let statusBadge = null;

                if (att.checkOutDate) {
                  statusBadge = (
                    <span className="badge-glass-success">
                      {t('dashboard.statusCompleted')}
                    </span>
                  );
                } else if (att.checkInDate) {
                  statusBadge = (
                    <span className="badge-glass-warning text-dark">
                      {t('dashboard.statusInProgress')}
                    </span>
                  );
                }

                return (
                  <tr key={att.id}>
                    <td
                      style={{
                        color: '#2c3e50',
                        fontWeight: 600,
                        paddingLeft: '1rem'
                      }}
                    >
                      {f.name}{' '}
                      <small className="text-muted">
                        (ID: {f.id})
                      </small>
                    </td>

                    <td style={{ color: '#64748b' }}>
                      {new Date(f.formationDate).toLocaleString()}
                    </td>

                    <td>{statusBadge}</td>

                    <td
                      className="text-center"
                      style={{ paddingRight: '1rem' }}
                    >
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          className="ba-btn-primary fw-bold shadow-sm !rounded-full px-4 py-1.5 inline-flex items-center justify-center gap-1.5 text-xs"
                          onClick={() => onOpenDetails(att)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          {t('dashboard.viewDetails')}
                        </Button>

                        {!att.checkOutDate && (
                          <Button
                            size="sm"
                            className="ba-btn-secondary fw-bold shadow-sm !rounded-full px-4 py-1.5 text-xs"
                            onClick={() => onCheckout(att)}
                          >
                            {t('dashboard.checkout')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* MÓVIL */}
        <div className="lg:hidden flex flex-col gap-4 mt-2">
          {sortedAttendances.map((att) => {
            const f = att.formation;

            let statusBadge = null;

            if (att.checkOutDate) {
              statusBadge = (
                <span className="badge-glass-success">
                  {t('dashboard.statusCompleted')}
                </span>
              );
            } else if (att.checkInDate) {
              statusBadge = (
                <span className="badge-glass-warning text-dark">
                  {t('dashboard.statusInProgress')}
                </span>
              );
            }

            return (
              <div
                key={att.id}
                className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      ID: {f.id}
                    </span>

                    <h3 className="font-bold text-slate-800 m-0 text-base">
                      {f.name}
                    </h3>
                  </div>

                  <div>{statusBadge}</div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">
                    {t('dashboard.date')}:
                  </span>

                  <span>
                    {new Date(f.formationDate).toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-slate-200/50 pt-3 flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="ba-btn-primary fw-bold shadow-sm !rounded-full px-5 py-2 inline-flex items-center justify-center gap-2 text-xs w-full"
                    onClick={() => onOpenDetails(att)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    {t('dashboard.viewDetails')}
                  </Button>

                  {!att.checkOutDate && (
                    <Button
                      size="sm"
                      className="ba-btn-secondary fw-bold shadow-sm !rounded-full px-5 py-2 text-xs w-full"
                      onClick={() => onCheckout(att)}
                    >
                      {t('dashboard.checkout')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-center p-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1.5px solid rgba(255, 255, 255, 0.8)'
      }}
    >
      <p
        className="mb-0"
        style={{ color: '#64748b', fontWeight: 500 }}
      >
        {t('dashboard.noFormations')}
      </p>
    </div>
  );
}