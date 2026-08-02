package org.springframework.samples.smartcheckin.exports;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.audit.AuditLog;

class PdfReportGeneratorTests {

    private PdfReportGenerator pdfReportGenerator;

    @BeforeEach
    void setUp() {
        pdfReportGenerator = new PdfReportGenerator();
    }

    @Test
    void shouldGenerateAuditLogPdf() {
        AuditLog log1 = new AuditLog("TEST_ACTION_1", "admin", "details1", "127.0.0.1");
        log1.setTimestamp(LocalDateTime.now(ZoneId.systemDefault()));
        
        AuditLog log2 = new AuditLog("TEST_ACTION_2", "admin", "details2", "127.0.0.1");
        log2.setTimestamp(LocalDateTime.now(ZoneId.systemDefault()));

        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(List.of(log1, log2));

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, "PDF should not be empty");
    }

    @Test
    void shouldGenerateAuditLogPdfWithNullTimestamp() {
        AuditLog log1 = new AuditLog("TEST_ACTION_1", "admin", "details1", "127.0.0.1");
        // Timestamp is null by default
        
        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(List.of(log1));

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, "PDF should not be empty");
    }

    @Test
    void shouldCatchExceptionInGenerateAuditLogPdf() {
        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(null);
        
        assertNotNull(pdf);
    }

    @Test
    void shouldGenerateHrReportPdf() {
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(100, 50, 45, 12);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, "PDF should not be empty");
    }

    @Test
    void shouldGenerateHrReportPdfWithMoreActiveThanTotal() {
        // activeCheckins > totalUsers to hit the ternary else branch
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(10, 50, 20, 12);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, "PDF should not be empty");
    }
}
