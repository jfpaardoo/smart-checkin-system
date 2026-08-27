import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faRightFromBracket, faFilePdf, faLocationDot, faChalkboardUser, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import StatusBadge from '../../../components/StatusBadge';
import GlassButton from '../../../components/GlassButton';
import CalendarSyncDropdown from '../../../components/CalendarSyncDropdown';
import { formatDate } from '../../../utils/dateUtils';
import {
  getThemeClasses,
  getFormationIcon,
  calculateRelativeTimeBadge
} from './userFormationHelpers';

export default function MobileUserFormationCard({
  att,
  t,
  onOpenDetails,
  onCheckout,
  onDownloadCertificate,
  downloadingCertId
}) {
  const f = att.formation;
  const isClosed = Boolean(f.isClosed || f.status === 'CLOSED');
  const isCompleted = !!att.checkOutDate;
  const isInProgress = !!att.checkInDate && !att.checkOutDate;
  const isClosedNonAttended = !att.checkInDate && !att.checkOutDate && isClosed;
  const isScheduled = !att.checkInDate && !att.checkOutDate && !isClosed;
  const themeClasses = getThemeClasses(isInProgress, isCompleted || isClosedNonAttended);
  const icon = getFormationIcon(isCompleted || isClosedNonAttended, isScheduled);
  const relativeBadge = isScheduled ? calculateRelativeTimeBadge(f.formationDate, t) : null;

  return (
    <div 
      className={`backdrop-blur-md shadow-xs rounded-2xl p-4 border flex flex-col gap-3 transition-all ${
        isInProgress
          ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/40'
          : 'bg-white/70 dark:bg-slate-800/70 border-white/60 dark:border-white/10'
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2.5 rounded-2xl shadow-xs flex-shrink-0 ${themeClasses}`}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base leading-tight break-words">
              {f.name}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              <span>{formatDate(f.formationDate)}</span>
              {relativeBadge && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  {relativeBadge.text}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          {isCompleted && <StatusBadge variant="success">{t('dashboard.statusCompleted', 'Completada')}</StatusBadge>}
          {isInProgress && <StatusBadge variant="warning" pulse>{t('dashboard.statusInProgress', 'En curso')}</StatusBadge>}
          {isScheduled && <StatusBadge variant="info">{t('dashboard.statusScheduled', 'Programada')}</StatusBadge>}
          {isClosedNonAttended && <StatusBadge variant="neutral">{t('dashboard.statusClosedNonAttended', 'Finalizada')}</StatusBadge>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-white/50 dark:border-white/5">
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={faLocationDot} className="text-rose-500" />
          <span>{f.location || 'BA VILLAFRANCA'}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={faChalkboardUser} className="text-sky-500" />
          <span>{f.trainer || 'VICTOR PARDO'}</span>
        </span>
      </div>

      {isScheduled && (
        <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-300 bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
          <FontAwesomeIcon icon={faCircleInfo} className="shrink-0" />
          <span>{t('dashboard.scheduledTip', 'El fichaje estará disponible al escanear el QR el día del evento.')}</span>
        </div>
      )}

      <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5">
          {isScheduled && (
            <CalendarSyncDropdown formation={f} variant="icon" />
          )}
          <button
            type="button"
            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white inline-flex items-center justify-center shadow-xs cursor-pointer"
            onClick={() => onOpenDetails(att)}
            title={t('dashboard.viewDetails', 'Ver Detalles')}
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {isCompleted && att.id && !att.isScheduled && (
            <button
              type="button"
              disabled={downloadingCertId === att.id}
              className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 inline-flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
              onClick={() => onDownloadCertificate(att.id)}
              title={t('profile.downloadCertificate', 'Descargar Diploma PDF')}
            >
              <FontAwesomeIcon icon={faFilePdf} />
            </button>
          )}
        </div>

        {isInProgress && (
          <GlassButton
            type="button"
            variant="primary"
            className="px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs"
            onClick={() => onCheckout(att)}
            icon={<FontAwesomeIcon icon={faRightFromBracket} />}
          >
            <span>{t('dashboard.checkout', 'Fichar Salida')}</span>
          </GlassButton>
        )}
      </div>
    </div>
  );
}
