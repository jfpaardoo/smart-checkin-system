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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.analytics.AnalyticsService;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.samples.smartcheckin.exports.strategy.DataExportStrategy;
import org.springframework.samples.smartcheckin.exports.strategy.ExportFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@SuppressWarnings("null")
@RequestMapping("/api/v1/exports")
public class ExportRestController {

    private final CheckinRepository checkinRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final FormationRepository formationRepository;
    private final UserService userService;
    private final AuditLogRepository auditLogRepository;
    
    private final AnalyticsService analyticsService;
    private final ExportFactory exportFactory;

    @Autowired
    public ExportRestController(CheckinRepository checkinRepository,
                                FormationAttendanceRepository attendanceRepository,
                                FormationRepository formationRepository,
                                UserService userService,
                                AuditLogRepository auditLogRepository,
                                AnalyticsService analyticsService,
                                ExportFactory exportFactory) {
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
        this.formationRepository = formationRepository;
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
        this.analyticsService = analyticsService;
        this.exportFactory = exportFactory;
    }

    @GetMapping("/users/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportUsers(@PathVariable String format) throws Exception {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<UserAnalyticsDTO> users = analyticsService.getAllUsersAnalytics("");
        byte[] data = strategy.exportUsers(users);
        return createResponse(data, "empleados_analiticas." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/checkins/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckins(@PathVariable String format) throws Exception {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();
        byte[] data = strategy.exportCheckins(checkins);
        return createResponse(data, "checkins." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/formations/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportFormations(@PathVariable String format) throws Exception {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<Formation> formations = (List<Formation>) formationRepository.findAll();
        byte[] data = strategy.exportFormations(formations);
        return createResponse(data, "formations." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/audit/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs(@PathVariable String format) throws Exception {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<AuditLog> auditLogs = (List<AuditLog>) auditLogRepository.findAll();
        byte[] data = strategy.exportAuditLogs(auditLogs);
        return createResponse(data, "audit_log." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/me/export")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportMyData() throws IOException {
        User user = userService.findCurrentUser();
        List<Checkin> checkins = checkinRepository.findByUserId(user.getId());
        List<FormationAttendance> attendances = attendanceRepository.findByUserId(user.getId());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        Map<String, Object> exportData = new HashMap<>();
        exportData.put("userProfile", user);
        exportData.put("checkins", checkins);
        exportData.put("formations", attendances);

        byte[] jsonData = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(exportData);

        return createResponse(jsonData, "my_data.json", MediaType.APPLICATION_JSON_VALUE);
    }

    private ResponseEntity<byte[]> createResponse(byte[] data, String filename, String contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        
        // Handling UTF-8 BOM or specific character sets for CSV is generally done by the client or in strategy,
        // but spring sets default charset properly for application type. 
        if ("text/csv".equalsIgnoreCase(contentType)) {
            headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        } else {
            headers.setContentType(MediaType.parseMediaType(contentType));
        }
        
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
