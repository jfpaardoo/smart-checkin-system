import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faPlus } from '@fortawesome/free-solid-svg-icons';
import GlassSearchBar from "../../components/GlassSearchBar";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function UserListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/v1/users?search=${encodeURIComponent(query)}` 
        : `/api/v1/users`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [fetchUsers, searchQuery]);

  // Defensive client-side filtering on active state
  const filteredUsers = users.filter((user) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (user.username?.toLowerCase().includes(q)) ||
      (user.firstName?.toLowerCase().includes(q)) ||
      (user.lastName?.toLowerCase().includes(q)) ||
      (user.personalCode?.toLowerCase().includes(q))
    );
  });

  const userList = filteredUsers.map((user) => {
    return (
      <tr key={user.id}>
        <td>{user.personalCode}</td>
        <td>{user.username}</td>
        <td>{user.firstName}</td>
        <td>{user.lastName}</td>
        <td>
          <span className={`ba-badge ${user.isWorking ? 'ba-badge-active' : 'ba-badge-inactive'}`}>
            {user.isWorking ? t('users.working') : t('users.offDuty')}
          </span>
        </td>
        <td>{user.authority?.authority}</td>
        <td>
          <ButtonGroup>
            <Button
              size="sm"
              className="ba-btn-secondary"
              aria-label={"edit-" + user.id}
              tag={Link}
              to={"/users/" + user.id}
            >
              {t('users.edit')}
            </Button>
            <Button
              size="sm"
              className="ba-btn-danger btn-gap"
              aria-label={"delete-" + user.id}
              onClick={() =>
                deleteFromList(
                  `/api/v1/users/${user.id}`,
                  user.id,
                  [users, setUsers],
                  toast,
                  { entityName: "User", t }
                )
              }
            >
              {t('users.delete')}
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  });

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
      }
    } catch (error) {
      console.error("Failed to download export file", error);
    }
  };

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
            <h2>
                <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" /> {t('users.title', 'Users Management')}
            </h2>
            <div className="d-flex gap-2 align-items-center">
                <Button className="ba-btn-primary btn-icon-expand" onClick={() => handleDownloadExport('users/csv', 'usuarios.csv')}>
                    <FontAwesomeIcon icon={faFileCsv} />
                    <span className="btn-expand-label">{t('analytics.exportCsv', 'Export CSV')}</span>
                </Button>
                <Button className="ba-btn-blue btn-icon-expand" onClick={() => handleDownloadExport('users/excel', 'usuarios.xlsx')}>
                    <FontAwesomeIcon icon={faFileExcel} />
                    <span className="btn-expand-label">{t('analytics.exportExcel', 'Export Excel')}</span>
                </Button>
                <Button className="ba-btn-primary" tag={Link} to="/users/new">
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('users.addUser', 'Add User')}
                </Button>
            </div>
        </div>

        {/* Debounced Search Bar (350ms delay) */}
        <div className="mb-4">
          <GlassSearchBar 
            placeholder={t('analytics.searchEmployee', 'Search employee by name or code...')}
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>
        
        {loading ? (
          <TableGhostLoader columns={7} rows={4} />
        ) : (
          <Table responsive aria-label="users" className="ba-table">
            <thead>
              <tr>
                <th>{t('users.personalCode')}</th>
                <th>{t('users.username')}</th>
                <th>{t('users.firstName')}</th>
                <th>{t('users.lastName')}</th>
                <th>{t('users.status')}</th>
                <th>{t('users.role')}</th>
                <th>{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {userList.length > 0 ? (
                userList
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-muted">
                    {t('common.noResults', 'No users found.')}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
