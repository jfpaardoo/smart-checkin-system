import React, { useState, useEffect } from 'react';
import { Table, Badge } from 'reactstrap';
import { FaShieldAlt, FaSearch, FaDownload } from 'react-icons/fa';
import tokenService from '../../services/token.service';
import { TableGhostLoader } from '../../components/GhostLoader';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

export default function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/v1/audit', {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('SAVE')) return 'primary';
    if (action.includes('DELETE')) return 'danger';
    if (action.includes('SUCCESS')) return 'success';
    return 'secondary';
  };

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadCsv = async () => {
    try {
      const response = await fetch('/api/v1/audit/csv', {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error("Error downloading CSV", error);
    }
  };

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header flex-wrap gap-3 d-flex justify-content-between align-items-center">
          <h2>
            <FaShieldAlt style={{ color: "var(--ba-primary)" }} className="me-2" />
            {t('audit.title', 'Registro de Auditoría')}
          </h2>
          <button className="btn ba-btn-primary d-flex align-items-center gap-2" onClick={handleDownloadCsv}>
            <FaDownload /> {t('audit.exportCSV', 'Exportar a CSV')}
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-muted">{t('audit.subtitle', 'Trazabilidad de acciones del sistema')}</p>
        </div>

        <div className="mb-4 position-relative">
          <FaSearch className="position-absolute ba-search-bar-icon" />
          <input
            type="text"
            className="form-control ba-glass-search-input w-100"
            placeholder={t('audit.searchPlaceholder', 'Buscar por acción, usuario o detalles...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <TableGhostLoader rows={8} columns={5} />
        ) : (
          <Table hover className="ba-table" style={{ tableLayout: 'fixed', width: '100%', wordBreak: 'break-word' }}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>{t('audit.columns.date', 'Fecha y Hora')}</th>
                <th style={{ width: '15%' }}>{t('audit.columns.action', 'Acción')}</th>
                <th style={{ width: '15%' }}>{t('audit.columns.user', 'Usuario')}</th>
                <th style={{ width: '30%' }}>{t('audit.columns.details', 'Detalles')}</th>
                <th style={{ width: '25%' }}>{t('audit.columns.ip', 'IP Origen')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="text-muted small fw-medium">
                    {moment(log.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                  </td>
                  <td>
                    <Badge color={getActionColor(log.action)} pill className="px-3 py-2 fw-semibold">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="fw-bold text-dark">{log.username}</td>
                  <td className="text-muted small">{log.details}</td>
                  <td><code className="text-secondary bg-light px-2 py-1 rounded">{log.ipAddress || 'N/A'}</code></td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    {t('audit.noRecords', 'No se encontraron registros de auditoría.')}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
