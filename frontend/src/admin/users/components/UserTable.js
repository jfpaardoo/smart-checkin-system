import React from "react";
import { Link } from "react-router-dom";
import { Table, Button } from "reactstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FaBuilding } from 'react-icons/fa';
import { useTranslation } from "react-i18next";
import { TableGhostLoader } from "../../../components/GhostLoader";

export default function UserTable({
  users,
  activeTab,
  loading,
  onApprove,
  onReject,
  onDelete,
  openDeleteModal
}) {
  const handleDeleteAction = onDelete || openDeleteModal;
  const { t } = useTranslation();

  if (loading) {
    return <TableGhostLoader />;
  }

  return (
    <div className="w-full relative z-10">
      {/* 1. VISTA ESCRITORIO (Se oculta en pantallas menores a 1024px - 'lg') */}
      <div className="hidden lg:block overflow-x-auto">
        <Table responsive hover aria-label="users" className="da-table align-middle" style={{ tableLayout: 'fixed', minWidth: '900px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '11%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
              <th style={{ width: '13%' }}>{t('users.username', 'Usuario')}</th>
              <th style={{ width: '14%' }}>{t('users.firstName', 'Nombre')}</th>
              <th style={{ width: '14%' }}>{t('users.lastName', 'Apellidos')}</th>
              <th style={{ width: '18%' }}>{t('users.company', 'Empresa / Centro')}</th>
              <th style={{ width: '12%', textAlign: 'center' }}>{t('users.status', 'Estado')}</th>
              <th style={{ width: '18%', textAlign: 'center' }}>{t('users.actions', 'Acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ paddingLeft: '1rem' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="fw-bold">{user.personalCode}</span>
                    {user.locator && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30 flex-shrink-0">
                        {user.locator}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ wordBreak: 'break-word' }}>{user.username}</td>
                <td style={{ wordBreak: 'break-word' }}>{user.firstName}</td>
                <td style={{ wordBreak: 'break-word' }}>{user.lastName}</td>
                <td>
                  {user.company ? (
                    <span className="font-semibold text-slate-800 text-xs truncate max-w-[150px] block" title={user.company.name}>
                      {user.company.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">{t('users.noCompany', 'Sin empresa')}</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="flex justify-center items-center w-full">
                    {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                      <span className={`da-badge ${user.isWorking ? 'da-badge-active' : 'da-badge-inactive'}`} style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                        {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                      </span>
                    ) : (
                      <span className="da-badge da-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
                    )}
                  </div>
                </td>
                <td>
                  {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                    <div className="da-table-actions">
                      <Button
                        size="sm"
                        className="da-btn-blue w-100 fw-bold shadow-sm"
                        style={{ borderRadius: '20px' }}
                        tag={Link}
                        to={"/users/" + user.id}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-1" /> {t('users.edit', 'Editar')}
                      </Button>
                      <Button
                        size="sm"
                        className="da-btn-danger w-100 fw-bold shadow-sm"
                        style={{ borderRadius: '20px' }}
                        onClick={() => handleDeleteAction?.(user.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.delete', 'Eliminar')}
                      </Button>
                    </div>
                  ) : (
                    <div className="da-table-actions">
                      <Button
                        size="sm"
                        className="da-btn-primary w-100 fw-bold shadow-sm"
                        style={{ borderRadius: '20px' }}
                        onClick={() => onApprove(user.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} className="me-1" /> {t('users.approve', 'Aprobar')}
                      </Button>
                      <Button
                        size="sm"
                        className="da-btn-danger w-100 fw-bold shadow-sm"
                        style={{ borderRadius: '20px' }}
                        onClick={() => onDelete(user.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.reject', 'Rechazar')}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* 2. VISTA MÓVIL / TABLET */}
      <div className="lg:hidden flex flex-col gap-4 mt-2">
        {users.map((user) => (
          <div key={user.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                  {user.locator && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30">
                      {user.locator}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 m-0 text-lg">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">@{user.username}</p>
              </div>
            </div>

            {/* Empresa / Centro en vista móvil */}
            <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
              <span className="text-xs text-slate-500">{t('users.company', 'Empresa / Centro')}:</span>
              {user.company ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-white/60 px-2.5 py-1 rounded-xl border border-white/80 shadow-2xs">
                  <FaBuilding className="text-[#8fa228]" size={12} />
                  {user.company.name}
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">{t('users.noCompany', 'Sin empresa')}</span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
              <span className="text-xs text-slate-500">{t('users.status', 'Estado')}:</span>
              {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                <span className={`da-badge ${user.isWorking ? 'da-badge-active' : 'da-badge-inactive'}`}>
                  {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                </span>
              ) : (
                <span className="da-badge da-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
              )}
            </div>

            <div className="flex flex-row gap-2 items-center justify-between border-t border-slate-200/50 pt-3">
              {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                <div className="da-table-actions w-full flex gap-2">
                  <Button
                    size="sm"
                    className="da-btn-blue flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    tag={Link}
                    to={"/users/" + user.id}
                  >
                    <FontAwesomeIcon icon={faEdit} className="me-1" /> {t('users.edit', 'Editar')}
                  </Button>
                  <Button
                    size="sm"
                    className="da-btn-danger flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => handleDeleteAction?.(user.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.delete', 'Eliminar')}
                  </Button>
                </div>
              ) : (
                <div className="da-table-actions w-full flex gap-2">
                  <Button
                    size="sm"
                    className="da-btn-primary flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => onApprove(user.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} className="me-1" /> {t('users.approve', 'Aprobar')}
                  </Button>
                  <Button
                    size="sm"
                    className="da-btn-danger flex-1 fw-bold shadow-sm"
                    style={{ borderRadius: '20px' }}
                    onClick={() => onDelete(user.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('users.reject', 'Rechazar')}
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