import React from "react";
import { Row, Col, Table, Badge, Button } from "reactstrap";
import { FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaAward, FaClock, FaFilePdf } from "react-icons/fa";
import { TableGhostLoader } from "../../../components/GhostLoader";
import tokenService from "../../../services/token.service";
import { calculateDuration, formatDate } from "../../../utils/dateUtils";

export default function FormationsTab({ loadingFormations, formations, t }) {
  if (loadingFormations) {
    return <TableGhostLoader rows={4} columns={6} />;
  }

  const completedFormations = formations.filter(f => f.checkOutDate && f.signature).length;
  const totalMinutes = formations.reduce((acc, f) => {
    if (f.checkInDate && f.checkOutDate) {
      const diff = new Date(f.checkOutDate) - new Date(f.checkInDate);
      return acc + (diff > 0 ? Math.floor(diff / 60000) : 0);
    }
    return acc;
  }, 0);

  const formattedHours = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : `${totalMinutes} min`;

  const handleDownloadCertificate = async (attendanceId) => {
    try {
      const response = await fetch(`/api/v1/certificates/attendance/${attendanceId}`, {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${attendanceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        console.error("Error fetching certificate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF", error);
    }
  };

  return (
    <div className="p-1 p-md-3">
      {/* Summary Analytics Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-primary flex-shrink-0">
              <FaGraduationCap size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.totalFormations', 'Total Registradas')}</div>
              <div className="fs-4 fw-bold text-dark">{formations.length}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-success flex-shrink-0">
              <FaAward size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.completedSigned', 'Completadas y Firmadas')}</div>
              <div className="fs-4 fw-bold text-dark">{completedFormations}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-warning flex-shrink-0">
              <FaClock size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.accumulatedTime', 'Tiempo Acumulado')}</div>
              <div className="fs-4 fw-bold text-dark">{formattedHours}</div>
            </div>
          </div>
        </Col>
      </Row>

      <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
        <FaGraduationCap className="me-2" style={{ color: "#8a9e29" }} /> {t('profile.myFormationHistory', 'Historial de Formaciones')}
      </h5>

      {formations.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FaGraduationCap size={48} className="mb-3 opacity-50" />
          <h6>{t('profile.noFormationsYet', 'No tienes ninguna formación registrada todavía.')}</h6>
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO (Tabla clásica) */}
          <div className="hidden lg:block w-100 overflow-x-auto rounded-3 shadow-sm" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
            <Table responsive borderless align="middle" className="ba-table mb-0" style={{ minWidth: '650px' }}>
              <thead>
                <tr className="text-uppercase text-muted small" style={{ letterSpacing: '0.05em' }}>
                  <th className="bg-transparent pb-3">{t('formations.name', 'Nombre')}</th>
                  <th className="bg-transparent pb-3">{t('formations.scheduled', 'Fecha Programada')}</th>
                  <th className="bg-transparent pb-3">{t('formations.checkin', 'Entrada')}</th>
                  <th className="bg-transparent pb-3">{t('formations.checkout', 'Salida')}</th>
                  <th className="bg-transparent pb-3">{t('formations.duration', 'Duración')}</th>
                  <th className="bg-transparent pb-3">{t('formations.signature', 'Firma Digital')}</th>
                  <th className="bg-transparent pb-3 text-end"></th>
                </tr>
              </thead>
              <tbody>
                {formations.map((att) => {
                  const isSigned = Boolean(att.signature);
                  return (
                    <tr key={att.id} className="align-middle">
                      <td className="fw-bold text-dark">{att.formation?.name || "Formación"}</td>
                      <td className="small text-secondary">{formatDate(att.formation?.formationDate)}</td>
                      <td className="small text-secondary">{formatDate(att.checkInDate)}</td>
                      <td className="small text-secondary">{formatDate(att.checkOutDate)}</td>
                      <td>
                        <span className="ba-badge ba-badge-inactive fw-bold px-3 py-1 text-dark" style={{ color: '#1e293b' }}>
                          {calculateDuration(att.checkInDate, att.checkOutDate)}
                        </span>
                      </td>
                      <td>
                        {isSigned ? (
                          <Badge color="success" pill className="d-inline-flex align-items-center justify-content-center gap-1 px-3 py-2 fw-semibold text-wrap text-xs" style={{ minWidth: '90px' }}>
                            <FaCheckCircle /> {t('profile.signed', 'Firmado')}
                          </Badge>
                        ) : (
                          <Badge color="warning" pill className="d-inline-flex align-items-center justify-content-center gap-1 px-3 py-2 fw-semibold text-wrap text-xs" style={{ minWidth: '90px' }}>
                            <FaExclamationTriangle /> {t('profile.pendingSignature', 'Pendiente')}
                          </Badge>
                        )}
                      </td>
                      <td className="text-end">
                        {isSigned && (
                          <Button size="sm" outline color="secondary" className="ba-action-btn-sm d-inline-flex align-items-center gap-1" onClick={() => handleDownloadCertificate(att.id)} title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}>
                            <FaFilePdf className="text-danger" /> PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* 2. VISTA MÓVIL / TABLET (Tarjetas adaptadas idénticas al Audit) */}
          <div className="lg:hidden flex flex-col gap-4 mt-2">
            {formations.map((att) => {
              const isSigned = Boolean(att.signature);
              return (
                <div key={att.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
                  
                  {/* Cabecera: Fecha, Título y Badge */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        {formatDate(att.formation?.formationDate) || "SIN FECHA"}
                      </span>
                      <h3 className="font-bold text-slate-800 m-0 text-base mt-0.5">
                        {att.formation?.name || "Formación"}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {isSigned ? (
                        <Badge color="success" pill className="px-3 py-1.5 fw-semibold text-xs d-inline-flex align-items-center gap-1">
                          <FaCheckCircle /> {t('profile.signed', 'Firmado')}
                        </Badge>
                      ) : (
                        <Badge color="warning" pill className="px-3 py-1.5 fw-semibold text-xs d-inline-flex align-items-center gap-1">
                          <FaExclamationTriangle /> {t('profile.pendingSignature', 'Pendiente')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo: Detalles de Entrada, Salida y Duración */}
                  <div className="text-xs text-slate-600 bg-white/40 rounded-xl p-3 border border-white/50 shadow-inner flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{t('formations.checkin', 'Entrada')}:</span>
                      <span>{formatDate(att.checkInDate) || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{t('formations.checkout', 'Salida')}:</span>
                      <span>{formatDate(att.checkOutDate) || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/60">
                      <span className="font-semibold text-slate-700">{t('formations.duration', 'Duración')}:</span>
                      <span className="font-bold text-slate-800">{calculateDuration(att.checkInDate, att.checkOutDate)}</span>
                    </div>
                  </div>

                  {/* Pie de tarjeta: Botón PDF (Solo si está firmado) */}
                  {isSigned && (
                    <div className="flex items-center justify-end border-t border-slate-200/50 pt-3">
                      <Button 
                        size="sm" 
                        outline 
                        color="secondary" 
                        className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-semibold shadow-sm hover:-translate-y-0.5 transition-transform"
                        onClick={() => handleDownloadCertificate(att.id)}
                      >
                        <FaFilePdf className="text-danger" /> {t('profile.downloadCertificate', 'Descargar PDF')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}