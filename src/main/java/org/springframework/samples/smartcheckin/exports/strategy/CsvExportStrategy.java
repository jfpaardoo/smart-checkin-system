package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.List;
import java.io.IOException;

@Component
public class CsvExportStrategy implements DataExportStrategy {

    @Override
    public byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,Username,PersonalCode,FirstName,LastName,Role,CurrentlyInFormation,FormationsAssigned,FormationsAttended,AttendanceRate,TotalFormationMinutes\n");

        for (UserAnalyticsDTO u : users) {
            buildUserCsvRow(csvBuilder, u);
        }

        return csvBuilder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void buildUserCsvRow(StringBuilder csvBuilder, UserAnalyticsDTO u) {
        String role = u.getAuthority() != null ? u.getAuthority() : "N/A";
        csvBuilder.append(u.getUserId()).append(",")
                .append(u.getUsername() != null ? u.getUsername().replace(",", " ") : "").append(",")
                .append(u.getPersonalCode() != null ? u.getPersonalCode() : "").append(",")
                .append(u.getFirstName() != null ? u.getFirstName().replace(",", " ") : "").append(",")
                .append(u.getLastName() != null ? u.getLastName().replace(",", " ") : "").append(",")
                .append(role).append(",")
                .append(Boolean.TRUE.equals(u.getIsWorking()) ? "YES" : "NO").append(",")
                .append(u.getFormationsAssigned() != null ? u.getFormationsAssigned() : 0).append(",")
                .append(u.getFormationsAttended() != null ? u.getFormationsAttended() : 0).append(",")
                .append(u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0).append(",")
                .append(u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0).append("\n");
    }

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,User,PersonalCode,Direction,Timestamp\n");

        for (Checkin checkin : checkins) {
            String username = checkin.getUser() != null && checkin.getUser().getUsername() != null ? checkin.getUser().getUsername() : "N/A";
            String pCode = checkin.getUser() != null && checkin.getUser().getPersonalCode() != null ? checkin.getUser().getPersonalCode() : "N/A";
            csvBuilder.append(checkin.getId() != null ? checkin.getId() : 0).append(",")
                    .append(username).append(",")
                    .append(pCode).append(",")
                    .append(checkin.getCheckInType() != null ? checkin.getCheckInType().name() : "N/A").append(",")
                    .append(checkin.getCheckInDate() != null ? checkin.getCheckInDate().toString() : "N/A").append("\n");
        }

        return csvBuilder.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("FormationID,FormationName,ScheduledDate,UserID,Username,PersonalCode,FullName,CheckInTime,CheckOutTime,Duration(Minutes),SignaturePresent,AuditVerificationHash\n");

        for (Formation f : formations) {
            if (f.getAttendances() != null) {
                for (FormationAttendance att : f.getAttendances()) {
                    buildAttendanceCsvRow(csvBuilder, f, att);
                }
            }
        }
        return csvBuilder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void buildAttendanceCsvRow(StringBuilder csvBuilder, Formation f, FormationAttendance att) {
        String formationName = f.getName() != null ? f.getName().replace(",", " ") : "N/A";
        String scheduledDate = f.getFormationDate() != null ? f.getFormationDate().toString() : "N/A";
        String username = att.getUser() != null && att.getUser().getUsername() != null ? att.getUser().getUsername() : "N/A";
        String personalCode = att.getUser() != null && att.getUser().getPersonalCode() != null ? att.getUser().getPersonalCode() : "N/A";
        String fullName = att.getUser() != null ? (att.getUser().getFirstName() + " " + att.getUser().getLastName()).replace(",", " ") : "N/A";
        String checkIn = att.getCheckInDate() != null ? att.getCheckInDate().toString() : "N/A";
        String checkOut = att.getCheckOutDate() != null ? att.getCheckOutDate().toString() : "N/A";

        long durationMinutes = 0;
        if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
            durationMinutes = Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
        }
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        String auditHash = ExportUtils.generateVerificationHash(att);

        csvBuilder.append(f.getId() != null ? f.getId() : 0).append(",")
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

    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("Timestamp,Action,Details,IPAddress\n");
        for (AuditLog log : auditLogs) {
            String timestamp = log.getTimestamp() != null ? log.getTimestamp().toString() : "";
            String action = log.getAction() != null ? log.getAction().replace(",", " ") : "";
            String details = log.getDetails() != null ? log.getDetails().replace(",", " ") : "";
            String ip = log.getIpAddress() != null ? log.getIpAddress() : "";
            
            csvBuilder.append(timestamp).append(",")
                      .append(action).append(",")
                      .append(details).append(",")
                      .append(ip).append("\n");
        }
        return csvBuilder.toString().getBytes(StandardCharsets.UTF_8);
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


