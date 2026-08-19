package org.springframework.samples.smartcheckin.audit;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.metrics.AppMetricsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    public static final String GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final String AUDIT_TOPIC = "/topic/audit";
    private static final String LOG_UPDATE = "NEW_LOG";

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private AppMetricsService metricsService;

    @Value("${smartcheckin.app.jwtSecret:${badistributionacademy.app.jwtSecret:auditHmacSecretKeyDefault12345}}")
    private String hmacSecretKey;

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
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
            if (log.getLogHash() == null || log.getPreviousHash() == null || !computed.equalsIgnoreCase(log.getLogHash()) || log.getSignatureHmac() == null) {
                log.setPreviousHash(prevHash);
                log.setLogHash(computed);
                log.setSignatureHmac(hmac);
                auditLogRepository.save(log);
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

        java.time.LocalDateTime ts = (log.getTimestamp() != null)
                ? log.getTimestamp().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                : java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()).truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
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
        return prevHash != null && !prevHash.equals(expectedPrevHash) && !expectedPrevHash.equals(GENESIS_PREVIOUS_HASH);
    }

    private void recordVerificationMetric(boolean isValid) {
        if (metricsService != null) {
            metricsService.incrementAuditVerification(isValid);
        }
    }
}
