package org.springframework.samples.smartcheckin.audit;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.metrics.AppMetricsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    public static final String GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final String AUDIT_TOPIC = "/topic/audit";
    private static final String LOG_UPDATE = "NEW_LOG";

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Environment environment;
    private AppMetricsService metricsService;

    @Value("${smartcheckin.security.audit.hmac-secret:${smartcheckin.app.jwtSecret:auditHmacSecretKeyDefault12345}}")
    private String hmacSecretKey;

    public AuditService(AuditLogRepository auditLogRepository, SimpMessagingTemplate messagingTemplate) {
        this(auditLogRepository, messagingTemplate, null);
    }

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository,
                        SimpMessagingTemplate messagingTemplate,
                        @Autowired(required = false) Environment environment) {
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
        this.environment = environment;
    }

    @PostConstruct
    public void validateHmacKeyInProduction() {
        if (environment != null && environment.acceptsProfiles(Profiles.of("prod", "production"))
                && (hmacSecretKey == null || "auditHmacSecretKeyDefault12345".equals(hmacSecretKey) || hmacSecretKey.isBlank())) {
            throw new IllegalStateException("CRÍTICO: El secreto HMAC de auditoría no puede tener el valor por defecto en producción.");
        }
    }

    @Autowired(required = false)
    public void setMetricsService(AppMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    public void setHmacSecretKey(String hmacSecretKey) {
        this.hmacSecretKey = hmacSecretKey;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeLegacyLogsHashChain() {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByIdAsc();
        String prevHash = GENESIS_PREVIOUS_HASH;
        for (AuditLog log : allLogs) {
            String computed = AuditLog.calculateHash(
                    prevHash,
                    log.getTimestamp(),
                    log.getAction(),
                    log.getUsername(),
                    log.getDetails(),
                    log.getIpAddress()
            );
            String hmac = AuditLog.calculateHmac(computed, hmacSecretKey);

            if (log.getLogHash() == null) {
                // Registro histórico anterior a la cadena criptográfica: inicializar hash y firma
                log.setPreviousHash(prevHash);
                log.setLogHash(computed);
                log.setSignatureHmac(hmac);
                auditLogRepository.save(log);
            } else if (!computed.equalsIgnoreCase(log.getLogHash())) {
                // P0 Evidencia Forense: NUNCA auto-reescribir ni destruir registros alterados
                logger.error("ALERTA CRÍTICA DE MANIPULACIÓN FORENSE: El log de auditoría ID {} presenta una discrepancia con su hash SHA-256. Se preserva el registro original sin alterar para auditoría judicial.", log.getId());
            }
            prevHash = log.getLogHash();
        }
    }

    @Transactional
    public synchronized AuditLog recordAuditLog(AuditLog log) {
        AuditLog lastLog = auditLogRepository.findTopByOrderByIdDesc().orElse(null);
        String prevHash = (lastLog != null && lastLog.getLogHash() != null && !lastLog.getLogHash().isBlank())
                ? lastLog.getLogHash()
                : GENESIS_PREVIOUS_HASH;

        LocalDateTime ts = (log.getTimestamp() != null)
                ? log.getTimestamp().truncatedTo(ChronoUnit.SECONDS)
                : LocalDateTime.now(ZoneId.systemDefault()).truncatedTo(ChronoUnit.SECONDS);
        log.setTimestamp(ts);
        log.setPreviousHash(prevHash);

        String currentHash = AuditLog.calculateHash(
                prevHash,
                ts,
                log.getAction(),
                log.getUsername(),
                log.getDetails(),
                log.getIpAddress()
        );
        log.setLogHash(currentHash);
        log.setSignatureHmac(AuditLog.calculateHmac(currentHash, hmacSecretKey));

        AuditLog saved = auditLogRepository.save(log);
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);
        }
        if (metricsService != null && log.getAction() != null && log.getAction().contains("CHECKIN")) {
            metricsService.incrementCheckinSuccess();
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public AuditIntegrityResult verifyIntegrity() {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByIdAsc();
        if (allLogs.isEmpty()) {
            recordVerificationMetric(true);
            return new AuditIntegrityResult(true, null, "No audit logs in system.", 0);
        }

        String expectedPrevHash = GENESIS_PREVIOUS_HASH;
        int verifiedCount = 0;

        for (AuditLog log : allLogs) {
            if (log.getLogHash() == null || log.getLogHash().isBlank()) {
                continue;
            }

            AuditIntegrityResult error = validateLogIntegrity(log, expectedPrevHash, verifiedCount);
            if (error != null) {
                recordVerificationMetric(false);
                return error;
            }

            expectedPrevHash = log.getLogHash();
            verifiedCount++;
        }

        recordVerificationMetric(true);
        return new AuditIntegrityResult(
                true,
                null,
                String.format("Cryptographic integrity verified. All %d audit logs in the SHA-256 chain are authentic and intact.", verifiedCount),
                verifiedCount
        );
    }

    private AuditIntegrityResult validateLogIntegrity(AuditLog log, String expectedPrevHash, int verifiedCount) {
        if (isChainBroken(log.getPreviousHash(), expectedPrevHash)) {
            return new AuditIntegrityResult(
                    false,
                    log.getId(),
                    String.format("Cryptographic chain broken at Log ID %d: previous hash mismatch.", log.getId()),
                    verifiedCount
            );
        }

        String computedHash = AuditLog.calculateHash(
                log.getPreviousHash(),
                log.getTimestamp(),
                log.getAction(),
                log.getUsername(),
                log.getDetails(),
                log.getIpAddress()
        );

        if (!computedHash.equalsIgnoreCase(log.getLogHash())) {
            return new AuditIntegrityResult(
                    false,
                    log.getId(),
                    String.format("Tampering detected at Log ID %d: recorded data does not match SHA-256 hash.", log.getId()),
                    verifiedCount
            );
        }

        if (log.getSignatureHmac() != null && hmacSecretKey != null && !hmacSecretKey.isBlank()) {
            String expectedHmac = AuditLog.calculateHmac(log.getLogHash(), hmacSecretKey);
            if (expectedHmac != null && !expectedHmac.equalsIgnoreCase(log.getSignatureHmac())) {
                return new AuditIntegrityResult(
                        false,
                        log.getId(),
                        String.format("HMAC signature mismatch at Log ID %d: unauthorized database manipulation detected.", log.getId()),
                        verifiedCount
                );
            }
        }

        return null;
    }

    private boolean isChainBroken(String prevHash, String expectedPrevHash) {
        if (prevHash == null) {
            return true;
        }
        return !prevHash.equalsIgnoreCase(expectedPrevHash);
    }

    private void recordVerificationMetric(boolean isValid) {
        if (metricsService != null) {
            metricsService.incrementAuditVerification(isValid);
        }
    }
}
