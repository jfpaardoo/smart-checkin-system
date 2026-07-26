import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

const jwt = tokenService.getLocalAccessToken();

export default function FormationListAdmin() {
  const toast = useToast();
  const [formations, setFormations, loading] = useFetchState(
    [],
    `/api/v1/formations`,
    jwt,
    null,
    null
  );

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
              className="ba-btn-primary btn-gap"
              aria-label={"details-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id + "/details"}
            >
              Details / Attendees
            </Button>
            <Button
              size="sm"
              className="ba-btn-danger btn-gap"
              aria-label={"delete-" + formation.id}
              onClick={() =>
                deleteFromList(
                  `/api/v1/formations/${formation.id}`,
                  formation.id,
                  [formations, setFormations],
                  toast,
                  { entityName: "Formation" }
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
          <TableGhostLoader columns={5} rows={4} />
        ) : (
          <>
            <div className="ba-card-header">
              <h2>Formations Management</h2>
              <Button className="ba-btn-primary" tag={Link} to="/formations/new">
                + Create Formation
              </Button>
            </div>
            
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
          </>
        )}
      </div>
    </div>
  );
}
