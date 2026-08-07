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

  if (users.length === 0) {
    return (
      <div className="text-center p-6 text-slate-500 bg-white/40 rounded-2xl border border-white/20 mt-4">
        {activeTab === 'approved' 
          ? t('users.noActiveUsers', 'No se encontraron usuarios activos')
          : t('users.noPendingUsers', 'No hay solicitudes de registro pendientes')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. VISTA ESCRITORIO (Se oculta antes, en pantallas menores a 1024px - 'lg') */}
      <div className="hidden lg:block overflow-x-auto">
        <Table responsive hover aria-label="users" className="ba-table align-middle" style={{ tableLayout: 'fixed', minWidth: '800px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '9%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
              <th style={{ width: '13%' }}>{t('users.username', 'Usuario')}</th>
              <th style={{ width: '14%' }}>{t('users.firstName', 'Nombre')}</th>
              <th style={{ width: '14%' }}>{t('users.lastName', 'Apellidos')}</th>
              <th style={{ width: '17%' }} className="text-center">{t('users.status', 'Estado')}</th>
              <th style={{ width: '11%' }} className="text-center">{t('users.role', 'Rol')}</th>
              <th style={{ width: '22%' }} className="text-center">{t('users.actions', 'Acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
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
            ))}
          </tbody>
        </Table>
      </div>

      {/* 2. VISTA MÓVIL / TABLET (Se activa antes con 'lg:hidden' para evitar que se amontone) */}
      <div className="lg:hidden flex flex-col gap-4 mt-2">
        {users.map((user) => (
          <div key={user.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                <h3 className="font-bold text-slate-800 m-0 text-lg">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">@{user.username}</p>
              </div>
              <div>
                <span className="ba-badge bg-light text-dark border text-xs">{user.authority.authority}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
              <span className="text-xs text-slate-500">Estado:</span>
              {activeTab === 'approved' ? (
                <span className={`ba-badge ${user.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`}>
                  {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                </span>
              ) : (
                <span className="ba-badge ba-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
              )}
            </div>

            <div className="flex flex-row gap-2 items-center justify-between border-t border-slate-200/50 pt-3">
              {activeTab === 'approved' ? (
                <div className="ba-table-actions w-full flex gap-2">
                  <Button
                    size="sm"
                    className="ba-btn-blue flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    tag={Link}
                    to={"/admin/users/" + user.id}
                  >
                    <FontAwesomeIcon icon={faEdit} className="me-1" /> {t('users.edit', 'Editar')}
                  </Button>
                  <Button
                    size="sm"
                    className="ba-btn-danger flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => onDelete(user.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.delete', 'Eliminar')}
                  </Button>
                </div>
              ) : (
                <div className="ba-table-actions w-full flex gap-2">
                  <Button
                    size="sm"
                    className="ba-btn-primary flex-1 d-flex align-items-center justify-content-center gap-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => onApprove(user.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    {t('users.approve', 'Aprobar')}
                  </Button>
                  <Button
                    size="sm"
                    className="ba-btn-danger flex-1 d-flex align-items-center justify-content-center gap-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => onReject(user.id)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    {t('users.reject', 'Rechazar')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}