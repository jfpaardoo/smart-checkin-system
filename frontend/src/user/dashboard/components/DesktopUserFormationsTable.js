import React from 'react';
import DesktopUserFormationRow from './DesktopUserFormationRow';

export default function DesktopUserFormationsTable({
  items,
  t,
  onOpenDetails,
  onCheckout,
  onDownloadCertificate,
  downloadingCertId
}) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
      <table className="w-full text-left border-collapse align-middle">
        <thead>
          <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
            <th className="py-4 px-5" style={{ width: '38%' }}>{t('dashboard.formation', 'Formación')}</th>
            <th className="py-4 px-5" style={{ width: '22%' }}>{t('dashboard.scheduledDate', 'Fecha y Horario')}</th>
            <th className="py-4 px-5 text-center" style={{ width: '18%' }}>{t('dashboard.status', 'Estado')}</th>
            <th className="py-4 px-5 text-right" style={{ width: '22%' }}>{t('dashboard.action', 'Acciones')}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
          {items.map((att) => (
            <DesktopUserFormationRow
              key={att.id || att.formation?.id}
              att={att}
              t={t}
              onOpenDetails={onOpenDetails}
              onCheckout={onCheckout}
              onDownloadCertificate={onDownloadCertificate}
              downloadingCertId={downloadingCertId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
