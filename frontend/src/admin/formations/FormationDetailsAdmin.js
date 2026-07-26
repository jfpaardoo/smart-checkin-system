import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Form, FormGroup, Input } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getErrorModal from "../../util/getErrorModal";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";

const jwt = tokenService.getLocalAccessToken();

export default function FormationDetailsAdmin() {
  const id = getIdFromUrl(2);
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  
  const [formation] = useFetchState(
    null,
    `/api/v1/formations/${id}`,
    jwt,
    setMessage,
    setVisible,
    id
  );

  const [allUsers] = useFetchState(
    [],
    `/api/v1/users`,
    jwt,
    setMessage,
    setVisible
  );

  const [selectedUserId, setSelectedUserId] = useState("");

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
          window.location.reload();
        } else {
          return response.json().then(json => {
            setMessage(json.message || "Failed to add user");
            setVisible(true);
          });
        }
      })
      .catch((error) => {
        setMessage(error.toString());
        setVisible(true);
      });
  };

  const handleRemoveUser = (userId) => {
    if (window.confirm("Are you sure you want to remove this user from the formation?")) {
      fetch(`/api/v1/formations/${id}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            window.location.reload();
          } else {
            return response.json().then(json => {
              setMessage(json.message || "Failed to remove user");
              setVisible(true);
            });
          }
        })
        .catch((error) => {
          setMessage(error.toString());
          setVisible(true);
        });
    }
  };

  const modal = getErrorModal(setVisible, visible, message);

  if (!formation) {
    return <CardGhostLoader />;
  }

  // Find users not currently attending
  const attendeeIds = formation.attendees ? formation.attendees.map(u => u.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>Formation Details: {formation.name}</h2>
          <Button className="ba-btn-secondary" tag={Link} to="/formations">
            Back to List
          </Button>
        </div>
        {modal}

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
              <Input
                type="select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select User to Add...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.username})
                  </option>
                ))}
              </Input>
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
