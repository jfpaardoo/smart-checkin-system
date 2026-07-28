package org.springframework.samples.smartcheckin.audit;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    private LocalDateTime timestamp;
    private String action;
    private String username;
    private String details;
    private String ipAddress;

    public AuditLog() {
        this.timestamp = LocalDateTime.now(ZoneId.systemDefault());
    }

    public AuditLog(String action, String username, String details, String ipAddress) {
        this.timestamp = LocalDateTime.now(ZoneId.systemDefault());
        this.action = action;
        this.username = username;
        this.details = details;
        this.ipAddress = ipAddress;
    }
}
