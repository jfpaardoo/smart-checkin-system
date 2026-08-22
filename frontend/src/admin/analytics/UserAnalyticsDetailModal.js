import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faGraduationCap,
  faClock,
  faTimes,
  faCheckCircle,
  faSpinner,
  faFileExcel,
  faFilePdf,
  faFileCsv,
  faBuilding,
  faMapMarkerAlt,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { formatDuration } from '../../util/dateTimeUtil';
import { useToast } from '../../components/ToastProvider';
import downloadExportFile from '../../util/downloadExportFile';
import GlassModal from '../../components/GlassModal';

export default function UserAnalyticsDetailModal({ isOpen, toggle, userAnalytics }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [isExporting, setIsExporting] = useState(false);

    if (!userAnalytics) return null;

    const handleExportDossier = async (format) => {
        if (isExporting || !userAnalytics.userId) return;
        setIsExporting(true);
        try {
            const cleanUser = (userAnalytics.username || 'empleado').replace(/\W/g, '_');
            const filename = `expediente_formativo_${cleanUser}.${format === 'excel' ? 'xlsx' : format}`;
            await downloadExportFile(`user/${userAnalytics.userId}/${format}`, filename, toast, t);
        } finally {
            setIsExporting(false);
        }
    };

    const renderSignatureStatus = (f) => {
        if (f.hasSignature) {
            return (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheckCircle} /> {t('analytics.signed', 'Firmado')}
                </span>
            );
        }
        if (f.status === 'IN_PROGRESS') {
            return (
                <span className="text-amber-500 font-bold flex items-center gap-1">
                    <FontAwesomeIcon icon={faSpinner} spin /> {t('analytics.inProgress', 'En Curso')}
                </span>
            );
        }
        return <span className="text-slate-400 font-medium">{t('analytics.pending', 'Pendiente / No Asistió')}</span>;
    };

    const modalTitle = (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 pe-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#b3c34c]/25 text-[#73841e] text-lg flex items-center justify-center shadow-xs">
                    <FontAwesomeIcon icon={faUser} />
                </div>
                <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base sm:text-lg">
                        {userAnalytics.firstName} {userAnalytics.lastName} 
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono ms-2">({userAnalytics.personalCode || userAnalytics.username})</span>
                    </h5>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {userAnalytics.companyName && (
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faBuilding} className="text-[#8a9b1c]" /> {userAnalytics.companyName}
                            </span>
                        )}
                        {userAnalytics.locator && (
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#8a9b1c]" /> Sede {userAnalytics.locator}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faBriefcase} className="text-[#8a9b1c]" /> {userAnalytics.authority || 'EMPLOYEE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Dossier Export Action Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                    {t('analytics.exportDossier', 'Expediente:')}
                </span>
                <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleExportDossier('excel')}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Descargar Expediente Formativo en Excel"
                >
                    <FontAwesomeIcon icon={isExporting ? faSpinner : faFileExcel} spin={isExporting} className="text-emerald-600" />
                    <span>Excel</span>
                </button>
                <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleExportDossier('pdf')}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl text-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Descargar Expediente Formativo en PDF"
                >
                    <FontAwesomeIcon icon={isExporting ? faSpinner : faFilePdf} spin={isExporting} className="text-rose-500" />
                    <span>PDF</span>
                </button>
                <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleExportDossier('csv')}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl text-[#3b4707] bg-[#b3c34c]/20 hover:bg-[#b3c34c]/30 dark:text-[#d2db85] border border-[#b3c34c]/40 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Descargar Expediente Formativo en CSV"
                >
                    <FontAwesomeIcon icon={isExporting ? faSpinner : faFileCsv} spin={isExporting} className="text-[#8a9b1c]" />
                    <span>CSV</span>
                </button>
            </div>
        </div>
    );

    return (
        <GlassModal 
            isOpen={isOpen} 
            toggle={toggle} 
            title={modalTitle}
            size="xl"
            footer={
                <button 
                    type="button"
                    onClick={toggle}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-slate-500 dark:text-slate-400" />
                    <span>{t('common.close', 'Cerrar')}</span>
                </button>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Employee KPI Quick Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#b3c34c]/20 text-[#73841e] text-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faGraduationCap} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                {t('analytics.attendanceRate', 'Tasa de Asistencia')}
                            </span>
                            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                {userAnalytics.attendancePercentage !== null ? `${userAnalytics.attendancePercentage}%` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                {t('analytics.timeInFormations', 'Horas en Formación')}
                            </span>
                            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                {formatDuration(userAnalytics.totalFormationMinutes)}
                            </span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 text-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                {t('analytics.formationsCount', 'Cursos Completados')}
                            </span>
                            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                {userAnalytics.formationsAttended || 0} / {userAnalytics.formationsAssigned || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formations List Table */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h6 className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 m-0">
                            <FontAwesomeIcon icon={faGraduationCap} className="text-[#8a9b1c]" />
                            {t('analytics.formationBreakdown', 'Desglose de Formaciones y Horas Asistidas')}
                        </h6>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {userAnalytics.formationDetails ? userAnalytics.formationDetails.length : 0} {t('analytics.records', 'registros')}
                        </span>
                    </div>

                    {userAnalytics.formationDetails && userAnalytics.formationDetails.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto bg-white/50 dark:bg-slate-800/50 shadow-xs">
                            <table className="da-table stacked-mobile align-middle mb-0 w-full" style={{ minWidth: '100%' }}>
                                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                                    <tr>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.formationName', 'Formación')}</th>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.date', 'Fecha')}</th>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.checkIn', 'Entrada')}</th>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.checkOut', 'Salida')}</th>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.duration', 'Tiempo Dedicado')}</th>
                                        <th className="py-2.5 px-3 font-bold">{t('analytics.signature', 'Firma y Estado')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-100">
                                    {userAnalytics.formationDetails.map((f) => (
                                        <tr key={f.formationId} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/60 transition-colors">
                                            <td data-label={t('analytics.formationName', 'Formación')} className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                                                {f.formationName}
                                            </td>
                                            <td data-label={t('analytics.date', 'Fecha')} className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                                {f.formationDate ? dayjs(f.formationDate).format('YYYY-MM-DD HH:mm') : 'N/A'}
                                            </td>
                                            <td data-label={t('analytics.checkIn', 'Entrada')} className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200">
                                                {f.checkInDate ? dayjs(f.checkInDate).format('HH:mm') : '-'}
                                            </td>
                                            <td data-label={t('analytics.checkOut', 'Salida')} className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200">
                                                {f.checkOutDate ? dayjs(f.checkOutDate).format('HH:mm') : '-'}
                                            </td>
                                            <td data-label={t('analytics.duration', 'Tiempo Dedicado')} className="py-2.5 px-3">
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-[#b3c34c]/20 text-[#3b4707] dark:text-[#d2db85]">
                                                    {formatDuration(f.durationMinutes)}
                                                </span>
                                            </td>
                                            <td data-label={t('analytics.signature', 'Firma y Estado')} className="py-2.5 px-3">
                                                {renderSignatureStatus(f)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs">
                            {t('analytics.noFormationsUser', 'No hay formaciones asignadas a este empleado.')}
                        </div>
                    )}
                </div>
            </div>
        </GlassModal>
    );
}
