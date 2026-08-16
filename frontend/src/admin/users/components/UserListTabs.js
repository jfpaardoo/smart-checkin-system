import React from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
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

  return (
    <Nav tabs className="da-admin-tabs-nav flex flex-wrap gap-1">
      {/* Todos los Activos */}
      <NavItem>
        <NavLink
          className={`da-tab-pill ${activeTab === 'all' || activeTab === 'approved' ? 'da-tab-pill-active' : ''}`}
          onClick={() => setActiveTab('approved')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faUsers} className="me-1" />
          {t('users.allActive', 'Todos Activos')} ({allCount})
        </NavLink>
      </NavItem>

      {/* Solo Administradores */}
      <NavItem>
        <NavLink
          className={`da-tab-pill ${activeTab === 'admins' ? 'da-tab-pill-active' : ''}`}
          onClick={() => setActiveTab('admins')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faUserShield} className="me-1" />
          {t('users.adminsTab', 'Administradores')} ({adminCount})
        </NavLink>
      </NavItem>

      {/* Solo Empleados */}
      <NavItem>
        <NavLink
          className={`da-tab-pill ${activeTab === 'employees' ? 'da-tab-pill-active' : ''}`}
          onClick={() => setActiveTab('employees')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faUserTie} className="me-1" />
          {t('users.employeesTab', 'Empleados')} ({employeeCount})
        </NavLink>
      </NavItem>

      {/* Solicitudes Pendientes */}
      <NavItem>
        <NavLink
          className={`da-tab-pill ${activeTab === 'pending' ? 'da-tab-pill-pending' : ''}`}
          onClick={() => setActiveTab('pending')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faClock} className="me-1" />
          {t('users.pendingRequestsTab', 'Solicitudes Pendientes')}
          {pendingCount > 0 && (
            <Badge color="danger" pill className="ms-2">
              {pendingCount}
            </Badge>
          )}
        </NavLink>
      </NavItem>
    </Nav>
  );
}
