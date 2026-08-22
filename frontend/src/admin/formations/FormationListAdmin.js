import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassDropdown from "../../components/GlassDropdown";
import GlassPagination from "../../components/GlassPagination";
import GlassPageHeader from "../../components/GlassPageHeader";
import { useSubscription } from "../../hooks/useSubscription";
import api from "../../services/api";
import FormationTable from "./components/FormationTable";

const fetcher = (url) => api.get(url).then((res) => (Array.isArray(res.data) ? res.data : []));

export default function FormationListAdmin() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');

  // SWR: Instantáneo desde RAM (0ms) + revalidación en segundo plano
  const { data: formations = [], isLoading, mutate } = useSWR('/formations', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useSubscription('/topic/formations', () => mutate());

  // Ordenar y filtrar instantáneamente en memoria
  const filteredFormations = useMemo(() => {
    const now = new Date();
    const q = searchQuery.toLowerCase().trim();
    return formations
      .filter((f) => {
        if (q) {
          const match = (
            (f?.name?.toLowerCase()?.includes(q)) ||
            (f?.description?.toLowerCase()?.includes(q))
          );
          if (!match) return false;
        }
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
  }, [formations, searchQuery, timeFilter]);

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
        <GlassPageHeader
          icon={<FontAwesomeIcon icon={faGraduationCap} />}
          title={t('formations.title', 'Gestión de Formaciones')}
          subtitle={t('formations.subtitle', 'Programa sesiones de formación, gestiona asistencias y material didáctico')}
          actions={
            <Link className="da-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shadow-md text-decoration-none" to="/formations/new">
              <FontAwesomeIcon icon={faPlus} /> {t('formations.createFormation', 'Crear Formación')}
            </Link>
          }
        />
        
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

        <FormationTable formations={paginatedFormations} loading={isLoading && formations.length === 0} />
        
        {/* Paginación Liquid Glass */}
        {filteredFormations.length > 0 && (
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