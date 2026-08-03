import React, { useState, useEffect, useCallback } from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers } from '@fortawesome/free-solid-svg-icons';
import tokenService from '../../services/token.service';
import UserAnalyticsDetailModal from './UserAnalyticsDetailModal';

import AnalyticsExportMenu from './components/AnalyticsExportMenu';
import AnalyticsOverviewTab from './components/AnalyticsOverviewTab';
import AnalyticsEmployeesTab from './components/AnalyticsEmployeesTab';

import '../../static/css/admin/adminPage.css';
import '../../static/css/admin/analyticsDashboard.css';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'employees'
  const [statistics, setStatistics] = useState([]);
  const [userAnalyticsList, setUserAnalyticsList] = useState([]);
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  useEffect(() => {
    if (!jwt) return;
    let isMounted = true;

    const loadAllAnalyticsData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/v1/analytics', { headers: { 'Authorization': `Bearer ${jwt}` } }),
          fetch('/api/v1/analytics/users', { headers: { 'Authorization': `Bearer ${jwt}` } })
        ]);

        if (isMounted && statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(Array.isArray(statsData) ? statsData : []);
        }
        if (isMounted && usersRes.ok) {
          const usersData = await usersRes.json();
          setUserAnalyticsList(Array.isArray(usersData) ? usersData : []);
        }
      } catch (error) {
        console.error("Failed to load analytics concurrently", error);
      }
    };

    loadAllAnalyticsData();

    return () => {
      isMounted = false;
    };
  }, [jwt]);

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
    <div className="ba-container">
      <div className="ba-card">
        {/* Header with Navigation Tabs & Export Menu */}
        <div className="ba-card-header ba-admin-header border-0">
          <h2>
            <FontAwesomeIcon icon={faChartLine} style={{ color: 'var(--ba-primary)' }} className="me-2" />
            {t('analytics.title', 'Analytics & HR Control')}
          </h2>
        </div>

        <div className="ba-admin-controls justify-center">
          <Nav tabs className="ba-admin-tabs-nav">
            <NavItem>
              <NavLink
                className={`ba-tab-pill ${activeTab === 'overview' ? 'ba-tab-pill-active' : ''}`}
                onClick={() => setActiveTab('overview')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faChartLine} className="me-1" />
                {t('analytics.overviewTab', 'Platform Overview')}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={`ba-tab-pill ${activeTab === 'employees' ? 'ba-tab-pill-active' : ''}`}
                onClick={() => setActiveTab('employees')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faUsers} className="me-1" />
                {t('analytics.employeesTab', 'Employee Control')}
              </NavLink>
            </NavItem>
          </Nav>

          <div className="ba-admin-header-actions">
            <AnalyticsExportMenu />
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
      </div>

      <UserAnalyticsDetailModal 
        isOpen={modalOpen} 
        toggle={() => setModalOpen(!modalOpen)} 
        userAnalytics={selectedUserAnalytics} 
      />
    </div>
  );
}
