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
    <div className="p-3">
      {/* Summary Analytics Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-primary">
              <FaGraduationCap size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.totalFormations', 'Total Registradas')}</div>
              <div className="fs-4 fw-bold text-dark">{formations.length}</div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-success">
              <FaAward size={24} />
            </div>
            <div>
              <div className="text-muted small fw-semibold">{t('profile.completedSigned', 'Completadas y Firmadas')}</div>
              <div className="fs-4 fw-bold text-dark">{completedFormations}</div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 ba-glass-panel d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-light text-warning">
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
        <div className="table-responsive">
          <Table responsive hover align="middle" className="ba-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>{t('formations.name', 'Formación')}</th>
                <th>{t('formations.scheduled', 'Fecha Programada')}</th>
                <th>{t('formations.checkin', 'Entrada')}</th>
                <th>{t('formations.checkout', 'Salida')}</th>
                <th>{t('formations.duration', 'Duración')}</th>
                <th>{t('formations.signature', 'Firma Digital')}</th>
              </tr>
            </thead>
            <tbody>
              {formations.map((att) => {
                const isSigned = Boolean(att.signature);
                return (
                  <tr key={att.id}>
                    <td className="fw-bold text-dark">{att.formation?.name || "Formación"}</td>
                    <td className="small">{formatDate(att.formation?.formationDate)}</td>
                    <td className="small">{formatDate(att.checkInDate)}</td>
                    <td className="small">{formatDate(att.checkOutDate)}</td>
                    <td>
                      <span className="ba-badge ba-badge-inactive fw-bold px-3 py-1 text-dark" style={{ color: '#1e293b' }}>
                        {calculateDuration(att.checkInDate, att.checkOutDate)}
                      </span>
                    </td>
                    <td>
                      {isSigned ? (
                        <Badge color="success" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                          <FaCheckCircle /> {t('profile.signed', 'Firmado')}
                        </Badge>
                      ) : (
                        <Badge color="warning" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                          <FaExclamationTriangle /> {t('profile.pendingSignature', 'Pendiente')}
                        </Badge>
                      )}
                    </td>
                    <td className="text-end">
                      {isSigned && (
                        <Button 
                          size="sm" 
                          outline 
                          color="secondary" 
                          className="ba-action-btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => handleDownloadCertificate(att.id)}
                          title={t('profile.downloadCertificate', 'Descargar Certificado PDF')}
                        >
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
      )}
    </div>
  );
}
