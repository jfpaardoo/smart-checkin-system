import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Form, FormGroup, Label, Input, Spinner } from "reactstrap";
import { FaBuilding, FaSave, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader } from "../../components/GhostLoader";
import api from "../../services/api";
import "../../App.css";

export default function CompanyEditAdmin() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const [company, setCompany] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await api.get(`/companies/${id}`);
      setCompany(res.data);
    } catch (e) {
      console.error("Error fetching company details", e);
      toast.error(t("companies.fetchError", "Error al cargar la empresa."));
      navigate("/companies");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate, t, toast]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.name || company.name.trim() === "") {
      toast.error(t("companies.nameRequired", "El nombre de la empresa es obligatorio."));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: company.name.trim(),
        description: company.description ? company.description.trim() : null,
      };

      if (isNew) {
        await api.post("/companies", payload);
        toast.success(t("companies.createdSuccess", "Empresa creada con éxito."));
      } else {
        await api.put(`/companies/${id}`, payload);
        toast.success(t("companies.updatedSuccess", "Empresa actualizada con éxito."));
      }
      navigate("/companies");
    } catch (err) {
      console.error("Error saving company", err);
      const msg = err.response?.data?.message || t("companies.saveError", "Error al guardar la empresa.");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="da-container">
      <div className="da-card" style={{ maxWidth: "760px", margin: "2rem auto", padding: "40px" }}>
        {/* Cabecera simétrica Liquid Glass con botón atrás y badge centrado */}
        <div className="relative mb-6 pb-4 border-b border-white/30 text-center">
          <Link
            to="/companies"
            className="absolute left-0 top-0 p-2.5 rounded-2xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center"
            title={t("common.back", "Volver")}
          >
            <FaArrowLeft size={16} />
          </Link>
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs mb-2">
            <FaBuilding size={26} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
            {isNew ? t("companies.newTitle", "Nueva Empresa") : t("companies.editTitle", "Editar Empresa")}
          </h2>
          <p className="text-xs text-slate-500 mb-0">
            {isNew
              ? t("companies.newSubtitle", "Registra una nueva empresa o centro de trabajo en la plataforma")
              : t("companies.editSubtitle", "Modifica los datos y descripción de la empresa")}
          </p>
        </div>

        <Form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <FormGroup className="mb-0">
            <Label for="name" className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
              {t("companies.nameLabel", "Nombre de la Empresa")} *
            </Label>
            <Input
              type="text"
              name="name"
              id="name"
              placeholder={t("companies.namePlaceholder", "Ej. BA Glass Spain SAU")}
              value={company.name || ""}
              onChange={handleChange}
              required
              className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm"
            />
          </FormGroup>

          {/* Descripción */}
          <FormGroup className="mb-0">
            <Label for="description" className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
              {t("companies.descriptionLabel", "Descripción / Observaciones")}
            </Label>
            <Input
              type="textarea"
              rows={3}
              name="description"
              id="description"
              placeholder={t("companies.descriptionPlaceholder", "Información adicional sobre la actividad o localización del centro...")}
              value={company.description || ""}
              onChange={handleChange}
              className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-3 text-sm text-slate-800 outline-none focus:border-[#b3c34c] focus:bg-white/70 transition shadow-sm resize-none"
            />
          </FormGroup>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/30">
            <Link
              to="/companies"
              className="da-btn-secondary px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center rounded-2xl"
              style={{ textDecoration: 'none' }}
            >
              {t("common.cancel", "Cancelar")}
            </Link>
            <button
              type="submit"
              className="da-btn-primary px-6 py-2.5 flex items-center gap-2 text-sm font-semibold shadow-md transition hover:-translate-y-0.5"
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : <FaSave />}
              {isNew ? t("companies.createBtn", "Crear Empresa") : t("companies.saveBtn", "Guardar Cambios")}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
