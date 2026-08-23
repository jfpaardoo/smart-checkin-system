import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { FaEye, FaFilePdf, FaTrash, FaUser } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import GlassDropdown from "../../../components/GlassDropdown";
import GlassSearchBar from "../../../components/GlassSearchBar";
import GlassPagination from "../../../components/GlassPagination";

dayjs.extend(utc);

export default function FormationAttendeesTable({
  formation,
  allUsers,
  isAddingUser,
  handleAddUser,
  handleRemoveUser,
  onViewSignature,
  onDownloadPdf
}) {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const renderAttendanceBadge = (att) => {
    if (att.checkOutDate) return <span className="da-badge da-badge-active text-xs">{t('formationDetails.statusCompleted', 'Completada')}</span>;
    if (att.checkInDate)  return <span className="da-badge da-badge-warning text-xs">{t('formationDetails.statusInProgress', 'En curso')}</span>;
    return <span className="da-badge da-badge-inactive text-xs">{t('formationDetails.statusPending', 'Pendiente')}</span>;
  };

  const attendeeIds = new Set(formation.attendances ? formation.attendances.map(a => a.user.id) : []);
  const availableUsers = allUsers.filter(u => !attendeeIds.has(u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await handleAddUser(selectedUserId)) {
      setSelectedUserId("");
    }
  };

  const attendees = useMemo(() => formation.attendances || [], [formation.attendances]);

  // Filtrado
  const filteredAttendees = useMemo(() => {
    return attendees.filter(att => {
      const u = att.user;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.firstName?.toLowerCase().includes(q) || 
        u.lastName?.toLowerCase().includes(q) || 
        u.username?.toLowerCase().includes(q) ||
        u.personalCode?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'COMPLETED') return !!att.checkOutDate;
      if (statusFilter === 'IN_PROGRESS') return !!att.checkInDate && !att.checkOutDate;
      if (statusFilter === 'PENDING') return !att.checkInDate && !att.checkOutDate;

      return true;
    });
  }, [attendees, searchQuery, statusFilter]);

  // Reset a pág 1 cuando cambien filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Paginación de asistentes filtrados
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, currentPage, pageSize]);

  return (
    <>
      {/* Selector de Nuevo Asistente (solo si no está cerrada) */}
      {!formation?.isClosed && (
        <div className="p-4 sm:p-5 mt-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative z-30">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 min-w-0">
              <GlassDropdown
                options={availableUsers.map((u) => ({
                  value: String(u.id),
                  label: `${u.firstName} ${u.lastName} (${u.username})`
                }))}
                value={selectedUserId}
                onChange={(val) => setSelectedUserId(String(val))}
                placeholder={t('formationDetails.selectUserToAdd', 'Seleccionar Usuario...')}
                searchable={true}
                className="w-full"
              />
            </div>
            <button 
              className="da-btn-primary px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-xs hover:scale-102 active:scale-98 transition-all border-0 cursor-pointer disabled:opacity-50 shrink-0" 
              type="submit" 
              disabled={!selectedUserId || isAddingUser}
            >
              {isAddingUser ? t('common.saving', 'Añadiendo...') : t('formationDetails.addUser', 'Añadir Usuario')}
            </button>
          </form>
        </div>
      )}

      {attendees.length === 0 ? (
        <div className="text-center p-6 mt-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400 relative z-10">
          <p className="mb-0 font-medium">{t('formationDetails.noAttendees', 'No hay asistentes registrados aún.')}</p>
        </div>
      ) : (
        <div className="w-full mt-4 relative z-10">
          {/* Barra de Filtro y Búsqueda de Asistentes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 items-center">
            <div className="sm:col-span-8">
              <GlassSearchBar
                placeholder={t('formationDetails.searchAttendee', 'Buscar asistente por nombre, usuario o código...')}
                onSearch={(q) => { setSearchQuery(q); setCurrentPage(1); }}
              />
            </div>
            <div className="sm:col-span-4">
              <GlassDropdown
                options={[
                  { value: 'ALL', label: t('formationDetails.filterAllStatus', 'Todos los estados') },
                  { value: 'COMPLETED', label: t('formationDetails.statusCompleted', 'Completada') },
                  { value: 'IN_PROGRESS', label: t('formationDetails.statusInProgress', 'En progreso') },
                  { value: 'PENDING', label: t('formationDetails.statusPending', 'Pendiente') }
                ]}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                placeholder={t('formationDetails.filterStatus', 'Filtrar estado')}
                className="w-full"
              />
            </div>
          </div>

          {/* 1. VISTA ESCRITORIO (md y superior) */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
            <table className="w-full text-left border-collapse align-middle">
              <thead>
                <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5" style={{ width: '10%' }}>{t('formationDetails.personalCode', 'Código')}</th>
                  <th className="py-4 px-5" style={{ width: '28%' }}>{t('formationDetails.name', 'Asistente')}</th>
                  <th className="py-4 px-5" style={{ width: '14%' }}>{t('formationDetails.checkIn', 'Check-in')}</th>
                  <th className="py-4 px-5" style={{ width: '14%' }}>{t('formationDetails.checkOut', 'Check-out')}</th>
                  <th className="py-4 px-5 text-center" style={{ width: '16%' }}>{t('formationDetails.status', 'Estado')}</th>
                  <th className="py-4 px-5 text-right" style={{ width: '18%' }}>{t('formationDetails.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-white/10 text-sm text-slate-800 dark:text-slate-100">
                {paginatedAttendees.map((att) => {
                  const user = att.user;
                  const isCompleted = !!att.checkOutDate;
                  const hasCheckedIn = !!att.checkInDate;
                  return (
                    <tr key={att.id || user.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition duration-150">
                      <td className="py-4 px-5 font-bold font-mono text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                        #{user.personalCode}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                            <FaUser size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {hasCheckedIn ? dayjs.utc(att.checkInDate).local().format('HH:mm:ss') : '-'}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {isCompleted ? dayjs.utc(att.checkOutDate).local().format('HH:mm:ss') : '-'}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {renderAttendanceBadge(att)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex gap-2 justify-end items-center">
                          {/* Botón 1: Detalles */}
                          <button
                            type="button"
                            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
                            onClick={() => onViewSignature(att)}
                            title={t('formationDetails.viewSignature', 'Ver Firma / Detalles')}
                            aria-label={t('formationDetails.viewSignature', 'Ver Firma / Detalles')}
                          >
                            <FaEye size={14} />
                          </button>

                          {/* Botón 2: PDF */}
                          {att.signature && (
                            <button
                              type="button"
                              className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer"
                              onClick={() => onDownloadPdf(att.id)}
                              title="PDF"
                              aria-label="Descargar PDF"
                            >
                              <FaFilePdf size={14} />
                            </button>
                          )}

                          {/* Botón 3: Eliminar (solo si no está cerrada) */}
                          {!formation?.isClosed && (
                            <button
                              type="button"
                              className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:text-rose-700 hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                              onClick={() => handleRemoveUser(user.id)}
                              title={t('formations.delete', 'Eliminar')}
                              aria-label={t('formations.delete', 'Eliminar')}
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. VISTA MÓVIL */}
          <div className="md:hidden flex flex-col gap-3 mt-2">
            {paginatedAttendees.map((att) => {
              const user = att.user;
              const isCompleted = !!att.checkOutDate;
              const hasCheckedIn = !!att.checkInDate;
              return (
                <div key={att.id || user.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a] shadow-xs flex-shrink-0">
                        <FaUser size={15} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 m-0 text-base leading-tight">{user.firstName} {user.lastName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">@{user.username} • #{user.personalCode}</p>
                      </div>
                    </div>
                    <div>{renderAttendanceBadge(att)}</div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-white/40 dark:border-white/10 font-mono">
                    <span><strong>{t('formationDetails.checkinTime', 'Entrada:')}</strong> {hasCheckedIn ? dayjs.utc(att.checkInDate).local().format('HH:mm:ss') : '-'}</span>
                    <span><strong>{t('formationDetails.checkoutTime', 'Salida:')}</strong> {isCompleted ? dayjs.utc(att.checkOutDate).local().format('HH:mm:ss') : '-'}</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white inline-flex items-center justify-center shadow-xs cursor-pointer"
                      onClick={() => onViewSignature(att)}
                      title={t('common.details', 'Detalles')}
                    >
                      <FaEye size={14} />
                    </button>

                    {att.signature && (
                      <button
                        type="button"
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:bg-rose-500/20 inline-flex items-center justify-center shadow-xs cursor-pointer"
                        onClick={() => onDownloadPdf(att.id)}
                        title="PDF"
                      >
                        <FaFilePdf size={14} />
                      </button>
                    )}

                    {!formation?.isClosed && (
                      <button
                        type="button"
                        className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-rose-500 hover:bg-rose-500/20 inline-flex items-center justify-center shadow-xs cursor-pointer"
                        onClick={() => handleRemoveUser(user.id)}
                        title={t('formations.delete', 'Eliminar')}
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación Liquid Glass */}
          {filteredAttendees.length > 0 && (
            <GlassPagination
              currentPage={currentPage}
              totalItems={filteredAttendees.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </div>
      )}
    </>
  );
}