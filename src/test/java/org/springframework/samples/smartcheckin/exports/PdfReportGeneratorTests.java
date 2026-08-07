package org.springframework.samples.smartcheckin.exports;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
        
        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(List.of(log1));

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldCatchExceptionInGenerateAuditLogPdf() {
        byte[] pdf = pdfReportGenerator.generateAuditLogPdf(null);
        
        assertNotNull(pdf);
    }

    @ParameterizedTest
    @CsvSource({
        "100, 50, 45, 12", // Caso estándar (activos < totales)
        "10, 50, 20, 12",  // Caso activos > totales (cubre la rama del ternario)
        "10, 50, 10, 12"   // Caso activos == totales (cubre límite del ternario)
    })
    void shouldGenerateHrReportPdfParameterized(int totalUsers, int totalFormations, int activeCheckins, int checkinsToday) {
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(totalUsers, totalFormations, activeCheckins, checkinsToday);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldCatchExceptionInGenerateHrReportPdf() {
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(-1, -1, -5, -1);

        assertNotNull(pdf);
    }

    @Test
    void shouldGenerateHrReportPdfWhenActiveCheckinsExceedTotalUsers() {
        // totalUsers = 5, activeCheckins = 10 (cubre la rama totalUsers > activeCheckins como falsa de manera segura)
        byte[] pdf = pdfReportGenerator.generateHrReportPdf(5, 10, 10, 2);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }
}