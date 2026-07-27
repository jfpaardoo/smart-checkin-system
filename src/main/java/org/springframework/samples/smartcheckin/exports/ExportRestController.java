package org.springframework.samples.smartcheckin.exports;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exports")
public class ExportRestController {

    private final CheckinRepository checkinRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final FormationRepository formationRepository;
    private final UserRepository userRepository;
    private static final String PERSONAL_CODE = "Personal Code";
    

    @Autowired
    public ExportRestController(CheckinRepository checkinRepository,
                                FormationAttendanceRepository attendanceRepository,
                                FormationRepository formationRepository,
                                UserRepository userRepository) {
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
        this.formationRepository = formationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/users/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportUsersCsv() {
        List<User> users = (List<User>) userRepository.findAll();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,Username,PersonalCode,FirstName,LastName,Role,IsWorking\n");

        for (User u : users) {
            String role = u.getAuthority() != null ? u.getAuthority().getAuthority() : "N/A";
            csvBuilder.append(u.getId()).append(",")
                    .append(u.getUsername() != null ? u.getUsername().replace(",", " ") : "").append(",")
                    .append(u.getPersonalCode() != null ? u.getPersonalCode() : "").append(",")
                    .append(u.getFirstName() != null ? u.getFirstName().replace(",", " ") : "").append(",")
                    .append(u.getLastName() != null ? u.getLastName().replace(",", " ") : "").append(",")
                    .append(role).append(",")
                    .append(Boolean.TRUE.equals(u.getIsWorking()) ? "YES" : "NO").append("\n");
        }

        return createCsvResponse(csvBuilder.toString(), "usuarios.csv");
    }

    @GetMapping("/users/excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportUsersExcel() throws IOException {
        List<User> users = (List<User>) userRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");
            Row headerRow = sheet.createRow(0);
            createHeaderCells(headerRow, "ID", "Username", PERSONAL_CODE, "First Name", "Last Name", "Role / Authority", "Currently Working");

            int rowIdx = 1;
            for (User u : users) {
                Row row = sheet.createRow(rowIdx++);
                String role = u.getAuthority() != null ? u.getAuthority().getAuthority() : "N/A";
                row.createCell(0).setCellValue(u.getId());
                row.createCell(1).setCellValue(u.getUsername() != null ? u.getUsername() : "");
                row.createCell(2).setCellValue(u.getPersonalCode() != null ? u.getPersonalCode() : "");
                row.createCell(3).setCellValue(u.getFirstName() != null ? u.getFirstName() : "");
                row.createCell(4).setCellValue(u.getLastName() != null ? u.getLastName() : "");
                row.createCell(5).setCellValue(role);
                row.createCell(6).setCellValue(Boolean.TRUE.equals(u.getIsWorking()) ? "YES" : "NO");
            }

            workbook.write(out);
            return createExcelResponse(out.toByteArray(), "usuarios.xlsx");
        }
    }

    @GetMapping("/checkins/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckinsCsv() {
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,User,PersonalCode,Direction,Timestamp\n");

        for (Checkin checkin : checkins) {
            csvBuilder.append(checkin.getId()).append(",")
                    .append(checkin.getUser().getUsername()).append(",")
                    .append(checkin.getUser().getPersonalCode()).append(",")
                    .append(checkin.getCheckInType()).append(",")
                    .append(checkin.getCheckInDate()).append("\n");
        }

        return createCsvResponse(csvBuilder.toString(), "checkins.csv");
    }

    @GetMapping("/checkins/excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckinsExcel() throws IOException {
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Checkins");
            Row headerRow = sheet.createRow(0);
            createHeaderCells(headerRow, "ID", "User", PERSONAL_CODE, "Direction", "Timestamp");

            int rowIdx = 1;
            for (Checkin checkin : checkins) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(checkin.getId());
                row.createCell(1).setCellValue(checkin.getUser().getUsername());
                row.createCell(2).setCellValue(checkin.getUser().getPersonalCode());
                row.createCell(3).setCellValue(checkin.getCheckInType().name());
                row.createCell(4).setCellValue(checkin.getCheckInDate().toString());
            }

