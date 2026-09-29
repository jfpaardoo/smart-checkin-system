import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaMapPin } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassPagination from "../../components/GlassPagination";
import GlassPageHeader from "../../components/GlassPageHeader";
import GlassConfirmModal from "../../components/GlassConfirmModal";
import { TableGhostLoader } from "../../components/GhostLoader";
import SortableHeader from "../../components/SortableHeader";
import MobileSortBar from "../../components/MobileSortBar";
import api from "../../services/api";

const fetcher = (url) => api.get(url).then((res) => (Array.isArray(res.data) ? res.data : []));

export default function CompanyListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const sortOptions = [
    { key: "name", label: t("companies.name", "Nombre de Empresa") },
    { key: "id", label: t("companies.id", "Identificador (#)") },
    { key: "description", label: t("companies.description", "Descripción") },
  ];
  
  // SWR: Instantáneo desde caché de RAM (0ms) + revalidación en segundo plano
  const { data: companies = [], isLoading, mutate } = useSWR("/companies", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Ordenación por columnas
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Modal de confirmación de borrado
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = (company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/companies/${companyToDelete.id}`);
      toast.success(t("companies.deletedSuccess", "Empresa eliminada correctamente."));
      await mutate((prev) => (prev ? prev.filter((c) => c.id !== companyToDelete.id) : []), false);
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting company", err);
      toast.error(t("companies.deleteError", "No se pudo eliminar la empresa."));
      await mutate();
    } finally {
      setDeleting(false);
      setCompanyToDelete(null);
    }
  };

  // Filtrado por texto
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = (
          (c?.name?.toLowerCase()?.includes(q)) ||
          (c?.description?.toLowerCase()?.includes(q))
        );
        if (!match) return false;
      }
      return true;
    });
  }, [companies, searchQuery]);

  // Ordenación según columna seleccionada
  const sortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    if (!sortConfig?.key) return list;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    list.sort((a, b) => {
      if (key === "id") {
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        return multiplier * (idA - idB);
      }
      if (key === "name") {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return multiplier * nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      }
      if (key === "description") {
        const descA = a.description || a.address || "";
        const descB = b.description || b.address || "";
        return multiplier * descA.localeCompare(descB, undefined, { sensitivity: "base" });
      }
      return 0;
    });

    return list;
  }, [filteredCompanies, sortConfig]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Paginación
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCompanies.slice(start, start + pageSize);
  }, [sortedCompanies, currentPage, pageSize]);

  const renderContent = () => {
    if (isLoading && companies.length === 0) {
      return <TableGhostLoader columns={4} rows={4} />;
    }

    return (
      <div className="w-full relative z-10 mt-2">
        {/* VISTA ESCRITORIO (md y superior) */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
          <table className="w-full text-left border-collapse align-middle">
            <thead>
              <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                <SortableHeader
                  label="#"
                  sortKey="id"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  width="8%"
                />
                <SortableHeader
                  label={t("companies.name", "Nombre de Empresa")}
                  sortKey="name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  width="45%"
                />
                <SortableHeader
                  label={t("companies.description", "Descripción")}
                  sortKey="description"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  width="32%"
                />
                <th className="py-4 px-5 text-right font-bold uppercase tracking-wider" style={{ width: "15%" }}>{t("common.actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-5 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <div className="p-3.5 rounded-2xl bg-[#b3c34c]/10 dark:bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]">
                        <FaBuilding size={22} />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm m-0">
                        {t("companies.emptyTitle", "No se encontraron empresas")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 m-0 max-w-sm">
                        {t("companies.emptySubtitle", "Añade una nueva empresa o modifica tu término de búsqueda.")}
                      </p>
                      <Link to="/companies/new" className="da-btn-primary inline-flex items-center gap-2 text-decoration-none mt-2 text-xs">
                        <FaPlus /> {t("companies.create", "Nueva Empresa")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                    <td className="py-4 px-5 font-semibold text-slate-400">
                      #{company.id}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs flex-shrink-0">
                          <FaBuilding size={16} />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{company.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      <div className="space-y-1">
                        {company.description && <p className="m-0 text-sm">{company.description}</p>}
                        {company.address && (
                          <p className="m-0 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" /> {company.address}
                          </p>
                        )}
                        {company.latitude && company.longitude && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <FaMapPin className="text-emerald-500" /> Geofencing: {company.radiusMeters || 100}m
                          </span>
                        )}
                        {!company.description && !company.address && !company.latitude && (
                          <span className="text-slate-400 italic text-xs">{t("common.noDescription", "Sin descripción")}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          to={`/companies/${company.id}`}
                          className="p-2 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs"
                          title={t("common.edit", "Editar")}
                        >
                          <FaEdit size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => confirmDelete(company)}
                          className="p-2 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-50/80 hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer"
                          title={t("common.delete", "Eliminar")}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL (tarjetas liquid glass) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {paginatedCompanies.length > 0 && (
            <MobileSortBar
              options={sortOptions}
              currentSort={sortConfig}
              onSort={handleSort}
            />
          )}
          {paginatedCompanies.length === 0 ? (
            <div className="text-center p-6 text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-xl bg-[#b3c34c]/10 dark:bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]">
                  <FaBuilding size={18} />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm m-0">
                  {t("companies.emptyTitle", "No se encontraron empresas")}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 m-0">
                  {t("companies.emptySubtitle", "Añade una nueva empresa o modifica tu término de búsqueda.")}
                </p>
                <Link to="/companies/new" className="da-btn-primary inline-flex items-center gap-2 text-decoration-none mt-2 text-xs">
                  <FaPlus /> {t("companies.create", "Nueva Empresa")}
                </Link>
              </div>
            </div>
          ) : (
            paginatedCompanies.map((company) => (
              <div 
                key={company.id}
                className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md transition flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#b3c34c]/20 text-[#8fa228] flex-shrink-0">
                      <FaBuilding size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0">{company.name}</h4>
                      <span className="text-[11px] text-slate-400">ID #{company.id}</span>
                    </div>
                  </div>
                  {company.latitude && company.longitude && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1">
                      <FaMapPin size={10} className="text-emerald-600 dark:text-emerald-400" /> {company.radiusMeters || 100}m
                    </span>
                  )}
                </div>

                {(company.description || company.address) && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/30 dark:bg-slate-900/40 p-2.5 rounded-xl border border-white/40 dark:border-white/10 space-y-1 mb-0">
                    {company.description && <p className="m-0">{company.description}</p>}
                    {company.address && (
                      <p className="m-0 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <FaMapMarkerAlt size={11} className="text-slate-400" /> {company.address}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-1.5 sm:gap-2 pt-2.5 border-t border-white/30 dark:border-white/10 w-full">
                  <Link
                    to={`/companies/${company.id}`}
                    className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-700 border border-white dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white inline-flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto text-center text-decoration-none"
                  >
                    <FaEdit size={12} /> {t("common.edit", "Editar")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => confirmDelete(company)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-100 inline-flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto cursor-pointer"
                  >
                    <FaTrash size={12} /> {t("common.delete", "Eliminar")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación Liquid Glass */}
        {!isLoading && filteredCompanies.length > 0 && (
          <GlassPagination
            currentPage={currentPage}
            totalItems={filteredCompanies.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>
    );
  };

  return (
    <div className="da-container">
      <div className="da-card">
        <GlassPageHeader
          icon={FaBuilding}
          title={t("companies.title", "Gestión de Empresas")}
          subtitle={t("companies.subtitle", "Administra las entidades y empresas registradas en la plataforma")}
          actions={
            <Link className="da-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shadow-md text-decoration-none" to="/companies/new">
              <FaPlus /> {t("companies.create", "Nueva Empresa")}
            </Link>
          }
        />

        {/* Barra de Búsqueda */}
        <div className="mb-4">
          <GlassSearchBar
            placeholder={t("companies.searchPlaceholder", "Buscar empresa por nombre o descripción...")}
            onSearch={(q) => setSearchQuery(q)}
          />
        </div>

        {renderContent()}
      </div>

      {/* Modal de confirmación Liquid Glass */}
      <GlassConfirmModal
        isOpen={deleteModalOpen}
        toggle={() => setDeleteModalOpen(!deleteModalOpen)}
        title={t("companies.deleteModalTitle", "Eliminar Empresa")}
        message={
          <p className="mb-0">
            {t("companies.deleteModalPrompt", "¿Estás seguro de que deseas eliminar la empresa")}{" "}
            <strong className="text-slate-900 dark:text-white">"{companyToDelete?.name}"</strong>?
          </p>
        }
        warningMessage={t("companies.deleteModalWarning", "Los usuarios asignados a esta empresa quedarán desasociados de forma segura sin perder su cuenta.")}
        confirmVariant="danger"
        confirmText={t("common.delete", "Eliminar")}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
