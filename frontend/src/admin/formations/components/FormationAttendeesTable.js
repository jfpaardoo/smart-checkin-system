import React from 'react';
import { Table, Button, Form, FormGroup } from "reactstrap";
import { useTranslation } from "react-i18next";
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
    if (att.checkOutDate) return <span className="badge-glass-success">{t('formationDetails.statusCompleted')}</span>;
    if (att.checkInDate)  return <span className="badge-glass-warning text-dark">{t('formationDetails.statusInProgress')}</span>;
    return <span className="badge-glass-secondary">{t('formationDetails.statusPending')}</span>;
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

      <Table responsive className="ba-table align-middle" style={{ minWidth: '700px' }}>
        <thead>
          <tr>
            <th>{t('formationDetails.personalCode')}</th>
            <th>{t('formationDetails.name')}</th>
            <th>{t('formationDetails.username')}</th>
            <th>{t('formationDetails.checkIn')}</th>
            <th>{t('formationDetails.checkOut')}</th>
            <th>{t('formationDetails.status')}</th>
            <th>{t('formationDetails.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {formation.attendances && formation.attendances.length > 0 ? (
            formation.attendances.map((att) => {
              const user = att.user;
              const isCompleted = !!att.checkOutDate;
              const hasCheckedIn = !!att.checkInDate;
              return (
                <tr key={att.id || user.id}>
                  <td>{user.personalCode}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.username}</td>
                  <td>{hasCheckedIn ? moment(att.checkInDate).format('HH:mm:ss') : '-'}</td>
                  <td>{isCompleted ? moment(att.checkOutDate).format('HH:mm:ss') : '-'}</td>
                  <td>{renderAttendanceBadge(att)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        className="ba-btn-primary"
                        onClick={() => onViewSignature(att)}
                      >
                        {t('formationDetails.viewSignature')}
                      </Button>
                      {att.signature && (
                        <Button
                          size="sm"
                          className="ba-btn-secondary"
                          onClick={() => onDownloadPdf(att.id)}
                        >
                          PDF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="ba-btn-danger"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        {t('formationDetails.remove')}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                {t('formationDetails.noAttendees')}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