            workbook.write(out);
            return createExcelResponse(out.toByteArray(), "checkins.xlsx");
        }
    }

    @GetMapping("/formations/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportFormationsCsv() {
        List<FormationAttendance> attendances = (List<FormationAttendance>) attendanceRepository.findAll();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("FormationID,FormationName,ScheduledDate,UserID,Username,PersonalCode,FullName,CheckInTime,CheckOutTime,DurationMinutes,HasSignature,AuditVerificationHash\n");

        for (FormationAttendance att : attendances) {
            appendAttendanceCsvRow(csvBuilder, att);
        }

        return createCsvResponse(csvBuilder.toString(), "formaciones_firmas.csv");
    }

    @GetMapping("/formations/excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportFormationsExcel() throws IOException {
        List<Formation> formations = (List<Formation>) formationRepository.findAll();
        List<FormationAttendance> attendances = (List<FormationAttendance>) attendanceRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            buildFormationsSummarySheet(workbook, formations);
            buildDetailedAttendancesSheet(workbook, attendances);

            workbook.write(out);
            return createExcelResponse(out.toByteArray(), "formaciones_firmas.xlsx");
        }
    }

    private void appendAttendanceCsvRow(StringBuilder csvBuilder, FormationAttendance att) {
        String formationName = att.getFormation() != null ? att.getFormation().getName().replace(",", " ") : "N/A";
        String scheduledDate = att.getFormation() != null && att.getFormation().getFormationDate() != null ? att.getFormation().getFormationDate().toString() : "N/A";
        String username = att.getUser() != null ? att.getUser().getUsername() : "N/A";
        String personalCode = att.getUser() != null ? att.getUser().getPersonalCode() : "N/A";
        String fullName = att.getUser() != null ? (att.getUser().getFirstName() + " " + att.getUser().getLastName()).replace(",", " ") : "N/A";
        String checkIn = att.getCheckInDate() != null ? att.getCheckInDate().toString() : "N/A";
        String checkOut = att.getCheckOutDate() != null ? att.getCheckOutDate().toString() : "N/A";

        long durationMinutes = calculateDuration(att);
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        String auditHash = generateVerificationHash(att);

        csvBuilder.append(att.getFormation() != null ? att.getFormation().getId() : 0).append(",")
                .append(formationName).append(",")
                .append(scheduledDate).append(",")
                .append(att.getUser() != null ? att.getUser().getId() : 0).append(",")
                .append(username).append(",")
                .append(personalCode).append(",")
                .append(fullName).append(",")
                .append(checkIn).append(",")
                .append(checkOut).append(",")
                .append(durationMinutes).append(",")
                .append(hasSig ? "YES" : "NO").append(",")
                .append(auditHash).append("\n");
    }

    private void buildFormationsSummarySheet(Workbook workbook, List<Formation> formations) {
        Sheet summarySheet = workbook.createSheet("Formations Summary");
        Row header1 = summarySheet.createRow(0);
        createHeaderCells(header1, "ID", "Formation Name", "Scheduled Date", "Total Assigned", "Total Completed", "Attendance Rate (%)");

        int rIdx = 1;
        for (Formation f : formations) {
            Row r = summarySheet.createRow(rIdx++);
            r.createCell(0).setCellValue(f.getId());
            r.createCell(1).setCellValue(f.getName());
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
        r.createCell(8).setCellValue(calculateDuration(att));
        r.createCell(9).setCellValue(hasSig ? "YES" : "NO");
        r.createCell(10).setCellValue(generateVerificationHash(att));
    }

    private String generateVerificationHash(FormationAttendance att) {
        if (att == null) return "N/A";
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        if (!hasSig) {
            return "N/A";
        }
        try {
            String dataToHash = String.format("%d|%s|%d|%s|%s|%s|%s",
                att.getFormation() != null ? att.getFormation().getId() : 0,
                att.getFormation() != null && att.getFormation().getFormationDate() != null ? att.getFormation().getFormationDate().toString() : "",
                att.getUser() != null ? att.getUser().getId() : 0,
                att.getUser() != null ? att.getUser().getPersonalCode() : "",
                att.getCheckInDate() != null ? att.getCheckInDate().toString() : "",
                att.getCheckOutDate() != null ? att.getCheckOutDate().toString() : "",
                att.getSignature()
            );
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return "SHA256:" + hexString.toString().toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            return "HASH_ERROR";
        }
    }

    private long calculateDuration(FormationAttendance att) {
        if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
            return Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
        }
        return 0;
    }

    private void createHeaderCells(Row headerRow, String... headers) {
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
    }

    private ResponseEntity<byte[]> createCsvResponse(String csvContent, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        return ResponseEntity.ok().headers(headers).body(csvContent.getBytes());
    }

    private ResponseEntity<byte[]> createExcelResponse(byte[] bytes, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
