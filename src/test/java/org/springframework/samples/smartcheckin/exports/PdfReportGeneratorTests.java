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
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;

@SuppressWarnings("java:S1313")
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
    void shouldGenerateUsersPdf() {
        UserAnalyticsDTO u1 = UserAnalyticsDTO.builder()
                .userId(1)
                .username("jdoe")
                .firstName("John")
                .lastName("Doe")
                .personalCode("1001")
                .locator("LOC01")
                .authority("ADMIN")
                .companyName("Logística Sur")
                .isWorking(true)
                .attendancePercentage(95.0)
                .totalFormationMinutes(120L)
                .build();

        byte[] pdf = pdfReportGenerator.generateUsersPdf(List.of(u1));
        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateUsersPdfWithNullsAndEmptyList() {
        byte[] pdfEmpty = pdfReportGenerator.generateUsersPdf(List.of());
        assertNotNull(pdfEmpty);
        assertTrue(pdfEmpty.length > 0, PDF_NOT_EMPTY);

        byte[] pdfNull = pdfReportGenerator.generateUsersPdf(null);
        assertNotNull(pdfNull);
        assertTrue(pdfNull.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateCheckinsPdf() {
        User user = new User();
        user.setId(1);
        user.setUsername("worker1");
        user.setPersonalCode("W001");
        user.setFirstName("Worker");
        user.setLastName("One");

        Checkin c1 = new Checkin();
        c1.setId(101);
        c1.setUser(user);
        c1.setCheckInType(CheckinType.ENTRADA);
        c1.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        c1.setSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

        Checkin c2 = new Checkin();
        c2.setId(102);
        c2.setUser(user);
        c2.setCheckInType(CheckinType.SALIDA);
        c2.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()).plusHours(8));

        byte[] pdf = pdfReportGenerator.generateCheckinsPdf(List.of(c1, c2));
        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateCheckinsPdfWithNullsAndEmptyList() {
        byte[] pdfEmpty = pdfReportGenerator.generateCheckinsPdf(List.of());
        assertNotNull(pdfEmpty);
        assertTrue(pdfEmpty.length > 0, PDF_NOT_EMPTY);

        byte[] pdfNull = pdfReportGenerator.generateCheckinsPdf(null);
        assertNotNull(pdfNull);
        assertTrue(pdfNull.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateFormationsPdf() {
        User user = new User();
        user.setId(1);
        user.setUsername("student1");
        user.setPersonalCode("S001");
        user.setFirstName("Student");
        user.setLastName("One");

        Formation formation = new Formation();
        formation.setId(10);
        formation.setName("Seguridad en Planta");
        formation.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        FormationAttendance att = new FormationAttendance();
        att.setId(20);
        att.setFormation(formation);
        att.setUser(user);
        att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        att.setCheckOutDate(LocalDateTime.now(ZoneId.systemDefault()).plusHours(2));
        att.setSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

        formation.setAttendances(List.of(att));

        byte[] pdf = pdfReportGenerator.generateFormationsPdf(List.of(formation));
        assertNotNull(pdf);
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateFormationsPdfWithNullsAndEmptyList() {
        byte[] pdfEmpty = pdfReportGenerator.generateFormationsPdf(List.of());
        assertNotNull(pdfEmpty);
        assertTrue(pdfEmpty.length > 0, PDF_NOT_EMPTY);

        byte[] pdfNull = pdfReportGenerator.generateFormationsPdf(null);
        assertNotNull(pdfNull);
        assertTrue(pdfNull.length > 0, PDF_NOT_EMPTY);
    }

    @Test
    void shouldGenerateAuditLogPdf() {
        AuditLog log1 = new AuditLog("SECURITY_ANOMALY_IP", ADMIN, "details1", IP);
        log1.setTimestamp(LocalDateTime.now(ZoneId.systemDefault()));
        
        AuditLog log2 = new AuditLog("USER_LOGIN_SUCCESS", ADMIN, "details2", IP);
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
        assertTrue(pdf.length > 0, PDF_NOT_EMPTY);
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