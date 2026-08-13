package org.springframework.samples.smartcheckin.utils;

import org.springframework.samples.smartcheckin.formation.FormationAttendance;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class HashUtils {

    private HashUtils() {
        // Utility class
    }

    public static String generateVerificationHash(FormationAttendance att) {
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
}
