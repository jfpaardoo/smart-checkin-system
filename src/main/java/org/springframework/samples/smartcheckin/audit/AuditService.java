package org.springframework.samples.smartcheckin.audit;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

@Service
@SuppressWarnings("null")
public class AuditService {

    public static final String GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final String AUDIT_TOPIC = "/topic/audit";
    private static final String LOG_UPDATE = "NEW_LOG";

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
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
            if (log.getLogHash() == null || log.getPreviousHash() == null || !computed.equalsIgnoreCase(log.getLogHash())) {
                log.setPreviousHash(prevHash);
                log.setLogHash(computed);
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

        AuditLog saved = auditLogRepository.save(log);
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public AuditIntegrityResult verifyIntegrity() {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByIdAsc();
        if (allLogs.isEmpty()) {
            return new AuditIntegrityResult(true, null, "No audit logs in system.", 0);
        }

        String expectedPrevHash = GENESIS_PREVIOUS_HASH;
        int verifiedCount = 0;

        for (AuditLog log : allLogs) {
            // If it's a legacy log created before hash chaining, calculate its hash retroactively or skip if no hash
            if (log.getLogHash() == null || log.getLogHash().isBlank()) {
                continue;
            }

            // Verify previous hash chain linkage
            if (log.getPreviousHash() != null && !log.getPreviousHash().equals(expectedPrevHash) && !expectedPrevHash.equals(GENESIS_PREVIOUS_HASH)) {
                return new AuditIntegrityResult(
                        false,
                        log.getId(),
                        String.format("Cryptographic chain broken at Log ID %d: previous hash mismatch.", log.getId()),
                        verifiedCount
                );
            }

            // Verify content integrity hash
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

            expectedPrevHash = log.getLogHash();
            verifiedCount++;
        }

        return new AuditIntegrityResult(
                true,
                null,
                String.format("Cryptographic integrity verified. All %d audit logs in the SHA-256 chain are authentic and intact.", verifiedCount),
                verifiedCount
        );
    }
}
