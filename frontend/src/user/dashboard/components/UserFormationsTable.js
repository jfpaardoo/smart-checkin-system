import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { TableGhostLoader } from '../../../components/GhostLoader';
import GlassPagination from '../../../components/GlassPagination';
import api from '../../../services/api';
import { saveBlobFile } from '../../../util/downloadExportFile';
import UserFormationCategoryTabs from './UserFormationCategoryTabs';
import DesktopUserFormationsTable from './DesktopUserFormationsTable';
import MobileUserFormationCard from './MobileUserFormationCard';
import {
  combineFormations,
  computeCounts,
  filterAndSortItems
} from './userFormationHelpers';

export default function UserFormationsTable({
  attendances,
  allPublishedFormations,
  isLoading,
  onOpenDetails,
  onCheckout
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [downloadingCertId, setDownloadingCertId] = useState(null);

  const combinedItems = useMemo(() => {
    return combineFormations(attendances, allPublishedFormations);
  }, [attendances, allPublishedFormations]);

  const counts = useMemo(() => {
    return computeCounts(combinedItems);
  }, [combinedItems]);

  const filteredItems = useMemo(() => {
    return filterAndSortItems(combinedItems, activeTab);
  }, [combinedItems, activeTab]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleDownloadCertificate = useCallback(async (attendanceId) => {
    if (!attendanceId) return;
    setDownloadingCertId(attendanceId);
    try {
      const res = await api.get(`/certificates/attendance/${attendanceId}`, { responseType: 'blob' });
      await saveBlobFile(res.data, `certificado_${attendanceId}.pdf`, 'application/pdf');
    } catch (error) {
      console.error('Error downloading certificate PDF', error);
    } finally {
      setDownloadingCertId(null);
    }
  }, []);

  const handleSelectTab = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  if (isLoading) {
    return <TableGhostLoader />;
  }

  if (combinedItems.length === 0) {
    return (
      <div className="text-center p-8 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
        <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-slate-300 dark:text-slate-600 mb-1" />
        <p className="mb-0 font-bold text-sm">
          {t('dashboard.noFormations', 'No tienes formaciones asignadas ni programadas.')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Selector de Categorías (GlassDropdown en móvil y Pestañas en escritorio) */}
      <UserFormationCategoryTabs
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        counts={counts}
      />

      {/* 2. Vista Escritorio (Tabla) */}
      <DesktopUserFormationsTable
        items={paginatedItems}
        t={t}
        onOpenDetails={onOpenDetails}
        onCheckout={onCheckout}
        onDownloadCertificate={handleDownloadCertificate}
        downloadingCertId={downloadingCertId}
      />

      {/* 3. Vista Móvil (Tarjetas) */}
      <div className="md:hidden flex flex-col gap-3">
        {paginatedItems.map((att) => (
          <MobileUserFormationCard
            key={att.id || att.formation?.id}
            att={att}
            t={t}
            onOpenDetails={onOpenDetails}
            onCheckout={onCheckout}
            onDownloadCertificate={handleDownloadCertificate}
            downloadingCertId={downloadingCertId}
          />
        ))}
      </div>

      {/* 4. Paginación */}
      {filteredItems.length > pageSize && (
        <GlassPagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => setPageSize(s)}
          pageSizeOptions={[4, 8, 12, 20]}
        />
      )}
    </div>
  );
}