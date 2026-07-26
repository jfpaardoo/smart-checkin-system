import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faFileCsv, faFileExcel, faUserCheck, faGraduationCap, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import tokenService from '../../services/token.service';
import '../../static/css/admin/adminPage.css';
import '../../static/css/admin/analyticsDashboard.css';

export default function AnalyticsDashboard() {
    const [statistics, setStatistics] = useState([]);
    const { t } = useTranslation();
    
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const req = await fetch('/api/v1/analytics', {
                    headers: {
                        'Authorization': `Bearer ${tokenService.getLocalAccessToken()}`
                    }
                });
                if (req.ok) {
                    const data = await req.json();
                    setStatistics(Array.isArray(data) ? data : []);
                } else {
                    console.error("Failed to fetch analytics, status:", req.status);
                    setStatistics([]);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                setStatistics([]);
            }
        };
        fetchAnalytics();
    }, []);

    const handleExportFetch = async (type) => {
        try {
            const response = await fetch(`/api/v1/exports/checkins/${type}`, {
                headers: {
                    'Authorization': `Bearer ${tokenService.getLocalAccessToken()}`
                }
            });
            if (!response.ok) throw new Error("Export request failed");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `checkins.${type === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
        }
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
                {/* Header matching Admin Module standard */}
                <div className="ba-card-header">
                    <h2>
                        <FontAwesomeIcon icon={faChartLine} className="me-2" style={{ color: 'var(--ba-dark)' }} /> 
                        {t('analytics.title', 'Analytics Dashboard')}
                    </h2>
                    <div className="d-flex gap-2">
                        <Button 
                            className="ba-btn-primary btn-icon-expand" 
                            onClick={() => handleExportFetch('csv')}
                        >
                            <FontAwesomeIcon icon={faFileCsv} />
                            <span className="btn-expand-label">{t('analytics.exportCsv', 'Export CSV')}</span>
                        </Button>
                        <Button 
                            className="ba-btn-blue btn-icon-expand" 
                            onClick={() => handleExportFetch('excel')}
                        >
                            <FontAwesomeIcon icon={faFileExcel} />
                            <span className="btn-expand-label">{t('analytics.exportExcel', 'Export Excel')}</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="analytics-kpi-row">
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
                <div className="row g-4">
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
            </div>
        </div>
    );
}
