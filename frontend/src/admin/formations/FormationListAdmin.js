import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassDropdown from "../../components/GlassDropdown";
import GlassPagination from "../../components/GlassPagination";
import { useSubscription } from "../../hooks/useSubscription";
import api from "../../services/api";
import FormationTable from "./components/FormationTable";

export default function FormationListAdmin() {
  const { t } = useTranslation();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Ordenar y filtrar
  const filteredFormations = useMemo(() => {
    const now = new Date();
    return formations
      .filter((f) => {
        // Filtro por tiempo
        if (timeFilter === 'UPCOMING') {
          return new Date(f.formationDate) >= now;
        }
        if (timeFilter === 'PAST') {
          return new Date(f.formationDate) < now;
        }
        return true;
      })
      .sort((a, b) => new Date(b.formationDate) - new Date(a.formationDate));
  }, [formations, timeFilter]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeFilter, pageSize]);

  // Paginación
  const paginatedFormations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFormations.slice(start, start + pageSize);
  }, [filteredFormations, currentPage, pageSize]);

  return (
    <div className="da-container">
      <div className="da-card">
        <div className="da-card-header da-admin-header border-0 flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full sm:w-auto">
            <div className="p-3.5 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] text-2xl flex-shrink-0 flex items-center justify-center shadow-xs mb-1 sm:mb-0">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-slate-800">
                {t('formations.title', 'Gestión de Formaciones')}
              </h2>
              <p className="text-xs text-slate-500 mb-0">
                {t('formations.subtitle', 'Programa sesiones de formación, gestiona asistencias y material didáctico')}
              </p>
            </div>
          </div>
          <div className="da-admin-header-actions w-full sm:w-auto">
            <Button className="da-btn-primary d-flex items-center justify-center gap-2 w-full sm:w-auto shadow-md" tag={Link} to="/formations/new">
              <FontAwesomeIcon icon={faPlus} /> {t('formations.createFormation', 'Crear Formación')}
            </Button>
          </div>
        </div>
        
        {/* Barra de Búsqueda y Filtro de Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 items-center relative z-30">
          <div className="sm:col-span-8">
            <GlassSearchBar 
              placeholder={t('formations.searchPlaceholderShort', 'Buscar formación por título o descripción...')}
              onSearch={(query) => setSearchQuery(query)}
            />
          </div>
          <div className="sm:col-span-4">
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('formations.filterAll', 'Todas las formaciones') },
                { value: 'UPCOMING', label: t('formations.filterUpcoming', 'Próximas formaciones') },
                { value: 'PAST', label: t('formations.filterPast', 'Formaciones pasadas') }
              ]}
              value={timeFilter}
              onChange={(val) => setTimeFilter(val)}
              placeholder={t('formations.filterTime', 'Filtrar por fecha')}
              className="w-full"
            />
          </div>
        </div>

        <FormationTable formations={paginatedFormations} loading={loading} />
        
        {/* Paginación Liquid Glass */}
        {!loading && filteredFormations.length > 0 && (
          <GlassPagination
            currentPage={currentPage}
            totalItems={filteredFormations.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>
    </div>
  );
}