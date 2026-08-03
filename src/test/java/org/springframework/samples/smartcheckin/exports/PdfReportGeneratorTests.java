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

    private static final String ADMIN = "admin";
    private static final String IP = "127.0.0.1";
    private static final String PDF_NOT_EMPTY = "PDF should not be empty";

    private PdfReportGenerator pdfReportGenerator;

    @BeforeEach
    void setUp() {
        pdfReportGenerator = new PdfReportGenerator();
    }

    @Test
    void shouldGenerateAuditLogPdf() {
        AuditLog log1 = new AuditLog("TEST_ACTION_1", ADMIN, "details1", IP);
        log1.setTimestamp(LocalDateTime.now(ZoneId.systemDefault()));
        
        AuditLog log2 = new AuditLog("TEST_ACTION_2", ADMIN, "details2", IP);
        log2.setTimestamp(LocalDateTime.now(ZoneId.systemDefault()));

        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(List.of(log1, log2));

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateAuditLogPdfWithNullTimestamp() {
        AuditLog log1 = new AuditLog("TEST_ACTION_1", ADMIN, "details1", IP);
        // Timestamp is null by default
        
        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(List.of(log1));

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
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
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateHrReportPdfWithMoreActiveThanTotal() {
        // activeCheckins > totalUsers to hit the ternary else branch
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(10, 50, 20, 12);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }
}
