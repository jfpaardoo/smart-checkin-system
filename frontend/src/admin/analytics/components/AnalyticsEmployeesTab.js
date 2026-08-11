import React from 'react';
import { Table, Button } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from '../../../components/GlassSearchBar';
import { formatDuration } from '../../../util/dateTimeUtil';

export default function AnalyticsEmployeesTab({ userAnalyticsList, onSearch, onOpenUserDetail }) {
  const { t } = useTranslation();

  const getAttendanceColorClass = (percentage) => {
    if (percentage >= 75) return 'text-emerald-600 font-bold';
    if (percentage >= 50) return 'text-amber-600 font-bold';
    return 'text-rose-500 font-bold';
  };

  return (
    <div className="mt-3 w-full">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <GlassSearchBar 
            placeholder={t('analytics.searchEmployee', 'Search employee by name or code...')}
            onSearch={onSearch}
        />
        <span className="text-slate-500 font-bold text-sm">
            {t('analytics.totalEmployees', 'Employees')}: {userAnalyticsList.length}
        </span>
      </div>

      {userAnalyticsList.length === 0 ? (
        <div className="text-center p-6 text-slate-500 bg-white/40 rounded-2xl border border-white/20 mt-4">
          {t('analytics.noEmployees', 'No se encontraron empleados.')}
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO */}
          <div className="hidden lg:block overflow-x-auto pb-4">
            <Table responsive className="da-table align-middle" style={{ minWidth: '950px', width: '100%', tableLayout: 'fixed', fontSize: '0.9rem' }}>
              <thead>
                  <tr>
                      <th style={{ width: '8%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
                      <th style={{ width: '18%' }}>{t('users.name', 'Empleado')}</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>{t('users.role', 'Rol')}</th>
                      <th style={{ width: '16%' }} className="text-center">{t('analytics.formationsCount', 'Formaciones (Asist/Asign)')}</th>
                      <th style={{ width: '10%' }} className="text-center">{t('analytics.attendancePercentage', '% Asistencia')}</th>
                      <th style={{ width: '12%' }}>{t('analytics.totalFormationTime', 'T. Formación')}</th>
                      <th style={{ width: '8%', paddingRight: '1.5rem' }} className="text-center">{t('analytics.actions', 'Acciones')}</th>
                  </tr>
              </thead>
              <tbody>
                  {userAnalyticsList.map((user) => (
                      <tr key={user.userId}>
                          <td className="fw-bold" style={{ paddingLeft: '1rem' }}>{user.personalCode}</td>
                          <td style={{ wordBreak: 'break-word' }}>
                              <div className="fw-bold text-slate-800">{user.firstName} {user.lastName}</div>
                              <small className="text-slate-400">@{user.username}</small>
                          </td>
                          <td className="text-center">
                              <span className="da-badge da-badge-active" style={{ whiteSpace: 'normal', display: 'inline-block' }}>{user.authority}</span>
                          </td>
                          <td className="text-center">
                              {user.formationsAttended} / {user.formationsAssigned}
                          </td>
                          <td className="text-center">
                              <span className={getAttendanceColorClass(user.attendancePercentage)}>
                                  {user.attendancePercentage}%
                              </span>
                          </td>
                          <td>
                              <span className="flex items-center gap-1 text-slate-800 font-bold">
                                  <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                                  {formatDuration(user.totalFormationMinutes)}
                              </span>
                          </td>
                          <td className="text-center" style={{ paddingRight: '1.5rem' }}>
                              <Button 
                                  size="sm" 
                                  className="da-btn-blue fw-bold shadow-sm !rounded-full px-4 py-1.5 inline-flex items-center justify-center mx-auto text-xs"
                                  onClick={() => onOpenUserDetail(user.userId)}
                                  title={t('analytics.viewDetails', 'View Details')}
                              >
                                  <FontAwesomeIcon icon={faEye} />
                              </Button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </Table>
          </div>

          {/* 2. VISTA MÓVIL / TABLET COMPRIMIDA */}
          <div className="lg:hidden flex flex-col gap-4 mt-2">
            {userAnalyticsList.map((user) => (
              <div key={user.userId} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                    <h3 className="font-bold text-slate-800 m-0 text-base">{user.firstName} {user.lastName}</h3>
                    <p className="text-xs text-slate-400 m-0">@{user.username}</p>
                  </div>
                  <div>
                    <span className="da-badge da-badge-active text-xs">{user.authority}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-3 text-xs text-slate-600">
                  <div><span className="font-semibold text-slate-500">Asistencia:</span> <span className={getAttendanceColorClass(user.attendancePercentage)}>{user.attendancePercentage}%</span></div>
                  <div><span className="font-semibold text-slate-500">T. Formación:</span> {formatDuration(user.totalFormationMinutes)}</div>
                  <div className="col-span-2"><span className="font-semibold text-slate-500">Formaciones (Asist/Asign):</span> {user.formationsAttended} / {user.formationsAssigned}</div>
                </div>

                <div className="border-t border-slate-200/50 pt-3 flex justify-end">
                  <Button 
                      size="sm" 
                      className="da-btn-blue fw-bold shadow-sm !rounded-full px-5 py-2 inline-flex items-center justify-center gap-2 text-xs w-full sm:w-auto"
                      onClick={() => onOpenUserDetail(user.userId)}
                  >
                      <FontAwesomeIcon icon={faEye} />
                      {t('analytics.viewDetails', 'Ver Detalles')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}