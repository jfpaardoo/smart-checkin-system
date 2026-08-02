import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Label, FormGroup, Row, Col } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileLines, faFileImage, faFile } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchState from "../../util/useFetchState";
import moment from "moment";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

export default function FormationEditAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const emptyItem = {
    id: null,
    name: "",
    description: "",
    formationDate: "",
    documentUrls: [],
  };
  const id = getIdFromUrl(2);
  const toast = useToast();
  const [formation, setFormation, loading] = useFetchState(
    emptyItem,
    `/api/v1/formations/${id}`,
    jwt,
    null,
    null,
    id
  );
  const [files, setFiles] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    setFormation({ ...formation, [name]: value });
  }

  function handleFileChange(event) {
    setFiles(Array.from(event.target.files));
  }

  const handleRemoveExistingFile = (urlToRemove) => {
    setFormation({
      ...formation,
      documentUrls: (formation.documentUrls || []).filter(url => url !== urlToRemove)
    });
  };

  const getCleanFileNameAndType = (item) => {
    try {
      let url = item;
      let originalName = "";

      if (item.includes("||")) {
        const parts = item.split("||");
        originalName = parts[0];
        url = parts[1];
      } else {
        const decoded = decodeURIComponent(item);
        const segments = decoded.split('/');
        const rawFileName = segments.at(-1)?.split('?')[0] || "Documento";
        const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
        originalName = uuidPrefixRegex.test(rawFileName) ? rawFileName.replace(uuidPrefixRegex, '') : rawFileName;
      }

      if (originalName.startsWith("IQ") || originalName.length > 30) {
        originalName = "Documento Adjunto.pdf";
      }

      const lower = originalName.toLowerCase();
      if (lower.endsWith('.pdf') || lower.includes('pdf')) {
        return { name: originalName, url, icon: faFilePdf, color: '#e74c3c' };
      } else if (['.txt', '.doc', '.docx', '.odt', '.log'].some(ext => lower.endsWith(ext)) || lower.includes('txt') || lower.includes('doc')) {
        return { name: originalName, url, icon: faFileLines, color: '#3498db' };
      } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => lower.endsWith(ext)) || lower.includes('png') || lower.includes('jpg')) {
        return { name: originalName, url, icon: faFileImage, color: '#2ecc71' };
      }
      return { name: originalName, url, icon: faFilePdf, color: '#e74c3c' };
    } catch {
      return { name: "Documento Adjunto", url: item, icon: faFile, color: '#95a5a6' };
    }
  };

  function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    const payload = {
      ...formation,
      existingDocumentUrls: formation.documentUrls || []
    };
    formData.append("formation", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    files.forEach(file => {
      formData.append("files", file);
    });

    fetch("/api/v1/formations" + (formation.id ? "/" + formation.id : ""), {
      method: formation.id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.message) {
          let errorMsg = json.message;
          if (errorMsg.startsWith("{") && errorMsg.endsWith("}")) {
            errorMsg = errorMsg
              .slice(1, -1)
              .split(",")
              .map(err => {
                const [field, msg] = err.split("=");
                return `${field.trim()}: ${msg.trim()}`;
              })
              .join("\n");
          } else if (errorMsg.includes("duplicate key value")) {
            errorMsg = t('formations.duplicateConflict');
          }
          toast.error(errorMsg);
          setIsSaving(false);
        } else {
          toast.success(formation.id ? t('formations.updated') : t('formations.created'));
          setTimeout(() => { window.location.href = "/formations"; }, 1200);
        }
      })
      .catch(() => {
        toast.error(t('formations.connectionError'));
        setIsSaving(false);
      });
  }

  const formattedDate = formation.formationDate 
    ? moment(formation.formationDate).format('YYYY-MM-DDTHH:mm') 
    : '';

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card ba-card-form my-auto mx-auto">
        <div className="ba-card-header">
          <h2>{formation.id ? t('formations.editFormation') : t('formations.createNew')}</h2>
        </div>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
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
            </Col>

            <Col md={6}>
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
            </Col>
          </Row>

          <Row>
            <Col md={12}>
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
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="file">{t('formations.document', 'Documentos de Formación (Opcional)')}</Label>
                <Input
                  type="file"
                  name="files"
                  id="file"
                  multiple
                  onChange={handleFileChange}
                />
                {formation.documentUrls && formation.documentUrls.length > 0 && (
                  <div className="mt-3">
                    <strong>{t('formations.currentDocuments', 'Documentos actuales vinculados:')}</strong>
                    <ul className="list-group mt-2">
                      {formation.documentUrls.map((item) => {
                        const fileInfo = getCleanFileNameAndType(item);

                        return (
                          <li key={item} className="list-group-item d-flex justify-content-between align-items-center">
                            <a href={fileInfo.url} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-truncate" style={{ maxWidth: '350px' }}>
                              <FontAwesomeIcon icon={fileInfo.icon} style={{ color: fileInfo.color }} />
                              <span className="text-truncate">{fileInfo.name}</span>
                            </a>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveExistingFile(item)}
                            >
                              {t('formations.removeDocument', 'Eliminar')}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>

          <div className="form-action-group mt-4 d-flex gap-3">
            <button className="ba-btn-primary position-relative" type="submit" disabled={isSaving} style={{ minWidth: '150px' }}>
              {isSaving ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  <span>{t('formations.saving', 'Guardando...')}</span>
                </div>
              ) : (
                t('formations.saveFormation')
              )}
            </button>
            <Link 
              to={`/formations/${id}/details`} 
              className={`ba-btn-secondary form-action-link ${isSaving ? 'disabled pe-none opacity-50' : ''}`}
              aria-disabled={isSaving}
            >
              {t('formations.cancel')}
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}