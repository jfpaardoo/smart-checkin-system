package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.time.Month;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;

class CsvExportStrategyTests {

    private CsvExportStrategy strategy;

    // ─── Test helpers ──────────────────────────────────────────────────────────

    private User buildUser(Integer id, String username, String personalCode,
                           String firstName, String lastName) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPersonalCode(personalCode);
        u.setFirstName(firstName);
        u.setLastName(lastName);
        return u;
    }

    private FormationAttendance buildAttendance(Formation formation, User user,
                                                LocalDateTime checkIn, LocalDateTime checkOut,
                                                String signature) {
        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setUser(user);
        att.setCheckInDate(checkIn);
        att.setCheckOutDate(checkOut);
        att.setSignature(signature);
        return att;
    }

    private Formation buildFormation(Integer id, String name, LocalDateTime date,
                                     List<FormationAttendance> attendances) {
        Formation f = new Formation();
        f.setId(id);
        f.setName(name);
        f.setFormationDate(date);
        f.setAttendances(attendances);
        return f;
    }

    @BeforeEach
    void setUp() {
        strategy = new CsvExportStrategy();
    }

    // ─── Metadata ──────────────────────────────────────────────────────────────

    @Test
    void testGetContentTypeReturnsCsvMimeType() {
        assertEquals("text/csv", strategy.getContentType());
    }

    @Test
    void testGetFileExtensionReturnsCsv() {
        assertEquals("csv", strategy.getFileExtension());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportUsers
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportUsersEmptyListReturnsOnlyHeader() throws IOException {
        byte[] result = strategy.exportUsers(Collections.emptyList());
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.contains("ID,Username,PersonalCode,Locator,FirstName,LastName,Company,Role,CurrentlyWorking,TotalCheckins,TotalWorkMinutes,FormationsAssigned,FormationsAttended,FormationsCompleted,AttendanceRate,TotalFormationMinutes"));
    }

    @Test
    void testExportUsersAllFieldsPresentCorrectRow() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(1).username("jdoe").personalCode("A001").locator("L01")
                .firstName("John").lastName("Doe").authority("ADMIN").companyName("Acme Corp")
                .isWorking(true).totalCheckins(20).totalWorkMinutes(4800L)
                .formationsAssigned(5).formationsAttended(4).formationsCompleted(4)
                .attendancePercentage(80.0).totalFormationMinutes(120L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("1,jdoe,A001,L01,John,Doe,Acme Corp,ADMIN,YES,20,4800,5,4,4,80.0,120"));
    }

    @Test
    void testExportUsersIsWorkingFalseShowsNO() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(2).username("jsmith").personalCode("A002")
                .firstName("Jane").lastName("Smith").authority("USER")
                .isWorking(false).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
    }

    @Test
    void testExportUsersIsWorkingNullShowsNO() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(3).isWorking(null).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
    }

    @Test
    void testExportUsersNullOptionalFieldsDefaultsApplied() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(4).username(null).personalCode(null).firstName(null).lastName(null)
                .authority(null).isWorking(true).formationsAssigned(null)
                .formationsAttended(null).attendancePercentage(null).totalFormationMinutes(null).build();

        byte[] result = strategy.exportUsers(List.of(u));
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void testExportUsersCommasInNameReplaced() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(5).username("user,name").firstName("First,Name").lastName("Last,Name")
                .authority("USER").companyName("Comp, Inc").isWorking(false).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertFalse(csv.contains("user,name,"));
        assertTrue(csv.contains("user name"));
        assertTrue(csv.contains("First Name"));
        assertTrue(csv.contains("Last Name"));
        assertTrue(csv.contains("Comp  Inc") || csv.contains("Comp Inc"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportCheckins
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportCheckinsEmptyListReturnsHeader() throws IOException {
        String csv = new String(strategy.exportCheckins(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.contains("ID,Username,PersonalCode,FullName,Company,Direction,Timestamp,SignaturePresent"));
    }

    @Test
    void testExportCheckinsAllFieldsPresentCorrectRow() throws IOException {
        User user = buildUser(10, "jdoe", "A001", "John", "Doe");

        Checkin checkin = new Checkin();
        checkin.setId(99);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(LocalDateTime.of(2025, Month.JUNE, 1, 9, 0));

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("99,jdoe,A001,John Doe,N/A,ENTRADA"));
    }

    @Test
    void testExportCheckinsNullUserShowsNA() throws IOException {
        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(null);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void testExportCheckinsNullIdShowsZero() throws IOException {
        User user = buildUser(5, "user", "X001", "A", "B");

        Checkin checkin = new Checkin();
        checkin.setId(null);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("0,user"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportFormations
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportFormationsEmptyListReturnsHeader() throws IOException {
        String csv = new String(strategy.exportFormations(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.contains("FormationID,FormationName,ScheduledDate"));
    }

    @Test
    void testExportFormationsWithAttendanceAndSignatureIncludesHashAndYES() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        LocalDateTime ci = LocalDateTime.of(2025, Month.JUNE, 1, 9, 0);
        LocalDateTime co = LocalDateTime.of(2025, Month.JUNE, 1, 10, 0);

        Formation f = buildFormation(10, "Safety Training", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, ci, co, "BASE64_SIG");
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("YES"));
        assertTrue(csv.contains("SHA256:"));
        assertTrue(csv.contains("60")); // 60 minutes duration
    }

    @Test
    void testExportFormationsWithAttendanceWithoutSignatureShowsNoAndHashNA() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(11, "Orientation", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user,
                LocalDateTime.of(2025, Month.JUNE, 1, 9, 0),
                LocalDateTime.of(2025, Month.JUNE, 1, 10, 30), null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
        assertTrue(csv.contains("N/A"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportAuditLogs
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportAuditLogsEmptyListReturnsHeader() throws IOException {
        String csv = new String(strategy.exportAuditLogs(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.contains("ID,Timestamp,Action,Username,Details,IPAddress,LogHash"));
    }

    @Test
    void testExportAuditLogsAllFieldsPresentCorrectRow() throws IOException {
        AuditLog log = new AuditLog("LOGIN", "jdoe", "User logged in", "127.0.0.1");

        String csv = new String(strategy.exportAuditLogs(List.of(log)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("LOGIN"));
        assertTrue(csv.contains("jdoe"));
        assertTrue(csv.contains("User logged in"));
        assertTrue(csv.contains("127.0.0.1"));
    }

    @Test
    void testExportAuditLogsNullFieldsDefaultToEmpty() throws IOException {
        AuditLog log = new AuditLog();
        log.setTimestamp(null);
        log.setAction(null);
        log.setDetails(null);
        log.setIpAddress(null);

        byte[] result = strategy.exportAuditLogs(List.of(log));
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.lines().count() >= 2);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportUserFormations
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportUserFormationsEmptyListReturnsHeader() throws IOException {
        String csv = new String(strategy.exportUserFormations(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.contains("UserID,Username,PersonalCode,FullName,Email,Locator,Company,Role,WorkingStatus,FormationID,FormationName,ScheduledDate,AttendanceStatus,CheckInTime,CheckOutTime,DurationMinutes,DurationFormatted,SignaturePresent,IntegrityHash"));
    }

    @Test
    void testExportUserFormationsWithDataReturnsFormattedRow() throws IOException {
        org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO dto = org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO.builder()
                .userId(1)
                .username("jdoe")
                .personalCode("PC01")
                .fullName("John Doe")
                .email("jdoe@test.com")
                .locator("AV")
                .companyName("Acme Corp")
                .authority("USER")
                .isWorking(true)
                .formationId(10)
                .formationName("Java Training")
                .formationDate(LocalDateTime.of(2026, 8, 1, 10, 0))
                .status("ASISTIÓ")
                .checkInDate(LocalDateTime.of(2026, 8, 1, 10, 5))
                .checkOutDate(LocalDateTime.of(2026, 8, 1, 12, 0))
                .durationMinutes(115L)
                .durationHoursFormatted("1h 55m (1.9h)")
                .hasSignature(true)
                .verificationHash("SHA256:TESTHASH")
                .build();

        String csv = new String(strategy.exportUserFormations(List.of(dto)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("1,jdoe,PC01,John Doe,jdoe@test.com,AV,Acme Corp,USER,YES,10,Java Training"));
        assertTrue(csv.contains("ASISTIÓ"));
        assertTrue(csv.contains("115"));
        assertTrue(csv.contains("SHA256:TESTHASH"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportSingleUserDossier
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportSingleUserDossierReturnsDossierSections() throws IOException {
        UserAnalyticsDTO user = UserAnalyticsDTO.builder()
                .userId(5)
                .username("analyst")
                .personalCode("P005")
                .firstName("Ana")
                .lastName("Lyst")
                .companyName("Beta Inc")
                .locator("MG")
                .authority("EMPLOYEE")
                .attendancePercentage(85.5)
                .totalFormationMinutes(240L)
                .build();

        org.springframework.samples.smartcheckin.analytics.UserFormationDetailDTO detail = org.springframework.samples.smartcheckin.analytics.UserFormationDetailDTO.builder()
                .formationId(101)
                .formationName("Security 101")
                .formationDate(LocalDateTime.of(2026, 8, 10, 9, 0))
                .status("COMPLETED")
                .durationMinutes(120L)
                .hasSignature(true)
                .signature("sig")
                .build();

        String csv = new String(strategy.exportSingleUserDossier(user, List.of(detail)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("# --- EMPLOYEE DOSSIER SUMMARY ---"));
        assertTrue(csv.contains("Username,analyst"));
        assertTrue(csv.contains("# --- FORMATION SESSIONS ---"));
        assertTrue(csv.contains("101,Security 101"));
    }
}
