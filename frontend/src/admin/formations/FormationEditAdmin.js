import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faUpload, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import getIdFromUrl from "../../util/getIdFromUrl";
import dayjs from "dayjs";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { getCleanFileInfo } from "../../utils/fileUtils";
import GlassFormHeader from "../../components/GlassFormHeader";
import GlassButton from "../../components/GlassButton";
import { useFormationEdit } from "./hooks/useFormationEdit";

export default function FormationEditAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const id = getIdFromUrl(2);
  const toast = useToast();

  const {
    formation,
    loading,
    isSaving,
    files,
    handleChange,
    handleFileChange,
    handleRemoveExistingFile,
    handleSubmit
  } = useFormationEdit(id, jwt, toast, t);

  const formattedDate = formation.formationDate 
    ? dayjs(formation.formationDate).format('YYYY-MM-DDTHH:mm') 
    : '';

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="da-container justify-content-center">
      <div className="da-card da-card-form my-auto mx-auto" style={{ maxWidth: "820px" }}>
        <GlassFormHeader
          icon={<FontAwesomeIcon icon={faGraduationCap} size="lg" />}
          title={formation.id ? t('formations.editFormation', 'Editar Formación') : t('formations.createNew', 'Nueva Formación')}
          subtitle={formation.id 
            ? t('formations.editSubtitle', 'Modifica los datos, horario y documentación de la formación')
            : t('formations.newSubtitle', 'Crea una nueva sesión formativa y sube el material')}
          backUrl="/formations"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('formations.formationName', 'Nombre de la Formación')} *
              </label>
              <input
                type="text"
                required
                name="name"
                id="name"
                value={formation.name || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            <div>
              <label htmlFor="formationDate" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('formations.dateAndTime', 'Fecha y Hora')} *
              </label>
              <input
                type="datetime-local"
                required
                name="formationDate"
                id="formationDate"
                value={formattedDate}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('formations.location', 'Lugar Formación')} *
              </label>
              <input
                type="text"
                required
                name="location"
                id="location"
                placeholder="Ej. BA VILLAFRANCA"
                value={formation.location || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            <div>
              <label htmlFor="trainer" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('formations.trainer', 'Formador')} *
              </label>
              <input
                type="text"
                required
                name="trainer"
                id="trainer"
                placeholder="Ej. VICTOR PARDO"
                value={formation.trainer || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              {t('formations.description')}
            </label>
            <textarea
              required
              name="description"
              id="description"
              rows="3"
              value={formation.description || ""}
              onChange={handleChange}
              className="da-input w-full"
            />
          </div>

          <div className="mt-3 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                {t('formations.attachments', 'Documentos Adjuntos')}
              </label>
              
              {/* Archivos Existentes */}
              {formation.documentUrls && formation.documentUrls.length > 0 && (
                <div className="flex flex-col gap-2 mb-3 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{t('formations.existingFiles', 'Archivos actuales')}</span>
                  <div className="flex flex-wrap gap-2">
                    {formation.documentUrls.map((item) => {
                      const fileMeta = getCleanFileInfo(item);
                      return (
                        <div key={item} className="da-badge bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center gap-2 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-full text-xs">
                          <FontAwesomeIcon icon={fileMeta.icon} style={{ color: fileMeta.color }} />
                          <span className="truncate max-w-[200px]" title={fileMeta.name}>{fileMeta.name}</span>
                          <button 
                            type="button" 
                            className="bg-transparent border-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer text-xs font-bold ml-1" 
                            onClick={() => handleRemoveExistingFile(item)}
                            title={t('formations.removeFile', 'Eliminar archivo')}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subir Nuevos Archivos */}
              <div className="upload-container relative">
                  <input
                    type="file"
                    name="files"
                    id="files"
                    multiple
                    onChange={handleFileChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer left-0 top-0 z-10"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  />
                  <div className="upload-dropzone p-4 text-center rounded-2xl border-2 border-dashed border-[#b3c34c] bg-white/60 dark:bg-slate-800/60 transition duration-200">
                    <FontAwesomeIcon icon={faUpload} size="2x" className="mb-2 text-[#8fa228] opacity-70" />
                    <h6 className="font-bold mb-1 text-slate-800 dark:text-slate-100 text-sm">{t('formations.dragDropFiles', 'Arrastra archivos aquí o haz clic para subir')}</h6>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-0">{t('formations.acceptedFormats', 'Formatos aceptados: PDF, Word, Excel, PowerPoint, Imágenes')}</p>
                    
                    {files.length > 0 && (
                      <div className="mt-3 text-left">
                        <span className="font-bold text-xs" style={{ color: 'var(--da-primary)' }}>
                          {files.length} {t('formations.filesSelected', 'archivo(s) seleccionado(s)')}
                        </span>
                        <ul className="list-none mb-0 mt-2 space-y-1 p-0">
                          {files.map((f) => (
                            <li key={f.name} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <FontAwesomeIcon icon={faPlus} className="text-emerald-500 text-[10px]" />
                              <span className="truncate max-w-[250px]">{f.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-white/30 dark:border-white/10 w-full">
            <Link to="/formations" className="da-btn-secondary w-full sm:w-auto text-center text-decoration-none">
              <FontAwesomeIcon icon={faTimes} className="me-1" /> {t('common.cancel')}
            </Link>
            <GlassButton
              type="submit"
              variant="primary"
              loading={isSaving}
              loadingText={t('common.saving', 'Guardando...')}
              icon={<FontAwesomeIcon icon={faPlus} />}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl shadow-md"
            >
              <span>
                {formation.id ? t('common.save') : t('formations.createNew')}
              </span>
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}