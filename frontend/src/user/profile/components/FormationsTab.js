import React from "react";
import { Row, Col, Table, Badge, Button } from "reactstrap";
import { FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaAward, FaClock, FaFilePdf } from "react-icons/fa";
import { TableGhostLoader } from "../../../components/GhostLoader";
import api from "../../../services/api";
import { calculateDuration, formatDate } from "../../../utils/dateUtils";

const handleDownloadCertificate = async (attendanceId) => {
  try {
    const res = await api.get(`/certificates/attendance/${attendanceId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${attendanceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error("Error downloading PDF", error);
  }
};

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

  return (
    <div className="p-1 p-md-3">
      {/* Summary Analytics Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <div className="p-3 da-glass-panel d-flex align-items-center gap-3">
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
          <div className="p-3 da-glass-panel d-flex align-items-center gap-3">
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
          <div className="p-3 da-glass-panel d-flex align-items-center gap-3">
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
          <FaGraduationCap size={48} className="d-block mx-auto mb-3 opacity-50" />
          <h6>{t('profile.noFormationsYet', 'No tienes ninguna formación registrada todavía.')}</h6>
        </div>
      ) : (
        <>
          {/* 1. VISTA ESCRITORIO (Tabla clásica) */}
          <div className="hidden lg:block w-100 overflow-x-auto rounded-3 shadow-sm" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
            <Table responsive borderless align="middle" className="da-table mb-0" style={{ minWidth: '650px' }}>
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
                        <span className="da-badge da-badge-inactive fw-bold px-3 py-1 text-dark" style={{ color: '#1e293b' }}>
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
                          <Button size="sm" outline color="secondary" className="da-action-btn-sm d-inline-flex align-items-center gap-1" onClick={() => handleDownloadCertificate(att.id)} title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}>
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

          {/* 2. VISTA MÓVIL / TABLET (Tarjetas adaptadas) */}
          <div className="lg:hidden flex flex-col gap-3.5 mt-2">
            {formations.map((att) => {
              const isSigned = Boolean(att.signature);
              return (
                <div key={att.id} className="bg-white/80 backdrop-blur-md shadow-xs rounded-2xl p-4 border border-white/60 flex flex-col gap-2.5">
                  
                  {/* Cabecera: Fecha y Badge */}
                  <div className="flex justify-between items-center gap-2 border-b border-slate-200/50 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 tracking-wide">
                      {formatDate(att.formation?.formationDate) || "SIN FECHA"}
                    </span>
                    <div className="flex-shrink-0">
                      {isSigned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <FaCheckCircle className="text-[10px]" /> {t('profile.signed', 'Firmado')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <FaExclamationTriangle className="text-[10px]" /> {t('profile.pendingSignature', 'Pendiente')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título de la Formación */}
                  <h3 className="font-bold text-slate-800 m-0 text-sm sm:text-base leading-snug break-words">
                    {att.formation?.name || "Formación"}
                  </h3>

                  {/* Cuerpo: Detalles de Entrada, Salida y Duración */}
                  <div className="text-xs text-slate-600 bg-slate-50/70 rounded-xl p-2.5 border border-slate-200/50 flex flex-col gap-1.5">
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5">
                      <span className="font-semibold text-slate-500 text-[11px]">{t('formations.checkin', 'Entrada')}:</span>
                      <span className="font-medium text-slate-700 text-xs">{formatDate(att.checkInDate) || '-'}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5">
                      <span className="font-semibold text-slate-500 text-[11px]">{t('formations.checkout', 'Salida')}:</span>
                      <span className="font-medium text-slate-700 text-xs">{formatDate(att.checkOutDate) || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mt-0.5 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-600 text-[11px]">{t('formations.duration', 'Duración')}:</span>
                      <span className="font-bold text-slate-900 text-xs">{calculateDuration(att.checkInDate, att.checkOutDate)}</span>
                    </div>
                  </div>

                  {/* Pie de tarjeta: Botón PDF (Solo si está firmado) */}
                  {isSigned && (
                    <div className="flex items-center justify-end pt-1">
                      <button 
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300/80 shadow-xs hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => handleDownloadCertificate(att.id)}
                      >
                        <FaFilePdf className="text-red-500 text-sm" /> 
                        <span>{t('profile.downloadCertificate', 'Descargar Certificado PDF')}</span>
                      </button>
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