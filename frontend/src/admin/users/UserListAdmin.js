import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileCsv, faFileExcel, faPlus } from '@fortawesome/free-solid-svg-icons';
import useFetchState from "../../util/useFetchState";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function UserListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers, loading] = useFetchState(
    [],
    `/api/v1/users`,
    jwt,
    null,
    null
  );

  const userList = users.map((user) => {
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
        <td>{user.authority.authority}</td>
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

  return (
    <div className="ba-container">
      <div className="ba-card">
        {loading ? (
          <TableGhostLoader columns={7} rows={4} />
        ) : (
          <>
            <div className="ba-card-header">
                <h2>
                    <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" /> {t('users.title', 'Users Management')}
                </h2>
                <div className="d-flex gap-2">
                    <Button className="ba-btn-primary btn-icon-expand" onClick={() => window.open('/api/v1/exports/checkins/csv?token=' + tokenService.getLocalAccessToken(), '_blank')}>
                        <FontAwesomeIcon icon={faFileCsv} />
                        <span className="btn-expand-label">{t('analytics.exportCsv', 'Export CSV')}</span>
                    </Button>
                    <Button className="ba-btn-blue btn-icon-expand" onClick={() => window.open('/api/v1/exports/checkins/excel?token=' + tokenService.getLocalAccessToken(), '_blank')}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        <span className="btn-expand-label">{t('analytics.exportExcel', 'Export Excel')}</span>
                    </Button>
                    <Button className="ba-btn-primary" tag={Link} to="/users/new">
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('users.addUser', 'Add User')}
                    </Button>
                </div>
            </div>
            
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
              <tbody>{userList}</tbody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}
