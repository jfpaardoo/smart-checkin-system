import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faGraduationCap, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';

export default function AnalyticsOverviewTab({ statistics }) {
  const { t } = useTranslation();

  const latestTotalCheckins = statistics.length > 0 ? statistics[0].totalCheckins : 0;
  const latestAttendanceRate = statistics.length > 0 && statistics[0].formationAttendanceRate !== undefined 
      ? Math.round(statistics[0].formationAttendanceRate) 
      : 0;
  const daysTracked = statistics.length;

  const COLORS = ['#b3c34c', '#1e293b'];

  const pieData = statistics.length > 0 ? [
      { name: t('analytics.attendance', 'Attendance'), value: latestAttendanceRate, fill: COLORS[0] },
      { name: t('analytics.absence', 'Absence'), value: Math.max(0, 100 - latestAttendanceRate), fill: COLORS[1] }
  ] : [];
  
  // Reverse statistics for correct chronological rendering on the X-axis (left to right)
  const chronologicalStatistics = [...statistics].reverse();

  return (
    <>
      <div className="analytics-kpi-row mt-3">
        <div className="analytics-kpi-card">
            <div className="analytics-kpi-icon">
                <FontAwesomeIcon icon={faUserCheck} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.totalCheckins', 'Asistencias Totales')}</h6>
                <p className="kpi-value">{latestTotalCheckins}</p>
            </div>
        </div>
        
        <div className="analytics-kpi-card">
            <div className="analytics-kpi-icon blue">
                <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.formationAttendance', 'Attendance Rate')}</h6>
                <p className="kpi-value">{latestAttendanceRate}%</p>
            </div>
        </div>

        <div className="analytics-kpi-card">
            <div className="analytics-kpi-icon green">
                <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.daysTracked', 'Days Tracked')}</h6>
                <p className="kpi-value">{daysTracked}</p>
            </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
          <div className="col-lg-8">
              <div className="analytics-chart-card">
                  <div className="analytics-chart-title">
                      <span>{t('analytics.totalCheckins', 'Asistencias Totales (Últimos 30 Días)')}</span>
                  </div>
                  <div className="chart-container-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chronologicalStatistics} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.06)" />
                              <XAxis 
                                  dataKey="date" 
                                  stroke="#64748b" 
                                  fontSize={12} 
                                  tickLine={false} 
                                  tickFormatter={(val) => {
                                      if (!val) return '';
                                      const d = new Date(val);
                                      return Number.isNaN(d.valueOf()) ? val : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
                                  }}
                              />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                              <RechartsTooltip />
                              <Line 
                                  type="monotone" 
                                  name={t('analytics.totalCheckins', 'Asistencias')} 
                                  dataKey="totalCheckins" 
                                  stroke="#2563eb" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, fill: '#2563eb' }}
                                  activeDot={{ r: 7 }} 
                              />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          <div className="col-lg-4">
              <div className="analytics-chart-card">
                  <div className="analytics-chart-title">
                      <span>{t('analytics.formationAttendance', 'Formation Attendance')}</span>
                  </div>
                  <div className="chart-container-wrapper d-flex flex-column align-items-center justify-content-center">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="45%"
                                  innerRadius={55}
                                  outerRadius={85}
                                  paddingAngle={4}
                                  dataKey="value"
                              />
                              <RechartsTooltip />
                          </PieChart>
                      </ResponsiveContainer>
                      
                      <div className="d-flex justify-content-center gap-3 mt-2">
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[0], display: 'inline-block' }}></span>
                              {t('analytics.attendance', 'Attendance')} ({latestAttendanceRate}%)
                          </div>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[1], display: 'inline-block' }}></span>
                              {t('analytics.absence', 'Absence')} ({Math.max(0, 100 - latestAttendanceRate)}%)
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}
