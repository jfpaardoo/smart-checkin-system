package org.springframework.samples.smartcheckin.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class DataRetentionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(DataRetentionScheduler.class);

    private final AuditLogRepository auditLogRepository;
    private final CheckinRepository checkinRepository;
    private final FormationAttendanceRepository formationAttendanceRepository;

    @Autowired
    public DataRetentionScheduler(AuditLogRepository auditLogRepository, 
                                  CheckinRepository checkinRepository, 
                                  FormationAttendanceRepository formationAttendanceRepository) {
        this.auditLogRepository = auditLogRepository;
        this.checkinRepository = checkinRepository;
        this.formationAttendanceRepository = formationAttendanceRepository;
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void performDataRetentionCleanup() {
        logger.info("Iniciando tarea programada de limpieza de datos (RGPD)...");
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());

        LocalDateTime auditCutoff = now.minusYears(1);
        try {
            auditLogRepository.deleteByTimestampBefore(auditCutoff);
            logger.info("AuditLogs anteriores a {} eliminados correctamente.", auditCutoff);
        } catch (Exception e) {
            logger.error("Error al limpiar AuditLogs", e);
        }

        LocalDateTime checkinCutoff = now.minusYears(4);
        try {
            checkinRepository.deleteByCheckInDateBefore(checkinCutoff);
            formationAttendanceRepository.deleteByCheckInDateBefore(checkinCutoff);
            logger.info("Fichajes y Formaciones anteriores a {} eliminados correctamente.", checkinCutoff);
        } catch (Exception e) {
            logger.error("Error al limpiar Checkins/Formations", e);
        }

        logger.info("Limpieza de datos finalizada.");
    }
}