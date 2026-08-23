import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import GlassDropdown from '../../components/GlassDropdown';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faGraduationCap, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import tokenService from '../../services/token.service';
import { useSubscription } from '../../hooks/useSubscription';
import UserAnalyticsDetailModal from './UserAnalyticsDetailModal';

import AnalyticsExportMenu from './components/AnalyticsExportMenu';
import AnalyticsOverviewTab from './components/AnalyticsOverviewTab';
import AnalyticsEmployeesTab from './components/AnalyticsEmployeesTab';
import AnalyticsFormationsTab from './components/AnalyticsFormationsTab';

const tabContentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' } }
};

export default function AnalyticsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = ['overview', 'employees', 'formations'].includes(rawTab) ? rawTab : 'overview';

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };
  const [statistics, setStatistics] = useState([]);
  const [userAnalyticsList, setUserAnalyticsList] = useState([]);
  const [formationAnalyticsList, setFormationAnalyticsList] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { t } = useTranslation();

  const fetchUserAnalytics = useCallback(async (search = '') => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/analytics/users${params}`);
      setUserAnalyticsList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch user analytics", error);
    }
  }, []);

  const fetchFormationAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/analytics/formations');
      setFormationAnalyticsList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch formation analytics", error);
    }
  }, []);

  useEffect(() => {
    if (!tokenService.getUser()) return;
    let isMounted = true;

    let statsUrl = '/analytics';
    if (startDate && endDate) {
      statsUrl += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    Promise.all([
      api.get(statsUrl),
      api.get('/analytics/users'),
      api.get('/analytics/formations'),
      api.get('/companies')
    ]).then(([statsRes, usersRes, formationsRes, companiesRes]) => {
      if (isMounted) {
        setStatistics(Array.isArray(statsRes.data) ? statsRes.data : []);
        setUserAnalyticsList(Array.isArray(usersRes.data) ? usersRes.data : []);
        setFormationAnalyticsList(Array.isArray(formationsRes.data) ? formationsRes.data : []);
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
      }
    }).catch(error => {
      console.error("Failed to load analytics concurrently", error);
    });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  // WebSocket Subscription for Real-Time Updates
  useSubscription('/topic/statistics', useCallback((message) => {
    try {
      const updatedStat = JSON.parse(message.body);
      
      const parseDate = (d) => {
        if (Array.isArray(d)) {
          const [year, month, day] = d;
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        return d;
      };

      setStatistics(prevStats => {
        const parsedNewDate = parseDate(updatedStat.date);
        const exists = prevStats.findIndex(s => parseDate(s.date) === parsedNewDate);
        if (exists >= 0) {
          const newStats = [...prevStats];
          newStats[exists] = updatedStat;
          return newStats;
        } else {
          return [updatedStat, ...prevStats];
        }
      });
      fetchUserAnalytics();
      fetchFormationAnalytics();

    } catch (err) {
      console.error("Failed to parse websocket statistics message", err);
    }
  }, [fetchUserAnalytics, fetchFormationAnalytics]));

  const handleOpenUserDetail = async (userId) => {
    if (!userId || userId === 'undefined') return;
    try {
      const res = await api.get(`/analytics/users/${userId}`);
      setSelectedUserAnalytics(res.data);
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch user detail", error);
    }
  };

  return (
    <div className="da-container">
      <div className="da-card">
        {/* Header with Navigation Tabs & Export Menu */}
        <div className="da-card-header da-admin-header border-0 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] text-2xl flex-shrink-0 flex items-center justify-center shadow-xs">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                {t('analytics.title', 'Panel de Analíticas')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                {t('analytics.subtitle', 'Métricas de productividad, control horario y seguimiento de formación')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-center w-full gap-4 mb-6 relative z-50">
          <div className="w-full sm:w-auto min-w-0 sm:min-w-[240px] max-w-full">
            <GlassDropdown
              value={activeTab}
              onChange={handleTabChange}
              options={[
                { 
                  value: 'overview', 
                  label: (
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FontAwesomeIcon icon={faChartLine} style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.overviewTab', 'Platform Overview')}
                    </span>
                  )
                },
                { 
                  value: 'employees', 
                  label: (
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.employeesTab', 'Employee Control')}
                    </span>
                  )
                },
                { 
                  value: 'formations', 
                  label: (
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FontAwesomeIcon icon={faGraduationCap} style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.formationsTab', 'Rendimiento Formaciones')}
                    </span>
                  )
                }
              ]}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-center xl:justify-end">
            {activeTab === 'overview' && (
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <div className="da-date-filter-box w-full sm:w-48 xl:w-52">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-xs shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <label htmlFor="startDate" className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none mb-0.5 cursor-pointer truncate">
                      {t('analytics.startDate', 'Fecha inicio')}
                    </label>
                    <input 
                      type="date" 
                      id="startDate" 
                      name="startDate" 
                      className="da-date-input" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      onClick={(e) => { try { e.target.showPicker?.(); } catch { /* ignore */ } }}
                      aria-label={t('analytics.startDate', 'Fecha inicio')} 
                    />
                  </div>
                  {startDate && (
                    <button 
                      type="button" 
                      onClick={() => setStartDate('')} 
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer bg-transparent border-0 shrink-0"
                      title={t('common.clear', 'Limpiar')}
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div className="da-date-filter-box w-full sm:w-48 xl:w-52">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-xs shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <label htmlFor="endDate" className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none mb-0.5 cursor-pointer truncate">
                      {t('analytics.endDate', 'Fecha fin')}
                    </label>
                    <input 
                      type="date" 
                      id="endDate" 
                      name="endDate" 
                      className="da-date-input" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      onClick={(e) => { try { e.target.showPicker?.(); } catch { /* ignore */ } }}
                      aria-label={t('analytics.endDate', 'Fecha fin')} 
                    />
                  </div>
                  {endDate && (
                    <button 
                      type="button" 
                      onClick={() => setEndDate('')} 
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer bg-transparent border-0 shrink-0"
                      title={t('common.clear', 'Limpiar')}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="w-full sm:w-auto flex justify-center">
              <AnalyticsExportMenu 
                companies={companies} 
                activeFilters={{ startDate, endDate }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <AnalyticsOverviewTab statistics={statistics} />
            </motion.div>
          )}

          {activeTab === 'employees' && (
            <motion.div
              key="employees"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <AnalyticsEmployeesTab 
                userAnalyticsList={userAnalyticsList} 
                companies={companies}
                onOpenUserDetail={handleOpenUserDetail} 
              />
            </motion.div>
          )}

          {activeTab === 'formations' && (
            <motion.div
              key="formations"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <AnalyticsFormationsTab formations={formationAnalyticsList} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UserAnalyticsDetailModal 
        isOpen={modalOpen} 
        toggle={() => setModalOpen(!modalOpen)} 
        userAnalytics={selectedUserAnalytics} 
      />
    </div>
  );
}
