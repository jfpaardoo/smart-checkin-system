import { Link } from "react-router-dom";
import { Form, Input, Label, FormGroup, Row, Col } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function FormationEditAdmin() {
  const emptyItem = {
    id: null,
    name: "",
    description: "",
    formationDate: "",
  };
  const id = getIdFromUrl(2);
  const toast = useToast();
  const [formation, setFormation, loading] = useFetchState(
    emptyItem,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
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
          let errorMsg = json.message;
          // Handle Spring validation map format: {field=message}
          if (errorMsg.startsWith("{") && errorMsg.endsWith("}")) {
            errorMsg = errorMsg
              .slice(1, -1)
              .split(",")
              .map(err => {
                const [field, msg] = err.split("=");
                return `${field.trim()}: ${msg.trim()}`;
              })
              .join("\n");
          }
          // Handle database unique constraints (e.g. SQL duplicate key)
          else if (errorMsg.includes("duplicate key value")) {
            errorMsg = "This formation details already conflict with an existing record.";
          }
          toast.error(errorMsg);
        } else {
          toast.success(formation.id ? "Formation updated successfully" : "Formation created successfully");
          setTimeout(() => { window.location.href = "/formations"; }, 1200);
        }
      })
      .catch(() => toast.error("Connection error. Please try again."));
  }

  // Format the date for the datetime-local input field
  const formattedDate = formation.formationDate 
    ? moment(formation.formationDate).format('YYYY-MM-DDTHH:mm') 
    : '';

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card ba-card-form my-auto mx-auto">
        <div className="ba-card-header">
          <h2>{formation.id ? "Edit Formation" : "Create New Formation"}</h2>
        </div>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
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
            </Col>

            <Col md={6}>
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
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="description">Description</Label>
                <Input
                  type="textarea"
                  required
                  name="description"
                  id="description"
                  rows="3"
                  value={formation.description || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>
          </Row>

          <div className="form-action-group">
            <button className="ba-btn-primary" type="submit">
              Save Formation
            </button>
            <Link to="/formations" className="ba-btn-secondary form-action-link">
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
