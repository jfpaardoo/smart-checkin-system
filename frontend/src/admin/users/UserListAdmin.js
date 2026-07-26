import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import useFetchState from "../../util/useFetchState";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function UserListAdmin() {
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
            {user.isWorking ? 'Working' : 'Off-duty'}
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
              Edit
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
                  { entityName: "User" }
                )
              }
            >
              Delete
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
              <h2>Users Management</h2>
              <Button className="ba-btn-primary" tag={Link} to="/users/new">
                + Add User
              </Button>
            </div>
            
            <Table responsive aria-label="users" className="ba-table">
              <thead>
                <tr>
                  <th>Personal Code</th>
                  <th>Username</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
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
