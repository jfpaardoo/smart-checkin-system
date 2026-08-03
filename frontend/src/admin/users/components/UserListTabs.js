import React from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

export default function UserListTabs({ activeTab, setActiveTab, activeCount, pendingCount }) {
  const { t } = useTranslation();

  return (
    <Nav tabs className="border-bottom-0 gap-2 w-100 w-xl-auto justify-content-center justify-content-xl-start">
      <NavItem>
        <NavLink
          className={`ba-tab-pill ${activeTab === 'approved' ? 'ba-tab-pill-active' : ''}`}
          onClick={() => setActiveTab('approved')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faUsers} className="me-1" />
          {t('users.activeEmployees', 'Empleados Activos')} ({activeCount})
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          className={`ba-tab-pill ${activeTab === 'pending' ? 'ba-tab-pill-pending' : ''}`}
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
