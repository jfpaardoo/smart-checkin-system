package org.springframework.samples.smartcheckin.audit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuditServiceTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AuditService auditService;

    @Test
    void testRecordFirstAuditLogUsesGenesisHash() {
        when(auditLogRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditLog log = new AuditLog("LOGIN_SUCCESS", "admin", "Admin logged in", "192.168.1.1");
        AuditLog saved = auditService.recordAuditLog(log);

        assertNotNull(saved);
        assertEquals(AuditService.GENESIS_PREVIOUS_HASH, saved.getPreviousHash());
        assertNotNull(saved.getLogHash());
        assertEquals(64, saved.getLogHash().length());
        verify(messagingTemplate, times(1)).convertAndSend("/topic/audit", "NEW_LOG");
    }

    @Test
    void testRecordSecondAuditLogChainsFromFirst() {
        AuditLog firstLog = new AuditLog("FIRST_ACTION", "user1", "first details", "10.0.0.1");
        firstLog.setId(1);
        firstLog.setPreviousHash(AuditService.GENESIS_PREVIOUS_HASH);
        firstLog.setLogHash("a".repeat(64));

        when(auditLogRepository.findTopByOrderByIdDesc()).thenReturn(Optional.of(firstLog));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditLog secondLog = new AuditLog("SECOND_ACTION", "user2", "second details", "10.0.0.2");
        AuditLog saved = auditService.recordAuditLog(secondLog);

        assertNotNull(saved);
        assertEquals("a".repeat(64), saved.getPreviousHash());
        assertNotNull(saved.getLogHash());
        assertEquals(64, saved.getLogHash().length());
    }

    @Test
    void testVerifyIntegrityValidChain() {
        AuditLog log1 = new AuditLog("ACTION_1", "user1", "details1", "127.0.0.1");
        log1.setId(1);
        log1.setTimestamp(LocalDateTime.of(2026, Month.JANUARY, 1, 10, 0));
        log1.setPreviousHash(AuditService.GENESIS_PREVIOUS_HASH);
        log1.setLogHash(AuditLog.calculateHash(AuditService.GENESIS_PREVIOUS_HASH, log1.getTimestamp(), log1.getAction(), log1.getUsername(), log1.getDetails(), log1.getIpAddress()));

        AuditLog log2 = new AuditLog("ACTION_2", "user2", "details2", "127.0.0.1");
        log2.setId(2);
        log2.setTimestamp(LocalDateTime.of(2026, Month.JANUARY, 1, 10, 5));
        log2.setPreviousHash(log1.getLogHash());
        log2.setLogHash(AuditLog.calculateHash(log1.getLogHash(), log2.getTimestamp(), log2.getAction(), log2.getUsername(), log2.getDetails(), log2.getIpAddress()));

        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of(log1, log2));

        AuditIntegrityResult result = auditService.verifyIntegrity();

        assertTrue(result.isValid());
        assertNull(result.getTamperedLogId());
        assertEquals(2, result.getTotalLogsVerified());
    }

    @Test
    void testVerifyIntegrityTamperedContentDetected() {
        AuditLog log1 = new AuditLog("ACTION_1", "user1", "details1", "127.0.0.1");
        log1.setId(1);
        log1.setTimestamp(LocalDateTime.of(2026, Month.JANUARY, 1, 10, 0));
        log1.setPreviousHash(AuditService.GENESIS_PREVIOUS_HASH);
        log1.setLogHash(AuditLog.calculateHash(AuditService.GENESIS_PREVIOUS_HASH, log1.getTimestamp(), log1.getAction(), log1.getUsername(), log1.getDetails(), log1.getIpAddress()));

        // Tamper action without updating hash
        log1.setAction("TAMPERED_ACTION");

        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of(log1));

        AuditIntegrityResult result = auditService.verifyIntegrity();

        assertFalse(result.isValid());
        assertEquals(1, result.getTamperedLogId());
    }

    @Test
    void testVerifyIntegrityEmptyLogs() {
        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of());

        AuditIntegrityResult result = auditService.verifyIntegrity();

        assertTrue(result.isValid());
        assertEquals(0, result.getTotalLogsVerified());
    }
}
