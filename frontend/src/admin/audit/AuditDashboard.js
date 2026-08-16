import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { Table, Badge } from 'reactstrap';
import { FaShieldAlt, FaDownload } from 'react-icons/fa';
import { TableGhostLoader } from '../../components/GhostLoader';
import GlassSearchBar from '../../components/GlassSearchBar';
import GlassDropdown from '../../components/GlassDropdown';
import GlassPagination from '../../components/GlassPagination';
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
    const parsed = JSON.parse(details);
    return t(`audit.details.${action}`, parsed.message || action, parsed);
  } catch {
    return details;
  }
};

const matchesAuditSearch = (log, query) => {
  if (!query?.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    (log.action || '').toLowerCase().includes(q) ||
    (log.username || '').toLowerCase().includes(q) ||
    (log.details || '').toLowerCase().includes(q) ||
    (log.ipAddress || '').toLowerCase().includes(q)
  );
};

const matchesAuditCategory = (action = '', category = 'ALL') => {
  if (category === 'ALL') return true;
  if (category === 'SECURITY') return action.includes('SECURITY') || action.includes('FAILED');
  if (category === 'AUTH') return action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('2FA');
  if (category === 'CHECKIN') return action.includes('CHECKIN') || action.includes('CHECKOUT');
  if (category === 'CRUD') return action.includes('CREATE') || action.includes('UPDATE') || action.includes('DELETE') || action.includes('APPROVE');
  return true;
};

export default function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionCategory, setActionCategory] = useState('ALL');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { t } = useTranslation();
  const toast = useToast();
  const { stompClient, isConnected } = useWebSocket();

  const fetchLogs = useCallback(() => {
    api.get('/audit')
      .then(response => {
        setLogs(Array.isArray(response.data) ? response.data : []);
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

  // Filtrado de logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      matchesAuditSearch(log, searchTerm) &&
      matchesAuditCategory(log.action, actionCategory)
    );
  }, [logs, searchTerm, actionCategory]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionCategory, pageSize]);

  // Paginación
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div className="da-container">
      <div className="da-card">
        
        {/* Cabecera con botones de exportación */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 border-0">
          <div>
            <h2 className="flex items-center text-2xl font-bold text-slate-800 m-0 text-center sm:text-left gap-2">
              <FaShieldAlt style={{ color: "var(--da-primary)" }} className="shrink-0" />
              {t('audit.title', 'Registro de Auditoría y Seguridad')}
            </h2>
            <p className="text-xs text-slate-500 m-0 mt-0.5 text-center sm:text-left">
              {t('audit.subtitle', 'Trazabilidad en tiempo real de accesos, eventos y acciones del sistema')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto justify-center">
            <button 
              type="button" 
              className="inline-flex items-center justify-center px-4 py-2 bg-white/80 hover:bg-white text-slate-800 font-semibold text-xs rounded-full transition border border-white shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto" 
              onClick={handleDownloadCsv}
            >
              <FaDownload className="text-[#b3c34c]" /> 
              <span>{t('audit.exportCSV', 'Exportar a CSV')}</span>
            </button>
            <button 
              type="button" 
              className="inline-flex items-center justify-center px-4 py-2 bg-white/80 hover:bg-white text-slate-800 font-semibold text-xs rounded-full transition border border-white shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto" 
              onClick={() => handleDownloadPdf(toast, t)}
            >
              <FaDownload className="text-[#b3c34c]" /> 
              <span>{t('audit.exportPDF', 'Exportar a PDF')}</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 items-center relative z-30">
          <div className="sm:col-span-8">
            <GlassSearchBar
              placeholder={t('audit.searchPlaceholder', 'Buscar por acción, usuario, IP o detalles...')}
              onSearch={(q) => setSearchTerm(q)}
            />
          </div>
          <div className="sm:col-span-4">
            <GlassDropdown
              options={[
                { value: 'ALL', label: t('audit.filterAll', 'Todos los eventos') },
                { value: 'SECURITY', label: t('audit.filterSecurity', 'Seguridad y Anomalías') },
                { value: 'AUTH', label: t('audit.filterAuth', 'Inicios de sesión y 2FA') },
                { value: 'CHECKIN', label: t('audit.filterCheckin', 'Fichajes / Check-in') },
                { value: 'CRUD', label: t('audit.filterCrud', 'Modificaciones / Altas / Bajas') }
              ]}
              value={actionCategory}
              onChange={(val) => setActionCategory(val)}
              placeholder={t('audit.filterCategory', 'Filtrar por categoría')}
              className="w-full"
            />
          </div>
        </div>

        {loading ? (
          <TableGhostLoader rows={8} columns={5} />
        ) : (
          <>
            {/* 1. VISTA ESCRITORIO */}
            <div className="hidden lg:block overflow-x-auto pb-2 relative z-10">
              <Table responsive hover className="da-table align-middle" style={{ tableLayout: 'fixed', minWidth: '850px', width: '100%', wordBreak: 'break-word' }}>
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>{t('audit.columns.date', 'Fecha y Hora')}</th>
                    <th style={{ width: '17%' }}>{t('audit.columns.action', 'Acción')}</th>
                    <th style={{ width: '15%' }}>{t('audit.columns.user', 'Usuario')}</th>
                    <th style={{ width: '32%' }}>{t('audit.columns.details', 'Detalles')}</th>
                    <th style={{ width: '20%' }}>{t('audit.columns.ip', 'IP Origen')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map(log => (
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

            {/* 2. VISTA MÓVIL / TABLET */}
            <div className="lg:hidden flex flex-col gap-3 mt-2">
              {filteredLogs.length > 0 ? (
                paginatedLogs.map(log => (
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

            {/* Paginación Liquid Glass */}
            {filteredLogs.length > 0 && (
              <GlassPagination
                currentPage={currentPage}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(s) => setPageSize(s)}
                pageSizeOptions={[10, 15, 25, 50]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}