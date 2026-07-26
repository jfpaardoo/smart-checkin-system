import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faUsers, faTrash, faQrcode } from "@fortawesome/free-solid-svg-icons";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { useSubscription } from "../../hooks/useSubscription";

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

  const reloadFormations = () => {
    fetch("/api/v1/formations", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data) => setFormations(data))
      .catch((e) => console.error("Error refreshing formations list via WS", e));
  };

  useSubscription('/topic/formations', reloadFormations);

  const sortedFormations = [...formations].sort(
    (a, b) => new Date(b.formationDate) - new Date(a.formationDate)
  );

  const formationList = sortedFormations.map((formation) => {
    const total = formation.attendances ? formation.attendances.length : 0;
    const completed = formation.attendances ? formation.attendances.filter(a => a.checkOutDate).length : 0;
    const inProgress = formation.attendances ? formation.attendances.filter(a => a.checkInDate && !a.checkOutDate).length : 0;

    return (
      <tr key={formation.id}>
        <td>{formation.name}</td>
        <td>{formation.description}</td>
        <td>{moment(formation.formationDate).format('YYYY-MM-DD HH:mm')}</td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-secondary">{total} Total</span>
            {completed > 0 && <span className="badge bg-success">{completed} Completados</span>}
            {inProgress > 0 && <span className="badge bg-warning text-dark">{inProgress} En Curso</span>}
          </div>
        </td>
        <td>
          <ButtonGroup>
            <Button
              size="sm"
              className="ba-btn-secondary btn-icon-expand"
              aria-label={"edit-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id}
            >
              <FontAwesomeIcon icon={faPencil} />
              <span className="btn-expand-label">Editar</span>
            </Button>
            <Button
              size="sm"
              className="ba-btn-primary btn-gap btn-icon-expand"
              aria-label={"details-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id + "/details"}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className="btn-expand-label">Asistentes</span>
            </Button>
            <Button
              size="sm"
              className="ba-btn-blue btn-gap btn-icon-expand"
              aria-label={"qr-" + formation.id}
              tag={Link}
              to={`/qr-generator?formationId=${formation.id}`}
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span className="btn-expand-label">QR</span>
            </Button>
            <Button
              size="sm"
              className="ba-btn-danger btn-gap btn-icon-expand"
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
              <FontAwesomeIcon icon={faTrash} />
              <span className="btn-expand-label">Eliminar</span>
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
