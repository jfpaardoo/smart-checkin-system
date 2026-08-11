import React, { useState, useEffect, useCallback } from 'react';
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

import '../../static/css/admin/adminPage.css';
import '../../static/css/admin/analyticsDashboard.css';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'employees' | 'formations'
  const [statistics, setStatistics] = useState([]);
  const [userAnalyticsList, setUserAnalyticsList] = useState([]);
  const [formationAnalyticsList, setFormationAnalyticsList] = useState([]);
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { t } = useTranslation();
  
  const jwt = tokenService.getLocalAccessToken();

  const fetchUserAnalytics = useCallback(async (search = '') => {
    try {
      const queryParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const req = await fetch(`/api/v1/analytics/users${queryParam}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (req.ok) {
        const data = await req.json();
        setUserAnalyticsList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch user analytics", error);
    }
  }, [jwt]);

  const fetchFormationAnalytics = useCallback(async () => {
    try {
      const req = await fetch('/api/v1/analytics/formations', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (req.ok) {
        const data = await req.json();
        setFormationAnalyticsList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch formation analytics", error);
    }
  }, [jwt]);

  useEffect(() => {
    if (!jwt) return;
    let isMounted = true;

    const loadAllAnalyticsData = async () => {
      try {
        let statsUrl = '/api/v1/analytics';
        if (startDate && endDate) {
          statsUrl += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const [statsRes, usersRes, formationsRes] = await Promise.all([
          fetch(statsUrl, { headers: { 'Authorization': `Bearer ${jwt}` } }),
          fetch('/api/v1/analytics/users', { headers: { 'Authorization': `Bearer ${jwt}` } }),
          fetch('/api/v1/analytics/formations', { headers: { 'Authorization': `Bearer ${jwt}` } })
        ]);

        if (isMounted && statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(Array.isArray(statsData) ? statsData : []);
        }
        if (isMounted && usersRes.ok) {
          const usersData = await usersRes.json();
          setUserAnalyticsList(Array.isArray(usersData) ? usersData : []);
        }
        if (isMounted && formationsRes.ok) {
          const formationsData = await formationsRes.json();
          setFormationAnalyticsList(Array.isArray(formationsData) ? formationsData : []);
        }
      } catch (error) {
        console.error("Failed to load analytics concurrently", error);
      }
    };

    loadAllAnalyticsData();

    return () => {
      isMounted = false;
    };
  }, [jwt, startDate, endDate]);

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
    try {
      const req = await fetch(`/api/v1/analytics/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (req.ok) {
        const data = await req.json();
        setSelectedUserAnalytics(data);
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch user detail", error);
    }
  };

  return (
    <div className="da-container">
      <div className="da-card">
        {/* Header with Navigation Tabs & Export Menu */}
        <div className="da-card-header da-admin-header border-0">
          <h2>
            <FontAwesomeIcon icon={faChartLine} style={{ color: 'var(--da-primary)' }} className="me-2" />
            {t('analytics.title', 'Analytics & HR Control')}
          </h2>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-center w-full gap-4 mb-6">
          <div className="w-full sm:w-auto" style={{ minWidth: '280px' }}>
            <GlassDropdown
              value={activeTab}
              onChange={(val) => setActiveTab(val)}
              options={[
                { 
                  value: 'overview', 
                  label: (
                    <span className="fw-bold" style={{ color: '#2c3e50' }}>
                      <FontAwesomeIcon icon={faChartLine} className="me-2" style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.overviewTab', 'Platform Overview')}
                    </span>
                  )
                },
                { 
                  value: 'employees', 
                  label: (
                    <span className="fw-bold" style={{ color: '#2c3e50' }}>
                      <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.employeesTab', 'Employee Control')}
                    </span>
                  )
                },
                { 
                  value: 'formations', 
                  label: (
                    <span className="fw-bold" style={{ color: '#2c3e50' }}>
                      <FontAwesomeIcon icon={faGraduationCap} className="me-2" style={{ color: 'var(--da-primary)' }} />
                      {t('analytics.formationsTab', 'Rendimiento Formaciones')}
                    </span>
                  )
                }
              ]}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-center xl:justify-end">
            {activeTab === 'overview' && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-muted hidden sm:block" />
                    <input type="date" className="form-control form-control-sm w-full sm:w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <span className="text-muted hidden sm:block"> - </span>
                  <div className="w-full sm:w-auto">
                    <input type="date" className="form-control form-control-sm w-full sm:w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
            )}
            <div className="w-full sm:w-auto">
              <AnalyticsExportMenu />
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <AnalyticsOverviewTab statistics={statistics} />
        )}

        {activeTab === 'employees' && (
          <AnalyticsEmployeesTab 
            userAnalyticsList={userAnalyticsList} 
            onSearch={fetchUserAnalytics} 
            onOpenUserDetail={handleOpenUserDetail} 
          />
        )}
        {activeTab === 'formations' && (
          <AnalyticsFormationsTab formations={formationAnalyticsList} />
        )}
      </div>

      <UserAnalyticsDetailModal 
        isOpen={modalOpen} 
        toggle={() => setModalOpen(!modalOpen)} 
        userAnalytics={selectedUserAnalytics} 
      />
    </div>
  );
}
