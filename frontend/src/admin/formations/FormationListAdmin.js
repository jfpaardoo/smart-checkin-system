import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import getErrorModal from "../../util/getErrorModal";
import useFetchState from "../../util/useFetchState";
import moment from "moment";

const jwt = tokenService.getLocalAccessToken();

export default function FormationListAdmin() {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [formations, setFormations] = useFetchState(
    [],
    `/api/v1/formations`,
    jwt,
    setMessage,
    setVisible
  );
  const [alerts, setAlerts] = useState([]);

  const formationList = formations.map((formation) => {
    return (
      <tr key={formation.id}>
        <td>{formation.name}</td>
        <td>{formation.description}</td>
        <td>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</td>
        <td>{formation.attendees ? formation.attendees.length : 0}</td>
        <td>
          <ButtonGroup>
            <Button
              size="sm"
              className="ba-btn-secondary"
              aria-label={"edit-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id}
            >
              Edit
            </Button>
            <Button
              size="sm"
              className="ba-btn-primary"
              style={{ borderRadius: '20px', marginLeft: '5px' }}
              aria-label={"details-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id + "/details"}
            >
              Details / Attendees
            </Button>
            <Button
              size="sm"
              color="danger"
              style={{ borderRadius: '20px', marginLeft: '5px' }}
              aria-label={"delete-" + formation.id}
              onClick={() =>
                deleteFromList(
                  `/api/v1/formations/${formation.id}`,
                  formation.id,
                  [formations, setFormations],
                  [alerts, setAlerts],
                  setMessage,
                  setVisible
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
  
  const modal = getErrorModal(setVisible, visible, message);

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>Formations Management</h2>
          <Button className="ba-btn-primary" tag={Link} to="/formations/new">
            + Create Formation
          </Button>
        </div>
        
        {alerts.map((a) => a.alert)}
        {modal}
        
        <Table responsive aria-label="formations" className="ba-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Date & Time</th>
              <th>Attendees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
             {formationList.length > 0 ? formationList : (
                 <tr><td colSpan="5" className="text-center">No formations found</td></tr>
             )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
