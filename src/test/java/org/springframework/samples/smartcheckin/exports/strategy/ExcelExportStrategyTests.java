package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.time.Month;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;

class ExcelExportStrategyTests {

    // Apache POI truncates sheet names to 31 chars max
    private static final String DETAIL_SHEET = "Detailed Attendances & Signatur";

    private ExcelExportStrategy strategy;

    // ─── Helpers ────────────────────────────────────────────────────────────────

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

    private Workbook toWorkbook(byte[] bytes) throws Exception {
        return new XSSFWorkbook(new ByteArrayInputStream(bytes));
    }

    @BeforeEach
    void setUp() {
        strategy = new ExcelExportStrategy();
    }

    // ─── Metadata ───────────────────────────────────────────────────────────────

    @Test
    void getContentType_returnsXlsxMime() {
        assertEquals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                strategy.getContentType());
    }

    @Test
    void testGetFileExtensionReturnsXlsx() {
        assertEquals("xlsx", strategy.getFileExtension());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportUsers
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void testExportUsersReturnsWorkbookWithHeaderOnly() throws Exception {
        byte[] bytes = strategy.exportUsers(Collections.emptyList());
        assertNotNull(bytes);
        assertTrue(bytes.length > 0);
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Employees Analytics");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum());
            assertEquals("ID", sheet.getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    void exportUsers_allFieldsPresent_correctCellValues() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(1).username("jdoe").personalCode("A001")
                .firstName("John").lastName("Doe").authority("ADMIN")
                .isWorking(true).formationsAssigned(5).formationsAttended(4)
                .attendancePercentage(80.0).totalFormationMinutes(120L).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Employees Analytics");
            Row row = sheet.getRow(1);
            assertEquals(1.0, row.getCell(0).getNumericCellValue());
            assertEquals("jdoe", row.getCell(1).getStringCellValue());
            assertEquals("A001", row.getCell(2).getStringCellValue());
            assertEquals("John", row.getCell(3).getStringCellValue());
            assertEquals("Doe", row.getCell(4).getStringCellValue());
            assertEquals("ADMIN", row.getCell(5).getStringCellValue());
            assertEquals("YES", row.getCell(6).getStringCellValue());
            assertEquals(5.0, row.getCell(7).getNumericCellValue());
            assertEquals(4.0, row.getCell(8).getNumericCellValue());
            assertEquals(80.0, row.getCell(9).getNumericCellValue());
            assertEquals(120.0, row.getCell(10).getNumericCellValue());
        }
    }

    @Test
    void exportUsers_isWorkingFalse_cellShowsNO() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(2).username("jane").personalCode("A002")
                .firstName("Jane").lastName("Doe").authority("USER")
                .isWorking(false).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals("NO", wb.getSheet("Employees Analytics").getRow(1).getCell(6).getStringCellValue());
        }
    }

    @Test
    void exportUsers_isWorkingNull_cellShowsNO() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(3).isWorking(null).formationsAssigned(0).formationsAttended(0)
                .attendancePercentage(0.0).totalFormationMinutes(0L).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals("NO", wb.getSheet("Employees Analytics").getRow(1).getCell(6).getStringCellValue());
        }
    }

    @Test
    void exportUsers_nullOptionalFields_usesDefaults() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(4).username(null).personalCode(null)
                .firstName(null).lastName(null).authority(null)
                .isWorking(false).formationsAssigned(null).formationsAttended(null)
                .attendancePercentage(null).totalFormationMinutes(null).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Employees Analytics").getRow(1);
            assertEquals("N/A", row.getCell(5).getStringCellValue());
            assertEquals(0.0, row.getCell(7).getNumericCellValue());
            assertEquals(0.0, row.getCell(8).getNumericCellValue());
            assertEquals(0.0, row.getCell(9).getNumericCellValue());
            assertEquals(0.0, row.getCell(10).getNumericCellValue());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportCheckins
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportCheckins_emptyList_returnsHeaderSheet() throws Exception {
        byte[] bytes = strategy.exportCheckins(Collections.emptyList());
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Checkins");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum());
            assertEquals("ID", sheet.getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_allFieldsPresent_correctRow() throws Exception {
        User user = buildUser(10, "jdoe", "A001", "John", "Doe");
        Checkin checkin = new Checkin();
        checkin.setId(99);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(LocalDateTime.of(2025, Month.JUNE, 1, 9, 0));

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Checkins").getRow(1);
            assertEquals(99.0, row.getCell(0).getNumericCellValue());
            assertEquals("jdoe", row.getCell(1).getStringCellValue());
            assertEquals("A001", row.getCell(2).getStringCellValue());
            assertEquals("ENTRADA", row.getCell(3).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_nullUser_showsNA() throws Exception {
        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(null);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Checkins").getRow(1);
            assertEquals("N/A", row.getCell(1).getStringCellValue());
            assertEquals("N/A", row.getCell(2).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_userNullUsernameAndPersonalCode_showsNA() throws Exception {
        User user = buildUser(5, null, null, "Jane", "Doe");
        Checkin checkin = new Checkin();
        checkin.setId(2);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(LocalDateTime.now());

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Checkins").getRow(1);
            assertEquals("N/A", row.getCell(1).getStringCellValue());
            assertEquals("N/A", row.getCell(2).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_nullId_showsZero() throws Exception {
        User user = buildUser(5, "user", "X001", "A", "B");
        Checkin checkin = new Checkin();
        checkin.setId(null);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.SALIDA);
        checkin.setCheckInDate(LocalDateTime.now());

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals(0.0, wb.getSheet("Checkins").getRow(1).getCell(0).getNumericCellValue());
        }
    }

    @Test
    void exportCheckins_nullType_showsNA() throws Exception {
        User user = buildUser(5, "user", "X001", "A", "B");
        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(user);
        checkin.setCheckInType(null);
        checkin.setCheckInDate(LocalDateTime.now());

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals("N/A", wb.getSheet("Checkins").getRow(1).getCell(3).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_nullDate_showsNA() throws Exception {
        User user = buildUser(5, "user", "X001", "A", "B");
        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setUser(user);
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setCheckInDate(null);

        byte[] bytes = strategy.exportCheckins(List.of(checkin));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals("N/A", wb.getSheet("Checkins").getRow(1).getCell(4).getStringCellValue());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportFormations
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportFormations_emptyList_returnsTwoSheets() throws Exception {
        byte[] bytes = strategy.exportFormations(Collections.emptyList());
        try (Workbook wb = toWorkbook(bytes)) {
            assertNotNull(wb.getSheet("Formations Summary"));
            // Apache POI truncates sheet names > 31 chars
            assertNotNull(wb.getSheet(DETAIL_SHEET));
        }
    }

    @Test
    void exportFormations_withFormationNoAttendances_summaryRow() throws Exception {
        Formation f = buildFormation(1, "Intro", LocalDateTime.now().plusDays(1), new ArrayList<>());

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet summary = wb.getSheet("Formations Summary");
            Row row = summary.getRow(1);
            assertNotNull(row);
            assertEquals("Intro", row.getCell(1).getStringCellValue());
            assertEquals(0.0, row.getCell(3).getNumericCellValue());
            assertEquals(0.0, row.getCell(4).getNumericCellValue());
            assertEquals(0.0, row.getCell(5).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_withNullAttendances_summaryRow() throws Exception {
        Formation f = buildFormation(1, "Test", LocalDateTime.now().plusDays(1), null);

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Formations Summary").getRow(1);
            assertEquals(0.0, row.getCell(3).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_withAttendanceAndSignature_detailSheetHasYES() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");
        LocalDateTime ci = LocalDateTime.of(2025, Month.JUNE, 1, 9, 0);
        LocalDateTime co = LocalDateTime.of(2025, Month.JUNE, 1, 10, 0);

        Formation f = buildFormation(10, "Safety", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, ci, co, "SIGNATURE");
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail, "Detail sheet must exist (truncated to 31 chars)");
            Row row = detail.getRow(1);
            assertEquals("YES", row.getCell(9).getStringCellValue());
            assertTrue(row.getCell(10).getStringCellValue().startsWith("SHA256:"));
            assertEquals(60.0, row.getCell(8).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_withAttendanceNoSignature_detailSheetHasNO() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(11, "Orientation", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user,
                LocalDateTime.of(2025, Month.JUNE, 1, 9, 0),
                LocalDateTime.of(2025, Month.JUNE, 1, 10, 30), null);
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);
            Row row = detail.getRow(1);
            assertEquals("NO", row.getCell(9).getStringCellValue());
            assertEquals("N/A", row.getCell(10).getStringCellValue());
        }
    }

    @Test
    void exportFormations_blankSignature_detailSheetHasNO() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(12, "Meeting", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, LocalDateTime.now(), LocalDateTime.now().plusHours(1), "   ");
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);
            assertEquals("NO", detail.getRow(1).getCell(9).getStringCellValue());
        }
    }

    @Test
    void exportFormations_nullCheckInCheckOut_durationZero() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user = buildUser(1, "jdoe", "A001", "John", "Doe");

        Formation f = buildFormation(13, "Zero Dur", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, user, null, null, null);
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);
            assertEquals(0.0, detail.getRow(1).getCell(8).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_nullUserOnAttendance_usesNA() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        Formation f = buildFormation(14, "Null User", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f, null,
                LocalDateTime.of(2025, Month.JANUARY, 1, 8, 0),
                LocalDateTime.of(2025, Month.JANUARY, 1, 9, 0), null);
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);
            Row row = detail.getRow(1);
            assertEquals("N/A", row.getCell(3).getStringCellValue());
            assertEquals("N/A", row.getCell(4).getStringCellValue());
        }
    }

    @Test
    void exportFormations_nullFormationIdAndName_useDefaults() throws Exception {
        Formation f = new Formation();
        f.setId(null);
        f.setName(null);
        f.setFormationDate(null);

        User user = buildUser(1, "jdoe", "A001", "John", "Doe");
        FormationAttendance att = buildAttendance(f, user, null, null, null);
        f.setAttendances(List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Row summaryRow = wb.getSheet("Formations Summary").getRow(1);
            assertEquals(0.0, summaryRow.getCell(0).getNumericCellValue());
            assertEquals("N/A", summaryRow.getCell(1).getStringCellValue());
            assertEquals("N/A", summaryRow.getCell(2).getStringCellValue());
        }
    }

    @Test
    void exportFormations_attendanceRateCalculation_correctPercent() throws Exception {
        LocalDateTime date = LocalDateTime.now().plusDays(3);
        User user1 = buildUser(1, "u1", "A001", "A", "B");
        User user2 = buildUser(2, "u2", "A002", "C", "D");

        Formation f = buildFormation(20, "Rate Test", date, new ArrayList<>());
        FormationAttendance att1 = buildAttendance(f, user1,
                LocalDateTime.of(2025, Month.JUNE, 1, 9, 0),
                LocalDateTime.of(2025, Month.JUNE, 1, 10, 0), null);
        // att2: no checkout (incomplete)
        FormationAttendance att2 = buildAttendance(f, user2,
                LocalDateTime.of(2025, Month.JUNE, 1, 9, 0), null, null);
        f.setAttendances(List.of(att1, att2));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Formations Summary").getRow(1);
            assertEquals(2.0, row.getCell(3).getNumericCellValue());
            assertEquals(1.0, row.getCell(4).getNumericCellValue());
            assertEquals(50.0, row.getCell(5).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_nullAttendanceFormationRef_hashStillGenerated() throws Exception {
        FormationAttendance att = new FormationAttendance();
        att.setFormation(null);
        att.setUser(buildUser(1, "jdoe", "A001", "John", "Doe"));
        att.setCheckInDate(LocalDateTime.now());
        att.setCheckOutDate(LocalDateTime.now().plusHours(1));
        att.setSignature("SOME_SIG");

        Formation f = buildFormation(15, "Test", LocalDateTime.now().plusDays(1), List.of(att));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);
            String hash = detail.getRow(1).getCell(10).getStringCellValue();
            assertTrue(hash.startsWith("SHA256:"));
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportAuditLogs
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportAuditLogs_emptyList_returnsHeaderSheet() throws Exception {
        byte[] bytes = strategy.exportAuditLogs(Collections.emptyList());
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Audit Logs");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum());
            assertEquals("Timestamp", sheet.getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    void exportAuditLogs_allFieldsPresent_correctRow() throws Exception {
        AuditLog log = new AuditLog("LOGIN", "jdoe", "User logged in", "127.0.0.1");

        byte[] bytes = strategy.exportAuditLogs(List.of(log));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Audit Logs").getRow(1);
            assertEquals("LOGIN", row.getCell(1).getStringCellValue());
            assertEquals("User logged in", row.getCell(2).getStringCellValue());
            assertEquals("127.0.0.1", row.getCell(3).getStringCellValue());
        }
    }

    @Test
    void exportAuditLogs_nullFields_usesEmpty() throws Exception {
        AuditLog log = new AuditLog();
        log.setTimestamp(null);
        log.setAction(null);
        log.setDetails(null);
        log.setIpAddress(null);

        byte[] bytes = strategy.exportAuditLogs(List.of(log));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Audit Logs").getRow(1);
            assertEquals("", row.getCell(0).getStringCellValue());
            assertEquals("", row.getCell(1).getStringCellValue());
            assertEquals("", row.getCell(2).getStringCellValue());
            assertEquals("", row.getCell(3).getStringCellValue());
        }
    }

    @Test
    void exportAuditLogs_multipleRows_allPresent() throws Exception {
        AuditLog log1 = new AuditLog("LOGIN", "u1", "Login", "1.1.1.1");
        AuditLog log2 = new AuditLog("LOGOUT", "u2", "Logout", "2.2.2.2");

        byte[] bytes = strategy.exportAuditLogs(List.of(log1, log2));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Audit Logs");
            assertEquals(2, sheet.getLastRowNum());
            assertEquals("LOGIN", sheet.getRow(1).getCell(1).getStringCellValue());
            assertEquals("LOGOUT", sheet.getRow(2).getCell(1).getStringCellValue());
        }
    }
}
