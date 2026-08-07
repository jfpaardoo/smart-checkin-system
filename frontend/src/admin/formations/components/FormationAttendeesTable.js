import React from 'react';
import { Table, Button, Form, FormGroup } from "reactstrap";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFilePdf, faTrash } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import GlassDropdown from "../../../components/GlassDropdown";

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

  const renderAttendanceBadge = (att) => {
    if (att.checkOutDate) return <span className="badge-glass-success text-xs">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark text-xs">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary text-xs">{t('formationDetails.statusPending')}</span>;
  };

  const attendeeIds = formation.attendances ? formation.attendances.map(a => a.user.id) : [];
  const availableUsers = allUsers.filter(u => !attendeeIds.includes(u.id));

  const [selectedUserId, setSelectedUserId] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await handleAddUser(selectedUserId)) {
      setSelectedUserId("");
    }
  };

  const attendees = formation.attendances || [];

  // Estilo común para que los 3 botones tengan el mismo ancho y alineación
  const actionButtonStyle = { 
    width: '100px', // Ancho fijo para los 3 botones
    height: '34px', // Altura fija
    padding: '0', 
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '17px', // Borde totalmente redondeado
    flexShrink: 0 
  };

  return (
    <>
      <div className="ba-card-header pt-3">
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
          <Button className="ba-btn-primary h-100 d-flex align-items-center justify-content-center px-4" type="submit" disabled={!selectedUserId || isAddingUser}>
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
          {/* 1. VISTA ESCRITORIO (Botones uniformes y armonizados) */}
          <div className="hidden lg:block overflow-x-auto pb-2">
            <Table responsive hover className="ba-table align-middle" style={{ minWidth: '700px', width: '100%' }}>
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
                {attendees.map((att) => {
                  const user = att.user;
                  const isCompleted = !!att.checkOutDate;
                  const hasCheckedIn = !!att.checkInDate;
                  return (
                    <tr key={att.id || user.id}>
                      <td style={{ color: '#2c3e50', fontWeight: 600, paddingLeft: '1rem' }}>{user.personalCode}</td>
                      <td style={{ color: '#2c3e50' }}>{user.firstName} {user.lastName}</td>
                      <td style={{ color: '#64748b' }}>{user.username}</td>
                      <td style={{ color: '#64748b' }}>{hasCheckedIn ? moment(att.checkInDate).format('HH:mm:ss') : '-'}</td>
                      <td style={{ color: '#64748b' }}>{isCompleted ? moment(att.checkOutDate).format('HH:mm:ss') : '-'}</td>
                      <td>{renderAttendanceBadge(att)}</td>
                      <td className="text-center" style={{ paddingRight: '1rem' }}>
                        <div className="flex justify-center gap-2 items-center w-full">
                          {/* Botón 1: Detalles (Texto corto para cuadrar tamaño) */}
                          <Button
                            size="sm"
                            className="ba-btn-primary fw-bold shadow-sm"
                            style={actionButtonStyle}
                            onClick={() => onViewSignature(att)}
                            title={t('formationDetails.viewSignature')} // Tooltip con el texto completo
                          >
                            <FontAwesomeIcon icon={faEye} size="lg" />
                            <span>{t('common.details', 'Detalles')}</span>
                          </Button>

                          {/* Botón 2: PDF (Visible si hay firma) */}
                          {att.signature && (
                            <Button
                              size="sm"
                              className="ba-btn-blue fw-bold shadow-sm"
                              style={actionButtonStyle}
                              onClick={() => onDownloadPdf(att.id)}
                              title="PDF"
                            >
                              <FontAwesomeIcon icon={faFilePdf} size="lg" />
                              <span>PDF</span>
                            </Button>
                          )}
                          
                          {/* Espaciador si no hay PDF para mantener la alineación */}
                          {!att.signature && <div style={actionButtonStyle} />}

                          {/* Botón 3: Eliminar */}
                          <Button
                            size="sm"
                            className="ba-btn-danger fw-bold shadow-sm"
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

          {/* 2. VISTA MÓVIL / TABLET COMPRIMIDA (Sin cambios, diseño previo aprobado) */}
          <div className="lg:hidden flex flex-col gap-4 mt-2">
            {attendees.map((att) => {
              const user = att.user;
              const isCompleted = !!att.checkOutDate;
              const hasCheckedIn = !!att.checkInDate;
              return (
                <div key={att.id || user.id} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Código: {user.personalCode}</span>
                      <h3 className="font-bold text-slate-800 m-0 text-base">{user.firstName} {user.lastName}</h3>
                      <p className="text-xs text-slate-400 m-0">@{user.username}</p>
                    </div>
                    <div>
                      {renderAttendanceBadge(att)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-3 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-500">Check-in:</span> {hasCheckedIn ? moment(att.checkInDate).format('HH:mm:ss') : '-'}</div>
                    <div><span className="font-semibold text-slate-500">Check-out:</span> {isCompleted ? moment(att.checkOutDate).format('HH:mm:ss') : '-'}</div>
                  </div>

                  {/* Botones móviles ordenados en grid simétrica (Mismo diseño previo) */}
                  <div className="border-t border-slate-200/50 pt-3 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="ba-btn-primary fw-bold shadow-sm !rounded-full py-2.5 inline-flex items-center justify-center gap-1.5 text-xs col-span-2"
                      onClick={() => onViewSignature(att)}
                      title={t('formationDetails.viewSignature')}
                    >
                      <FontAwesomeIcon icon={faEye} size="lg" />
                      <span>{t('formationDetails.viewSignature')}</span>
                    </Button>

                    {att.signature ? (
                      <Button
                        size="sm"
                        className="ba-btn-blue fw-bold shadow-sm !rounded-full py-2 inline-flex items-center justify-center gap-1.5 text-xs"
                        onClick={() => onDownloadPdf(att.id)}
                      >
                        <FontAwesomeIcon icon={faFilePdf} size="lg" />
                        <span>PDF</span>
                      </Button>
                    ) : <div />}

                    <Button
                      size="sm"
                      className="ba-btn-danger fw-bold shadow-sm !rounded-full py-2 inline-flex items-center justify-center gap-1.5 text-xs"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} size="lg" />
                      <span>{t('formations.delete', 'Eliminar')}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}