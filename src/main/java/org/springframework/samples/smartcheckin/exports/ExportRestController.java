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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.analytics.AnalyticsService;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;
import org.springframework.samples.smartcheckin.auth.session.UserSession;
import org.springframework.samples.smartcheckin.auth.session.UserSessionRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.samples.smartcheckin.exports.strategy.DataExportStrategy;
import org.springframework.samples.smartcheckin.exports.strategy.ExportFactory;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.util.ByteArrayMultipartFile;
import org.springframework.samples.smartcheckin.exports.strategy.ExportUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
    private final UserSessionRepository userSessionRepository;
    private final AnalyticsService analyticsService;
    private final ExportFactory exportFactory;
    private final OfficialFormationSheetService officialFormationSheetService;
    private final CloudStorageAdapter cloudStorageAdapter;

    @Autowired
    public ExportRestController(CheckinRepository checkinRepository,
                                FormationAttendanceRepository attendanceRepository,
                                FormationRepository formationRepository,
                                UserService userService,
                                AuditLogRepository auditLogRepository,
                                UserSessionRepository userSessionRepository,
                                AnalyticsService analyticsService,
                                ExportFactory exportFactory,
                                OfficialFormationSheetService officialFormationSheetService,
                                @Autowired(required = false) CloudStorageAdapter cloudStorageAdapter) {
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
        this.formationRepository = formationRepository;
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
        this.userSessionRepository = userSessionRepository;
        this.analyticsService = analyticsService;
        this.exportFactory = exportFactory;
        this.officialFormationSheetService = officialFormationSheetService;
        this.cloudStorageAdapter = cloudStorageAdapter;
    }

    @GetMapping("/formations/{id}/official-sheet")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportOfficialFormationSheet(
            @PathVariable Integer id,
            @RequestParam(required = false) String formationWord,
            @RequestParam(required = false) String summaryWord,
            @RequestParam(required = false) String filename,
            @RequestParam(required = false, defaultValue = "excel") String format) throws IOException {
        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Formación no encontrada"));

        boolean isPdf = "pdf".equalsIgnoreCase(format);
        byte[] data = isPdf 
                ? officialFormationSheetService.generateOfficialSheetPdf(formation)
                : officialFormationSheetService.generateOfficialSheet(formation);

        String mimeType = isPdf ? "application/pdf" : "application/vnd.ms-excel";
        String extension = isPdf ? ".pdf" : ".xls";

        String finalFilename;
        if (filename != null && !filename.isBlank()) {
            finalFilename = filename.toLowerCase().endsWith(extension) 
                    ? filename 
                    : filename.replaceAll("\\.[^.]+$", "") + extension;
        } else {
            finalFilename = buildOfficialSheetFilename(formation, formationWord, summaryWord, extension);
        }

        syncOfficialSheetToCloud(formation, finalFilename, data, mimeType);

        return createResponse(data, finalFilename, mimeType);
    }

    private String buildOfficialSheetFilename(Formation formation, String formationWord, String summaryWord, String extension) {
        String fWord = (formationWord != null && !formationWord.isBlank()) ? formationWord.trim().toUpperCase() : "FORMACIÓN";
        String sWord = (summaryWord != null && !summaryWord.isBlank()) ? summaryWord.trim().toUpperCase() : "SUMARIO Y REGISTRO DE PRESENCIAS";
        String yearMonth = formation.getFormationDate() != null 
                ? formation.getFormationDate().format(DateTimeFormatter.ofPattern("yyyyMM")) 
                : LocalDateTime.now(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyyMM"));
        String safeFormationName = formation.getName() != null 
                ? formation.getName().toUpperCase().replaceAll("[\\\\/:*?\"<>|~#%&{}]", "_").trim() 
                : "SIN_NOMBRE";
        return yearMonth + "_" + fWord + "_" + safeFormationName + "_" + sWord + "_FOR_99 HRS" + extension;
    }

    private void syncOfficialSheetToCloud(Formation formation, String filename, byte[] data, String mimeType) {
        if (cloudStorageAdapter == null) {
            return;
        }
        try {
            ByteArrayMultipartFile multipartFile = 
                    new ByteArrayMultipartFile(
                            filename, 
                            filename, 
                            mimeType, 
                            data
                    );
            String uploadedDoc = cloudStorageAdapter.uploadFile(multipartFile, formation.getName());
            if (uploadedDoc != null && !formation.getDocumentUrls().contains(uploadedDoc)) {
                formation.getDocumentUrls().add(uploadedDoc);
                formationRepository.save(formation);
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ExportRestController.class)
                    .warn("No se pudo sincronizar automáticamente la hoja oficial FOR 99 en OneDrive: {}", e.getMessage());
        }
    }

    @GetMapping("/user-formations/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportUserFormations(
            @PathVariable String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String locator,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String performance,
            @RequestParam(required = false) Boolean isWorking,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String attendanceStatus,
            @RequestParam(required = false) Integer formationId,
            @RequestParam(required = false) Integer userId) throws IOException {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        LocalDateTime start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate).atTime(23, 59, 59) : null;

        List<UserFormationExportDTO> records = analyticsService.getFilteredUserFormations(
                new AnalyticsService.UserFormationFilterCriteria(
                        search, companyId, locator, role, performance, isWorking,
                        start, end, attendanceStatus, formationId, userId
                )
        );
        byte[] data = strategy.exportUserFormations(records);
        return createResponse(data, "asistencias_formaciones_detallado." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/user/{userId}/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportSingleUserDossier(
            @PathVariable Integer userId,
            @PathVariable String format) throws IOException {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        UserAnalyticsDTO userAnalytics = analyticsService.getUserAnalytics(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        byte[] data = strategy.exportSingleUserDossier(userAnalytics, userAnalytics.getFormationDetails());
        String cleanUsername = userAnalytics.getUsername() != null ? userAnalytics.getUsername().replaceAll("\\W", "_") : "empleado";
        return createResponse(data, "expediente_formativo_" + cleanUsername + "." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/users/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportUsers(
            @PathVariable String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String locator,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String performance,
            @RequestParam(required = false) Boolean isWorking) throws IOException {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<UserAnalyticsDTO> users = analyticsService.getFilteredUsersAnalytics(search, companyId, locator, role, performance, isWorking);
        byte[] data = strategy.exportUsers(users);
        return createResponse(data, "empleados_analiticas." + strategy.getFileExtension(), strategy.getContentType());
    }

    @GetMapping("/checkins/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckins(
            @PathVariable String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer userId) throws IOException {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();
        checkins = filterCheckins(checkins, search, companyId, startDate, endDate, userId);

        byte[] data = strategy.exportCheckins(checkins);
        return createResponse(data, "checkins." + strategy.getFileExtension(), strategy.getContentType());
    }

    private List<Checkin> filterCheckins(List<Checkin> checkins, String search, Integer companyId,
                                         String startDate, String endDate, Integer userId) {
        List<Checkin> result = checkins;
        if (companyId != null) {
            result = result.stream()
                    .filter(c -> c.getUser() != null && c.getUser().getCompany() != null && companyId.equals(c.getUser().getCompany().getId()))
                    .toList();
        }
        if (userId != null) {
            result = result.stream()
                    .filter(c -> c.getUser() != null && userId.equals(c.getUser().getId()))
                    .toList();
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            result = result.stream()
                    .filter(c -> matchesUserSearch(c.getUser(), q))
                    .toList();
        }
        if (startDate != null && !startDate.isBlank()) {
            LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
            result = result.stream().filter(c -> c.getCheckInDate() != null && !c.getCheckInDate().isBefore(start)).toList();
        }
        if (endDate != null && !endDate.isBlank()) {
            LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
            result = result.stream().filter(c -> c.getCheckInDate() != null && !c.getCheckInDate().isAfter(end)).toList();
        }
        return result;
    }

    private boolean matchesUserSearch(User user, String query) {
        if (user == null) {
            return false;
        }
        return (user.getUsername() != null && user.getUsername().toLowerCase().contains(query)) ||
               (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(query)) ||
               (user.getLastName() != null && user.getLastName().toLowerCase().contains(query)) ||
               (user.getPersonalCode() != null && user.getPersonalCode().toLowerCase().contains(query));
    }

    @GetMapping("/formations/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportFormations(
            @PathVariable String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) throws IOException {
        DataExportStrategy strategy = exportFactory.getStrategy(format);
        List<Formation> formations = (List<Formation>) formationRepository.findAll();

        if (companyId != null) {
            formations = filterFormationsByCompany(formations, companyId);
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            formations = formations.stream()
                    .filter(f -> f.getName() != null && f.getName().toLowerCase().contains(q))
                    .toList();
        }
        if (startDate != null && !startDate.isBlank()) {
            LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
            formations = formations.stream().filter(f -> f.getFormationDate() != null && !f.getFormationDate().isBefore(start)).toList();
        }
        if (endDate != null && !endDate.isBlank()) {
            LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
            formations = formations.stream().filter(f -> f.getFormationDate() != null && !f.getFormationDate().isAfter(end)).toList();
        }

        byte[] data = strategy.exportFormations(formations);
        return createResponse(data, "formations." + strategy.getFileExtension(), strategy.getContentType());
    }

    private List<Formation> filterFormationsByCompany(List<Formation> formations, Integer companyId) {
        List<Formation> result = new ArrayList<>();
        for (Formation f : formations) {
            if (f.getAttendances() == null || f.getAttendances().isEmpty()) {
                continue;
            }
            List<FormationAttendance> matching = f.getAttendances().stream()
                    .filter(att -> att.getUser() != null && att.getUser().getCompany() != null && companyId.equals(att.getUser().getCompany().getId()))
                    .toList();
            if (!matching.isEmpty()) {
                Formation copy = Formation.builder()
                        .name(f.getName())
                        .description(f.getDescription())
                        .formationDate(f.getFormationDate())
                        .documentUrls(f.getDocumentUrls())
                        .attendances(new ArrayList<>(matching))
                        .build();
                copy.setId(f.getId());
                result.add(copy);
            }
        }
        return result;
    }

    @GetMapping("/audit/{format}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs(@PathVariable String format) throws IOException {
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

        ObjectMapper mapper = createObjectMapper();
        Map<String, Object> exportData = new LinkedHashMap<>();

        exportData.put("_metadata", buildMetadataMap(user));
        exportData.put("userProfile", buildUserProfileMap(user));
        exportData.put("checkinsHistory", buildCheckinsMap(checkins));
        exportData.put("formationsHistory", buildFormationsMap(attendances));
        exportData.put("activeSessions", buildSessionsMap(user));
        exportData.put("personalAuditLogs", buildAuditMap(user));

        byte[] jsonData = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(exportData);
        return createResponse(jsonData, "my_data.json", MediaType.APPLICATION_JSON_VALUE);
    }

    private ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    private Map<String, Object> buildMetadataMap(User user) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("exportTimestamp", LocalDateTime.now(ZoneId.systemDefault()).format(DateTimeFormatter.ISO_DATE_TIME));
        metadata.put("schemaVersion", "2.0.0");
        metadata.put("systemName", "Smart Check-in (Distribution Academy)");
        metadata.put("compliance", "Reglamento General de Protección de Datos (RGPD / EU GDPR 2016/679)");
        metadata.put("requestingUser", user.getUsername());
        return metadata;
    }

    private Map<String, Object> buildUserProfileMap(User user) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("personalCode", user.getPersonalCode());
        profile.put("locator", user.getLocator());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("authority", user.getAuthority() != null ? user.getAuthority().getAuthority() : null);
        profile.put("company", user.getCompany() != null ? user.getCompany().getName() : null);
        profile.put("isWorking", user.getIsWorking());
        profile.put("isApproved", user.getIsApproved());
        profile.put("emailNotificationsEnabled", user.getEmailNotificationsEnabled());
        profile.put("pushNotificationsEnabled", user.getPushNotificationsEnabled());
        profile.put("privacyPolicyAccepted", user.getPrivacyPolicyAccepted());
        profile.put("privacyPolicyAcceptedAt", user.getPrivacyPolicyAcceptedAt());
        profile.put("twoFactorEnabled", user.getTwoFactorEnabled());
        profile.put("twoFactorType", user.getTwoFactorType());
        return profile;
    }

    private Map<String, Object> buildCheckinsMap(List<Checkin> checkins) {
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("totalCheckinsCount", checkins != null ? checkins.size() : 0);
        block.put("records", checkins != null ? checkins : List.of());
        return block;
    }

    private Map<String, Object> buildFormationsMap(List<FormationAttendance> attendances) {
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("totalAttendancesCount", attendances != null ? attendances.size() : 0);
        List<Map<String, Object>> list = new ArrayList<>();
        if (attendances != null) {
            for (FormationAttendance att : attendances) {
                list.add(buildAttendanceEntry(att));
            }
        }
        block.put("attendances", list);
        return block;
    }

    private Map<String, Object> buildAttendanceEntry(FormationAttendance att) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", att.getId());
        map.put("formationId", att.getFormation() != null ? att.getFormation().getId() : null);
        map.put("formationName", att.getFormation() != null ? att.getFormation().getName() : null);
        map.put("formationDate", att.getFormation() != null ? att.getFormation().getFormationDate() : null);
        map.put("checkInDate", att.getCheckInDate());
        map.put("checkOutDate", att.getCheckOutDate());
        map.put("signaturePresent", att.getSignature() != null && !att.getSignature().trim().isEmpty());
        map.put("digitalVerificationHash", ExportUtils.generateVerificationHash(att));
        return map;
    }

    private List<Map<String, Object>> buildSessionsMap(User user) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (userSessionRepository == null || user.getUsername() == null) {
            return list;
        }
        List<UserSession> sessions = userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc(user.getUsername());
        if (sessions != null) {
            for (UserSession s : sessions) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", s.getId());
                map.put("deviceInfo", s.getDeviceInfo());
                map.put("userAgent", s.getUserAgent());
                map.put("ipAddress", s.getIpAddress());
                map.put("createdAt", s.getCreatedAt());
                map.put("lastActivityAt", s.getLastActivityAt());
                list.add(map);
            }
        }
        return list;
    }

    private List<AuditLog> buildAuditMap(User user) {
        if (auditLogRepository == null || user.getUsername() == null) {
            return List.of();
        }
        List<AuditLog> logs = auditLogRepository.findByUsername(user.getUsername());
        return logs != null ? logs : List.of();
    }

    private ResponseEntity<byte[]> createResponse(byte[] data, String filename, String contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        
        if ("text/csv".equalsIgnoreCase(contentType)) {
            headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        } else {
            headers.setContentType(MediaType.parseMediaType(contentType));
        }
        
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
