import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaBuilding, FaSave, FaMapMarkedAlt, FaInfoCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import { CardGhostLoader } from "../../components/GhostLoader";
import GlassFormHeader from "../../components/GlassFormHeader";
import GlassButton from "../../components/GlassButton";
import LocationMapPicker from "../../components/LocationMapPicker";
import api from "../../services/api";

export default function CompanyEditAdmin() {
  const { id } = useParams();
  const isNew = !id || id === "new";
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
    if (name === "latitude" || name === "longitude") {
      const normalized = value.replace(",", ".");
      setCompany((prev) => ({ ...prev, [name]: normalized }));
    } else {
      setCompany((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.name || company.name.trim() === "") {
      toast.error(t("companies.nameRequired", "El nombre de la empresa es obligatorio."));
      return;
    }

    setSaving(true);
    try {
      const latParsed = company.latitude !== "" && company.latitude !== null && company.latitude !== undefined 
        ? Number(String(company.latitude).replace(",", ".")) 
        : null;
      const lngParsed = company.longitude !== "" && company.longitude !== null && company.longitude !== undefined 
        ? Number(String(company.longitude).replace(",", ".")) 
        : null;

      const payload = {
        name: company.name.trim(),
        description: company.description ? company.description.trim() : null,
        address: company.address ? company.address.trim() : null,
        latitude: !Number.isNaN(latParsed) ? latParsed : null,
        longitude: !Number.isNaN(lngParsed) ? lngParsed : null,
        radiusMeters: company.radiusMeters ? Number(company.radiusMeters) : 100,
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
        <GlassFormHeader
          icon={FaBuilding}
          title={isNew ? t("companies.newTitle", "Nueva Empresa") : t("companies.editTitle", "Editar Empresa")}
          subtitle={isNew
            ? t("companies.newSubtitle", "Registra una nueva empresa o centro de trabajo en la plataforma")
            : t("companies.editSubtitle", "Modifica los datos y descripción de la empresa")}
          backUrl="/companies"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 block">
              {t("companies.nameLabel", "Nombre de la Empresa")} *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder={t("companies.namePlaceholder", "Ej. BA Glass Spain SAU")}
              value={company.name || ""}
              onChange={handleChange}
              required
              className="da-input w-full"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 block">
              {t("companies.descriptionLabel", "Descripción / Observaciones")}
            </label>
            <textarea
              rows={2}
              name="description"
              id="description"
              placeholder={t("companies.descriptionPlaceholder", "Información adicional sobre la actividad o localización del centro...")}
              value={company.description || ""}
              onChange={handleChange}
              className="da-input w-full resize-none"
            />
          </div>

          {/* Sección Geofencing y Ubicación con Mapa Interactivo */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-3">
              <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
                  <FaMapMarkedAlt className="text-blue-500 text-base" /> {t("companies.geofenceTitle", "Control de Ubicación y Geofencing")}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                  {t("companies.geofenceSubtitle", "Busca la sede, haz clic en el mapa o usa GPS para fijar el perímetro de fichaje.")}
                </p>
              </div>
            </div>

            {/* Selector de Mapa Interactivo */}
            <LocationMapPicker
              latitude={company.latitude}
              longitude={company.longitude}
              radiusMeters={company.radiusMeters}
              address={company.address}
              onLocationChange={({ latitude, longitude, address }) => {
                setCompany((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                  address,
                }));
              }}
              t={t}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label htmlFor="latitude" className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t("companies.latitudeLabel", "Latitud")}
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  id="latitude"
                  placeholder="Ej. 37.389092"
                  value={company.latitude ?? ""}
                  onChange={handleChange}
                  className="da-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label htmlFor="longitude" className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t("companies.longitudeLabel", "Longitud")}
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  id="longitude"
                  placeholder="Ej. -5.984459"
                  value={company.longitude ?? ""}
                  onChange={handleChange}
                  className="da-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label htmlFor="radiusMeters" className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t("companies.radiusLabel", "Radio Máximo (Metros)")}
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  name="radiusMeters"
                  id="radiusMeters"
                  placeholder="100"
                  value={company.radiusMeters ?? 100}
                  onChange={handleChange}
                  className="da-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 flex items-center gap-1.5">
              <FaInfoCircle className="text-blue-500 flex-shrink-0" />
              <span>{t("companies.geofenceHelp", "Si se configuran las coordenadas GPS, los empleados asignados a esta sede solo podrán fichar dentro del radio establecido.")}</span>
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-white/30 dark:border-white/10 w-full">
            <Link
              to="/companies"
              className="da-btn-secondary px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center rounded-2xl w-full sm:w-auto text-center text-decoration-none"
            >
              {t("common.cancel", "Cancelar")}
            </Link>
            <GlassButton
              type="submit"
              variant="primary"
              loading={saving}
              loadingText={t("common.saving", "Guardando...")}
              icon={FaSave}
              className="px-6 py-2.5 text-sm font-semibold rounded-2xl shadow-md w-full sm:w-auto"
            >
              {isNew ? t("companies.createBtn", "Crear Empresa") : t("companies.saveBtn", "Guardar Cambios")}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
