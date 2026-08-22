import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserShield, faUserTie, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

export default function UserListTabs({ 
  activeTab, 
  setActiveTab, 
  allCount = 0,
  adminCount = 0, 
  employeeCount = 0, 
  pendingCount = 0 
}) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'approved', label: t('users.allActive', 'Todos Activos'), icon: faUsers, count: allCount, activeIds: ['all', 'approved'] },
    { id: 'admins', label: t('users.adminsTab', 'Administradores'), icon: faUserShield, count: adminCount, activeIds: ['admins'] },
    { id: 'employees', label: t('users.employeesTab', 'Empleados'), icon: faUserTie, count: employeeCount, activeIds: ['employees'] },
    { id: 'pending', label: t('users.pendingRequestsTab', 'Solicitudes Pendientes'), icon: faClock, count: null, activeIds: ['pending'], isPending: true },
  ];

  return (
    <nav className="da-admin-tabs-nav flex flex-wrap gap-1" aria-label="User tabs">
      {tabs.map((tab) => {
        const isActive = tab.activeIds.includes(activeTab);
        return (
          <button
            key={tab.id}
            type="button"
            className={`da-tab-pill ${isActive ? (tab.isPending ? 'da-tab-pill-pending' : 'da-tab-pill-active') : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} className="me-1" />
            {tab.label}
            {tab.count !== null && ` (${tab.count})`}
            {tab.isPending && pendingCount > 0 && (
              <span className="ms-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
