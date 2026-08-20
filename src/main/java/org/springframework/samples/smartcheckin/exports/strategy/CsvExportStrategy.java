package org.springframework.samples.smartcheckin.exports.strategy;

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
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class CsvExportStrategy implements DataExportStrategy {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final String CSV_DELIMITER = ",";
    private static final String NOT_AVAILABLE = "N/A";
    private static final String USERNAME_HEADER = "Username";
    private static final String PERSONAL_CODE_HEADER = "PersonalCode";
    private static final String COMPANY_HEADER = "Company";
    private static final String YES = "YES";
    private static final String NO = "NO";

    @Override
    public byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println(String.join(CSV_DELIMITER,
                    "ID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "Locator", "FirstName", "LastName",
                    COMPANY_HEADER, "Role", "CurrentlyWorking", "TotalCheckins", "TotalWorkMinutes",
                    "FormationsAssigned", "FormationsAttended", "FormationsCompleted",
                    "AttendanceRate", "TotalFormationMinutes"
            ));

            if (users != null) {
                for (UserAnalyticsDTO u : users) {
                    writer.println(buildUserCsvRow(u));
                }
            }
        }
        return out.toByteArray();
    }

    private String buildUserCsvRow(UserAnalyticsDTO u) {
        String isWorkingStr = Boolean.TRUE.equals(u.getIsWorking()) ? YES : NO;
        double rate = u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0;

        return String.join(CSV_DELIMITER,
                String.valueOf(u.getUserId() != null ? u.getUserId() : 0),
                sanitize(u.getUsername()),
                sanitize(u.getPersonalCode()),
                sanitize(u.getLocator()),
                sanitize(u.getFirstName()),
                sanitize(u.getLastName()),
                sanitize(u.getCompanyName()),
                sanitize(u.getAuthority()),
                isWorkingStr,
                String.valueOf(u.getTotalCheckins() != null ? u.getTotalCheckins() : 0),
                String.valueOf(u.getTotalWorkMinutes() != null ? u.getTotalWorkMinutes() : 0),
                String.valueOf(u.getFormationsAssigned() != null ? u.getFormationsAssigned() : 0),
                String.valueOf(u.getFormationsAttended() != null ? u.getFormationsAttended() : 0),
                String.valueOf(u.getFormationsCompleted() != null ? u.getFormationsCompleted() : 0),
                String.format(java.util.Locale.US, "%.1f", rate),
                String.valueOf(u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0)
        );
    }

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println(String.join(CSV_DELIMITER,
                    "ID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "FullName", COMPANY_HEADER, "Direction", "Timestamp", "SignaturePresent"
            ));

            if (checkins != null) {
                for (Checkin c : checkins) {
                    writer.println(buildCheckinCsvRow(c));
                }
            }
        }
        return out.toByteArray();
    }

    private String buildCheckinCsvRow(Checkin c) {
        String idStr = String.valueOf(c.getId() != null ? c.getId() : 0);
        String username = c.getUser() != null ? sanitize(c.getUser().getUsername()) : NOT_AVAILABLE;
        String personalCode = c.getUser() != null ? sanitize(c.getUser().getPersonalCode()) : NOT_AVAILABLE;
        String fullName = c.getUser() != null
                ? sanitize((safe(c.getUser().getFirstName()) + " " + safe(c.getUser().getLastName())).trim())
                : NOT_AVAILABLE;
        String company = (c.getUser() != null && c.getUser().getCompany() != null)
                ? sanitize(c.getUser().getCompany().getName())
                : NOT_AVAILABLE;
        String type = c.getCheckInType() != null ? c.getCheckInType().name() : NOT_AVAILABLE;
        String ts = c.getCheckInDate() != null ? c.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String hasSignature = (c.getSignature() != null && !c.getSignature().trim().isEmpty()) ? YES : NO;

        return String.join(CSV_DELIMITER, idStr, username, personalCode, fullName, company, type, ts, hasSignature);
    }

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println(String.join(CSV_DELIMITER,
                    "FormationID", "FormationName", "ScheduledDate", "UserID", USERNAME_HEADER,
                    PERSONAL_CODE_HEADER, "FullName", COMPANY_HEADER, "CheckInTime", "CheckOutTime",
                    "Duration(Minutes)", "SignaturePresent", "AuditVerificationHash"
            ));

            if (formations != null) {
                for (Formation f : formations) {
                    writeFormationAttendances(writer, f);
                }
            }
        }
        return out.toByteArray();
    }

    private void writeFormationAttendances(PrintWriter writer, Formation f) {
        if (f.getAttendances() == null || f.getAttendances().isEmpty()) {
            return;
        }
        for (FormationAttendance att : f.getAttendances()) {
            writer.println(buildAttendanceCsvRow(f, att));
        }
    }

    private String buildAttendanceCsvRow(Formation f, FormationAttendance att) {
        String fId = String.valueOf(f.getId() != null ? f.getId() : 0);
        String fName = sanitize(f.getName());
        String schedDate = f.getFormationDate() != null ? f.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;

        String userFields = extractAttendanceUserData(att);
        String cIn = att.getCheckInDate() != null ? att.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String cOut = att.getCheckOutDate() != null ? att.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        long duration = calculateAttendanceDuration(att);

        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        String hasSigStr = hasSig ? YES : NO;
        String hash = hasSig ? ExportUtils.generateVerificationHash(att) : NOT_AVAILABLE;

        return String.join(CSV_DELIMITER, fId, fName, schedDate, userFields, cIn, cOut, String.valueOf(duration), hasSigStr, hash);
    }

    private String extractAttendanceUserData(FormationAttendance att) {
        String uId = (att.getUser() != null && att.getUser().getId() != null) ? String.valueOf(att.getUser().getId()) : NOT_AVAILABLE;
        String uName = att.getUser() != null ? sanitize(att.getUser().getUsername()) : NOT_AVAILABLE;
        String pCode = att.getUser() != null ? sanitize(att.getUser().getPersonalCode()) : NOT_AVAILABLE;
        String fullName = att.getUser() != null
                ? sanitize((safe(att.getUser().getFirstName()) + " " + safe(att.getUser().getLastName())).trim())
                : NOT_AVAILABLE;
        String company = (att.getUser() != null && att.getUser().getCompany() != null)
                ? sanitize(att.getUser().getCompany().getName())
                : NOT_AVAILABLE;

        return String.join(CSV_DELIMITER, uId, uName, pCode, fullName, company);
    }

    private long calculateAttendanceDuration(FormationAttendance att) {
        if (att.getCheckInDate() == null || att.getCheckOutDate() == null) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(
                att.getCheckInDate().atZone(java.time.ZoneId.systemDefault()),
                att.getCheckOutDate().atZone(java.time.ZoneId.systemDefault()));
    }

    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println(String.join(CSV_DELIMITER,
                    "ID", "Timestamp", "Action", USERNAME_HEADER, "Details", "IPAddress", "LogHash"
            ));

            if (auditLogs != null) {
                for (AuditLog log : auditLogs) {
                    writer.println(buildAuditLogRow(log));
                }
            }
        }
        return out.toByteArray();
    }

    private String buildAuditLogRow(AuditLog log) {
        String idStr = String.valueOf(log.getId() != null ? log.getId() : 0);
        String ts = log.getTimestamp() != null ? log.getTimestamp().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String action = sanitize(log.getAction());
        String username = sanitize(log.getUsername());
        String details = sanitize(log.getDetails());
        String ip = sanitize(log.getIpAddress());
        String rawData = ts + action + username + ip;
        String hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawData);

        return String.join(CSV_DELIMITER, idStr, ts, action, username, details, ip, hash);
    }

    // ─── 5. Export User Formations Matrix ──────────────────────────────────────

    @Override
    public byte[] exportUserFormations(List<UserFormationExportDTO> records) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println(String.join(CSV_DELIMITER,
                    "UserID", USERNAME_HEADER, PERSONAL_CODE_HEADER, "FullName", "Email",
                    "Locator", COMPANY_HEADER, "Role", "WorkingStatus",
                    "FormationID", "FormationName", "ScheduledDate", "AttendanceStatus",
                    "CheckInTime", "CheckOutTime", "DurationMinutes", "DurationFormatted",
                    "SignaturePresent", "IntegrityHash"
            ));

            if (records != null) {
                for (UserFormationExportDTO r : records) {
                    writer.println(buildUserFormationCsvRow(r));
                }
            }
        }
        return out.toByteArray();
    }

    private String buildUserFormationCsvRow(UserFormationExportDTO r) {
        String uId = String.valueOf(r.getUserId() != null ? r.getUserId() : 0);
        String uName = sanitize(r.getUsername());
        String pCode = sanitize(r.getPersonalCode());
        String fName = sanitize(r.getFullName());
        String email = sanitize(r.getEmail());
        String loc = sanitize(r.getLocator());
        String comp = sanitize(r.getCompanyName());
        String role = sanitize(r.getAuthority());
        String isWorking = Boolean.TRUE.equals(r.getIsWorking()) ? YES : NO;

        String fId = String.valueOf(r.getFormationId() != null ? r.getFormationId() : 0);
        String formName = sanitize(r.getFormationName());
        String sDate = r.getFormationDate() != null ? r.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String status = sanitize(r.getStatus());

        String cIn = r.getCheckInDate() != null ? r.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String cOut = r.getCheckOutDate() != null ? r.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String durationMins = String.valueOf(r.getDurationMinutes() != null ? r.getDurationMinutes() : 0);
        String durationFormatted = sanitize(r.getDurationHoursFormatted());

        boolean hasSig = Boolean.TRUE.equals(r.getHasSignature());
        String hasSigStr = hasSig ? YES : NO;
        String hash = sanitize(r.getVerificationHash());

        return String.join(CSV_DELIMITER,
                uId, uName, pCode, fName, email, loc, comp, role, isWorking,
                fId, formName, sDate, status, cIn, cOut, durationMins, durationFormatted,
                hasSigStr, hash
        );
    }

    // ─── 6. Export Single User Dossier ─────────────────────────────────────────

    @Override
    public byte[] exportSingleUserDossier(UserAnalyticsDTO user, List<UserFormationDetailDTO> details) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = createUtf8BomWriter(out)) {
            writer.println("# --- EMPLOYEE DOSSIER SUMMARY ---");
            writer.println("Property,Value");
            writer.println("UserID," + (user != null && user.getUserId() != null ? user.getUserId() : 0));
            writer.println("Username," + (user != null ? sanitize(user.getUsername()) : NOT_AVAILABLE));
            writer.println("PersonalCode," + (user != null ? sanitize(user.getPersonalCode()) : NOT_AVAILABLE));
            writer.println("FullName," + (user != null ? sanitize((safe(user.getFirstName()) + " " + safe(user.getLastName())).trim()) : NOT_AVAILABLE));
            writer.println("Company," + (user != null && user.getCompanyName() != null ? sanitize(user.getCompanyName()) : NOT_AVAILABLE));
            writer.println("Locator," + (user != null && user.getLocator() != null ? sanitize(user.getLocator()) : NOT_AVAILABLE));
            writer.println("Role," + (user != null && user.getAuthority() != null ? sanitize(user.getAuthority()) : NOT_AVAILABLE));
            writer.println("AttendanceRate," + (user != null && user.getAttendancePercentage() != null ? user.getAttendancePercentage() : 0.0) + "%");
            writer.println("TotalFormationMinutes," + (user != null && user.getTotalFormationMinutes() != null ? user.getTotalFormationMinutes() : 0));
            writer.println();
            writer.println("# --- FORMATION SESSIONS ---");
            writer.println(String.join(CSV_DELIMITER,
                    "FormationID", "FormationName", "ScheduledDate", "Status",
                    "CheckInTime", "CheckOutTime", "DurationMinutes", "SignaturePresent", "VerificationHash"
            ));

            if (details != null) {
                for (UserFormationDetailDTO d : details) {
                    String dFId = String.valueOf(d.getFormationId() != null ? d.getFormationId() : 0);
                    String dFName = sanitize(d.getFormationName());
                    String dDate = d.getFormationDate() != null ? d.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
                    String dStatus = sanitize(d.getStatus());
                    String dIn = d.getCheckInDate() != null ? d.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
                    String dOut = d.getCheckOutDate() != null ? d.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
                    String dDur = String.valueOf(d.getDurationMinutes() != null ? d.getDurationMinutes() : 0);
                    boolean dSig = Boolean.TRUE.equals(d.getHasSignature());
                    String dHash = NOT_AVAILABLE;
                    if (dSig && d.getSignature() != null) {
                        dHash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(
                                String.valueOf(d.getFormationId()) + safe(d.getFormationName()) + d.getSignature());
                    }
                    writer.println(String.join(CSV_DELIMITER, dFId, dFName, dDate, dStatus, dIn, dOut, dDur, dSig ? YES : NO, sanitize(dHash)));
                }
            }
        }
        return out.toByteArray();
    }

    private PrintWriter createUtf8BomWriter(ByteArrayOutputStream out) {
        out.write(0xEF);
        out.write(0xBB);
        out.write(0xBF);
        return new PrintWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
    }

    private String sanitize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return NOT_AVAILABLE;
        }
        return value.replace(",", " ").trim();
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    @Override
    public String getContentType() {
        return "text/csv";
    }

    @Override
    public String getFileExtension() {
        return "csv";
    }
}
