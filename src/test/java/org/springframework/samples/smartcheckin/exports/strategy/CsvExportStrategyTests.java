package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
    void getContentType_returnsCsvMimeType() {
        assertEquals("text/csv", strategy.getContentType());
    }

    @Test
    void getFileExtension_returnsCsv() {
        assertEquals("csv", strategy.getFileExtension());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportUsers
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportUsers_emptyList_returnsOnlyHeader() throws IOException {
        byte[] result = strategy.exportUsers(Collections.emptyList());
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("ID,Username,PersonalCode,FirstName,LastName,Role,CurrentlyInFormation,FormationsAssigned,FormationsAttended,AttendanceRate,TotalFormationMinutes\n"));
        assertEquals(1, csv.trim().split("\n").length);
    }

    @Test
    void exportUsers_allFieldsPresent_correctRow() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(1).username("jdoe").personalCode("A001")
                .firstName("John").lastName("Doe").authority("ADMIN")
                .isWorking(true).formationsAssigned(5).formationsAttended(4)
                .attendancePercentage(80.0).totalFormationMinutes(120L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("1,jdoe,A001,John,Doe,ADMIN,YES,5,4,80.0,120"));
    }

    @Test
    void exportUsers_isWorkingFalse_showsNO() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(2).username("jsmith").personalCode("A002")
                .firstName("Jane").lastName("Smith").authority("USER")
                .isWorking(false).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
    }

    @Test
    void exportUsers_isWorkingNull_showsNO() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(3).isWorking(null).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
    }

    @Test
    void exportUsers_nullOptionalFields_defaultsApplied() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(4).username(null).personalCode(null).firstName(null).lastName(null)
                .authority(null).isWorking(true).formationsAssigned(null)
                .formationsAttended(null).attendancePercentage(null).totalFormationMinutes(null).build();

        byte[] result = strategy.exportUsers(List.of(u));
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
        assertTrue(csv.contains(",0,0,0.0,0"));
    }

    @Test
    void exportUsers_commasInName_replaced() throws IOException {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(5).username("user,name").firstName("First,Name").lastName("Last,Name")
                .authority("USER").isWorking(false).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        String csv = new String(strategy.exportUsers(List.of(u)), StandardCharsets.UTF_8);
        assertFalse(csv.contains("user,name,"));
        assertTrue(csv.contains("user name"));
        assertTrue(csv.contains("First Name"));
        assertTrue(csv.contains("Last Name"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportCheckins
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportCheckins_emptyList_returnsHeader() throws IOException {
        String csv = new String(strategy.exportCheckins(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("ID,User,PersonalCode,Direction,Timestamp"));
        assertEquals(1, csv.trim().split("\n").length);
    }

    @Test
    void exportCheckins_allFieldsPresent_correctRow() throws IOException {
        User user = buildUser(10, "jdoe", "A001", "John", "Doe");

        Checkin checkin = new Checkin();
        checkin.setId(99);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(LocalDateTime.of(2025, 6, 1, 9, 0));

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("99,jdoe,A001,ENTRADA"));
    }

    @Test
    void exportCheckins_nullUser_showsNA() throws IOException {
        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(null);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void exportCheckins_userWithNullUsernameAndPersonalCode_showsNA() throws IOException {
        User user = buildUser(5, null, null, "Jane", "Doe");

        Checkin checkin = new Checkin();
        checkin.setId(2);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void exportCheckins_nullId_showsZero() throws IOException {
        User user = buildUser(5, "user", "X001", "A", "B");

        Checkin checkin = new Checkin();
        checkin.setId(null);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("0,user"));
    }

    @Test
    void exportCheckins_nullCheckInType_showsNA() throws IOException {
        User user = buildUser(5, "user", "X001", "A", "B");

        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(user);
        checkin.setCheckInType(null);
        checkin.setCheckInDate(LocalDateTime.now());

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void exportCheckins_nullCheckInDate_showsNA() throws IOException {
        User user = buildUser(5, "user", "X001", "A", "B");

        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(null);

        String csv = new String(strategy.exportCheckins(List.of(checkin)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportFormations
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportFormations_emptyList_returnsHeader() throws IOException {
        String csv = new String(strategy.exportFormations(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("FormationID,FormationName,ScheduledDate"));
    }

    @Test
    void exportFormations_nullAttendances_skipsRows() throws IOException {
        Formation f = buildFormation(1, "Intro", LocalDateTime.now().plusDays(1), null);
        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertEquals(1, csv.trim().split("\n").length);
    }

    @Test
    void exportFormations_emptyAttendances_skipsRows() throws IOException {
        Formation f = buildFormation(1, "Intro", LocalDateTime.now().plusDays(1), new ArrayList<>());
        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertEquals(1, csv.trim().split("\n").length);
    }

    @Test
    void exportFormations_withAttendanceAndSignature_includesHashAndYES() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        LocalDateTime ci = LocalDateTime.of(2025, 6, 1, 9, 0);
        LocalDateTime co = LocalDateTime.of(2025, 6, 1, 10, 0);

        Formation f = buildFormation(10, "Safety Training", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, ci, co, "BASE64_SIG");
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("YES"));
        assertTrue(csv.contains("SHA256:"));
        assertTrue(csv.contains("60")); // 60 minutes duration
    }

    @Test
    void exportFormations_withAttendanceWithoutSignature_showsNoAndHashNA() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(11, "Orientation", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user,
                LocalDateTime.of(2025, 6, 1, 9, 0),
                LocalDateTime.of(2025, 6, 1, 10, 30), null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void exportFormations_withBlankSignature_hashIsNA() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(12, "Meeting", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, LocalDateTime.now(), LocalDateTime.now().plusHours(1), "   ");
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("NO"));
    }

    @Test
    void exportFormations_nullCheckInOrCheckOut_durationIsZero() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(13, "Test", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, null, null, null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains(",0,"));
    }

    @Test
    void exportFormations_nullUserOnAttendance_showsNA() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        Formation f = buildFormation(14, "Null User Test", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, null,
                LocalDateTime.of(2025, 1, 1, 8, 0),
                LocalDateTime.of(2025, 1, 1, 9, 0), null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("N/A"));
    }

    @Test
    void exportFormations_nullFormationIdAndName_showsDefaults() throws IOException {
        Formation f = new Formation();
        f.setId(null);
        f.setName(null);
        f.setFormationDate(null);

        User user = buildUser(1, "jdoe", "A001", "John", "Doe");
        FormationAttendance att = buildAttendance(f, user, null, null, null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("0,N/A,N/A"));
    }

    @Test
    void exportFormations_nameWithComma_replaced() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        Formation f = buildFormation(20, "Safety, Training", date, new ArrayList<>());
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");
        FormationAttendance att = buildAttendance(f, user,
                LocalDateTime.of(2025, 6, 1, 9, 0),
                LocalDateTime.of(2025, 6, 1, 10, 0), null);
        f.setAttendances(List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertFalse(csv.contains("Safety, Training,"));
    }

    @Test
    void exportFormations_nullAttendanceFormationRef_hashNotCrash() throws IOException {
        // att.getFormation() == null triggers the null branch in generateVerificationHash
        FormationAttendance att = new FormationAttendance();
        att.setFormation(null);
        att.setUser(buildUser(1, "jdoe", "A001", "John", "Doe"));
        att.setCheckInDate(LocalDateTime.now());
        att.setCheckOutDate(LocalDateTime.now().plusHours(1));
        att.setSignature("SOME_SIG");

        Formation f = buildFormation(15, "Test Null Formation Ref", LocalDateTime.now().plusDays(1), List.of(att));

        String csv = new String(strategy.exportFormations(List.of(f)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("SHA256:"));
    }

    @Test
    void exportFormations_userWithNullPersonalCode_doesNotThrow() throws IOException {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", null, "John", "Doe");
        Formation f = buildFormation(60, "Test", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user,
                LocalDateTime.of(2025, 6, 1, 9, 0),
                LocalDateTime.of(2025, 6, 1, 10, 0), "SIG");
        f.setAttendances(List.of(att));

        byte[] result = strategy.exportFormations(List.of(f));
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportAuditLogs
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportAuditLogs_emptyList_returnsHeader() throws IOException {
        String csv = new String(strategy.exportAuditLogs(Collections.emptyList()), StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("Timestamp,Action,Details,IPAddress\n"));
        assertEquals(1, csv.trim().split("\n").length);
    }

    @Test
    void exportAuditLogs_allFieldsPresent_correctRow() throws IOException {
        AuditLog log = new AuditLog("LOGIN", "jdoe", "User logged in", "127.0.0.1");

        String csv = new String(strategy.exportAuditLogs(List.of(log)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("LOGIN"));
        assertTrue(csv.contains("User logged in"));
        assertTrue(csv.contains("127.0.0.1"));
    }

    @Test
    void exportAuditLogs_nullFields_defaultToEmpty() throws IOException {
        AuditLog log = new AuditLog();
        log.setTimestamp(null);
        log.setAction(null);
        log.setDetails(null);
        log.setIpAddress(null);

        byte[] result = strategy.exportAuditLogs(List.of(log));
        String csv = new String(result, StandardCharsets.UTF_8);
        assertTrue(csv.lines().count() >= 2);
    }

    @Test
    void exportAuditLogs_commasInActionAndDetails_replaced() throws IOException {
        AuditLog log = new AuditLog("LOGIN,ATTEMPT", "jdoe", "Details, with comma", "192.168.0.1");

        String csv = new String(strategy.exportAuditLogs(List.of(log)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("LOGIN ATTEMPT"));
        assertTrue(csv.contains("Details  with comma") || csv.contains("Details with comma"));
    }

    @Test
    void exportAuditLogs_timestampPresent_included() throws IOException {
        AuditLog log = new AuditLog("LOGOUT", "jdoe", "User logged out", "10.0.0.1");
        assertNotNull(log.getTimestamp());

        String csv = new String(strategy.exportAuditLogs(List.of(log)), StandardCharsets.UTF_8);
        assertTrue(csv.contains(log.getTimestamp().toString()));
    }

    @Test
    void exportAuditLogs_multipleRows_allPresent() throws IOException {
        AuditLog log1 = new AuditLog("LOGIN", "user1", "Login success", "1.1.1.1");
        AuditLog log2 = new AuditLog("LOGOUT", "user2", "Logout", "2.2.2.2");

        String csv = new String(strategy.exportAuditLogs(List.of(log1, log2)), StandardCharsets.UTF_8);
        assertTrue(csv.contains("LOGIN"));
        assertTrue(csv.contains("LOGOUT"));
    }
}
