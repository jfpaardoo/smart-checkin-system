import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import GlassSearchBar from "../../components/GlassSearchBar";
import { useSubscription } from "../../hooks/useSubscription";
import api from "../../services/api";
import FormationTable from "./components/FormationTable";

export default function FormationListAdmin() {
  const { t } = useTranslation();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFormations = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : '';
      const res = await api.get(`/formations${params}`);
      setFormations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching formations list", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormations(searchQuery);
  }, [fetchFormations, searchQuery]);

  const reloadFormations = () => {
    fetchFormations(searchQuery);
  };

  useSubscription('/topic/formations', reloadFormations);

  const sortedFormations = formations.slice().sort(
    (a, b) => new Date(b.formationDate) - new Date(a.formationDate)
  );

  return (
    <div className="da-container">
      <div className="da-card">
        <div className="da-card-header da-admin-header border-0">
          <h2>
            <FontAwesomeIcon icon={faGraduationCap} style={{ color: 'var(--da-primary)' }} className="me-2" />
            {t('formations.title')}
          </h2>
          <div className="da-admin-header-actions">
            <Button className="da-btn-primary" tag={Link} to="/formations/new">
              <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('formations.createFormation')}
            </Button>
          </div>
        </div>
        
        {/* Usamos texto corto en pantallas pequeñas ('Buscar formación...') para que quepa entero sin cortarse al pulsar */}
        <div className="mb-4">
          <GlassSearchBar 
            placeholder={t('formations.searchPlaceholderShort', 'Buscar formación...')}
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>

        <FormationTable formations={sortedFormations} loading={loading} />
        
      </div>
    </div>
  );
}