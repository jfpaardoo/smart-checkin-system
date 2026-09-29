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
import PublishFormationModal from "./components/PublishFormationModal";

const fetcher = (url) => api.get(url).then((res) => (Array.isArray(res.data) ? res.data : []));

const getFormationSortValue = (f, key) => {
  if (key === 'formationDate') {
    return f.formationDate ? new Date(f.formationDate).getTime() : 0;
  }
  if (key === 'attendees') {
    return f.attendances ? f.attendances.length : 0;
  }
  if (key === 'status') {
    return (f.isClosed || f.status === 'CLOSED') ? 'CLOSED' : (f.status || '');
  }
  return f[key] || '';
};

export default function FormationListAdmin() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formationToPublish, setFormationToPublish] = useState(null);

  // SWR: Instantáneo desde RAM (0ms) + revalidación en segundo plano
  const { data: formations = [], isLoading, mutate } = useSWR('/formations', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Ordenación por columnas
  const [sortConfig, setSortConfig] = useState({ key: 'formationDate', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  useSubscription('/topic/formations', () => mutate());

  // Filtrar instantáneamente en memoria
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

        // Filtro por Estado
        if (statusFilter === 'DRAFT' && f.status !== 'DRAFT') {
          return false;
        }
        if (statusFilter === 'PUBLISHED' && (f.status !== 'PUBLISHED' || f.isClosed)) {
          return false;
        }
        if (statusFilter === 'CLOSED' && f.status !== 'CLOSED' && !f.isClosed) {
          return false;
        }

        // Filtro por tiempo
        if (timeFilter === 'UPCOMING') {
          return new Date(f.formationDate) >= now;
        }
        if (timeFilter === 'PAST') {
          return new Date(f.formationDate) < now;
        }
        return true;
      });
  }, [formations, searchQuery, timeFilter, statusFilter]);

  // Ordenar según columna seleccionada
  const sortedFormations = useMemo(() => {
    const list = [...filteredFormations];
    if (!sortConfig?.key) return list;

    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      const valA = getFormationSortValue(a, key);
      const valB = getFormationSortValue(b, key);
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }
      return String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' }) * multiplier;
    });

    return list;
  }, [filteredFormations, sortConfig]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeFilter, statusFilter, pageSize]);

  // Paginación
  const paginatedFormations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFormations.slice(start, start + pageSize);
  }, [sortedFormations, currentPage, pageSize]);

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
        
        {/* Barra de Búsqueda y Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 items-center relative z-40">
          <div className="sm:col-span-6">
            <GlassSearchBar 
              placeholder={t('formations.searchPlaceholderShort', 'Buscar formación por título o descripción...')}
              onSearch={(query) => setSearchQuery(query)}
            />
          </div>
          <div className="sm:col-span-3">
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('formations.filterAllStatus', 'Todos los estados') },
                { value: 'DRAFT', label: t('formation.statusDraft', 'Borradores') },
                { value: 'PUBLISHED', label: t('formation.statusPublished', 'Publicadas') },
                { value: 'CLOSED', label: t('formation.statusClosed', 'Finalizadas') }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder={t('formations.filterStatus', 'Filtrar por estado')}
              className="w-full"
            />
          </div>
          <div className="sm:col-span-3">
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('formations.filterAll', 'Todas las fechas') },
                { value: 'UPCOMING', label: t('formations.filterUpcoming', 'Próximas') },
                { value: 'PAST', label: t('formations.filterPast', 'Pasadas') }
              ]}
              value={timeFilter}
              onChange={(val) => setTimeFilter(val)}
              placeholder={t('formations.filterTime', 'Filtrar por fecha')}
              className="w-full"
            />
          </div>
        </div>

        <FormationTable 
          formations={paginatedFormations} 
          loading={isLoading && formations.length === 0}
          onPublish={(formation) => setFormationToPublish(formation)}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
        
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

      {/* Modal de Publicación */}
      <PublishFormationModal
        isOpen={Boolean(formationToPublish)}
        onClose={() => setFormationToPublish(null)}
        formation={formationToPublish}
        onPublishSuccess={() => mutate()}
      />
    </div>
  );
}