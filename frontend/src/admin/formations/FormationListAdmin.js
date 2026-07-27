import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonGroup, Table } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faUsers, faTrash, faQrcode, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import deleteFromList from "../../util/deleteFromList";
import GlassSearchBar from "../../components/GlassSearchBar";
import moment from "moment";
import { TableGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { useSubscription } from "../../hooks/useSubscription";

export default function FormationListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const jwt = tokenService.getLocalAccessToken();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFormations = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/v1/formations?search=${encodeURIComponent(query)}`
        : `/api/v1/formations`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFormations(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching formations list", e);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    fetchFormations(searchQuery);
  }, [fetchFormations, searchQuery]);

  const reloadFormations = () => {
    fetchFormations(searchQuery);
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
            <span className="badge bg-secondary">{total} {t('formations.total')}</span>
            {completed > 0 && <span className="badge bg-success">{completed} {t('formations.completed')}</span>}
            {inProgress > 0 && <span className="badge bg-warning text-dark">{inProgress} {t('formations.inProgress')}</span>}
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
              <span className="btn-expand-label">{t('formations.edit')}</span>
            </Button>
            <Button
              size="sm"
              className="ba-btn-primary btn-gap btn-icon-expand"
              aria-label={"details-" + formation.id}
              tag={Link}
              to={"/formations/" + formation.id + "/details"}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className="btn-expand-label">{t('formations.attendeesBtn')}</span>
            </Button>
            <Button
              size="sm"
              className="ba-btn-blue btn-gap btn-icon-expand"
              aria-label={"qr-" + formation.id}
              tag={Link}
              to={`/qr-generator?formationId=${formation.id}`}
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span className="btn-expand-label">{t('formations.qr')}</span>
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
                  { entityName: "Formation", t }
                )
              }
            >
              <FontAwesomeIcon icon={faTrash} />
              <span className="btn-expand-label">{t('formations.delete')}</span>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  });

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header">
          <h2>{t('formations.title')}</h2>
          <Button className="ba-btn-primary" tag={Link} to="/formations/new">
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('formations.createFormation')}
          </Button>
        </div>
        
        {/* Debounced Search Bar (1000ms delay) */}
        <div className="mb-4">
          <GlassSearchBar 
            placeholder={t('formations.searchPlaceholder', 'Search formation by name or description...')}
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>

        {loading ? (
          <TableGhostLoader columns={5} rows={4} />
        ) : (
          <Table responsive aria-label="formations" className="ba-table">
            <thead>
              <tr>
                <th>{t('formations.name')}</th>
                <th>{t('formations.description')}</th>
                <th>{t('formations.dateTime')}</th>
                <th>{t('formations.attendees')}</th>
                <th>{t('formations.actions')}</th>
              </tr>
            </thead>
            <tbody>
               {formationList.length > 0 ? formationList : (
                   <tr><td colSpan="5" className="text-center p-4 text-muted">{t('formations.noFormations')}</td></tr>
               )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
