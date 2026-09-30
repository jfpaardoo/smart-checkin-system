package org.springframework.samples.smartcheckin.exports.strategy;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.util.HashUtils;

public final class ExportUtils {

    private static final String NOT_AVAILABLE = "N/A";

    private ExportUtils() {
        // Utility class
    }

    public static String safe(String value) {
        return value != null ? value : "";
    }

    public static String formatFullName(String firstName, String lastName) {
        String fullName = (safe(firstName) + " " + safe(lastName)).trim();
        return fullName.isEmpty() ? NOT_AVAILABLE : fullName;
    }

    public static long calculateDurationMinutes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || start.isAfter(end)) {
            return 0L;
        }
        return ChronoUnit.MINUTES.between(start, end);
    }

    public static String formatDurationHoursMinutes(long minutes) {
        long hours = minutes / 60;
        long remainingMins = minutes % 60;
        return String.format(Locale.US, "%dh %dm (%.1fh)", hours, remainingMins, minutes / 60.0);
    }

    public static String generateDetailHash(Integer formationId, String formationName, String signature) {
        if (signature == null || signature.trim().isEmpty()) {
            return NOT_AVAILABLE;
        }
        return HashUtils.generateHash(
                String.valueOf(formationId != null ? formationId : 0) + safe(formationName) + signature);
    }

    public static String generateAuditLogHash(String timestamp, String action, String username, String ip) {
        String rawData = safe(timestamp) + safe(action) + safe(username) + safe(ip);
        return HashUtils.generateHash(rawData);
    }

    public static String generateVerificationHash(FormationAttendance att) {
        if (att == null) {
            return NOT_AVAILABLE;
        }
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        if (!hasSig) {
            return NOT_AVAILABLE;
        }
        String dataToHash = String.format("%d|%s|%d|%s|%s|%s|%s",
                att.getFormation() != null ? att.getFormation().getId() : 0,
                att.getFormation() != null && att.getFormation().getFormationDate() != null ? att.getFormation().getFormationDate().toString() : "",
                att.getUser() != null ? att.getUser().getId() : 0,
                att.getUser() != null ? att.getUser().getPersonalCode() : "",
                att.getCheckInDate() != null ? att.getCheckInDate().toString() : "",
                att.getCheckOutDate() != null ? att.getCheckOutDate().toString() : "",
                att.getSignature()
        );
        String hash = HashUtils.generateHash(dataToHash);
        if ("HASH_GENERATION_FAILED".equals(hash)) {
            return "HASH_ERROR";
        }
        return "SHA256:" + hash.toUpperCase();
    }
}
