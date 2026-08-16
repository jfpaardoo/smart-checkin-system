import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Spinner } from "reactstrap";
import { FaBuilding, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import GlassSearchBar from "../../components/GlassSearchBar";
import GlassPagination from "../../components/GlassPagination";
import { TableGhostLoader } from "../../components/GhostLoader";
import api from "../../services/api";
import "../../App.css";
import "../../static/css/admin/adminPage.css";

export default function CompanyListAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal de confirmación de borrado
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies");
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching companies", e);
      toast.error(t("companies.fetchError", "Error al cargar las empresas."));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting company", err);
      toast.error(t("companies.deleteError", "No se pudo eliminar la empresa."));
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

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Paginación
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  const renderContent = () => {
    if (loading) {
      return <TableGhostLoader columns={4} rows={4} />;
    }

    if (filteredCompanies.length === 0) {
      return (
        <div className="text-center py-12 px-4 bg-white/30 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm mt-4">
          <div className="inline-flex p-4 rounded-full bg-[#b3c34c]/20 text-[#8fa228] mb-3">
            <FaBuilding size={36} />
          </div>
          <h5 className="text-slate-800 font-bold text-lg mb-1">{t("companies.emptyTitle", "No se encontraron empresas")}</h5>
          <p className="text-slate-500 text-sm max-w-md mx-auto">{t("companies.emptySubtitle", "Añade una nueva empresa o modifica tu término de búsqueda.")}</p>
        </div>
      );
    }

    return (
      <div className="w-full mt-2">
        {/* VISTA ESCRITORIO (md y superior) */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
          <table className="w-full text-left border-collapse align-middle">
            <thead>
              <tr className="border-b border-white/40 bg-white/50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-5 text-slate-500" style={{ width: "8%" }}>#</th>
                <th className="py-4 px-5" style={{ width: "45%" }}>{t("companies.name", "Nombre de Empresa")}</th>
                <th className="py-4 px-5" style={{ width: "32%" }}>{t("companies.description", "Descripción")}</th>
                <th className="py-4 px-5 text-right" style={{ width: "15%" }}>{t("common.actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 text-sm text-slate-800">
              {paginatedCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-white/50 transition duration-150">
                  <td className="py-4 px-5 font-semibold text-slate-400">
                    #{company.id}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs flex-shrink-0">
                        <FaBuilding size={16} />
                      </div>
                      <span className="font-bold text-slate-800 tracking-tight">{company.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600">
                    {company.description || <span className="text-slate-400 italic text-xs">{t("common.noDescription", "Sin descripción")}</span>}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        to={`/companies/${company.id}`}
                        className="p-2 rounded-xl bg-white/60 border border-white/80 text-slate-700 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs"
                        title={t("common.edit", "Editar")}
                      >
                        <FaEdit size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => confirmDelete(company)}
                        className="p-2 rounded-xl bg-white/60 border border-white/80 text-rose-500 hover:text-rose-700 hover:bg-rose-50/80 hover:scale-105 active:scale-95 transition shadow-xs"
                        title={t("common.delete", "Eliminar")}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL (tarjetas liquid glass) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {paginatedCompanies.map((company) => (
            <div 
              key={company.id}
              className="p-4 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm hover:shadow-md transition flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#b3c34c]/20 text-[#8fa228] flex-shrink-0">
                    <FaBuilding size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0">{company.name}</h4>
                    <span className="text-[11px] text-slate-400">ID #{company.id}</span>
                  </div>
                </div>
              </div>

              {company.description && (
                <p className="text-xs text-slate-600 bg-white/30 p-2.5 rounded-xl border border-white/40 mb-0">
                  {company.description}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/30">
                <Link
                  to={`/companies/${company.id}`}
                  className="px-3 py-1.5 rounded-xl bg-white/70 border border-white text-xs font-semibold text-slate-700 hover:bg-white flex items-center gap-1.5 shadow-xs"
                >
                  <FaEdit size={12} /> {t("common.edit", "Editar")}
                </Link>
                <button
                  type="button"
                  onClick={() => confirmDelete(company)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-100 flex items-center gap-1.5 shadow-xs"
                >
                  <FaTrash size={12} /> {t("common.delete", "Eliminar")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación Liquid Glass */}
        {!loading && filteredCompanies.length > 0 && (
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
      <div className="da-card" style={{ maxWidth: "1100px", margin: "2rem auto" }}>
        <div className="da-card-header da-admin-header border-0 flex flex-col sm:flex-row justify-between items-center mb-5 gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="p-3.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs flex-shrink-0 mb-1 sm:mb-0">
              <FaBuilding size={26} />
            </div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-slate-800">
                {t("companies.title", "Gestión de Empresas")}
              </h2>
              <p className="text-xs text-slate-500 mb-0">
                {t("companies.subtitle", "Administra las entidades y empresas registradas en la plataforma")}
              </p>
            </div>
          </div>
          <div className="da-admin-header-actions w-full sm:w-auto">
            <Button className="da-btn-primary d-flex items-center justify-center gap-2 w-full sm:w-auto shadow-md" tag={Link} to="/companies/new">
              <FaPlus /> {t("companies.create", "Nueva Empresa")}
            </Button>
          </div>
        </div>

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
      <Modal isOpen={deleteModalOpen} toggle={() => setDeleteModalOpen(!deleteModalOpen)} centered contentClassName="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden">
        <ModalHeader toggle={() => setDeleteModalOpen(!deleteModalOpen)} className="border-0 pb-0">
          <span className="font-bold text-slate-800 text-lg">{t("companies.deleteModalTitle", "Eliminar Empresa")}</span>
        </ModalHeader>
        <ModalBody className="py-3">
          <p className="text-slate-700 text-sm">
            {t("companies.deleteModalPrompt", "¿Estás seguro de que deseas eliminar la empresa")}{" "}
            <strong className="text-slate-900">"{companyToDelete?.name}"</strong>?
          </p>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800">
            {t("companies.deleteModalWarning", "Los usuarios asignados a esta empresa quedarán desasociados de forma segura sin perder su cuenta.")}
          </div>
        </ModalBody>
        <ModalFooter className="border-0 pt-0">
          <Button color="secondary" className="rounded-xl px-4 py-2 text-xs font-semibold" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button color="danger" className="rounded-xl px-4 py-2 text-xs font-semibold shadow-md" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : t("common.delete", "Eliminar")}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
