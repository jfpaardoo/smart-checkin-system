import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Table, Badge, Button } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faClock, faTimes, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { formatDuration } from '../../util/dateTimeUtil';

export default function UserAnalyticsDetailModal({ isOpen, toggle, userAnalytics }) {
    const { t } = useTranslation();

    if (!userAnalytics) return null;

    const renderSignatureStatus = (f) => {
        if (f.hasSignature) {
            return (
                <span className="text-success fw-bold d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faCheckCircle} /> {t('analytics.signed', 'Signed')}
                </span>
            );
        }
        if (f.status === 'IN_PROGRESS') {
            return (
                <span className="text-warning fw-bold d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faSpinner} spin /> {t('analytics.inProgress', 'In Progress')}
                </span>
            );
        }
        return <span className="text-muted">{t('analytics.pending', 'Pending')}</span>;
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" className="modal-dialog-centered analytics-detail-modal">
            <ModalHeader toggle={toggle} className="border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-primary" />
                    <span className="fw-bold fs-5">
                        {userAnalytics.firstName} {userAnalytics.lastName} ({userAnalytics.personalCode})
                    </span>
                </div>
            </ModalHeader>

            <ModalBody className="pt-3">
                {/* Employee KPI Quick Bar */}
                <div className="analytics-kpi-row mb-4">
                    <div className="analytics-kpi-card p-3">
                        <div className="analytics-kpi-icon">
                            <FontAwesomeIcon icon={faGraduationCap} />
                        </div>
                        <div className="analytics-kpi-content">
                            <h6>{t('analytics.attendanceRate', 'Attendance Rate')}</h6>
                            <p className="kpi-value">{userAnalytics.attendancePercentage}%</p>
                        </div>
                    </div>

                    <div className="analytics-kpi-card p-3">
                        <div className="analytics-kpi-icon blue">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div className="analytics-kpi-content">
                            <h6>{t('analytics.timeInFormations', 'Time in Formations')}</h6>
                            <p className="kpi-value">{formatDuration(userAnalytics.totalFormationMinutes)}</p>
                        </div>
                    </div>
                </div>

                {/* Formations List Table */}
                <h6 className="fw-bold mb-3 text-secondary">
                    <FontAwesomeIcon icon={faGraduationCap} className="me-2" />
                    {t('analytics.formationBreakdown', 'Formation Breakdown & Time Spent')}
                </h6>

                {userAnalytics.formationDetails && userAnalytics.formationDetails.length > 0 ? (
                    <Table responsive className="ba-table align-middle" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th>{t('analytics.formationName', 'Formation')}</th>
                                <th>{t('analytics.date', 'Date')}</th>
                                <th>{t('analytics.checkIn', 'Check-in')}</th>
                                <th>{t('analytics.checkOut', 'Check-out')}</th>
                                <th>{t('analytics.duration', 'Time Spent')}</th>
                                <th>{t('analytics.signature', 'Signature')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userAnalytics.formationDetails.map((f) => (
                                <tr key={f.formationId}>
                                    <td className="fw-bold">{f.formationName}</td>
                                    <td>{f.formationDate ? moment(f.formationDate).format('YYYY-MM-DD HH:mm') : 'N/A'}</td>
                                    <td>{f.checkInDate ? moment(f.checkInDate).format('HH:mm') : '-'}</td>
                                    <td>{f.checkOutDate ? moment(f.checkOutDate).format('HH:mm') : '-'}</td>
                                    <td>
                                        <Badge color="info" className="ba-badge text-dark fw-bold">
                                            {formatDuration(f.durationMinutes)}
                                        </Badge>
                                    </td>
                                    <td>{renderSignatureStatus(f)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <div className="text-center p-4 text-muted">
                        {t('analytics.noFormationsUser', 'No formations assigned to this user.')}
                    </div>
                )}
            </ModalBody>

            <ModalFooter className="border-0 pt-0">
                <Button className="ba-btn-secondary" onClick={toggle}>
                    <FontAwesomeIcon icon={faTimes} className="me-1" /> {t('common.close', 'Close')}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
