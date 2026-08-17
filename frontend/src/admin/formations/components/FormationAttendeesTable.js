import React, { useState, useMemo } from 'react';
import { Table, Button, Form, FormGroup } from "reactstrap";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFilePdf, faTrash } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import GlassDropdown from "../../../components/GlassDropdown";
import GlassSearchBar from "../../../components/GlassSearchBar";
import GlassPagination from "../../../components/GlassPagination";

dayjs.extend(utc);

// Estilo común para que los 3 botones tengan el mismo ancho y alineación
const actionButtonStyle = { 
  width: '100px',
  height: '34px',
  padding: '0', 
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  whiteSpace: 'nowrap'
};

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
    if (att.checkOutDate) return <span className="badge-glass-success text-xs">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark text-xs">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary text-xs">{t('formationDetails.statusPending')}</span>;
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
    return attendees.filter((att) => {
      const u = att.user;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = (
          (u?.firstName?.toLowerCase()?.includes(q)) ||
          (u?.lastName?.toLowerCase()?.includes(q)) ||
          (u?.username?.toLowerCase()?.includes(q)) ||
          (u?.personalCode?.toLowerCase()?.includes(q))
        );
        if (!match) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED' && !att.checkOutDate) return false;
        if (statusFilter === 'IN_PROGRESS' && (!att.checkInDate || att.checkOutDate)) return false;
        if (statusFilter === 'PENDING' && (att.checkInDate || att.checkOutDate)) return false;
      }

      return true;
    });
  }, [attendees, searchQuery, statusFilter]);

  // Paginación
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, currentPage, pageSize]);

  return (
    <>
      <div className="da-card-header pt-3 flex flex-col md:flex-row justify-between items-center gap-3">
        <h3>{t('formationDetails.attendeesSection')}</h3>
        <Form className="formation-add-form d-flex gap-2 align-items-stretch" style={{ height: '42px' }} onSubmit={handleSubmit}>
          <FormGroup className="mb-0 h-100" style={{ minWidth: '280px', flex: 1, maxWidth: '400px' }}>
            <GlassDropdown
              options={availableUsers.map(u => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.username})`
              }))}
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(String(val))}
              placeholder={t('formationDetails.selectUserToAdd')}
              searchable={true}
            />
          </FormGroup>
          <Button className="da-btn-primary h-100 d-flex align-items-center justify-content-center px-4" type="submit" disabled={!selectedUserId || isAddingUser}>
            {isAddingUser ? 'Añadiendo...' : t('formationDetails.addUser')}
          </Button>
        </Form>
      </div>

      {attendees.length === 0 ? (
        <div className="text-center p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.8)' }}>
          <p className="mb-0" style={{ color: '#64748b', fontWeight: 500 }}>{t('formationDetails.noAttendees')}</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Barra de Filtro y Búsqueda de Asistentes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 mt-2 items-center">
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

          {/* 1. VISTA ESCRITORIO */}
          <div className="hidden lg:block overflow-x-auto pb-2">
            <Table responsive hover className="da-table align-middle" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ color: '#2c3e50', paddingLeft: '1rem' }}>{t('formationDetails.personalCode')}</th>
                  <th style={{ color: '#2c3e50' }}>{t('formationDetails.name')}</th>
                  <th style={{ color: '#2c3e50' }}>{t('formationDetails.username')}</th>
                  <th style={{ color: '#2c3e50' }}>{t('formationDetails.checkIn')}</th>
                  <th style={{ color: '#2c3e50' }}>{t('formationDetails.checkOut')}</th>
                  <th style={{ color: '#2c3e50' }}>{t('formationDetails.status')}</th>
                  <th style={{ color: '#2c3e50', paddingRight: '1rem' }} className="text-center">{t('formationDetails.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttendees.map((att) => {
                  const user = att.user;
                  const isCompleted = !!att.checkOutDate;
                  const hasCheckedIn = !!att.checkInDate;
                  return (
                    <tr key={att.id || user.id}>
                      <td style={{ color: '#2c3e50', fontWeight: 600, paddingLeft: '1rem' }}>{user.personalCode}</td>
                      <td style={{ color: '#2c3e50' }}>{user.firstName} {user.lastName}</td>
                      <td style={{ color: '#64748b' }}>{user.username}</td>
                      <td style={{ color: '#64748b' }}>{hasCheckedIn ? dayjs.utc(att.checkInDate).local().format('HH:mm:ss') : '-'}</td>
                      <td style={{ color: '#64748b' }}>{isCompleted ? dayjs.utc(att.checkOutDate).local().format('HH:mm:ss') : '-'}</td>
                      <td>{renderAttendanceBadge(att)}</td>
                      <td className="text-center" style={{ paddingRight: '1rem' }}>
                        <div className="flex justify-center gap-2 items-center w-full">
                          {/* Botón 1: Detalles */}
                          <Button
                            size="sm"
                            className="da-btn-primary fw-bold shadow-sm"
                            style={actionButtonStyle}
                            onClick={() => onViewSignature(att)}
                            title={t('formationDetails.viewSignature')}
                          >
                            <FontAwesomeIcon icon={faEye} size="lg" />
                            <span>{t('common.details', 'Detalles')}</span>
                          </Button>

                          {/* Botón 2: PDF */}
                          {att.signature && (
                            <Button
                              size="sm"
                              className="da-btn-blue fw-bold shadow-sm"
                              style={actionButtonStyle}
                              onClick={() => onDownloadPdf(att.id)}
                              title="PDF"
                            >
                              <FontAwesomeIcon icon={faFilePdf} size="lg" />
                              <span>PDF</span>
                            </Button>
                          )}
                          
                          {/* Espaciador */}
                          {!att.signature && <div style={actionButtonStyle} />}

                          {/* Botón 3: Eliminar */}
                          <Button
                            size="sm"
                            className="da-btn-danger fw-bold shadow-sm"
                            style={actionButtonStyle}
                            onClick={() => handleRemoveUser(user.id)}
                            title={t('formations.delete', 'Eliminar')}
                          >
                            <FontAwesomeIcon icon={faTrash} size="lg" />
                            <span>{t('formations.delete', 'Eliminar')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* 2. VISTA MÓVIL */}
          <div className="lg:hidden flex flex-col gap-3 mt-2">
            {paginatedAttendees.map((att) => {
              const user = att.user;
              const isCompleted = !!att.checkOutDate;
              const hasCheckedIn = !!att.checkInDate;
              return (
                <div key={att.id || user.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[16px] p-4 border border-white/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 m-0 text-base">{user.firstName} {user.lastName}</h4>
                      <p className="text-xs text-slate-500 m-0 mt-0.5">@{user.username} • Cód: {user.personalCode}</p>
                    </div>
                    <div>{renderAttendanceBadge(att)}</div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600 bg-white/40 p-2.5 rounded-xl border border-white/40">
                    <span><strong>{t('formationDetails.checkinTime', 'Entrada:')}</strong> {hasCheckedIn ? dayjs.utc(att.checkInDate).local().format('HH:mm:ss') : '-'}</span>
                    <span><strong>{t('formationDetails.checkoutTime', 'Salida:')}</strong> {isCompleted ? dayjs.utc(att.checkOutDate).local().format('HH:mm:ss') : '-'}</span>
                  </div>

                  <div className={`grid ${att.signature ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-2 border-t border-slate-200/50 w-full`}>
                    <Button
                      size="sm"
                      className="da-btn-primary w-full d-flex items-center justify-center gap-1 font-bold shadow-xs"
                      style={{ padding: '6px 4px', minWidth: 0, height: '36px', borderRadius: '16px', fontSize: '0.78rem' }}
                      onClick={() => onViewSignature(att)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      <span className="truncate">{t('common.details', 'Detalles')}</span>
                    </Button>

                    {att.signature && (
                      <Button
                        size="sm"
                        className="da-btn-blue w-full d-flex items-center justify-center gap-1 font-bold shadow-xs"
                        style={{ padding: '6px 4px', minWidth: 0, height: '36px', borderRadius: '16px', fontSize: '0.78rem' }}
                        onClick={() => onDownloadPdf(att.id)}
                      >
                        <FontAwesomeIcon icon={faFilePdf} />
                        <span className="truncate">PDF</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      className="da-btn-danger w-full d-flex items-center justify-center gap-1 font-bold shadow-xs"
                      style={{ padding: '6px 4px', minWidth: 0, height: '36px', borderRadius: '16px', fontSize: '0.78rem' }}
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span className="truncate">{t('formations.delete', 'Eliminar')}</span>
                    </Button>
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