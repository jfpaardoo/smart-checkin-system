import React, { memo } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaCheck, FaUser } from 'react-icons/fa';
import { useTranslation } from "react-i18next";
import { TableGhostLoader } from "../../../components/GhostLoader";

function UserTable({
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
    <div className="w-full relative z-10 mt-2">
      {/* 1. VISTA ESCRITORIO (md y superior) */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        <table aria-label="users" className="w-full text-left border-collapse align-middle">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-5" style={{ width: '10%' }}>{t('users.personalCode', 'Código')}</th>
              <th className="py-4 px-5" style={{ width: '25%' }}>{t('users.name', 'Usuario / Nombre')}</th>
              <th className="py-4 px-5" style={{ width: '22%' }}>{t('users.company', 'Empresa / Centro')}</th>
              <th className="py-4 px-5 text-center" style={{ width: '18%' }}>{t('users.status', 'Estado')}</th>
              <th className="py-4 px-5 text-right" style={{ width: '15%' }}>{t('common.actions', 'Acciones')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm">#{user.personalCode}</span>
                    {user.locator && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] border border-[#b3c34c]/30 flex-shrink-0">
                        {user.locator}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                      <FaUser size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                  {user.company ? (
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[170px] block" title={user.company.name}>
                      {user.company.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">{t('users.noCompany', 'Sin empresa')}</span>
                  )}
                </td>
                <td className="py-4 px-5 text-center">
                  <div className="flex justify-center items-center w-full">
                    {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                      <span className={`da-badge ${user.isWorking ? 'da-badge-active' : 'da-badge-inactive'}`}>
                        {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                      </span>
                    ) : (
                      <span className="da-badge da-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-5 text-right">
                  {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                    <div className="inline-flex gap-2 justify-end items-center">
                      <Link
                        to={`/users/${user.id}`}
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer text-decoration-none"
                        title={t('common.edit', 'Editar')}
                        aria-label={t('common.edit', 'Editar')}
                      >
                        <FaEdit size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteAction?.(user.id)}
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                        title={t('common.delete', 'Eliminar')}
                        aria-label={t('common.delete', 'Eliminar')}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-2 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => onApprove(user.id)}
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                        title={t('users.approve', 'Aprobar')}
                        aria-label={t('users.approve', 'Aprobar')}
                      >
                        <FaCheck size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(user.id)}
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                        title={t('users.reject', 'Rechazar')}
                        aria-label={t('users.reject', 'Rechazar')}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. VISTA MÓVIL / TABLET */}
      <div className="md:hidden flex flex-col gap-3 mt-2">
        {users.map((user) => (
          <div key={user.id} className="content-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3 overflow-hidden transition-all duration-150">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                  <FaUser size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">#{user.personalCode}</span>
                    {user.locator && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] border border-[#b3c34c]/30">
                        {user.locator}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base break-words leading-tight">{user.firstName} {user.lastName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">@{user.username}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="font-semibold">{user.company?.name || t('users.noCompany', 'Sin empresa')}</span>
              {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                <span className={`da-badge ${user.isWorking ? 'da-badge-active' : 'da-badge-inactive'}`}>
                  {user.isWorking ? t('users.statusWorking', 'Trabajando') : t('users.statusResting', 'Descansando')}
                </span>
              ) : (
                <span className="da-badge da-badge-warning">{t('users.statusPending', 'Pendiente de Aprobación')}</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              {activeTab === 'approved' || activeTab === 'admins' || activeTab === 'employees' ? (
                <>
                  <Link
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white text-decoration-none inline-flex items-center justify-center shadow-xs"
                    to={"/users/" + user.id}
                    title={t('common.edit', 'Editar')}
                  >
                    <FaEdit size={14} />
                  </Link>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 inline-flex items-center justify-center shadow-xs cursor-pointer"
                    onClick={() => handleDeleteAction?.(user.id)}
                    title={t('common.delete', 'Eliminar')}
                  >
                    <FaTrash size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 inline-flex items-center justify-center shadow-xs cursor-pointer"
                    onClick={() => onApprove(user.id)}
                    title={t('users.approve', 'Aprobar')}
                  >
                    <FaCheck size={14} />
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 inline-flex items-center justify-center shadow-xs cursor-pointer"
                    onClick={() => onDelete(user.id)}
                    title={t('users.reject', 'Rechazar')}
                  >
                    <FaTrash size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(UserTable);