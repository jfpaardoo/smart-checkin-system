import React from 'react';
import { useTranslation } from 'react-i18next';
import { CardGhostLoader } from '../../../components/GhostLoader';

export default function UserFormationsTable({ attendances, isLoading, onOpenDetails }) {
  const { t } = useTranslation();

  if (isLoading) {
    return <CardGhostLoader />;
  }

  if (attendances && attendances.length > 0) {
    const sortedAttendances = [...attendances].sort((a, b) => {
      const aCompleted = !!a.checkOutDate;
      const bCompleted = !!b.checkOutDate;
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      return new Date(b.formation.formationDate) - new Date(a.formation.formationDate);
    });

    return (
      <div className="table-responsive">
        <table className="table table-hover ba-table align-middle" style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th style={{ color: '#2c3e50' }}>{t('dashboard.formation')}</th>
              <th style={{ color: '#2c3e50' }}>{t('dashboard.date')}</th>
              <th style={{ color: '#2c3e50' }}>{t('dashboard.status')}</th>
              <th style={{ color: '#2c3e50' }}>{t('dashboard.action')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedAttendances.map((att) => {
              const f = att.formation;
              
              let statusBadge = null;
              if (att.checkOutDate) {
                statusBadge = <span className="badge-glass-success">{t('dashboard.statusCompleted')}</span>;
              } else if (att.checkInDate) {
                statusBadge = <span className="badge-glass-warning text-dark">{t('dashboard.statusInProgress')}</span>;
              }
              
              return (
                <tr key={att.id}>
                  <td style={{ color: '#2c3e50', fontWeight: 600 }}>
                    {f.name} <small className="text-muted">(ID: {f.id})</small>
                  </td>
                  <td style={{ color: '#64748b' }}>{new Date(f.formationDate).toLocaleString()}</td>
                  <td>{statusBadge}</td>
                  <td>
                    <button className="ba-btn ba-btn-primary btn-sm m-0" onClick={() => onOpenDetails(att)}>
                      {t('dashboard.viewDetails')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="text-center p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)' }}>
      <p className="mb-0" style={{ color: '#64748b', fontWeight: 500 }}>{t('dashboard.noFormations')}</p>
    </div>
  );
}
