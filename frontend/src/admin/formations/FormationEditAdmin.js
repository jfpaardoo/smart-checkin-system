import React from "react";
import { Form, Input, Label, FormGroup, Button } from "reactstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faUpload, faArrowLeft, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import dayjs from "dayjs";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { getCleanFileInfo } from "../../utils/fileUtils";
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
        {/* Cabecera simétrica Liquid Glass con botón atrás y badge centrado */}
        <div className="relative mb-6 pb-4 border-b border-white/30 text-center">
          <Link
            to="/formations"
            className="absolute left-0 top-0 p-2.5 rounded-2xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center"
            title={t("common.back", "Volver")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs mb-2">
            <FontAwesomeIcon icon={faGraduationCap} size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
            {formation.id ? t('formations.editFormation', 'Editar Formación') : t('formations.createNew', 'Nueva Formación')}
          </h2>
          <p className="text-xs text-slate-500 mb-0">
            {formation.id 
              ? t('formations.editSubtitle', 'Modifica los datos, horario y documentación de la formación')
              : t('formations.newSubtitle', 'Crea una nueva sesión formativa y sube el material')}
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="da-form-row-2">
              <FormGroup>
                <Label for="name">{t('formations.formationName')}</Label>
                <Input
                  type="text"
                  required
                  name="name"
                  id="name"
                  value={formation.name || ""}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="formationDate">{t('formations.dateAndTime')}</Label>
                <Input
                  type="datetime-local"
                  required
                  name="formationDate"
                  id="formationDate"
                  value={formattedDate}
                  onChange={handleChange}
                />
              </FormGroup>
          </div>

          <div className="da-form-row-1">
              <FormGroup>
                <Label for="description">{t('formations.description')}</Label>
                <Input
                  type="textarea"
                  required
                  name="description"
                  id="description"
                  rows="3"
                  value={formation.description || ""}
                  onChange={handleChange}
                />
              </FormGroup>
          </div>

          <div className="da-form-row-1 mt-3 mb-4">
            <div>
              <Label className="fw-bold">{t('formations.attachments', 'Documentos Adjuntos')}</Label>
              
              {/* Archivos Existentes */}
              {formation.documentUrls && formation.documentUrls.length > 0 && (
                <div className="d-flex flex-column gap-2 mb-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span className="text-muted small fw-bold">{t('formations.existingFiles', 'Archivos actuales')}</span>
                  <div className="d-flex flex-wrap gap-2">
                    {formation.documentUrls.map((item) => {
                      const fileMeta = getCleanFileInfo(item);
                      return (
                        <div key={item} className="da-badge bg-white text-dark d-flex align-items-center gap-2 border">
                          <FontAwesomeIcon icon={fileMeta.icon} style={{ color: fileMeta.color }} />
                          <span className="text-truncate" style={{ maxWidth: '200px' }} title={fileMeta.name}>{fileMeta.name}</span>
                          <button 
                            type="button" 
                            className="btn-close" 
                            style={{ fontSize: '10px' }}
                            onClick={() => handleRemoveExistingFile(item)}
                            title={t('formations.removeFile', 'Eliminar archivo')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subir Nuevos Archivos */}
              <div className="upload-container position-relative">
                  <Input
                    type="file"
                    name="files"
                    id="files"
                    multiple
                    onChange={handleFileChange}
                    className="position-absolute w-100 h-100 opacity-0"
                    style={{ zIndex: 2, cursor: 'pointer', left: 0, top: 0 }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  />
                  <div className="upload-dropzone p-4 text-center rounded border-dashed" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '2px dashed var(--da-primary)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
                    <FontAwesomeIcon icon={faUpload} size="2x" className="mb-2 text-primary" style={{ opacity: 0.7 }} />
                    <h6 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>{t('formations.dragDropFiles', 'Arrastra archivos aquí o haz clic para subir')}</h6>
                    <p className="text-muted small mb-0">{t('formations.acceptedFormats', 'Formatos aceptados: PDF, Word, Excel, PowerPoint, Imágenes')}</p>
                    
                    {files.length > 0 && (
                      <div className="mt-3 text-start">
                        <span className="fw-bold small" style={{ color: 'var(--da-primary)' }}>
                          {files.length} {t('formations.filesSelected', 'archivo(s) seleccionado(s)')}
                        </span>
                        <ul className="list-unstyled mb-0 mt-2">
                          {files.map((f) => (
                            <li key={f.name} className="small text-muted d-flex align-items-center gap-2">
                              <FontAwesomeIcon icon={faPlus} className="text-success" style={{ fontSize: '10px' }} />
                              <span className="text-truncate" style={{ maxWidth: '250px' }}>{f.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </div>

          <div className="da-form-actions">
            <Button className="da-btn-secondary" onClick={() => window.history.back()} disabled={isSaving}>
              <FontAwesomeIcon icon={faTimes} className="me-1" /> {t('common.cancel')}
            </Button>
            <Button className="da-btn-primary" type="submit" disabled={isSaving}>
              <FontAwesomeIcon icon={faPlus} className="me-1" /> 
              {isSaving ? t('common.saving') : null}
              {!isSaving && formation.id ? t('common.save') : null}
              {!isSaving && !formation.id ? t('formations.createNew') : null}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}