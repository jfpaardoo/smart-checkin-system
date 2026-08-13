package org.springframework.samples.smartcheckin.exports.strategy;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.List;
import java.io.IOException;

@Component
public class ExcelExportStrategy implements DataExportStrategy {

    private static final String PERSONAL_CODE = "Personal Code";

    @Override
    public byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Employees Analytics");
            Row headerRow = sheet.createRow(0);
            createHeaderCells(headerRow, "ID", "Username", PERSONAL_CODE, "First Name", "Last Name", "Role", "In Formation", "Formations Assigned", "Formations Attended", "Attendance Rate (%)", "Total Formation Minutes");

            int rowIdx = 1;
            for (UserAnalyticsDTO u : users) {
                Row row = sheet.createRow(rowIdx++);
                appendUserExcelRow(row, u);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void appendUserExcelRow(Row row, UserAnalyticsDTO u) {
        String role = u.getAuthority() != null ? u.getAuthority() : "N/A";
        row.createCell(0).setCellValue(u.getUserId() != null ? u.getUserId() : 0);
        row.createCell(1).setCellValue(u.getUsername() != null ? u.getUsername() : "");
        row.createCell(2).setCellValue(u.getPersonalCode() != null ? u.getPersonalCode() : "");
        row.createCell(3).setCellValue(u.getFirstName() != null ? u.getFirstName() : "");
        row.createCell(4).setCellValue(u.getLastName() != null ? u.getLastName() : "");
        row.createCell(5).setCellValue(role);
        row.createCell(6).setCellValue(Boolean.TRUE.equals(u.getIsWorking()) ? "YES" : "NO");
        row.createCell(7).setCellValue(u.getFormationsAssigned() != null ? u.getFormationsAssigned() : 0);
        row.createCell(8).setCellValue(u.getFormationsAttended() != null ? u.getFormationsAttended() : 0);
        row.createCell(9).setCellValue(u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0);
        row.createCell(10).setCellValue(u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0);
    }

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Checkins");
            Row headerRow = sheet.createRow(0);
            createHeaderCells(headerRow, "ID", "User", PERSONAL_CODE, "Direction", "Timestamp");

            int rowIdx = 1;
            for (Checkin checkin : checkins) {
                Row row = sheet.createRow(rowIdx++);
                String username = checkin.getUser() != null && checkin.getUser().getUsername() != null ? checkin.getUser().getUsername() : "N/A";
                String pCode = checkin.getUser() != null && checkin.getUser().getPersonalCode() != null ? checkin.getUser().getPersonalCode() : "N/A";
                row.createCell(0).setCellValue(checkin.getId() != null ? checkin.getId() : 0);
                row.createCell(1).setCellValue(username);
                row.createCell(2).setCellValue(pCode);
                row.createCell(3).setCellValue(checkin.getCheckInType() != null ? checkin.getCheckInType().name() : "N/A");
                row.createCell(4).setCellValue(checkin.getCheckInDate() != null ? checkin.getCheckInDate().toString() : "N/A");
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            buildFormationsSummarySheet(workbook, formations);
            
            // Collect all attendances for the detail sheet
            java.util.List<FormationAttendance> allAttendances = new java.util.ArrayList<>();
            for (Formation f : formations) {
                if (f.getAttendances() != null) {
                    allAttendances.addAll(f.getAttendances());
                }
            }
            buildDetailedAttendancesSheet(workbook, allAttendances);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void buildFormationsSummarySheet(Workbook workbook, List<Formation> formations) {
        Sheet summarySheet = workbook.createSheet("Formations Summary");
        Row header1 = summarySheet.createRow(0);
        createHeaderCells(header1, "ID", "Formation Name", "Scheduled Date", "Total Assigned", "Total Completed", "Attendance Rate (%)");

        int rIdx = 1;
        for (Formation f : formations) {
            Row r = summarySheet.createRow(rIdx++);
            r.createCell(0).setCellValue(f.getId() != null ? f.getId() : 0);
            r.createCell(1).setCellValue(f.getName() != null ? f.getName() : "N/A");
            r.createCell(2).setCellValue(f.getFormationDate() != null ? f.getFormationDate().toString() : "N/A");

            List<FormationAttendance> fAtts = f.getAttendances();
            int totalAssigned = fAtts != null ? fAtts.size() : 0;
            int totalCompleted = fAtts != null ? (int) fAtts.stream().filter(a -> a.getCheckOutDate() != null).count() : 0;
            double rate = totalAssigned > 0 ? Math.round(((double) totalCompleted / totalAssigned) * 100.0) : 0.0;

            r.createCell(3).setCellValue(totalAssigned);
            r.createCell(4).setCellValue(totalCompleted);
            r.createCell(5).setCellValue(rate);
        }
    }

    private void buildDetailedAttendancesSheet(Workbook workbook, List<FormationAttendance> attendances) {
        Sheet detailSheet = workbook.createSheet("Detailed Attendances & Signatures");
        Row header2 = detailSheet.createRow(0);
        createHeaderCells(header2, "Formation Name", "Scheduled Date", "User ID", "Username", PERSONAL_CODE, "Full Name", "Check-in Time", "Check-out Time", "Duration (Minutes)", "Signature Present", "Audit Verification Hash (SHA-256)");

        int rIdx = 1;
        for (FormationAttendance att : attendances) {
            Row r = detailSheet.createRow(rIdx++);
            appendAttendanceExcelRow(r, att);
        }
    }

    private void appendAttendanceExcelRow(Row r, FormationAttendance att) {
        String fName = att.getFormation() != null ? att.getFormation().getName() : "N/A";
        String sDate = att.getFormation() != null && att.getFormation().getFormationDate() != null ? att.getFormation().getFormationDate().toString() : "N/A";
        int uId = att.getUser() != null ? att.getUser().getId() : 0;
        String uName = att.getUser() != null ? att.getUser().getUsername() : "N/A";
        String pCode = att.getUser() != null ? att.getUser().getPersonalCode() : "N/A";
        String fullName = att.getUser() != null ? att.getUser().getFirstName() + " " + att.getUser().getLastName() : "N/A";
        String cIn = att.getCheckInDate() != null ? att.getCheckInDate().toString() : "N/A";
        String cOut = att.getCheckOutDate() != null ? att.getCheckOutDate().toString() : "N/A";

        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();

        r.createCell(0).setCellValue(fName);
        r.createCell(1).setCellValue(sDate);
        r.createCell(2).setCellValue(uId);
        r.createCell(3).setCellValue(uName);
        r.createCell(4).setCellValue(pCode);
        r.createCell(5).setCellValue(fullName);
        r.createCell(6).setCellValue(cIn);
        r.createCell(7).setCellValue(cOut);
        
        long duration = 0;
        if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
            duration = Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
        }
        r.createCell(8).setCellValue(duration);
        r.createCell(9).setCellValue(hasSig ? "YES" : "NO");
        r.createCell(10).setCellValue(ExportUtils.generateVerificationHash(att));
    }
    
    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Audit Logs");
            Row headerRow = sheet.createRow(0);
            createHeaderCells(headerRow, "Timestamp", "Action", "Details", "IP Address");

            int rowIdx = 1;
            for (AuditLog log : auditLogs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(log.getTimestamp() != null ? log.getTimestamp().toString() : "");
                row.createCell(1).setCellValue(log.getAction() != null ? log.getAction() : "");
                row.createCell(2).setCellValue(log.getDetails() != null ? log.getDetails() : "");
                row.createCell(3).setCellValue(log.getIpAddress() != null ? log.getIpAddress() : "");
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public String getContentType() {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    @Override
    public String getFileExtension() {
        return "xlsx";
    }

    private void createHeaderCells(Row headerRow, String... headers) {
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
    }
}


