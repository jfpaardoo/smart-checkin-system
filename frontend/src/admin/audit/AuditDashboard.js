import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Table, Badge } from 'reactstrap';
import { FaShieldAlt, FaSearch, FaDownload } from 'react-icons/fa';
import { TableGhostLoader } from '../../components/GhostLoader';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import { useWebSocket } from '../../context/WebSocketProvider';


dayjs.extend(utc);

const handleDownloadCsv = async () => {
  try {
    const res = await api.get('/audit/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error("Error downloading CSV", error);
  }
};

const handleDownloadPdf = async (toast, t) => {
  try {
    const res = await api.get('/exports/audit/pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success(t('common.exportSuccess', 'Informe descargado con éxito'));
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error(t('common.networkError', 'Error de conexión con el servidor'));
  }
};



const getActionColor = (action) => {
  if (action.includes('SECURITY_ANOMALY')) return 'danger';
  if (action.includes('FAILED')) return 'warning';
  if (action.includes('SAVE') || action.includes('CREATE') || action.includes('UPDATE')) return 'primary';
  if (action.includes('DELETE')) return 'danger';
  if (action.includes('SUCCESS') || action.includes('APPROVE')) return 'success';
  if (action.includes('FORMATION') || action.includes('2FA')) return 'info';
  return 'secondary';
};

const formatDetails = (action, details, t) => {
  if (!details) return t(`audit.details.${action}`, action);
  
  try {
    // Intentamos parsear si los detalles vienen en formato estructurado (nuevo backend JSON)
    const parsed = JSON.parse(details);
    // Delegamos en i18next la interpolación. La clave base es audit.details.ACCION. 
    // Si no existe la traducción, usamos un fallback al mensaje que pudiera venir en el JSON.
    return t(`audit.details.${action}`, parsed.message || action, parsed);
  } catch {
    // Return raw string if JSON parsing fails for legacy logs
    return details;
  }
};

export default function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const toast = useToast();
  const { stompClient, isConnected } = useWebSocket();

  const fetchLogs = useCallback(() => {
    api.get('/audit')
      .then(response => {
        setLogs(response.data);
      })
      .catch(error => {
        console.error("Error fetching audit logs", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
  }, [isConnected, stompClient, fetchLogs, toast]);

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );




  return (
    <div className="da-container">
      <div className="da-card">
        
        {/* Cabecera con botones de exportación en Liquid Glass blanco y brillante */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3 border-0">
          <h2 className="flex items-center text-2xl font-bold text-slate-800 m-0 text-center sm:text-left">
            <FaShieldAlt style={{ color: "var(--da-primary)" }} className="me-2 shrink-0" />
            {t('audit.title', 'Registro de Auditoría')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto justify-center">
            <button 
              type="button" 
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white/80 hover:bg-white text-slate-800 font-semibold text-sm rounded-full transition border border-white shadow-[0_8px_25px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto" 
              onClick={handleDownloadCsv}
            >
              <FaDownload className="text-[#b3c34c]" /> 
              <span>{t('audit.exportCSV', 'Exportar a CSV')}</span>
            </button>
            <button 
              type="button" 
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white/80 hover:bg-white text-slate-800 font-semibold text-sm rounded-full transition border border-white shadow-[0_8px_25px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto" 
              onClick={() => handleDownloadPdf(toast, t)}
            >
              <FaDownload className="text-[#b3c34c]" /> 
              <span>{t('audit.exportPDF', 'Exportar a PDF')}</span>
            </button>
          </div>
        </div>
        
        {/* Subtítulo centrado en móvil y alineado a la izquierda en escritorio */}
        <div className="mb-4 text-center sm:text-left">
          <p className="text-muted m-0">{t('audit.subtitle', 'Trazabilidad de acciones del sistema')}</p>
        </div>

        {/* Buscador Glassmorphism */}
        <div className="mb-4 position-relative">
          <FaSearch className="position-absolute da-search-bar-icon" />
          <input
            id="auditSearchInput"
            name="auditSearchInput"
            type="text"
            className="form-control da-glass-search-input w-100"
            placeholder={t('audit.searchPlaceholder', 'Buscar por acción, usuario o detalles...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <TableGhostLoader rows={8} columns={5} />
        ) : (
          <>
            {/* 1. VISTA ESCRITORIO (Tabla clásica flotante) */}
            <div className="hidden lg:block overflow-x-auto pb-4">
              <Table responsive hover className="da-table align-middle" style={{ tableLayout: 'fixed', minWidth: '850px', width: '100%', wordBreak: 'break-word' }}>
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
                        {dayjs.utc(log.timestamp).local().format('DD/MM/YYYY HH:mm:ss')}
                      </td>
                      <td>
                        <Badge color={getActionColor(log.action)} pill className="px-3 py-2 fw-semibold text-wrap" style={{ wordBreak: 'break-all', minWidth: '100px' }}>
                          {t(`audit.actions.${log.action}`, log.action)}
                        </Badge>
                      </td>
                      <td className="fw-bold text-dark">{log.username}</td>
                      <td className="text-muted small">{formatDetails(log.action, log.details, t)}</td>
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
            </div>

            {/* 2. VISTA MÓVIL / TABLET (Tarjetas con efecto cristal adaptadas) */}
            <div className="lg:hidden flex flex-col gap-4 mt-2">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <div key={log.id} className={`bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border ${log.action === 'SECURITY_ANOMALY' ? 'border-red-400 bg-red-50/70' : 'border-white/40'} flex flex-col gap-3`}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          {dayjs.utc(log.timestamp).local().format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                        <h3 className="font-bold text-slate-800 m-0 text-base mt-0.5">{log.username || 'Sistema'}</h3>
                      </div>
                      <div>
                        <Badge color={getActionColor(log.action)} pill className="px-3 py-1.5 fw-semibold text-xs">
                          {t(`audit.actions.${log.action}`, log.action)}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-white/40 rounded-xl p-3 border border-white/50 shadow-inner">
                      <span className="font-semibold text-slate-700 block mb-1">{t('audit.columns.details', 'Detalles')}:</span>
                      {formatDetails(log.action, log.details, t)}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-3 text-xs text-slate-500">
                      <span>{t('audit.columns.ip', 'IP Origen')}:</span>
                      <code className="text-secondary bg-light px-2 py-0.5 rounded">{log.ipAddress || 'N/A'}</code>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 bg-white/40 rounded-2xl">
                  {t('audit.noRecords', 'No se encontraron registros de auditoría.')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}