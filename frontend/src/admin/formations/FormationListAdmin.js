import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import GlassSearchBar from "../../components/GlassSearchBar";
import { useSubscription } from "../../hooks/useSubscription";
import FormationTable from "./components/FormationTable";

export default function FormationListAdmin() {
  const { t } = useTranslation();
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

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header ba-admin-header border-0">
          <h2>
            <FontAwesomeIcon icon={faGraduationCap} style={{ color: 'var(--ba-primary)' }} className="me-2" />
            {t('formations.title')}
          </h2>
          <div className="ba-admin-header-actions">
            <Button className="ba-btn-primary" tag={Link} to="/formations/new">
              <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('formations.createFormation')}
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <GlassSearchBar 
            placeholder={t('formations.searchPlaceholder', 'Search formation by name or description...')}
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>

        <FormationTable formations={sortedFormations} loading={loading} />
      </div>
    </div>
  );
}