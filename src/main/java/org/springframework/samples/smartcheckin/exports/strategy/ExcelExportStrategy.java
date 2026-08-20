package org.springframework.samples.smartcheckin.exports.strategy;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationDetailDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ExcelExportStrategy implements DataExportStrategy {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final String USERNAME_HEADER = "Username";
    private static final String PERSONAL_CODE_HEADER = "Personal Code";
    private static final String COMPANY_HEADER = "Company";
    private static final String NOT_AVAILABLE = "N/A";
    private static final String YES = "YES";
    private static final String NO = "NO";

    private static class StyleRegistry {
        final CellStyle headerStyle;
        final CellStyle dataStyle;
        final CellStyle zebraStyle;
        final CellStyle centerStyle;
        final CellStyle centerZebraStyle;
        final CellStyle numberStyle;
        final CellStyle numberZebraStyle;

        StyleRegistry(Workbook workbook) {
            this.headerStyle = createHeaderStyle(workbook);
            this.dataStyle = createDataStyle(workbook, false, HorizontalAlignment.LEFT);
            this.zebraStyle = createDataStyle(workbook, true, HorizontalAlignment.LEFT);
            this.centerStyle = createDataStyle(workbook, false, HorizontalAlignment.CENTER);
            this.centerZebraStyle = createDataStyle(workbook, true, HorizontalAlignment.CENTER);
            this.numberStyle = createDataStyle(workbook, false, HorizontalAlignment.RIGHT);
            this.numberZebraStyle = createDataStyle(workbook, true, HorizontalAlignment.RIGHT);
        }

        private CellStyle createHeaderStyle(Workbook workbook) {
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            font.setFontHeightInPoints((short) 10);
            style.setFont(font);

            byte[] navyRgb = new byte[]{(byte) 30, (byte) 58, (byte) 138};
            ((org.apache.poi.xssf.usermodel.XSSFCellStyle) style)
                    .setFillForegroundColor(new XSSFColor(navyRgb, null));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            style.setAlignment(HorizontalAlignment.CENTER);
            style.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(style, IndexedColors.GREY_40_PERCENT.getIndex());
            return style;
        }

        private CellStyle createDataStyle(Workbook workbook, boolean zebra, HorizontalAlignment align) {
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setFontHeightInPoints((short) 9);
            style.setFont(font);
            style.setAlignment(align);
            style.setVerticalAlignment(VerticalAlignment.CENTER);

            if (zebra) {
                byte[] zebraRgb = new byte[]{(byte) 248, (byte) 250, (byte) 252};
                ((org.apache.poi.xssf.usermodel.XSSFCellStyle) style)
                        .setFillForegroundColor(new XSSFColor(zebraRgb, null));
                style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            applyBorders(style, IndexedColors.GREY_25_PERCENT.getIndex());
            return style;
        }

        private void applyBorders(CellStyle style, short colorIndex) {
            style.setBorderTop(BorderStyle.THIN);
            style.setTopBorderColor(colorIndex);
            style.setBorderBottom(BorderStyle.THIN);
            style.setBottomBorderColor(colorIndex);
            style.setBorderLeft(BorderStyle.THIN);
            style.setLeftBorderColor(colorIndex);
            style.setBorderRight(BorderStyle.THIN);
            style.setRightBorderColor(colorIndex);
        }
    }

    private void createHeaderRow(Sheet sheet, StyleRegistry styles, String... headers) {
        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(24);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(styles.headerStyle);
        }
        sheet.createFreezePane(0, 1);
    }

    private void autoSizeColumns(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
            int currentWidth = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.max(currentWidth + 1024, 3000));
        }
    }

    // ─── 1. Export Users ───────────────────────────────────────────────────────

    @Override
    public byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);
            Sheet sheet = workbook.createSheet("Employees Analytics");
            sheet.setDisplayGridlines(true);

            String[] headers = {
                    "ID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "Locator", "First Name", "Last Name",
                    COMPANY_HEADER, "Role", "In Formation", "Total Checkins", "Total Work Minutes",
                    "Formations Assigned", "Formations Attended", "Formations Completed",
                    "Attendance Rate (%)", "Total Formation Minutes"
            };
            createHeaderRow(sheet, styles, headers);

            int rowIdx = 1;
            if (users != null) {
                for (UserAnalyticsDTO u : users) {
                    appendUserExcelRow(sheet.createRow(rowIdx++), u, styles, (rowIdx % 2 == 0));
                }
            }

            autoSizeColumns(sheet, headers.length);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void appendUserExcelRow(Row row, UserAnalyticsDTO u, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), u.getUserId() != null ? u.getUserId() : 0, numStyle);
        setStringCell(row.createCell(1), u.getUsername(), txtStyle);
        setStringCell(row.createCell(2), u.getPersonalCode(), cntrStyle);
        setStringCell(row.createCell(3), u.getLocator(), cntrStyle);
        setStringCell(row.createCell(4), u.getFirstName(), txtStyle);
        setStringCell(row.createCell(5), u.getLastName(), txtStyle);
        setStringCell(row.createCell(6), u.getCompanyName(), txtStyle);
        setStringCell(row.createCell(7), u.getAuthority(), cntrStyle);
        setStringCell(row.createCell(8), Boolean.TRUE.equals(u.getIsWorking()) ? YES : NO, cntrStyle);

        setNumericCell(row.createCell(9), u.getTotalCheckins() != null ? u.getTotalCheckins() : 0, numStyle);
        setNumericCell(row.createCell(10), u.getTotalWorkMinutes() != null ? u.getTotalWorkMinutes() : 0, numStyle);
        setNumericCell(row.createCell(11), u.getFormationsAssigned() != null ? u.getFormationsAssigned() : 0, numStyle);
        setNumericCell(row.createCell(12), u.getFormationsAttended() != null ? u.getFormationsAttended() : 0, numStyle);
        setNumericCell(row.createCell(13), u.getFormationsCompleted() != null ? u.getFormationsCompleted() : 0, numStyle);

        double rate = u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0;
        setNumericCell(row.createCell(14), rate, numStyle);
        setNumericCell(row.createCell(15), u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0, numStyle);
    }

    // ─── 2. Export Checkins ───────────────────────────────────────────────────

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);
            Sheet sheet = workbook.createSheet("Checkins");
            sheet.setDisplayGridlines(true);

            String[] headers = {
                    "ID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "Full Name", COMPANY_HEADER,
                    "Checkin Type", "Timestamp", "Signature Present"
            };
            createHeaderRow(sheet, styles, headers);

            int rowIdx = 1;
            if (checkins != null) {
                for (Checkin c : checkins) {
                    appendCheckinExcelRow(sheet.createRow(rowIdx++), c, styles, (rowIdx % 2 == 0));
                }
            }

            autoSizeColumns(sheet, headers.length);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void appendCheckinExcelRow(Row row, Checkin c, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), c.getId() != null ? c.getId() : 0, numStyle);
        setStringCell(row.createCell(1), c.getUser() != null ? c.getUser().getUsername() : NOT_AVAILABLE, txtStyle);
        setStringCell(row.createCell(2), c.getUser() != null ? c.getUser().getPersonalCode() : NOT_AVAILABLE, cntrStyle);

        String fullName = c.getUser() != null ? (safe(c.getUser().getFirstName()) + " " + safe(c.getUser().getLastName())).trim() : NOT_AVAILABLE;
        setStringCell(row.createCell(3), fullName, txtStyle);

        String comp = (c.getUser() != null && c.getUser().getCompany() != null) ? c.getUser().getCompany().getName() : NOT_AVAILABLE;
        setStringCell(row.createCell(4), comp, txtStyle);

        setStringCell(row.createCell(5), c.getCheckInType() != null ? c.getCheckInType().name() : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(6), c.getCheckInDate() != null ? c.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);

        boolean hasSig = c.getSignature() != null && !c.getSignature().trim().isEmpty();
        setStringCell(row.createCell(7), hasSig ? YES : NO, cntrStyle);
    }

    // ─── 3. Export Formations ─────────────────────────────────────────────────

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);

            buildFormationsSummarySheet(workbook, formations, styles);
            buildDetailedAttendancesSheet(workbook, formations, styles);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void buildFormationsSummarySheet(Workbook workbook, List<Formation> formations, StyleRegistry styles) {
        Sheet sheet = workbook.createSheet("Formations Summary");
        sheet.setDisplayGridlines(true);

        String[] headers = {"Formation ID", "Formation Name", "Scheduled Date", "Enrolled Students"};
        createHeaderRow(sheet, styles, headers);

        int rowIdx = 1;
        if (formations != null) {
            for (Formation f : formations) {
                appendFormationSummaryRow(sheet.createRow(rowIdx++), f, styles, (rowIdx % 2 == 0));
            }
        }
        autoSizeColumns(sheet, headers.length);
    }

    private void appendFormationSummaryRow(Row row, Formation f, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), f.getId() != null ? f.getId() : 0, numStyle);
        setStringCell(row.createCell(1), f.getName(), txtStyle);
        setStringCell(row.createCell(2), f.getFormationDate() != null ? f.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        int enrolled = f.getAttendances() != null ? f.getAttendances().size() : 0;
        setNumericCell(row.createCell(3), enrolled, numStyle);
    }

    private void buildDetailedAttendancesSheet(Workbook workbook, List<Formation> formations, StyleRegistry styles) {
        Sheet sheet = workbook.createSheet("Detailed Attendances & Signatur");
        sheet.setDisplayGridlines(true);

        String[] headers = {
                "Formation ID", "Formation Name", "Scheduled Date", "User ID", USERNAME_HEADER,
                PERSONAL_CODE_HEADER, "Student Name", COMPANY_HEADER, "Check-in Time", "Check-out Time",
                "Duration (Minutes)", "Signature Present", "Integrity Verification Hash"
        };
        createHeaderRow(sheet, styles, headers);

        int rowIdx = 1;
        if (formations != null) {
            for (Formation f : formations) {
                if (f.getAttendances() == null) continue;
                for (FormationAttendance att : f.getAttendances()) {
                    appendAttendanceExcelRow(sheet.createRow(rowIdx++), f, att, styles, (rowIdx % 2 == 0));
                }
            }
        }
        autoSizeColumns(sheet, headers.length);
    }

    private void appendAttendanceExcelRow(Row row, Formation f, FormationAttendance att, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), f.getId() != null ? f.getId() : 0, numStyle);
        setStringCell(row.createCell(1), f.getName(), txtStyle);
        setStringCell(row.createCell(2), f.getFormationDate() != null ? f.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);

        populateAttendanceUserCells(row, att, styles, isZebra);

        setStringCell(row.createCell(8), att.getCheckInDate() != null ? att.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(9), att.getCheckOutDate() != null ? att.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);

        long duration = calculateAttendanceDuration(att);
        setNumericCell(row.createCell(10), duration, numStyle);

        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        setStringCell(row.createCell(11), hasSig ? YES : NO, cntrStyle);
        setStringCell(row.createCell(12), hasSig ? ExportUtils.generateVerificationHash(att) : NOT_AVAILABLE, cntrStyle);
    }

    private void populateAttendanceUserCells(Row row, FormationAttendance att, StyleRegistry styles, boolean isZebra) {
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(3), (att.getUser() != null && att.getUser().getId() != null) ? att.getUser().getId() : 0, numStyle);
        setStringCell(row.createCell(4), att.getUser() != null ? att.getUser().getUsername() : NOT_AVAILABLE, txtStyle);
        setStringCell(row.createCell(5), att.getUser() != null ? att.getUser().getPersonalCode() : NOT_AVAILABLE, cntrStyle);

        String sName = att.getUser() != null ? (safe(att.getUser().getFirstName()) + " " + safe(att.getUser().getLastName())).trim() : NOT_AVAILABLE;
        setStringCell(row.createCell(6), sName, txtStyle);

        String comp = (att.getUser() != null && att.getUser().getCompany() != null) ? att.getUser().getCompany().getName() : NOT_AVAILABLE;
        setStringCell(row.createCell(7), comp, txtStyle);
    }

    private long calculateAttendanceDuration(FormationAttendance att) {
        if (att.getCheckInDate() == null || att.getCheckOutDate() == null) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(
                att.getCheckInDate().atZone(java.time.ZoneId.systemDefault()),
                att.getCheckOutDate().atZone(java.time.ZoneId.systemDefault()));
    }

    // ─── 4. Export Audit Logs ─────────────────────────────────────────────────

    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);
            Sheet sheet = workbook.createSheet("Audit Logs");
            sheet.setDisplayGridlines(true);

            String[] headers = {"ID", "Timestamp", "Action", USERNAME_HEADER, "Details", "IP Address", "Integrity Hash"};
            createHeaderRow(sheet, styles, headers);

            int rowIdx = 1;
            if (auditLogs != null) {
                for (AuditLog log : auditLogs) {
                    appendAuditLogExcelRow(sheet.createRow(rowIdx++), log, styles, (rowIdx % 2 == 0));
                }
            }

            autoSizeColumns(sheet, headers.length);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void appendAuditLogExcelRow(Row row, AuditLog log, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), log.getId() != null ? log.getId() : 0, numStyle);
        String ts = log.getTimestamp() != null ? log.getTimestamp().format(DATE_FORMATTER) : NOT_AVAILABLE;
        setStringCell(row.createCell(1), ts, cntrStyle);
        setStringCell(row.createCell(2), log.getAction(), cntrStyle);
        setStringCell(row.createCell(3), log.getUsername(), txtStyle);
        setStringCell(row.createCell(4), log.getDetails(), txtStyle);
        setStringCell(row.createCell(5), log.getIpAddress(), cntrStyle);

        String rawData = ts + safe(log.getAction()) + safe(log.getUsername()) + safe(log.getIpAddress());
        setStringCell(row.createCell(6), org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawData), cntrStyle);
    }

    // ─── 5. Export User Formations Detailed ────────────────────────────────────

    @Override
    public byte[] exportUserFormations(List<UserFormationExportDTO> records) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);
            Sheet sheet = workbook.createSheet("User Formations Matrix");
            sheet.setDisplayGridlines(true);

            String[] headers = {
                    "User ID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "Full Name", "Email",
                    "Locator", COMPANY_HEADER, "Role", "Working Status",
                    "Formation ID", "Formation Name", "Scheduled Date", "Attendance Status",
                    "Check-in Time", "Check-out Time", "Duration (Minutes)", "Duration (Hours)",
                    "Signature Present", "Integrity Hash (SHA-256)"
            };
            createHeaderRow(sheet, styles, headers);

            int rowIdx = 1;
            if (records != null) {
                for (UserFormationExportDTO r : records) {
                    appendUserFormationExcelRow(sheet.createRow(rowIdx++), r, styles, (rowIdx % 2 == 0));
                }
            }

            autoSizeColumns(sheet, headers.length);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void appendUserFormationExcelRow(Row row, UserFormationExportDTO r, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), r.getUserId() != null ? r.getUserId() : 0, numStyle);
        setStringCell(row.createCell(1), r.getUsername(), txtStyle);
        setStringCell(row.createCell(2), r.getPersonalCode(), cntrStyle);
        setStringCell(row.createCell(3), r.getFullName(), txtStyle);
        setStringCell(row.createCell(4), r.getEmail(), txtStyle);
        setStringCell(row.createCell(5), r.getLocator(), cntrStyle);
        setStringCell(row.createCell(6), r.getCompanyName(), txtStyle);
        setStringCell(row.createCell(7), r.getAuthority(), cntrStyle);
        setStringCell(row.createCell(8), Boolean.TRUE.equals(r.getIsWorking()) ? YES : NO, cntrStyle);

        setNumericCell(row.createCell(9), r.getFormationId() != null ? r.getFormationId() : 0, numStyle);
        setStringCell(row.createCell(10), r.getFormationName(), txtStyle);
        setStringCell(row.createCell(11), r.getFormationDate() != null ? r.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(12), r.getStatus() != null ? r.getStatus() : NOT_AVAILABLE, cntrStyle);

        setStringCell(row.createCell(13), r.getCheckInDate() != null ? r.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(14), r.getCheckOutDate() != null ? r.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setNumericCell(row.createCell(15), r.getDurationMinutes() != null ? r.getDurationMinutes() : 0, numStyle);
        setStringCell(row.createCell(16), r.getDurationHoursFormatted() != null ? r.getDurationHoursFormatted() : "0h 0m", cntrStyle);

        boolean hasSig = Boolean.TRUE.equals(r.getHasSignature());
        setStringCell(row.createCell(17), hasSig ? YES : NO, cntrStyle);
        setStringCell(row.createCell(18), r.getVerificationHash() != null ? r.getVerificationHash() : NOT_AVAILABLE, cntrStyle);
    }

    // ─── 6. Export Single User Dossier ─────────────────────────────────────────

    @Override
    public byte[] exportSingleUserDossier(UserAnalyticsDTO user, List<UserFormationDetailDTO> details) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StyleRegistry styles = new StyleRegistry(workbook);

            // Sheet 1: Profile & KPI Summary
            Sheet summarySheet = workbook.createSheet("Employee Dossier Summary");
            summarySheet.setDisplayGridlines(true);

            String[] summaryHeaders = {
                    "Field", "Value"
            };
            createHeaderRow(summarySheet, styles, summaryHeaders);

            int sRow = 1;
            addDossierField(summarySheet.createRow(sRow++), "User ID", String.valueOf(user != null && user.getUserId() != null ? user.getUserId() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Username", user != null ? user.getUsername() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Personal Code", user != null ? user.getPersonalCode() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Full Name", user != null ? (safe(user.getFirstName()) + " " + safe(user.getLastName())).trim() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Company", user != null && user.getCompanyName() != null ? user.getCompanyName() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Locator / Sede", user != null && user.getLocator() != null ? user.getLocator() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Role / Authority", user != null && user.getAuthority() != null ? user.getAuthority() : NOT_AVAILABLE, styles);
            addDossierField(summarySheet.createRow(sRow++), "Currently Working", user != null && Boolean.TRUE.equals(user.getIsWorking()) ? YES : NO, styles);
            addDossierField(summarySheet.createRow(sRow++), "Total Shift Checkins", String.valueOf(user != null && user.getTotalCheckins() != null ? user.getTotalCheckins() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Total Work Minutes", String.valueOf(user != null && user.getTotalWorkMinutes() != null ? user.getTotalWorkMinutes() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Formations Assigned", String.valueOf(user != null && user.getFormationsAssigned() != null ? user.getFormationsAssigned() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Formations Attended", String.valueOf(user != null && user.getFormationsAttended() != null ? user.getFormationsAttended() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Formations Completed", String.valueOf(user != null && user.getFormationsCompleted() != null ? user.getFormationsCompleted() : 0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Attendance Rate (%)", String.format(java.util.Locale.US, "%.1f%%", user != null && user.getAttendancePercentage() != null ? user.getAttendancePercentage() : 0.0), styles);
            addDossierField(summarySheet.createRow(sRow++), "Total Formation Minutes", String.valueOf(user != null && user.getTotalFormationMinutes() != null ? user.getTotalFormationMinutes() : 0), styles);
            long fMins = user != null && user.getTotalFormationMinutes() != null ? user.getTotalFormationMinutes() : 0;
            addDossierField(summarySheet.createRow(sRow++), "Total Formation Hours", String.format(java.util.Locale.US, "%dh %dm (%.1fh)", fMins / 60, fMins % 60, fMins / 60.0), styles);

            autoSizeColumns(summarySheet, summaryHeaders.length);

            // Sheet 2: Training Sessions & Signatures
            Sheet detailsSheet = workbook.createSheet("Training Sessions & Signatures");
            detailsSheet.setDisplayGridlines(true);

            String[] detailHeaders = {
                    "Formation ID", "Formation Name", "Scheduled Date", "Status",
                    "Check-in Time", "Check-out Time", "Duration (Minutes)", "Duration (Formatted)",
                    "Signature Present", "Integrity Verification Hash"
            };
            createHeaderRow(detailsSheet, styles, detailHeaders);

            int dRow = 1;
            if (details != null) {
                for (UserFormationDetailDTO d : details) {
                    appendUserDetailRow(detailsSheet.createRow(dRow++), d, styles, (dRow % 2 == 0));
                }
            }

            autoSizeColumns(detailsSheet, detailHeaders.length);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void addDossierField(Row row, String fieldName, String fieldValue, StyleRegistry styles) {
        row.setHeightInPoints(18);
        setStringCell(row.createCell(0), fieldName, styles.zebraStyle);
        setStringCell(row.createCell(1), fieldValue, styles.dataStyle);
    }

    private void appendUserDetailRow(Row row, UserFormationDetailDTO d, StyleRegistry styles, boolean isZebra) {
        row.setHeightInPoints(18);
        CellStyle txtStyle = isZebra ? styles.zebraStyle : styles.dataStyle;
        CellStyle cntrStyle = isZebra ? styles.centerZebraStyle : styles.centerStyle;
        CellStyle numStyle = isZebra ? styles.numberZebraStyle : styles.numberStyle;

        setNumericCell(row.createCell(0), d.getFormationId() != null ? d.getFormationId() : 0, numStyle);
        setStringCell(row.createCell(1), d.getFormationName(), txtStyle);
        setStringCell(row.createCell(2), d.getFormationDate() != null ? d.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(3), d.getStatus() != null ? d.getStatus() : NOT_AVAILABLE, cntrStyle);

        setStringCell(row.createCell(4), d.getCheckInDate() != null ? d.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);
        setStringCell(row.createCell(5), d.getCheckOutDate() != null ? d.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE, cntrStyle);

        long mins = d.getDurationMinutes() != null ? d.getDurationMinutes() : 0;
        setNumericCell(row.createCell(6), mins, numStyle);
        long hours = mins / 60;
        long remainingMins = mins % 60;
        setStringCell(row.createCell(7), String.format(java.util.Locale.US, "%dh %dm (%.1fh)", hours, remainingMins, mins / 60.0), cntrStyle);

        boolean hasSig = Boolean.TRUE.equals(d.getHasSignature());
        setStringCell(row.createCell(8), hasSig ? YES : NO, cntrStyle);

        String hash = NOT_AVAILABLE;
        if (hasSig && d.getSignature() != null) {
            hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(
                    String.valueOf(d.getFormationId()) + safe(d.getFormationName()) + d.getSignature());
        }
        setStringCell(row.createCell(9), hash, cntrStyle);
    }

    // ─── Cell helpers ──────────────────────────────────────────────────────────

    private void setStringCell(Cell cell, String value, CellStyle style) {
        cell.setCellValue(value != null && !value.trim().isEmpty() ? value : NOT_AVAILABLE);
        cell.setCellStyle(style);
    }

    private void setNumericCell(Cell cell, double value, CellStyle style) {
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    @Override
    public String getContentType() {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    @Override
    public String getFileExtension() {
        return "xlsx";
    }
}
