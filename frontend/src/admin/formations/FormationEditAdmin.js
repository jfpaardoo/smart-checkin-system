import { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Label, FormGroup } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getErrorModal from "../../util/getErrorModal";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";

const jwt = tokenService.getLocalAccessToken();

export default function FormationEditAdmin() {
  const emptyItem = {
    id: null,
    name: "",
    description: "",
    formationDate: "",
  };
  const id = getIdFromUrl(2);
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [formation, setFormation] = useFetchState(
    emptyItem,
    `/api/v1/formations/${id}`,
    jwt,
    setMessage,
    setVisible,
    id
  );

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    setFormation({ ...formation, [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();

    fetch("/api/v1/formations" + (formation.id ? "/" + formation.id : ""), {
      method: formation.id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formation),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.message) {
          setMessage(json.message);
          setVisible(true);
        } else window.location.href = "/formations";
      })
      .catch((error_) => alert(error_));
  }

  const modal = getErrorModal(setVisible, visible, message);
  
  // Format the date for the datetime-local input field
  const formattedDate = formation.formationDate 
    ? moment(formation.formationDate).format('YYYY-MM-DDTHH:mm') 
    : '';

  return (
    <div className="ba-container">
      <div className="ba-card ba-card-form">
        <div className="ba-card-header">
          <h2>{formation.id ? "Edit Formation" : "Create New Formation"}</h2>
        </div>
        {modal}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="name">Formation Name</Label>
            <Input
              type="text"
              required
              name="name"
              id="name"
              value={formation.name || ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label for="description">Description</Label>
            <Input
              type="textarea"
              required
              name="description"
              id="description"
              rows="4"
              value={formation.description || ""}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label for="formationDate">Date and Time</Label>
            <Input
              type="datetime-local"
              required
              name="formationDate"
              id="formationDate"
              value={formattedDate}
              onChange={handleChange}
            />
          </FormGroup>

          <div className="form-action-group">
            <button className="ba-btn-primary" type="submit">Save Formation</button>
            <Link to={`/formations`} className="ba-btn-secondary form-action-link">
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
