import React, { useState, useEffect } from 'react';
import { Table, Badge } from 'reactstrap';
import { FaShieldAlt, FaSearch, FaDownload } from 'react-icons/fa';
import tokenService from '../../services/token.service';
import { TableGhostLoader } from '../../components/GhostLoader';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import { useWebSocket } from '../../context/WebSocketProvider';

export default function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const toast = useToast();
  const { stompClient, isConnected } = useWebSocket();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let auditSub = null;
    if (isConnected && stompClient) {
      auditSub = stompClient.subscribe('/topic/audit', () => {
        fetchLogs();
      });
    }

    return () => {
      if (auditSub) {
        auditSub.unsubscribe();
      }
    };
  }, [isConnected, stompClient, toast]);

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
    if (action.includes('SECURITY_ANOMALY')) return 'danger';
    if (action.includes('FAILED')) return 'warning';
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

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch('/api/v1/exports/audit/pdf', {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(t('common.exportSuccess', 'Informe descargado con éxito'));
      } else {
        toast.error(t('common.exportError', 'Error al generar la descarga del informe'));
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('common.networkError', 'Error de conexión con el servidor'));
    }
  };

  const EXACT_MATCHES = {
    'User successfully checked in': ['audit.details.checkinSuccess', 'Usuario fichó entrada correctamente'],
    'User successfully checked out with signature': ['audit.details.checkoutSuccess', 'Usuario fichó salida correctamente con firma'],
    'User logged in successfully': ['audit.details.loginSuccess', 'Usuario inició sesión correctamente'],
    'User logged in successfully using 2FA': ['audit.details.loginSuccess2FA', 'Usuario inició sesión correctamente usando 2FA'],
    'User changed their password': ['audit.details.passwordChange', 'El usuario cambió su contraseña'],
    'User enabled Two-Factor Authentication': ['audit.details.2faEnable', 'Usuario habilitó la autenticación en dos pasos'],
    'User disabled Two-Factor Authentication': ['audit.details.2faDisable', 'Usuario deshabilitó la autenticación en dos pasos'],
    'Database backup triggered': ['audit.details.dbBackup', 'Se inició copia de seguridad de la base de datos'],
    'User saved/updated': ['audit.details.userSavedNoName', 'Usuario guardado/actualizado'],
    'Formation created/updated': ['audit.details.formationSavedNoName', 'Formación guardada/actualizada']
  };

  const PREFIX_MATCHES = [
    { prefix: 'Data exported via method: ', key: 'audit.details.dataExported', defaultText: 'Datos exportados mediante método: {{method}}', paramName: 'method' },
    { prefix: 'User deleted: ID ', key: 'audit.details.userDeleted', defaultText: 'Usuario eliminado: ID {{id}}', paramName: 'id' },
    { prefix: 'User saved/updated: ', key: 'audit.details.userSaved', defaultText: 'Usuario guardado/actualizado: {{user}}', paramName: 'user' },
    { prefix: 'Formation created/updated: ', key: 'audit.details.formationSaved', defaultText: 'Formación guardada/actualizada: {{form}}', paramName: 'form' },
    { prefix: 'Formation deleted: ID ', key: 'audit.details.formationDeleted', defaultText: 'Formación eliminada: ID {{id}}', paramName: 'id' },
    { prefix: 'Failed login attempt for user: ', key: 'audit.details.failedLogin', defaultText: 'Intento de login fallido para el usuario: {{user}}', paramName: 'user' }
  ];

  const formatDetails = (details) => {
    if (!details) return '';
    
    if (EXACT_MATCHES[details]) {
      const [key, fallback] = EXACT_MATCHES[details];
      return t(key, fallback);
    }

    for (const { prefix, key, defaultText, paramName } of PREFIX_MATCHES) {
      if (details.startsWith(prefix)) {
        const paramValue = details.replace(prefix, '');
        return t(key, defaultText, { [paramName]: paramValue });
      }
    }
    
    return details;
  };

  return (
    <div className="ba-container">
      <div className="ba-card">
        <div className="ba-card-header flex-wrap gap-3 d-flex justify-content-between align-items-center">
          <h2>
            <FaShieldAlt style={{ color: "var(--ba-primary)" }} className="me-2" />
            {t('audit.title', 'Registro de Auditoría')}
          </h2>
          <div className="d-flex gap-2">
            <button className="btn ba-btn-primary d-flex align-items-center gap-2" onClick={handleDownloadCsv}>
              <FaDownload /> {t('audit.exportCSV', 'Exportar a CSV')}
            </button>
            <button className="btn ba-btn-secondary d-flex align-items-center gap-2" onClick={handleDownloadPdf}>
              <FaDownload /> {t('audit.exportPDF', 'Exportar a PDF')}
            </button>
          </div>
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
          <Table responsive hover className="ba-table align-middle" style={{ tableLayout: 'fixed', minWidth: '800px', width: '100%', wordBreak: 'break-word' }}>
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
                <tr key={log.id} className={log.action === 'SECURITY_ANOMALY' ? 'table-danger border-danger' : ''}>
                  <td className={`small fw-medium ${log.action === 'SECURITY_ANOMALY' ? 'text-danger fw-bold' : 'text-muted'}`}>
                    {moment(log.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                  </td>
                  <td>
                    <Badge color={getActionColor(log.action)} pill className="px-3 py-2 fw-semibold text-wrap" style={{ wordBreak: 'break-all', minWidth: '100px' }}>
                      {t(`audit.actions.${log.action}`, log.action)}
                    </Badge>
                  </td>
                  <td className="fw-bold text-dark">{log.username}</td>
                  <td className="text-muted small">{formatDetails(log.details)}</td>
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
