package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.audit.AuditLog;

import java.util.List;
import java.io.IOException;

public interface DataExportStrategy {
    byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException;
    byte[] exportCheckins(List<Checkin> checkins) throws IOException;
    byte[] exportFormations(List<Formation> formations) throws IOException;
    byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException;
    
    String getContentType();
    String getFileExtension();
}
