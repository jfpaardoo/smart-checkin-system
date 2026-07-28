package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
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

    @Autowired
    public AnalyticsService(UserRepository userRepository,
                            CheckinRepository checkinRepository,
                            FormationAttendanceRepository attendanceRepository) {
        this.userRepository = userRepository;
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Transactional(readOnly = true)
    public List<UserAnalyticsDTO> getAllUsersAnalytics(String search) {
        Iterable<User> users = userRepository.findAll();
        List<UserAnalyticsDTO> dtos = new ArrayList<>();

        for (User user : users) {
            dtos.add(buildUserAnalyticsDTO(user, false));
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            dtos = dtos.stream().filter(u ->
                (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(q)) ||
                (u.getLastName() != null && u.getLastName().toLowerCase().contains(q)) ||
                (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)) ||
                (u.getPersonalCode() != null && u.getPersonalCode().toLowerCase().contains(q))
            ).collect(java.util.stream.Collectors.toList());
        }

        dtos.sort(Comparator.comparing(UserAnalyticsDTO::getFirstName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        return dtos;
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
}
