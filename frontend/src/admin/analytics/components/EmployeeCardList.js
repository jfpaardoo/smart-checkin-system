import React from 'react';
import { Button } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { formatDuration } from '../../../util/dateTimeUtil';

const getAttendanceColorClass = (percentage) => {
  if (percentage >= 75) return 'text-emerald-600 font-bold';
  if (percentage >= 50) return 'text-amber-600 font-bold';
  return 'text-rose-500 font-bold';
};

export default function EmployeeCardList({ users = [], onOpenUserDetail }) {
  const { t } = useTranslation();

  return (
    <div className="lg:hidden flex flex-col gap-3 mt-2">
      {users.map((user) => (
        <div key={user.userId} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[24px] p-5 border border-white/50 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                {user.locator && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30">
                    {user.locator}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 m-0 text-base">{user.firstName} {user.lastName}</h3>
              <p className="text-xs text-slate-400 m-0">@{user.username}</p>
            </div>
            <div>
              <span className="da-badge bg-light text-dark border text-xs">{user.authority}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">{t('users.company', 'Empresa')}:</span>
            {user.companyName ? (
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBuilding} className="text-[#8fa228]" /> {user.companyName}
              </span>
            ) : (
              <span className="italic text-slate-400">{t('users.noCompany', 'Sin empresa')}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-2.5 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-500">{t('analytics.statAttendance', 'Asistencia:')}</span>{' '}
              <span className={getAttendanceColorClass(user.attendancePercentage)}>{user.attendancePercentage}%</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">{t('analytics.statTrainingTime', 'T. Formación:')}</span>{' '}
              {formatDuration(user.totalFormationMinutes)}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-500">{t('analytics.statFormationsCount', 'Formaciones (Asist/Asign):')}</span>{' '}
              {user.formationsAttended} / {user.formationsAssigned}
            </div>
          </div>

          <div className="border-t border-slate-200/50 pt-3 flex justify-end">
            <Button 
              size="sm" 
              className="da-btn-blue font-bold shadow-sm !rounded-2xl px-5 py-2 inline-flex items-center justify-center gap-2 text-xs w-full sm:w-auto"
              onClick={() => onOpenUserDetail(user.userId)}
            >
              <FontAwesomeIcon icon={faEye} />
              {t('analytics.viewDetails', 'Ver Detalles')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
