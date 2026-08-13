package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.exports.PdfReportGenerator;
import org.springframework.samples.smartcheckin.formation.Formation;

@ExtendWith(MockitoExtension.class)
class PdfExportStrategyTests {

    @Mock
    private PdfReportGenerator pdfReportGenerator;

    @InjectMocks
    private PdfExportStrategy strategy;


    // ─── Metadata ─────────────────────────────────────────────────────────────

    @Test
    void getContentType_returnsPdfMime() {
        assertEquals("application/pdf", strategy.getContentType());
    }

    @Test
    void getFileExtension_returnsPdf() {
        assertEquals("pdf", strategy.getFileExtension());
    }

    // ─── Unsupported operations ────────────────────────────────────────────────

    @Test
    void exportUsers_throwsUnsupportedOperationException() {
        List<UserAnalyticsDTO> users = Collections.emptyList();
        assertThrows(UnsupportedOperationException.class, () -> strategy.exportUsers(users));
    }

    @Test
    void exportCheckins_throwsUnsupportedOperationException() {
        List<Checkin> checkins = Collections.emptyList();
        assertThrows(UnsupportedOperationException.class, () -> strategy.exportCheckins(checkins));
    }

    @Test
    void exportFormations_throwsUnsupportedOperationException() {
        List<Formation> formations = Collections.emptyList();
        assertThrows(UnsupportedOperationException.class, () -> strategy.exportFormations(formations));
    }

    // ─── exportAuditLogs delegates to PdfReportGenerator ─────────────────────

    @Test
    void exportAuditLogs_delegatesToPdfReportGenerator() throws Exception {
        List<AuditLog> logs = List.of(new AuditLog("LOGIN", "jdoe", "Logged in", "127.0.0.1"));
        byte[] expected = new byte[]{1, 2, 3, 4};
        when(pdfReportGenerator.generateAuditLogPdf(logs)).thenReturn(expected);

        byte[] result = strategy.exportAuditLogs(logs);

        assertArrayEquals(expected, result);
        verify(pdfReportGenerator, times(1)).generateAuditLogPdf(logs);
    }

    @Test
    void exportAuditLogs_emptyList_callsGeneratorWithEmptyList() throws Exception {
        List<AuditLog> logs = Collections.emptyList();
        byte[] expected = new byte[]{};
        when(pdfReportGenerator.generateAuditLogPdf(logs)).thenReturn(expected);

        byte[] result = strategy.exportAuditLogs(logs);

        assertArrayEquals(expected, result);
        verify(pdfReportGenerator).generateAuditLogPdf(logs);
    }

    @Test
    void exportAuditLogs_propagatesExceptionFromGenerator() {
        List<AuditLog> logs = List.of(new AuditLog());
        when(pdfReportGenerator.generateAuditLogPdf(logs))
                .thenThrow(new RuntimeException("PDF generation failed"));

        assertThrows(RuntimeException.class, () -> strategy.exportAuditLogs(logs));
    }
}
