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
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <GlassSearchBar 
            placeholder={t('analytics.searchEmployee', 'Search employee by name or code...')}
            onSearch={onSearch}
        />
        <span className="text-muted fw-bold">
            {t('analytics.totalEmployees', 'Employees')}: {userAnalyticsList.length}
        </span>
      </div>

      <Table responsive className="ba-table align-middle" style={{ minWidth: '950px', width: '100%', tableLayout: 'fixed', fontSize: '0.9rem' }}>
        <thead>
            <tr>
                <th style={{ width: '8%', paddingLeft: '1rem' }}>{t('users.personalCode', 'Código')}</th>
                <th style={{ width: '14%' }}>{t('users.name', 'Empleado')}</th>
                <th style={{ width: '12%', textAlign: 'center' }}>{t('users.role', 'Rol')}</th>
                <th style={{ width: '8%' }}>{t('analytics.workCheckins', 'Check-ins')}</th>
                <th style={{ width: '12%' }}>{t('analytics.workTime', 'T. Trabajo')}</th>
                <th style={{ width: '16%' }}>{t('analytics.formationsCount', 'Formaciones (Asist/Asign)')}</th>
                <th style={{ width: '10%' }}>{t('analytics.attendancePercentage', '% Asistencia')}</th>
                <th style={{ width: '12%' }}>{t('analytics.totalFormationTime', 'T. Formación')}</th>
                <th style={{ width: '8%' }}>{t('analytics.actions', 'Acciones')}</th>
            </tr>
        </thead>
        <tbody>
            {userAnalyticsList.map((user) => (
                <tr key={user.userId}>
                    <td className="fw-bold" style={{ paddingLeft: '1rem' }}>{user.personalCode}</td>
                    <td style={{ wordBreak: 'break-word' }}>
                        <div className="fw-bold text-truncate">{user.firstName} {user.lastName}</div>
                        <small className="text-muted text-truncate">@{user.username}</small>
                    </td>
                    <td className="text-center">
                        <span className="ba-badge ba-badge-active" style={{ whiteSpace: 'normal', display: 'inline-block' }}>{user.authority}</span>
                    </td>
                    <td className="fw-bold text-center">
                        {user.totalCheckins}
                    </td>
                    <td>
                        <span className="d-flex align-items-center gap-1 fw-bold" style={{ color: '#0f766e' }}>
                            <FontAwesomeIcon icon={faClock} />
                            {formatDuration(user.totalWorkMinutes)}
                        </span>
                    </td>
                    <td className="text-center">
                        {user.formationsAttended} / {user.formationsAssigned}
                    </td>
                    <td className="text-center">
                        <span className={`fw-bold ${getAttendanceColorClass(user.attendancePercentage)}`}>
                            {user.attendancePercentage}%
                        </span>
                    </td>
                    <td>
                        <span className="d-flex align-items-center gap-1 text-dark fw-bold">
                            <FontAwesomeIcon icon={faClock} className="text-primary" />
                            {formatDuration(user.totalFormationMinutes)}
                        </span>
                    </td>
                    <td>
                        <Button 
                            size="sm" 
                            className="ba-btn-blue px-3 w-100 d-flex justify-content-center align-items-center"
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
  );
}
