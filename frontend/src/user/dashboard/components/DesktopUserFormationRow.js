import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faRightFromBracket, faFilePdf, faLocationDot, faChalkboardUser } from '@fortawesome/free-solid-svg-icons';
import StatusBadge from '../../../components/StatusBadge';
import GlassButton from '../../../components/GlassButton';
import CalendarSyncDropdown from '../../../components/CalendarSyncDropdown';
import { formatDate } from '../../../utils/dateUtils';
import {
  getThemeClasses,
  getFormationIcon,
  calculateRelativeTimeBadge
} from './userFormationHelpers';

export default function DesktopUserFormationRow({
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
    <tr 
      className={`transition duration-150 ${
        isInProgress 
          ? 'bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20' 
          : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
      }`}
    >
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl shadow-xs flex-shrink-0 ${themeClasses}`}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {f.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faLocationDot} className="text-rose-500 text-[10px]" />
                <span className="truncate max-w-[150px]">{f.location || 'BA VILLAFRANCA'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faChalkboardUser} className="text-sky-500 text-[10px]" />
                <span className="truncate max-w-[150px]">{f.trainer || 'VICTOR PARDO'}</span>
              </span>
            </div>
          </div>
        </div>
      </td>

      <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-medium">{formatDate(f.formationDate)}</span>
          {relativeBadge && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20">
              {relativeBadge.text}
            </span>
          )}
        </div>
      </td>

      <td className="py-4 px-5 text-center">
        {isCompleted && (
          <StatusBadge variant="success">
            {t('dashboard.statusCompleted', 'Completada')}
          </StatusBadge>
        )}
        {isInProgress && (
          <StatusBadge variant="warning" pulse>
            {t('dashboard.statusInProgress', 'En curso')}
          </StatusBadge>
        )}
        {isScheduled && (
          <StatusBadge variant="info">
            {t('dashboard.statusScheduled', 'Programada')}
          </StatusBadge>
        )}
        {isClosedNonAttended && (
          <StatusBadge variant="neutral">
            {t('dashboard.statusClosedNonAttended', 'Finalizada')}
          </StatusBadge>
        )}
      </td>

      <td className="py-4 px-5 text-right">
        <div className="inline-flex gap-1.5 justify-end items-center">
          {isScheduled && (
            <CalendarSyncDropdown formation={f} variant="icon" />
          )}

          <button
            type="button"
            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
            onClick={() => onOpenDetails(att)}
            title={t('dashboard.viewDetails', 'Ver Detalles y Temario')}
            aria-label={t('dashboard.viewDetails', 'Ver Detalles y Temario')}
          >
            <FontAwesomeIcon icon={faEye} />
          </button>

          {isCompleted && att.id && !att.isScheduled && (
            <button
              type="button"
              disabled={downloadingCertId === att.id}
              className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
              onClick={() => onDownloadCertificate(att.id)}
              title={t('profile.downloadCertificate', 'Descargar Diploma PDF')}
              aria-label={t('profile.downloadCertificate', 'Descargar Diploma PDF')}
            >
              <FontAwesomeIcon icon={faFilePdf} />
            </button>
          )}

          {isInProgress && (
            <GlassButton
              type="button"
              variant="primary"
              className="px-3 py-2 text-xs font-bold rounded-xl shadow-xs"
              onClick={() => onCheckout(att)}
              title={t('dashboard.checkout', 'Hacer Checkout')}
              icon={<FontAwesomeIcon icon={faRightFromBracket} />}
            >
              <span>{t('dashboard.checkout', 'Fichar Salida')}</span>
            </GlassButton>
          )}
        </div>
      </td>
    </tr>
  );
}
