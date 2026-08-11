package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.audit.AuditLog;

import java.util.List;

public interface DataExportStrategy {
    byte[] exportUsers(List<UserAnalyticsDTO> users) throws Exception;
    byte[] exportCheckins(List<Checkin> checkins) throws Exception;
    byte[] exportFormations(List<Formation> formations) throws Exception;
    byte[] exportAuditLogs(List<AuditLog> auditLogs) throws Exception;
    
    String getContentType();
    String getFileExtension();
}
