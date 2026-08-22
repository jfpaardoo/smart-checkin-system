import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faGraduationCap, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const COLORS = ['#b3c34c', '#1e293b'];
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function AnalyticsOverviewTab({ statistics }) {
  const { t } = useTranslation();
  const [Recharts, setRecharts] = useState(null);

  useEffect(() => {
    import('recharts')
      .then(module => {
        setRecharts(module);
      })
      .catch(err => {
        console.error('Failed to load recharts', err);
      });
  }, []);

  const totalCheckinsPeriod = statistics.reduce((acc, curr) => acc + (Number(curr.totalCheckins) || 0), 0);
  const latestAttendanceRate = statistics.length > 0 && statistics[0].formationAttendanceRate !== undefined 
      ? Math.round(statistics[0].formationAttendanceRate) 
      : 0;
  const daysTracked = statistics.length;

  const pieData = statistics.length > 0 ? [
      { name: t('analytics.attendance', 'Attendance'), value: latestAttendanceRate, fill: COLORS[0] },
      { name: t('analytics.absence', 'Absence'), value: Math.max(0, 100 - latestAttendanceRate), fill: COLORS[1] }
  ] : [];
  
  // Reverse statistics for correct chronological rendering on the X-axis (left to right)
  const chronologicalStatistics = [...statistics].reverse();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      <motion.div className="analytics-kpi-row mt-3" variants={containerVariants}>
        <motion.div className="analytics-kpi-card" variants={cardVariants}>
            <div className="analytics-kpi-icon">
                <FontAwesomeIcon icon={faUserCheck} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.totalCheckins', 'Asistencias Totales')}</h6>
                <p className="kpi-value">{totalCheckinsPeriod}</p>
            </div>
        </motion.div>
        
        <motion.div className="analytics-kpi-card" variants={cardVariants}>
            <div className="analytics-kpi-icon blue">
                <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.formationAttendance', 'Attendance Rate')}</h6>
                <p className="kpi-value">{latestAttendanceRate}%</p>
            </div>
        </motion.div>

        <motion.div className="analytics-kpi-card" variants={cardVariants}>
            <div className="analytics-kpi-icon green">
                <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="analytics-kpi-content">
                <h6>{t('analytics.daysTracked', 'Days Tracked')}</h6>
                <p className="kpi-value">{daysTracked}</p>
            </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-8">
              <div className="analytics-chart-card h-full">
                  <div className="analytics-chart-title">
                      <span>{t('analytics.totalCheckins', 'Asistencias Totales (Últimos 30 Días)')}</span>
                  </div>
                  <div className="chart-container-wrapper">
                      {Recharts ? (
                          <Recharts.ResponsiveContainer width="100%" height="100%" debounce={60}>
                              <Recharts.LineChart data={chronologicalStatistics} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
                                  <Recharts.CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                                  <Recharts.XAxis 
                                      dataKey="date" 
                                      stroke="#94a3b8" 
                                      fontSize={12} 
                                      tickLine={false} 
                                      tickFormatter={(val) => {
                                          if (!val) return '';
                                          const d = new Date(val);
                                          return Number.isNaN(d.valueOf()) ? val : dateFormatter.format(d);
                                      }}
                                  />
                                  <Recharts.YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                                  <Recharts.Tooltip 
                                      contentStyle={{ 
                                          backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                                          backdropFilter: 'blur(16px)', 
                                          borderRadius: '16px', 
                                          border: '1px solid rgba(255, 255, 255, 0.15)', 
                                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                          padding: '8px 12px'
                                      }}
                                      itemStyle={{ color: '#d4e84a', fontWeight: 700, fontSize: '12px' }}
                                      labelStyle={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
                                  />
                                  <Recharts.Line 
                                      type="monotone" 
                                      name={t('analytics.totalCheckins', 'Asistencias')} 
                                      dataKey="totalCheckins" 
                                      stroke="#b3c34c" 
                                      strokeWidth={3} 
                                      dot={{ r: 4, fill: '#b3c34c' }}
                                      activeDot={{ r: 7 }} 
                                  />
                              </Recharts.LineChart>
                          </Recharts.ResponsiveContainer>
                      ) : (
                          <div className="flex justify-center items-center h-full py-12">
                              <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#b3c34c] border-t-transparent"></div>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-4">
              <div className="analytics-chart-card h-full">
                  <div className="analytics-chart-title">
                      <span>{t('analytics.formationAttendance', 'Formation Attendance')}</span>
                  </div>
                  <div className="chart-container-wrapper flex flex-col items-center justify-center">
                      {Recharts ? (
                          <Recharts.ResponsiveContainer width="100%" height="100%" debounce={60}>
                              <Recharts.PieChart>
                                  <Recharts.Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="45%"
                                      innerRadius={55}
                                      outerRadius={85}
                                      paddingAngle={4}
                                      dataKey="value"
                                  />
                                  <Recharts.Tooltip 
                                      contentStyle={{ 
                                          backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                                          backdropFilter: 'blur(16px)', 
                                          borderRadius: '16px', 
                                          border: '1px solid rgba(255, 255, 255, 0.15)', 
                                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                          padding: '8px 12px'
                                      }}
                                      itemStyle={{ color: '#d4e84a', fontWeight: 700, fontSize: '12px' }}
                                      labelStyle={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}
                                  />
                              </Recharts.PieChart>
                          </Recharts.ResponsiveContainer>
                      ) : (
                          <div className="flex justify-center items-center h-full py-12">
                              <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#b3c34c] border-t-transparent"></div>
                          </div>
                      )}
                      
                      <div className="flex justify-center gap-4 mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#b3c34c]"></span>
                              <span>{t('analytics.attendance', 'Attendance')} ({latestAttendanceRate}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-700 dark:bg-slate-400"></span>
                              <span>{t('analytics.absence', 'Absence')} ({Math.max(0, 100 - latestAttendanceRate)}%)</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </motion.div>
  );
}
