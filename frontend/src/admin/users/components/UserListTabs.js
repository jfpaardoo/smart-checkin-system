import React from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

export default function UserListTabs({ activeTab, setActiveTab, activeCount, pendingCount }) {
  const { t } = useTranslation();

  return (
    <Nav tabs className="da-admin-tabs-nav">
      <NavItem>
        <NavLink
          className={`da-tab-pill ${activeTab === 'approved' ? 'da-tab-pill-active' : ''}`}
          onClick={() => setActiveTab('approved')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faUsers} className="me-1" />
          {t('users.activeEmployees', 'Empleados Activos')} ({activeCount})
        </NavLink>
      </NavItem>
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
