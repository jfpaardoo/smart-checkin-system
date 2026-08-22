import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEye, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { formatDuration } from '../../../util/dateTimeUtil';

const getAttendanceColorClass = (percentage) => {
  if (percentage >= 75) return 'text-emerald-600 font-bold';
  if (percentage >= 50) return 'text-amber-600 font-bold';
  return 'text-rose-500 font-bold';
};

export default function EmployeeTableView({ users = [], onOpenUserDetail }) {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative z-10">
      <table className="da-table align-middle w-full border-collapse" style={{ tableLayout: 'auto', minWidth: '950px', fontSize: '0.88rem' }}>
        <thead>
          <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
            <th className="py-4 px-4 text-left" style={{ width: '10%' }}>{t('users.personalCode', 'Código')}</th>
            <th className="py-4 px-4 text-left" style={{ width: '18%' }}>{t('users.name', 'Empleado')}</th>
            <th className="py-4 px-4 text-left" style={{ width: '16%' }}>{t('users.company', 'Empresa')}</th>
            <th className="py-4 px-3 text-center" style={{ width: '10%' }}>{t('users.role', 'Rol')}</th>
            <th className="py-4 px-3 text-center" style={{ width: '14%' }}>{t('analytics.formationsCount', 'Formaciones')}</th>
            <th className="py-4 px-3 text-center" style={{ width: '11%' }}>{t('analytics.attendancePercentage', '% Asistencia')}</th>
            <th className="py-4 px-4 text-left" style={{ width: '12%' }}>{t('analytics.totalFormationTime', 'T. Formación')}</th>
            <th className="py-4 px-4 text-center" style={{ width: '9%' }}>{t('analytics.actions', 'Acciones')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/40 dark:divide-white/10 text-slate-800 dark:text-slate-100">
          {users.map((user) => (
            <tr key={user.userId} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
              <td className="py-4 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{user.personalCode}</span>
                  {user.locator && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30 flex-shrink-0">
                      {user.locator}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4" style={{ wordBreak: 'break-word' }}>
                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.firstName} {user.lastName}</div>
                <small className="text-slate-400 text-xs">@{user.username}</small>
              </td>
              <td className="py-4 px-4">
                {user.companyName ? (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#8fa228] text-xs flex-shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs truncate max-w-[130px]" title={user.companyName}>
                      {user.companyName}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic">{t('users.noCompany', 'Sin empresa')}</span>
                )}
              </td>
              <td className="py-4 px-3 text-center">
                <span className="da-badge bg-light text-dark border text-xs" style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                  {user.authority}
                </span>
              </td>
              <td className="py-4 px-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                {user.formationsAttended} / {user.formationsAssigned}
              </td>
              <td className="py-4 px-3 text-center">
                <span className={getAttendanceColorClass(user.attendancePercentage)}>
                  {user.attendancePercentage}%
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                  <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                  {formatDuration(user.totalFormationMinutes)}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <button 
                  type="button"
                  className="da-btn-blue font-bold shadow-xs !rounded-2xl px-3 py-1.5 inline-flex items-center justify-center mx-auto text-xs border-0"
                  onClick={() => onOpenUserDetail(user.userId)}
                  title={t('analytics.viewDetails', 'Ver Detalles')}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
