import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import { FaShieldAlt, FaDownload, FaCheckCircle, FaExclamationTriangle, FaLock, FaSpinner } from 'react-icons/fa';
import { TableGhostLoader } from '../../components/GhostLoader';
import GlassSearchBar from '../../components/GlassSearchBar';
import GlassDropdown from '../../components/GlassDropdown';
import GlassPagination from '../../components/GlassPagination';
import GlassPageHeader from '../../components/GlassPageHeader';
import StatusBadge from '../../components/StatusBadge';
import downloadExportFile from '../../util/downloadExportFile';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ToastProvider';
import { useWebSocket } from '../../context/WebSocketProvider';

const fetcher = (url) => api.get(url).then((res) => (Array.isArray(res.data) ? res.data : []));

dayjs.extend(utc);

const getActionBadgeVariant = (action = '') => {
  if (action.includes('SECURITY_ANOMALY') || action.includes('DELETE')) return 'danger';
  if (action.includes('FAILED')) return 'warning';
  if (action.includes('SAVE') || action.includes('CREATE') || action.includes('UPDATE')) return 'info';
  if (action.includes('SUCCESS') || action.includes('APPROVE')) return 'success';
  if (action.includes('FORMATION') || action.includes('2FA')) return 'primary';
  return 'neutral';
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

const getIntegrityButtonConfig = (result, isVerifying, t) => {
  if (isVerifying) {
    return {
      className: 'bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-100 border-white dark:border-slate-700',
      icon: <FaSpinner className="animate-spin text-[#b3c34c] inline-block" />,
      label: t('audit.verifying', 'Verificando SHA-256...')
    };
  }
  if (result?.valid) {
    return {
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
      icon: <FaCheckCircle className="text-emerald-500" />,
      label: t('audit.integrityVerified', 'Cadena Íntegra')
    };
  }
  if (result && !result.valid) {
    return {
      className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
      icon: <FaExclamationTriangle className="text-rose-500" />,
      label: t('audit.integrityTamperedAlert', 'Cadena Alterada')
    };
  }
  return {
    className: 'bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-100 border-white dark:border-slate-700',
    icon: <FaShieldAlt className="text-[#b3c34c]" />,
    label: t('audit.verifyChain', 'Verificar SHA-256')
  };
};

export default function AuditDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [integrityResult, setIntegrityResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [exportingType, setExportingType] = useState(null); // 'csv' | 'pdf' | null

  // SWR: Carga instantánea desde RAM (0ms) + revalidación en segundo plano
  const { data: logs = [], isLoading, mutate } = useSWR('/audit', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Suscripción WebSocket a eventos de auditoría en tiempo real
  const handleWebSocketMessage = useCallback((message) => {
    try {
      const newLog = JSON.parse(message.body);
      mutate((prevLogs) => {
        const current = Array.isArray(prevLogs) ? prevLogs : [];
        if (current.some(l => l.id === newLog.id)) return current;
        return [newLog, ...current];
      }, false);
      if (newLog.action === 'SECURITY_ANOMALY') {
        toast.error(`${t('audit.anomalyDetected', 'Anomalía de seguridad detectada')}: ${newLog.username} (${newLog.details})`);
      }
    } catch (e) {
      console.error("Error processing websocket audit message", e);
    }
  }, [t, toast, mutate]);

  const { client, connected } = useWebSocket();

  useEffect(() => {
    if (!client || !connected) return;
    const subscription = client.subscribe('/topic/audit', handleWebSocketMessage);
    return () => {
      subscription.unsubscribe();
    };
  }, [client, connected, handleWebSocketMessage]);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/audit/verify-integrity');
      setIntegrityResult(res.data);
      if (res.data?.valid) {
        toast.success(t('audit.integritySuccess', 'La cadena criptográfica SHA-256 es 100% íntegra y no ha sido manipulada.'));
      } else {
        toast.error(t('audit.integrityError', 'ALERTA: Se ha detectado una alteración o salto en la cadena de bloques del log de auditoría.'));
      }
    } catch (err) {
      console.error("Error verifying integrity", err);
      toast.error(t('audit.integrityCheckFailed', 'Error al verificar la integridad criptográfica.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadCsv = async () => {
    setExportingType('csv');
    try {
      await downloadExportFile('audit/csv', 'audit_logs.csv', toast, t);
    } catch (err) {
      console.error("Error exporting audit csv", err);
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadPdf = async () => {
    setExportingType('pdf');
    try {
      await downloadExportFile('audit/pdf', 'audit_logs.pdf', toast, t);
    } catch (err) {
      console.error("Error exporting audit pdf", err);
    } finally {
      setExportingType(null);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => matchesAuditSearch(log, searchTerm))
      .filter((log) => matchesAuditCategory(log.action, categoryFilter));
  }, [logs, searchTerm, categoryFilter]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, pageSize]);

  // Paginación
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const integrityBtn = getIntegrityButtonConfig(integrityResult, verifying, t);

  return (
    <div className="da-container">
      <div className="da-card">
        {/* Cabecera con botones de exportación y verificación */}
        <GlassPageHeader
          icon={FaShieldAlt}
          title={
            <div className="flex items-center gap-2">
              <span>{t('audit.title', 'Registro de Auditoría y Seguridad')}</span>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#b3c34c]/20 text-[#73841e] border border-[#b3c34c]/30">
                <FaLock className="text-[10px]" /> SHA-256 Chain
              </span>
            </div>
          }
          subtitle={t('audit.subtitle', 'Trazabilidad en tiempo real de accesos, eventos y acciones del sistema')}
          actions={
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto justify-center">
              <button 
                type="button" 
                className={`inline-flex items-center justify-center px-4 py-2 font-semibold text-xs rounded-full transition border shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto cursor-pointer ${integrityBtn.className}`}
                onClick={handleVerifyIntegrity}
                disabled={verifying}
                title={t('audit.verifyChainTooltip', 'Verificar integridad criptográfica SHA-256 de todos los registros de auditoría')}
              >
                {integrityBtn.icon}
                <span>{integrityBtn.label}</span>
              </button>
              <button 
                type="button" 
                disabled={!!exportingType}
                className="inline-flex items-center justify-center px-4 py-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-full transition border border-white dark:border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer" 
                onClick={handleDownloadCsv}
              >
                {exportingType === 'csv' ? <FaSpinner className="animate-spin text-[#b3c34c]" /> : <FaDownload className="text-[#b3c34c]" />} 
                <span>{t('audit.exportCSV', 'Exportar a CSV')}</span>
              </button>
              <button 
                type="button" 
                disabled={!!exportingType}
                className="inline-flex items-center justify-center px-4 py-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-full transition border border-white dark:border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl active:scale-95 hover:-translate-y-0.5 gap-2 w-full sm:w-auto disabled:opacity-50 cursor-pointer" 
                onClick={handleDownloadPdf}
              >
                {exportingType === 'pdf' ? <FaSpinner className="animate-spin text-[#b3c34c]" /> : <FaDownload className="text-[#b3c34c]" />} 
                <span>{t('audit.exportPDF', 'Exportar a PDF')}</span>
              </button>
            </div>
          }
        />

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
                { value: 'ALL', label: t('audit.categories.all', 'Todos los eventos') },
                { value: 'SECURITY', label: t('audit.categories.security', 'Seguridad y Anomalías') },
                { value: 'AUTH', label: t('audit.categories.auth', 'Autenticación y 2FA') },
                { value: 'CHECKIN', label: t('audit.categories.checkin', 'Fichajes (Entrada/Salida)') },
                { value: 'CRUD', label: t('audit.categories.crud', 'Gestión de Registros (CRUD)') }
              ]}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              placeholder={t('audit.categories.filterPlaceholder', 'Filtrar por categoría')}
              className="w-full"
            />
          </div>
        </div>

        {isLoading && logs.length === 0 ? (
          <TableGhostLoader rows={8} columns={5} />
        ) : (
          <>
            {/* 1. VISTA ESCRITORIO (lg y superior) */}
            <div className="hidden lg:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
              <table className="w-full text-left border-collapse align-middle">
                <thead>
                  <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-5 text-slate-500 dark:text-slate-400" style={{ width: '15%' }}>{t('audit.columns.timestamp', 'Fecha/Hora')}</th>
                    <th className="py-4 px-5" style={{ width: '18%' }}>{t('audit.columns.action', 'Acción')}</th>
                    <th className="py-4 px-5" style={{ width: '15%' }}>{t('audit.columns.user', 'Usuario')}</th>
                    <th className="py-4 px-5" style={{ width: '38%' }}>{t('audit.columns.details', 'Detalles')}</th>
                    <th className="py-4 px-5" style={{ width: '14%' }}>{t('audit.columns.ip', 'IP')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                      <td className="py-3 px-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {dayjs.utc(log.timestamp).local().format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge
                          variant={getActionBadgeVariant(log.action)}
                          pulse={log.action.includes('SECURITY_ANOMALY')}
                        >
                          {t(`audit.actions.${log.action}`, log.action)}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-800 dark:text-slate-100">{log.username}</td>
                      <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-xs">{formatDetails(log.action, log.details, t)}</td>
                      <td className="py-3 px-5"><code className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{log.ipAddress || 'N/A'}</code></td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-slate-500">
                        {t('audit.noRecords', 'No se encontraron registros de auditoría.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. VISTA MÓVIL / TABLET */}
            <div className="lg:hidden flex flex-col gap-3 mt-2">
              {filteredLogs.length > 0 ? (
                paginatedLogs.map(log => (
                  <div key={log.id} className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-[20px] p-4 sm:p-5 border ${log.action === 'SECURITY_ANOMALY' ? 'border-red-400 bg-red-50/70 dark:bg-rose-950/40' : 'border-white/40 dark:border-white/10'} flex flex-col gap-3`}>
                    <div className="flex flex-col items-start gap-1.5 w-full">
                      <div className="min-w-0 w-full">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block truncate">
                          {dayjs.utc(log.timestamp).local().format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-sm sm:text-base mt-0.5 break-words">{log.username || 'Sistema'}</h3>
                      </div>
                      <div>
                        <StatusBadge
                          variant={getActionBadgeVariant(log.action)}
                          pulse={log.action.includes('SECURITY_ANOMALY')}
                        >
                          {t(`audit.actions.${log.action}`, log.action)}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border border-white/50 dark:border-white/10 shadow-inner break-words">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">{t('audit.columns.details', 'Detalles')}:</span>
                      {formatDetails(log.action, log.details, t)}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2.5 text-xs text-slate-500 dark:text-slate-400 gap-1">
                      <span className="font-semibold">{t('audit.columns.ip', 'IP Origen')}:</span>
                      <code className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded break-all max-w-full inline-block">{log.ipAddress || 'N/A'}</code>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 bg-white/40 dark:bg-slate-800/40 rounded-2xl">
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