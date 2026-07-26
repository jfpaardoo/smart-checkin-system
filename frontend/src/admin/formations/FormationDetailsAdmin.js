import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Form, FormGroup, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const toast = useToast();
  
  const [formation, setFormation] = useFetchState(
    null,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
    id
  );

  const [allUsers] = useFetchState(
    [],
    `/api/v1/users`,
    jwt,
    null,
    null
  );

  const [selectedUserId, setSelectedUserId] = useState("");

  const handleAddUserSuccess = () => {
    toast.success("User added to formation");
    fetch(`/api/v1/formations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setFormation(data);
        setSelectedUserId("");
      });
  };

  const handleAddUser = () => {
    if (!selectedUserId) return;
    
    fetch(`/api/v1/formations/${id}/users/${selectedUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          handleAddUserSuccess();
          return null;
        }
        return response.json();
      })
      .then((json) => {
        if (json) {
          toast.error(json.message || "Failed to add user");
        }
      })
      .catch(() => {
        toast.error("Connection error. Please try again.");
      });
  };

  const handleRemoveUserSuccess = () => {
    toast.success("User removed from formation");
    fetch(`/api/v1/formations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setFormation(data));
  };

  const handleRemoveUser = (userId) => {
    const performRemove = () => {
      fetch(`/api/v1/formations/${id}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            handleRemoveUserSuccess();
            return null;
          }
          return response.json();
        })
        .then((json) => {
          if (json) {
            toast.error(json.message || "Failed to remove user");
          }
        })
        .catch(() => {
          toast.error("Connection error. Please try again.");
        });
    };

    toast.confirm("Are you sure you want to remove this user from the formation?", performRemove);
  };

  if (!formation) {
    return <CardGhostLoader />;
  }

  // Find users not currently attending
  const attendeeIds = formation.attendees ? formation.attendees.map(u => u.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

  // Find selected user label for the dropdown display
  const selectedUser = availableUsers.find(u => String(u.id) === String(selectedUserId));
  const selectedLabel = selectedUser 
    ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.username})`
    : "Select User to Add...";

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>Formation Details: {formation.name}</h2>
          <Button className="ba-btn-secondary" tag={Link} to="/formations">
            Back to List
          </Button>
        </div>

        <div className="formation-info-box">
          <h4>Description</h4>
          <p>{formation.description}</p>
          <h4>Date & Time</h4>
          <p>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</p>
        </div>

        <div className="ba-card-header pt-3">
          <h3>Attendees</h3>
          <Form inline className="formation-add-form" onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <UncontrolledDropdown className="w-100">
                <DropdownToggle
                  tag="button"
                  type="button"
                  className="ba-select-toggle d-flex align-items-center justify-content-between"
                  style={{ minWidth: '280px' }}
                >
                  <span>{selectedLabel}</span>
                  <span className="dropdown-caret-icon">▼</span>
                </DropdownToggle>
                <DropdownMenu className="ba-dropdown-menu w-100">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((u) => (
                      <DropdownItem
                        key={u.id}
                        className="ba-dropdown-item d-flex align-items-center justify-content-between"
                        onClick={() => setSelectedUserId(String(u.id))}
                      >
                        <span>{u.firstName} {u.lastName} ({u.username})</span>
                        {String(selectedUserId) === String(u.id) && <span className="ms-2">✓</span>}
                      </DropdownItem>
                    ))
                  ) : (
                    <DropdownItem disabled>No available users</DropdownItem>
                  )}
                </DropdownMenu>
              </UncontrolledDropdown>
            </FormGroup>
            <Button className="ba-btn-primary" type="submit" disabled={!selectedUserId}>
              Add User
            </Button>
          </Form>
        </div>

        <Table responsive className="ba-table">
          <thead>
            <tr>
              <th>Personal Code</th>
              <th>Name</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formation.attendees && formation.attendees.length > 0 ? (
              formation.attendees.map((user) => (
                <tr key={user.id}>
                  <td>{user.personalCode}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.username}</td>
                  <td>
                    <Button
                      size="sm"
                      className="ba-btn-danger"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No attendees enrolled in this formation.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
