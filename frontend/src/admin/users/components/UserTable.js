import React from 'react';
import { Table, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { TableGhostLoader } from '../../../components/GhostLoader';

export default function UserTable({ users, loading, activeTab, onApprove, onReject, onDelete }) {
  const { t } = useTranslation();

  if (loading) {
    return <TableGhostLoader columns={7} rows={4} />;
  }

  return (
    <Table responsive hover aria-label="users" className="ba-table align-middle" style={{ tableLayout: 'fixed', minWidth: '800px', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ width: '9%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
          <th style={{ width: '13%' }}>{t('users.username', 'Usuario')}</th>
          <th style={{ width: '14%' }}>{t('users.firstName', 'Nombre')}</th>
          <th style={{ width: '14%' }}>{t('users.lastName', 'Apellidos')}</th>
          <th style={{ width: '17%' }}>{t('users.status', 'Estado')}</th>
          <th style={{ width: '11%' }}>{t('users.role', 'Rol')}</th>
          <th style={{ width: '22%' }}>{t('users.actions', 'Acciones')}</th>
        </tr>
      </thead>
      <tbody>
        {users.length > 0 ? (
          users.map((user) => (
            <tr key={user.id}>
              <td style={{ paddingLeft: '1rem' }}><span className="fw-bold">{user.personalCode}</span></td>
              <td style={{ wordBreak: 'break-word' }}>{user.username}</td>
              <td style={{ wordBreak: 'break-word' }}>{user.firstName}</td>
              <td style={{ wordBreak: 'break-word' }}>{user.lastName}</td>
              <td className="text-center">
                {activeTab === 'approved' ? (
                  <span className={`ba-badge ${user.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`} style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                    {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                  </span>
                ) : (
                  <span className="ba-badge ba-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
                )}
              </td>
              <td className="text-center">
                <span className="ba-badge bg-light text-dark border">{user.authority.authority}</span>
              </td>
              <td>
                {activeTab === 'approved' ? (
                  <div className="ba-table-actions">
                    <Button
                      size="sm"
                      className="ba-btn-blue w-100 fw-bold shadow-sm"
                      style={{ borderRadius: '20px' }}
                      tag={Link}
                      to={"/admin/users/" + user.id}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-1" /> {t('users.edit', 'Editar')}
                    </Button>
                    <Button
                      size="sm"
                      className="ba-btn-danger w-100 fw-bold shadow-sm"
                      style={{ borderRadius: '20px' }}
                      onClick={() => onDelete(user.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.delete', 'Eliminar')}
                    </Button>
                  </div>
                ) : (
                  <div className="ba-table-actions">
                    <Button
                      size="sm"
                      className="ba-btn-primary w-100 d-flex align-items-center justify-content-center gap-1 fw-bold shadow-sm"
                      style={{ borderRadius: '20px' }}
                      onClick={() => onApprove(user.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      {t('users.approve', 'Aprobar')}
                    </Button>
                    <Button
                      size="sm"
                      className="ba-btn-danger w-100 d-flex align-items-center justify-content-center gap-1 fw-bold shadow-sm"
                      style={{ borderRadius: '20px' }}
                      onClick={() => onReject(user.id)}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      {t('users.reject', 'Rechazar')}
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center p-4 text-muted">
              {activeTab === 'approved' 
                  ? t('users.noActiveUsers', 'No se encontraron usuarios activos')
                  : t('users.noPendingUsers', 'No hay solicitudes de registro pendientes')}
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}
