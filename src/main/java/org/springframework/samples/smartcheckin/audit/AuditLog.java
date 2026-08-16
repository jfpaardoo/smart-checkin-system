package org.springframework.samples.smartcheckin.audit;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

import org.jpatterns.gof.BuilderPattern;
import lombok.Builder;
import lombok.AllArgsConstructor;

import java.time.temporal.ChronoUnit;

@Getter
@Setter
@BuilderPattern.Builder
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    private LocalDateTime timestamp;
    private String action;
    private String username;
    private String details;
    private String ipAddress;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "log_hash", length = 64)
    private String logHash;

    @Column(name = "signature_hmac", length = 64)
    private String signatureHmac;

    public AuditLog() {
        this.timestamp = LocalDateTime.now(ZoneId.systemDefault()).truncatedTo(ChronoUnit.SECONDS);
    }

    public AuditLog(String action, String username, String details, String ipAddress) {
        this.timestamp = LocalDateTime.now(ZoneId.systemDefault()).truncatedTo(ChronoUnit.SECONDS);
        this.action = action;
        this.username = username;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    public static String calculateHash(String previousHash, LocalDateTime timestamp, String action, String username, String details, String ipAddress) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String tsString = (timestamp != null) ? timestamp.truncatedTo(ChronoUnit.SECONDS).toString() : "";
            String data = (previousHash != null ? previousHash : "0".repeat(64)) + "|"
                    + tsString + "|"
                    + (action != null ? action : "") + "|"
                    + (username != null ? username : "") + "|"
                    + (details != null ? details : "") + "|"
                    + (ipAddress != null ? ipAddress : "");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public static String calculateHmac(String logHash, String secretKey) {
        try {
            if (logHash == null || secretKey == null || secretKey.isBlank()) {
                return null;
            }
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(logHash.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256 signature", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
