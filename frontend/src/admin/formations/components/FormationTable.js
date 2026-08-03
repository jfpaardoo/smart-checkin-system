import React from 'react';
import { Table, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { TableGhostLoader } from '../../../components/GhostLoader';

export default function FormationTable({ formations, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return <TableGhostLoader columns={5} rows={4} />;
  }

  return (
    <Table responsive aria-label="formations" className="ba-table" style={{ minWidth: '800px' }}>
      <thead>
        <tr>
          <th>{t('formations.name')}</th>
          <th>{t('formations.description')}</th>
          <th>{t('formations.dateTime')}</th>
          <th>{t('formations.attendees')}</th>
          <th>{t('formations.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {formations.length > 0 ? (
          formations.map((formation) => {
            const total = formation.attendances ? formation.attendances.length : 0;
            const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
            const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

            return (
              <tr key={formation.id}>
                <td>{formation.name}</td>
                <td>{formation.description}</td>
                <td>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</td>
                <td>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge-glass-secondary">{total} {t('formations.total')}</span>
                  </div>
                  <div className="d-flex justify-content-center flex-wrap gap-2 mt-2">
                    {completed > 0 && <span className="badge-glass-success">{completed} {t('formations.completed')}</span>}
                    {inProgress > 0 && <span className="badge-glass-warning text-dark">{inProgress} {t('formations.inProgress')}</span>}
                  </div>
                </td>
                <td>
                  <Button
                    size="sm"
                    className="ba-btn-primary btn-icon-expand"
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
          })
        ) : (
          <tr>
            <td colSpan="5" className="text-center p-4 text-muted">
              {t('formations.noFormations')}
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}
