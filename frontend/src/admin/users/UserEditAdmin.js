import { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Label, FormGroup } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getErrorModal from "../../util/getErrorModal";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchData from "../../util/useFetchData";
import useFetchState from "../../util/useFetchState";

const jwt = tokenService.getLocalAccessToken();

export default function UserEditAdmin() {
  const emptyItem = {
    id: null,
    username: "",
    password: "",
    personalCode: "",
    firstName: "",
    lastName: "",
    isWorking: false,
    authority: null,
  };
  const id = getIdFromUrl(2);
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useFetchState(
    emptyItem,
    `/api/v1/users/${id}`,
    jwt,
    setMessage,
    setVisible,
    id
  );
  const auths = useFetchData(`/api/v1/users/authorities`, jwt);

  function handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    
    if (name === "authority") {
      const auth = auths.find((a) => a.id === Number(value));
      setUser({ ...user, authority: auth });
    } else {
      setUser({ ...user, [name]: value });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    fetch("/api/v1/users" + (user.id ? "/" + user.id : ""), {
      method: user.id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.message) {
          setMessage(json.message);
          setVisible(true);
        } else window.location.href = "/users";
      })
      .catch((error_) => alert(error_));
  }

  const modal = getErrorModal(setVisible, visible, message);
  const authOptions = auths.map((auth) => (
    <option key={auth.id} value={auth.id}>
      {auth.authority}
    </option>
  ));

  return (
    <div className="ba-container">
      <div className="ba-card ba-card-form">
        <div className="ba-card-header">
          <h2>{user.id ? "Edit User" : "Add New User"}</h2>
        </div>
        {modal}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="username">Username</Label>
            <Input
              type="text"
              required
              name="username"
              id="username"
              value={user.username || ""}
              onChange={handleChange}
            />
          </FormGroup>

          {!user.id && (
            <FormGroup>
              <Label for="password">Password</Label>
              <Input
                type="password"
                required
                name="password"
                id="password"
                value={user.password || ""}
                onChange={handleChange}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label for="personalCode">Personal Code (4 digits)</Label>
            <Input
              type="text"
              required
              maxLength="4"
              minLength="4"
              pattern="\d{4}"
              name="personalCode"
              id="personalCode"
              value={user.personalCode || ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label for="firstName">First Name</Label>
            <Input
              type="text"
              required
              name="firstName"
              id="firstName"
              value={user.firstName || ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label for="lastName">Last Name</Label>
            <Input
              type="text"
              required
              name="lastName"
              id="lastName"
              value={user.lastName || ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label for="authority">Role / Authority</Label>
            <Input
              type="select"
              required
              name="authority"
              id="authority"
              value={user.authority?.id || ""}
              onChange={handleChange}
            >
              <option value="">Select Role</option>
              {authOptions}
            </Input>
          </FormGroup>

          <div className="form-action-group">
            <button className="ba-btn-primary" type="submit">Save User</button>
            <Link to={`/users`} className="ba-btn-secondary form-action-link">
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
