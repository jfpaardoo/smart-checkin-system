package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.exports.strategy.ExportUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
@SuppressWarnings("null")
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CheckinRepository checkinRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final FormationRepository formationRepository;

    @Autowired
    public AnalyticsService(UserRepository userRepository,
                            CheckinRepository checkinRepository,
                            FormationAttendanceRepository attendanceRepository,
                            FormationRepository formationRepository) {
        this.userRepository = userRepository;
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
        this.formationRepository = formationRepository;
    }

    @Transactional(readOnly = true)
    public List<UserAnalyticsDTO> getAllUsersAnalytics(String search) {
        return executeGetAllUsersAnalytics(search, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<UserAnalyticsDTO> getAllUsersAnalytics(String search, Integer companyId) {
        return executeGetAllUsersAnalytics(search, companyId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<UserAnalyticsDTO> getFilteredUsersAnalytics(String search, Integer companyId, String locator,
                                                            String role, String performance, Boolean isWorking) {
        return executeGetAllUsersAnalytics(search, companyId, locator, role, performance, isWorking);
    }

    private List<UserAnalyticsDTO> executeGetAllUsersAnalytics(String search, Integer companyId, String locator,
                                                               String role, String performance, Boolean isWorking) {
        Iterable<User> users = userRepository.findAll();
        List<UserAnalyticsDTO> dtos = new ArrayList<>();

        for (User user : users) {
            if (isEligibleUser(user, companyId, locator, role, isWorking)) {
                dtos.add(buildUserAnalyticsDTO(user, false));
            }
        }

        if (performance != null && !performance.isBlank() && !"ALL".equalsIgnoreCase(performance)) {
            dtos = new ArrayList<>(dtos.stream().filter(u -> matchesPerformanceFilter(u, performance)).toList());
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            dtos = new ArrayList<>(dtos.stream().filter(u -> matchesSearchQuery(u, q)).toList());
        }

        dtos.sort(Comparator.comparing(UserAnalyticsDTO::getFirstName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        return dtos;
    }

    private boolean isEligibleUser(User user, Integer companyId, String locator, String role, Boolean isWorking) {
        if (user.getAuthority() != null && "ADMIN".equals(user.getAuthority().getAuthority())) {
            return false;
        }
        if (companyId != null && (user.getCompany() == null || !companyId.equals(user.getCompany().getId()))) {
            return false;
        }
        if (!matchesLocator(user.getLocator(), locator)) {
            return false;
        }
        if (!matchesRole(user.getAuthority(), role)) {
            return false;
        }
        return matchesWorkingState(user.getIsWorking(), isWorking);
    }

    private boolean matchesLocator(String userLocator, String locator) {
        if (locator == null || locator.isBlank() || "ALL".equalsIgnoreCase(locator)) {
            return true;
        }
        if ("NONE".equalsIgnoreCase(locator)) {
            return userLocator == null || userLocator.isBlank();
        }
        return locator.equalsIgnoreCase(userLocator);
    }

    private boolean matchesRole(org.springframework.samples.smartcheckin.user.Authorities auth, String role) {
        if (role == null || role.isBlank() || "ALL".equalsIgnoreCase(role)) {
            return true;
        }
        return auth != null && role.equalsIgnoreCase(auth.getAuthority());
    }

    private boolean matchesWorkingState(Boolean userIsWorking, Boolean isWorking) {
        if (isWorking == null) {
            return true;
        }
        return Boolean.valueOf(Boolean.TRUE.equals(userIsWorking)).equals(isWorking);
    }

    private boolean matchesPerformanceFilter(UserAnalyticsDTO u, String perf) {
        double rate = u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0;
        if ("HIGH".equalsIgnoreCase(perf)) return rate >= 75.0;
        if ("MEDIUM".equalsIgnoreCase(perf)) return rate >= 50.0 && rate < 75.0;
        if ("LOW".equalsIgnoreCase(perf)) return rate < 50.0;
        return true;
    }

    private boolean matchesSearchQuery(UserAnalyticsDTO u, String q) {
        return (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(q)) ||
               (u.getLastName() != null && u.getLastName().toLowerCase().contains(q)) ||
               (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)) ||
               (u.getPersonalCode() != null && u.getPersonalCode().toLowerCase().contains(q)) ||
               (u.getCompanyName() != null && u.getCompanyName().toLowerCase().contains(q)) ||
               (u.getLocator() != null && u.getLocator().toLowerCase().contains(q));
    }

    public record UserFormationFilterCriteria(
            String search,
            Integer companyId,
            String locator,
            String role,
            String performance,
            Boolean isWorking,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String attendanceStatus,
            Integer formationId,
            Integer targetUserId
    ) {}

    @Transactional(readOnly = true)
    public List<UserFormationExportDTO> getFilteredUserFormations(UserFormationFilterCriteria criteria) {
        List<UserAnalyticsDTO> eligibleUsers = resolveEligibleUsers(criteria);
        if (eligibleUsers.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> userIds = eligibleUsers.stream().map(UserAnalyticsDTO::getUserId).filter(Objects::nonNull).toList();
        List<FormationAttendance> allAttendances = attendanceRepository.findByUserIdIn(userIds);
        Map<Integer, List<FormationAttendance>> attendancesByUser = allAttendances.stream()
                .filter(a -> a.getUser() != null && a.getUser().getId() != null)
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getUser().getId()));

        List<UserFormationExportDTO> exportList = new ArrayList<>();

        for (UserAnalyticsDTO u : eligibleUsers) {
            List<FormationAttendance> attendances = attendancesByUser.get(u.getUserId());
            if (attendances != null) {
                for (FormationAttendance att : attendances) {
                    if (isMatchingAttendance(att, criteria)) {
                        exportList.add(mapToUserFormationExportDTO(u, att));
                    }
                }
            }
        }

        exportList.sort(Comparator.comparing(UserFormationExportDTO::getFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(UserFormationExportDTO::getFormationDate, Comparator.nullsLast(Comparator.naturalOrder())));

        return exportList;
    }

    private List<UserAnalyticsDTO> resolveEligibleUsers(UserFormationFilterCriteria criteria) {
        if (criteria.targetUserId() != null) {
            return userRepository.findById(criteria.targetUserId())
                    .map(u -> List.of(buildUserAnalyticsDTO(u, true)))
                    .orElse(Collections.emptyList());
        }
        return executeGetAllUsersAnalytics(
                criteria.search(), criteria.companyId(), criteria.locator(),
                criteria.role(), criteria.performance(), criteria.isWorking()
        );
    }

    private boolean isMatchingAttendance(FormationAttendance att, UserFormationFilterCriteria criteria) {
        Formation f = att.getFormation();
        if (f == null) {
            return false;
        }
        if (criteria.formationId() != null && !criteria.formationId().equals(f.getId())) {
            return false;
        }
        if (criteria.startDate() != null && f.getFormationDate() != null && f.getFormationDate().isBefore(criteria.startDate())) {
            return false;
        }
        if (criteria.endDate() != null && f.getFormationDate() != null && f.getFormationDate().isAfter(criteria.endDate())) {
            return false;
        }
        if (criteria.attendanceStatus() != null && !criteria.attendanceStatus().isBlank() && !"ALL".equalsIgnoreCase(criteria.attendanceStatus())) {
            String status = calculateAttendanceStatus(att);
            return matchesAttendanceStatus(status, criteria.attendanceStatus());
        }
        return true;
    }

    private UserFormationExportDTO mapToUserFormationExportDTO(UserAnalyticsDTO u, FormationAttendance att) {
        Formation f = att.getFormation();
        String status = calculateAttendanceStatus(att);
        long minutes = calculateAttendanceDurationMinutes(att);
        String formattedHours = formatMinutesToHours(minutes);
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        String hash = ExportUtils.generateVerificationHash(att);

        return UserFormationExportDTO.builder()
                .userId(u.getUserId())
                .username(u.getUsername())
                .personalCode(u.getPersonalCode())
                .fullName(((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim())
                .email(u.getUsername())
                .locator(u.getLocator())
                .companyId(u.getCompanyId())
                .companyName(u.getCompanyName())
                .authority(u.getAuthority())
                .isWorking(u.getIsWorking())
                .formationId(f.getId())
                .formationName(f.getName())
                .formationDescription(f.getDescription())
                .formationDate(f.getFormationDate())
                .status(status)
                .checkInDate(att.getCheckInDate())
                .checkOutDate(att.getCheckOutDate())
                .durationMinutes(minutes)
                .durationHoursFormatted(formattedHours)
                .hasSignature(hasSig)
                .verificationHash(hash)
                .build();
    }

    private String calculateAttendanceStatus(FormationAttendance att) {
        if (att.getCheckInDate() != null) {
            if (att.getCheckOutDate() != null) {
                return "ASISTIÓ";
            }
            return "EN CURSO";
        }
        return "NO ASISTIÓ";
    }

    private boolean matchesAttendanceStatus(String actualStatus, String filter) {
        if ("ATTENDED".equalsIgnoreCase(filter) || "ASISTIO".equalsIgnoreCase(filter)) {
            return "ASISTIÓ".equalsIgnoreCase(actualStatus);
        }
        if ("IN_PROGRESS".equalsIgnoreCase(filter) || "EN_CURSO".equalsIgnoreCase(filter)) {
            return "EN CURSO".equalsIgnoreCase(actualStatus);
        }
        if ("MISSED".equalsIgnoreCase(filter) || "NOT_ATTENDED".equalsIgnoreCase(filter) || "NO_ASISTIO".equalsIgnoreCase(filter) || "PENDING".equalsIgnoreCase(filter)) {
            return "NO ASISTIÓ".equalsIgnoreCase(actualStatus) || "PENDIENTE".equalsIgnoreCase(actualStatus);
        }
        return true;
    }

    private long calculateAttendanceDurationMinutes(FormationAttendance att) {
        if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
            return Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
        }
        return 0;
    }

    private String formatMinutesToHours(long minutes) {
        if (minutes <= 0) {
            return "0h 0m (0.0h)";
        }
        long hours = minutes / 60;
        long remainingMins = minutes % 60;
        double decimalHours = Math.round((minutes / 60.0) * 10.0) / 10.0;
        return String.format(java.util.Locale.US, "%dh %dm (%.1fh)", hours, remainingMins, decimalHours);
    }

    @Transactional(readOnly = true)
    public Optional<UserAnalyticsDTO> getUserAnalytics(Integer userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return userRepository.findById(userId).map(user -> buildUserAnalyticsDTO(user, true));
    }

    private UserAnalyticsDTO buildUserAnalyticsDTO(User user, boolean includeDetails) {
        List<Checkin> checkins = checkinRepository.findByUserIdOrderByCheckInDateDesc(user.getId());
        List<FormationAttendance> attendances = attendanceRepository.findByUserId(user.getId());

        int totalCheckins = checkins.size();
        long totalWorkMinutes = calculateWorkMinutes(checkins);

        int formationsAssigned = attendances.size();
        int formationsAttended = (int) attendances.stream().filter(a -> a.getCheckInDate() != null).count();
        int formationsCompleted = (int) attendances.stream().filter(a -> a.getCheckOutDate() != null).count();

        double attendancePercentage = formationsAssigned > 0 
                ? Math.round(((double) formationsAttended / formationsAssigned) * 100.0 * 10.0) / 10.0
                : 0.0;

        long totalFormationMinutes = calculateTotalFormationMinutes(attendances);
        List<UserFormationDetailDTO> formationDetails = includeDetails ? buildFormationDetailList(attendances) : Collections.emptyList();

        return UserAnalyticsDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .personalCode(user.getPersonalCode())
                .authority(user.getAuthority() != null ? user.getAuthority().getAuthority() : "USER")
                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .locator(user.getLocator())
                .isWorking(user.getIsWorking() != null && user.getIsWorking())
                .totalCheckins(totalCheckins)
                .totalWorkMinutes(totalWorkMinutes)
                .formationsAssigned(formationsAssigned)
                .formationsAttended(formationsAttended)
                .formationsCompleted(formationsCompleted)
                .attendancePercentage(attendancePercentage)
                .totalFormationMinutes(totalFormationMinutes)
                .formationDetails(formationDetails)
                .build();
    }

    private List<UserFormationDetailDTO> buildFormationDetailList(List<FormationAttendance> attendances) {
        List<UserFormationDetailDTO> list = new ArrayList<>();
        for (FormationAttendance att : attendances) {
            UserFormationDetailDTO detail = processFormationAttendance(att);
            if (detail != null) {
                list.add(detail);
            }
        }
        list.sort(Comparator.comparing(UserFormationDetailDTO::getFormationDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return list;
    }

    private UserFormationDetailDTO processFormationAttendance(FormationAttendance att) {
        if (att.getFormation() == null) {
            return null;
        }

        long minutes = 0;
        String status = "PENDING";

        if (att.getCheckInDate() != null) {
            status = "IN_PROGRESS";
            if (att.getCheckOutDate() != null) {
                status = "COMPLETED";
                minutes = Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
            }
        }

        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        return UserFormationDetailDTO.builder()
                .formationId(att.getFormation().getId())
                .formationName(att.getFormation().getName())
                .description(att.getFormation().getDescription())
                .formationDate(att.getFormation().getFormationDate())
                .checkInDate(att.getCheckInDate())
                .checkOutDate(att.getCheckOutDate())
                .durationMinutes(minutes)
                .hasSignature(hasSig)
                .signature(att.getSignature())
                .status(status)
                .build();
    }

    private long calculateTotalFormationMinutes(List<FormationAttendance> attendances) {
        long total = 0;
        for (FormationAttendance att : attendances) {
            if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
                total += Duration.between(att.getCheckInDate().atZone(ZoneOffset.UTC), att.getCheckOutDate().atZone(ZoneOffset.UTC)).toMinutes();
            }
        }
        return total;
    }

    private long calculateWorkMinutes(List<Checkin> checkins) {
        List<Checkin> chronological = new ArrayList<>(checkins);
        chronological.sort(Comparator.comparing(Checkin::getCheckInDate, Comparator.nullsLast(Comparator.naturalOrder())));

        long totalMinutes = 0;
        LocalDateTime lastEntrada = null;

        for (Checkin c : chronological) {
            if (c.getCheckInType() == CheckinType.ENTRADA) {
                lastEntrada = c.getCheckInDate();
            } else if (c.getCheckInType() == CheckinType.SALIDA && lastEntrada != null) {
                if (c.getCheckInDate() != null && c.getCheckInDate().isAfter(lastEntrada)) {
                    totalMinutes += Duration.between(lastEntrada.atZone(ZoneOffset.UTC), c.getCheckInDate().atZone(ZoneOffset.UTC)).toMinutes();
                }
                lastEntrada = null;
            }
        }
        return totalMinutes;
    }

    @Transactional(readOnly = true)
    public List<FormationAnalyticsDTO> getFormationAnalytics() {
        List<FormationAnalyticsDTO> dtos = new ArrayList<>();
        Iterable<Formation> formations = formationRepository.findAll();
        long totalActiveUsers = calculateTotalActiveUsers();

        for (Formation f : formations) {
            dtos.add(createFormationAnalyticsDTO(f, totalActiveUsers));
        }

        dtos.sort(Comparator.comparing(FormationAnalyticsDTO::getFormationDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return dtos;
    }

    private long calculateTotalActiveUsers() {
        long total = 0;
        for (User u : userRepository.findAll()) {
            if (u.getAuthority() != null && "USER".equals(u.getAuthority().getAuthority()) && Boolean.TRUE.equals(u.getIsWorking())) {
                total++;
            }
        }
        return total == 0 ? 1 : total;
    }

    private FormationAnalyticsDTO createFormationAnalyticsDTO(Formation f, long totalActiveUsers) {
        int attended = 0;
        if (f.getAttendances() != null) {
            for (FormationAttendance att : f.getAttendances()) {
                if (att.getCheckInDate() != null) {
                    attended++;
                }
            }
        }
        
        double percentage = Math.round(((double) attended / totalActiveUsers) * 100.0 * 10.0) / 10.0;
        if (percentage > 100.0) percentage = 100.0;

        return FormationAnalyticsDTO.builder()
            .formationId(f.getId())
            .formationName(f.getName())
            .formationDate(f.getFormationDate())
            .totalExpected((int) totalActiveUsers)
            .totalAttended(attended)
            .attendancePercentage(percentage)
            .build();
    }
}
