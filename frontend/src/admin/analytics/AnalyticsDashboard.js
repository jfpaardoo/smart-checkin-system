import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Nav, NavItem, NavLink } from 'reactstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faFileCsv, faFileExcel, faUserCheck, faGraduationCap, faCalendarAlt, faUsers, faEye, faDownload, faClock } from '@fortawesome/free-solid-svg-icons';
import tokenService from '../../services/token.service';
import UserAnalyticsDetailModal from './UserAnalyticsDetailModal';
import GlassSearchBar from '../../components/GlassSearchBar';
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
        const fetchAnalytics = async () => {
            try {
                const req = await fetch('/api/v1/analytics', {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });
                if (req.ok) {
                    const data = await req.json();
                    setStatistics(Array.isArray(data) ? data : []);
                } else {
                    setStatistics([]);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                setStatistics([]);
            }
        };

        fetchAnalytics();
        fetchUserAnalytics();
    }, [jwt, fetchUserAnalytics]);

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

    const handleDownloadExport = async (endpoint, defaultFilename) => {
        try {
            const response = await fetch(`/api/v1/exports/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${jwt}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = defaultFilename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } else {
                console.error("Export request failed with status", response.status);
            }
        } catch (error) {
            console.error("Failed to download export file", error);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes === 0) return '0 min';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
    };

    const getAttendanceColorClass = (percentage) => {
        if (percentage >= 75) return 'text-success';
        if (percentage >= 50) return 'text-warning';
        return 'text-danger';
    };

    // Calculate aggregated metrics safely
    const totalCheckinsSum = statistics.reduce((acc, curr) => acc + (curr.totalCheckins || 0), 0);
    const latestAttendanceRate = statistics.length > 0 && statistics[0].formationAttendanceRate !== undefined 
        ? Math.round(statistics[0].formationAttendanceRate) 
        : 0;
    const daysTracked = statistics.length;

    const COLORS = ['#2563eb', '#10b981'];

    const pieData = statistics.length > 0 ? [
        { name: t('analytics.attendance', 'Attendance'), value: latestAttendanceRate, fill: COLORS[0] },
        { name: t('analytics.absence', 'Absence'), value: Math.max(0, 100 - latestAttendanceRate), fill: COLORS[1] }
    ] : [];

    return (
        <div className="ba-container">
            <div className="ba-card">
                {/* Header with Navigation Tabs & Export Menu */}
                <div className="ba-card-header align-items-center">
                    <div>
                        <h2>
                            <FontAwesomeIcon icon={faChartLine} className="me-2" style={{ color: 'var(--ba-dark)' }} /> 
                            {t('analytics.title', 'Analytics & HR Control')}
                        </h2>
                        {/* Tab Switcher */}
                        <Nav tabs className="border-0 mt-3">
                            <NavItem>
                                <NavLink
                                    className={`ba-nav-link text-dark fw-bold me-2 style-cursor ${activeTab === 'overview' ? 'active bg-white shadow-sm' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                    style={{ cursor: 'pointer', borderRadius: '16px' }}
                                >
                                    <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                    {t('analytics.overviewTab', 'Platform Overview')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={`ba-nav-link text-dark fw-bold style-cursor ${activeTab === 'employees' ? 'active bg-white shadow-sm' : ''}`}
                                    onClick={() => setActiveTab('employees')}
                                    style={{ cursor: 'pointer', borderRadius: '16px' }}
                                >
                                    <FontAwesomeIcon icon={faUsers} className="me-1" />
                                    {t('analytics.employeesTab', 'Employee Control')}
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </div>

                    {/* Export Dropdown Menu */}
                    <div className="d-flex gap-2">
                        <UncontrolledDropdown>
                            <DropdownToggle className="ba-select-toggle d-inline-flex align-items-center gap-2">
                                <FontAwesomeIcon icon={faDownload} />
                                {t('analytics.exportData', 'Export Reports')}
                            </DropdownToggle>
                            <DropdownMenu end className="ba-dropdown-menu ba-light-dropdown">
                                <DropdownItem header className="fw-bold text-muted">{t('analytics.formationExports', 'Formations & Signatures')}</DropdownItem>
                                <DropdownItem onClick={() => handleDownloadExport('formations/csv', 'formaciones_firmas.csv')}>
                                    <FontAwesomeIcon icon={faFileCsv} className="me-2 text-info" /> {t('analytics.formationsCsv', 'Formations & Signatures (CSV)')}
                                </DropdownItem>
                                <DropdownItem onClick={() => handleDownloadExport('formations/excel', 'formaciones_firmas.xlsx')}>
                                    <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" /> {t('analytics.formationsExcel', 'Formations & Signatures (Excel)')}
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </div>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <>
                        {/* KPI Summary Cards */}
                        <div className="analytics-kpi-row mt-3">
                            <div className="analytics-kpi-card">
                                <div className="analytics-kpi-icon">
                                    <FontAwesomeIcon icon={faUserCheck} />
                                </div>
                                <div className="analytics-kpi-content">
                                    <h6>{t('analytics.totalCheckins', 'Total Check-ins')}</h6>
                                    <p className="kpi-value">{totalCheckinsSum}</p>
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

                        {/* Main Charts Row */}
                        <div className="row g-4 mt-1">
                            {/* Line Chart */}
                            <div className="col-lg-8">
                                <div className="analytics-chart-card">
                                    <div className="analytics-chart-title">
                                        <span>{t('analytics.totalCheckins', 'Total Check-ins (Last 30 Days)')}</span>
                                    </div>
                                    <div className="chart-container-wrapper">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={statistics} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.06)" />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                                                <RechartsTooltip />
                                                <Line 
                                                    type="monotone" 
                                                    name={t('analytics.totalCheckins', 'Check-ins')} 
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

                            {/* Donut / Pie Chart */}
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
                                        
                                        {/* Custom Legend */}
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
                )}

                {/* TAB 2: EMPLOYEE STATISTICS & HR CONTROL */}
                {activeTab === 'employees' && (
                    <div className="mt-3">
                        {/* Search & Filter Bar with 1000ms Debounced Backend Queries */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <GlassSearchBar 
                                placeholder={t('analytics.searchEmployee', 'Search employee by name or code...')}
                                onSearch={(query) => fetchUserAnalytics(query)}
                            />
                            <span className="text-muted fw-bold">
                                {t('analytics.totalEmployees', 'Employees')}: {userAnalyticsList.length}
                            </span>
                        </div>

                        {/* Employee Statistics Table */}
                        <Table responsive className="ba-table align-middle">
                            <thead>
                                <tr>
                                    <th>{t('users.personalCode', 'Code')}</th>
                                    <th>{t('users.name', 'Employee')}</th>
                                    <th>{t('users.role', 'Role')}</th>
                                    <th>{t('analytics.formationsCount', 'Formations (Attended / Assigned)')}</th>
                                    <th>{t('analytics.attendancePercentage', 'Attendance Rate')}</th>
                                    <th>{t('analytics.totalFormationTime', 'Time in Formations')}</th>
                                    <th>{t('analytics.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userAnalyticsList.map((user) => (
                                    <tr key={user.userId}>
                                        <td className="fw-bold">{user.personalCode}</td>
                                        <td>
                                            <div className="fw-bold">{user.firstName} {user.lastName}</div>
                                            <small className="text-muted">@{user.username}</small>
                                        </td>
                                        <td>
                                            <span className="ba-badge ba-badge-active">{user.authority}</span>
                                        </td>
                                        <td>
                                            {user.formationsAttended} / {user.formationsAssigned}
                                        </td>
                                        <td>
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
                                                className="ba-btn-blue btn-icon-expand"
                                                onClick={() => handleOpenUserDetail(user.userId)}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                                <span className="btn-expand-label">{t('analytics.viewDetails', 'View Details')}</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Employee Detailed Modal */}
            <UserAnalyticsDetailModal 
                isOpen={modalOpen} 
                toggle={() => setModalOpen(!modalOpen)} 
                userAnalytics={selectedUserAnalytics} 
            />
        </div>
    );
}
