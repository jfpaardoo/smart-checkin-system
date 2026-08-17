package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
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
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;

class ExcelExportStrategyTests {

    private static final String DETAIL_SHEET = "Detailed Attendances & Signatur";
    private static final String SUMMARY_SHEET = "Formations Summary";

    private ExcelExportStrategy strategy;

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

    // ─── Metadata & Styling ───────────────────────────────────────────────────

    @Test
    void getContentType_returnsXlsxMime() {
        assertEquals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                strategy.getContentType());
    }

    @Test
    void testGetFileExtensionReturnsXlsx() {
        assertEquals("xlsx", strategy.getFileExtension());
    }

    @Test
    void testHeaderStylingAndFreezePane() throws Exception {
        byte[] bytes = strategy.exportUsers(Collections.emptyList());
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Employees Analytics");
            assertNotNull(sheet);
            assertTrue(sheet.isDisplayGridlines());
            assertNotNull(sheet.getPaneInformation());
            assertTrue(sheet.getPaneInformation().isFreezePane());

            Row headerRow = sheet.getRow(0);
            assertEquals(24f, headerRow.getHeightInPoints(), 0.1);

            Cell firstCell = headerRow.getCell(0);
            assertNotNull(firstCell);
            CellStyle style = firstCell.getCellStyle();
            assertNotNull(style);

            Font font = wb.getFontAt(style.getFontIndex());
            assertTrue(font.getBold());
            assertEquals(10, font.getFontHeightInPoints());
            assertEquals(IndexedColors.WHITE.getIndex(), font.getColor());

            assertTrue(sheet.getColumnWidth(0) >= 3000);
        }
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
    void exportUsers_allFieldsPresent_correctCellValuesAndZebraStriping() throws Exception {
        UserAnalyticsDTO u1 = UserAnalyticsDTO.builder()
                .userId(1).username("jdoe").personalCode("A001").locator("L01")
                .firstName("John").lastName("Doe").authority("ADMIN").companyName("Logistics Corp")
                .isWorking(true).totalCheckins(10).totalWorkMinutes(600L)
                .formationsAssigned(5).formationsAttended(4).formationsCompleted(4)
                .attendancePercentage(80.0).totalFormationMinutes(120L).build();

        UserAnalyticsDTO u2 = UserAnalyticsDTO.builder()
                .userId(2).username("asmith").personalCode("A002").locator("L02")
                .firstName("Alice").lastName("Smith").authority("EMPLOYEE").companyName("Transportes SL")
                .isWorking(false).totalCheckins(5).totalWorkMinutes(300L)
                .formationsAssigned(2).formationsAttended(2).formationsCompleted(2)
                .attendancePercentage(100.0).totalFormationMinutes(60L).build();

        byte[] bytes = strategy.exportUsers(List.of(u1, u2));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Employees Analytics");
            assertEquals(2, sheet.getLastRowNum());

            // Row 1 (Non-Zebra)
            Row row1 = sheet.getRow(1);
            assertEquals(18f, row1.getHeightInPoints(), 0.1);
            assertEquals(1.0, row1.getCell(0).getNumericCellValue());
            assertEquals("jdoe", row1.getCell(1).getStringCellValue());
            assertEquals("A001", row1.getCell(2).getStringCellValue());
            assertEquals("L01", row1.getCell(3).getStringCellValue());
            assertEquals("John", row1.getCell(4).getStringCellValue());
            assertEquals("Doe", row1.getCell(5).getStringCellValue());
            assertEquals("Logistics Corp", row1.getCell(6).getStringCellValue());
            assertEquals("ADMIN", row1.getCell(7).getStringCellValue());
            assertEquals("YES", row1.getCell(8).getStringCellValue());
            assertEquals(10.0, row1.getCell(9).getNumericCellValue());
            assertEquals(600.0, row1.getCell(10).getNumericCellValue());
            assertEquals(5.0, row1.getCell(11).getNumericCellValue());
            assertEquals(4.0, row1.getCell(12).getNumericCellValue());
            assertEquals(4.0, row1.getCell(13).getNumericCellValue());
            assertEquals(80.0, row1.getCell(14).getNumericCellValue());
            assertEquals(120.0, row1.getCell(15).getNumericCellValue());

            // Row 2 (Zebra)
            Row row2 = sheet.getRow(2);
            assertEquals(18f, row2.getHeightInPoints(), 0.1);
            assertEquals(2.0, row2.getCell(0).getNumericCellValue());
            assertEquals("asmith", row2.getCell(1).getStringCellValue());
            assertEquals("NO", row2.getCell(8).getStringCellValue());
            assertNotEquals(row1.getCell(1).getCellStyle(), row2.getCell(1).getCellStyle());
        }
    }

    @Test
    void exportUsers_isWorkingNull_cellShowsNO() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(3).username("bob").personalCode("A003")
                .firstName("Bob").lastName("Builder")
                .isWorking(null).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            assertEquals("NO", wb.getSheet("Employees Analytics").getRow(1).getCell(8).getStringCellValue());
        }
    }

    @Test
    void exportUsers_nullOptionalFields_usesDefaults() throws Exception {
        UserAnalyticsDTO u = UserAnalyticsDTO.builder()
                .userId(null).username(null).personalCode(null).locator(null)
                .firstName(null).lastName(null).authority(null).companyName(null)
                .isWorking(false).totalCheckins(null).totalWorkMinutes(null)
                .formationsAssigned(null).formationsAttended(null).formationsCompleted(null)
                .attendancePercentage(null).totalFormationMinutes(null).build();

        byte[] bytes = strategy.exportUsers(List.of(u));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Employees Analytics").getRow(1);
            assertEquals(0.0, row.getCell(0).getNumericCellValue());
            assertEquals("N/A", row.getCell(1).getStringCellValue());
            assertEquals("N/A", row.getCell(2).getStringCellValue());
            assertEquals("N/A", row.getCell(3).getStringCellValue());
            assertEquals("N/A", row.getCell(4).getStringCellValue());
            assertEquals("N/A", row.getCell(5).getStringCellValue());
            assertEquals("N/A", row.getCell(6).getStringCellValue());
            assertEquals("N/A", row.getCell(7).getStringCellValue());
            assertEquals("NO", row.getCell(8).getStringCellValue());
            assertEquals(0.0, row.getCell(9).getNumericCellValue());
            assertEquals(0.0, row.getCell(10).getNumericCellValue());
            assertEquals(0.0, row.getCell(11).getNumericCellValue());
            assertEquals(0.0, row.getCell(12).getNumericCellValue());
            assertEquals(0.0, row.getCell(13).getNumericCellValue());
            assertEquals(0.0, row.getCell(14).getNumericCellValue());
            assertEquals(0.0, row.getCell(15).getNumericCellValue());
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
    void exportCheckins_allFieldsPresent_correctRowAndZebra() throws Exception {
        User user = buildUser(10, "jdoe", "A001", "John", "Doe");
        Company company = new Company();
        company.setName("Alpha Logistics");
        user.setCompany(company);

        Checkin c1 = new Checkin();
        c1.setId(99);
        c1.setUser(user);
        c1.setCheckInType(CheckinType.ENTRADA);
        c1.setCheckInDate(LocalDateTime.of(2025, Month.JUNE, 1, 9, 0));
        c1.setSignature("data:image/png;base64,ABCDEF");

        Checkin c2 = new Checkin();
        c2.setId(100);
        c2.setUser(user);
        c2.setCheckInType(CheckinType.SALIDA);
        c2.setCheckInDate(LocalDateTime.of(2025, Month.JUNE, 1, 17, 0));
        c2.setSignature(null);

        byte[] bytes = strategy.exportCheckins(List.of(c1, c2));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Checkins");
            Row row1 = sheet.getRow(1);
            assertEquals(99.0, row1.getCell(0).getNumericCellValue());
            assertEquals("jdoe", row1.getCell(1).getStringCellValue());
            assertEquals("A001", row1.getCell(2).getStringCellValue());
            assertEquals("John Doe", row1.getCell(3).getStringCellValue());
            assertEquals("Alpha Logistics", row1.getCell(4).getStringCellValue());
            assertEquals("ENTRADA", row1.getCell(5).getStringCellValue());
            assertTrue(row1.getCell(6).getStringCellValue().contains("01/06/2025"));
            assertEquals("YES", row1.getCell(7).getStringCellValue());

            Row row2 = sheet.getRow(2);
            assertEquals(100.0, row2.getCell(0).getNumericCellValue());
            assertEquals("SALIDA", row2.getCell(5).getStringCellValue());
            assertEquals("NO", row2.getCell(7).getStringCellValue());
        }
    }

    @Test
    void exportCheckins_nullUserAndFields_handlesGracefully() throws Exception {
        Checkin c = new Checkin();
        c.setId(null);
        c.setUser(null);
        c.setCheckInType(null);
        c.setCheckInDate(null);
        c.setSignature("");

        byte[] bytes = strategy.exportCheckins(List.of(c));
        try (Workbook wb = toWorkbook(bytes)) {
            Row row = wb.getSheet("Checkins").getRow(1);
            assertEquals(0.0, row.getCell(0).getNumericCellValue());
            assertEquals("N/A", row.getCell(1).getStringCellValue());
            assertEquals("N/A", row.getCell(2).getStringCellValue());
            assertEquals("N/A", row.getCell(3).getStringCellValue());
            assertEquals("N/A", row.getCell(4).getStringCellValue());
            assertEquals("N/A", row.getCell(5).getStringCellValue());
            assertEquals("N/A", row.getCell(6).getStringCellValue());
            assertEquals("NO", row.getCell(7).getStringCellValue());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // exportFormations
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void exportFormations_emptyList_returnsTwoSheets() throws Exception {
        byte[] bytes = strategy.exportFormations(Collections.emptyList());
        try (Workbook wb = toWorkbook(bytes)) {
            assertNotNull(wb.getSheet(SUMMARY_SHEET));
            assertNotNull(wb.getSheet(DETAIL_SHEET));
        }
    }

    @Test
    void exportFormations_summarySheetValuesChecked() throws Exception {
        LocalDateTime date = LocalDateTime.of(2025, Month.SEPTEMBER, 15, 10, 0);
        Formation f1 = buildFormation(101, "Seguridad en Planta", date, new ArrayList<>());
        FormationAttendance att = buildAttendance(f1, buildUser(1, "u1", "P1", "A", "B"), date, date.plusHours(2), "SIG");
        f1.getAttendances().add(att);

        Formation f2 = buildFormation(102, "Manipulación Alimentos", null, null);

        byte[] bytes = strategy.exportFormations(List.of(f1, f2));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet summary = wb.getSheet(SUMMARY_SHEET);
            assertNotNull(summary);

            Row r1 = summary.getRow(1);
            assertEquals(101.0, r1.getCell(0).getNumericCellValue());
            assertEquals("Seguridad en Planta", r1.getCell(1).getStringCellValue());
            assertTrue(r1.getCell(2).getStringCellValue().contains("15/09/2025"));
            assertEquals(1.0, r1.getCell(3).getNumericCellValue());

            Row r2 = summary.getRow(2);
            assertEquals(102.0, r2.getCell(0).getNumericCellValue());
            assertEquals("Manipulación Alimentos", r2.getCell(1).getStringCellValue());
            assertEquals("N/A", r2.getCell(2).getStringCellValue());
            assertEquals(0.0, r2.getCell(3).getNumericCellValue());
        }
    }

    @Test
    void exportFormations_detailSheetAllCellsChecked() throws Exception {
        LocalDateTime date = LocalDateTime.of(2025, Month.AUGUST, 10, 9, 0);
        User user = buildUser(5, "student1", "P005", "Carlos", "Santana");
        Company company = new Company();
        company.setName("Distribuciones SA");
        user.setCompany(company);

        Formation f = buildFormation(200, "Curso Avanzado", date, new ArrayList<>());
        FormationAttendance att1 = buildAttendance(f, user, date, date.plusMinutes(90), "BASE64_SIG");
        FormationAttendance att2 = buildAttendance(f, null, null, null, null);

        f.setAttendances(List.of(att1, att2));

        byte[] bytes = strategy.exportFormations(List.of(f));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet detail = wb.getSheet(DETAIL_SHEET);
            assertNotNull(detail);

            // Row 1 (Full Attendance)
            Row row1 = detail.getRow(1);
            assertEquals(200.0, row1.getCell(0).getNumericCellValue());
            assertEquals("Curso Avanzado", row1.getCell(1).getStringCellValue());
            assertTrue(row1.getCell(2).getStringCellValue().contains("10/08/2025"));
            assertEquals(5.0, row1.getCell(3).getNumericCellValue());
            assertEquals("student1", row1.getCell(4).getStringCellValue());
            assertEquals("P005", row1.getCell(5).getStringCellValue());
            assertEquals("Carlos Santana", row1.getCell(6).getStringCellValue());
            assertEquals("Distribuciones SA", row1.getCell(7).getStringCellValue());
            assertTrue(row1.getCell(8).getStringCellValue().contains("10/08/2025"));
            assertTrue(row1.getCell(9).getStringCellValue().contains("10/08/2025"));
            assertEquals(90.0, row1.getCell(10).getNumericCellValue());
            assertEquals("YES", row1.getCell(11).getStringCellValue());
            assertTrue(row1.getCell(12).getStringCellValue().startsWith("SHA256:"));

            // Row 2 (Nulls)
            Row row2 = detail.getRow(2);
            assertEquals(0.0, row2.getCell(3).getNumericCellValue());
            assertEquals("N/A", row2.getCell(4).getStringCellValue());
            assertEquals("N/A", row2.getCell(5).getStringCellValue());
            assertEquals("N/A", row2.getCell(6).getStringCellValue());
            assertEquals("N/A", row2.getCell(7).getStringCellValue());
            assertEquals("N/A", row2.getCell(8).getStringCellValue());
            assertEquals("N/A", row2.getCell(9).getStringCellValue());
            assertEquals(0.0, row2.getCell(10).getNumericCellValue());
            assertEquals("NO", row2.getCell(11).getStringCellValue());
            assertEquals("N/A", row2.getCell(12).getStringCellValue());
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
            assertEquals("ID", sheet.getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    void exportAuditLogs_allFieldsPresent_correctRowAndHash() throws Exception {
        AuditLog log1 = new AuditLog("LOGIN", "jdoe", "User logged in", "127.0.0.1");
        log1.setId(10);
        log1.setTimestamp(LocalDateTime.of(2025, Month.JULY, 1, 12, 30));

        AuditLog log2 = new AuditLog(null, null, null, null);
        log2.setId(null);
        log2.setTimestamp(null);

        byte[] bytes = strategy.exportAuditLogs(List.of(log1, log2));
        try (Workbook wb = toWorkbook(bytes)) {
            Sheet sheet = wb.getSheet("Audit Logs");
            Row row1 = sheet.getRow(1);
            assertEquals(10.0, row1.getCell(0).getNumericCellValue());
            assertTrue(row1.getCell(1).getStringCellValue().contains("01/07/2025"));
            assertEquals("LOGIN", row1.getCell(2).getStringCellValue());
            assertEquals("jdoe", row1.getCell(3).getStringCellValue());
            assertEquals("User logged in", row1.getCell(4).getStringCellValue());
            assertEquals("127.0.0.1", row1.getCell(5).getStringCellValue());
            assertNotNull(row1.getCell(6).getStringCellValue());
            assertFalse(row1.getCell(6).getStringCellValue().isEmpty());

            Row row2 = sheet.getRow(2);
            assertEquals(0.0, row2.getCell(0).getNumericCellValue());
            assertEquals("N/A", row2.getCell(1).getStringCellValue());
            assertEquals("N/A", row2.getCell(2).getStringCellValue());
            assertEquals("N/A", row2.getCell(3).getStringCellValue());
            assertEquals("N/A", row2.getCell(4).getStringCellValue());
            assertEquals("N/A", row2.getCell(5).getStringCellValue());
        }
    }
}
