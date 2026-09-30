package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;
import org.springframework.samples.smartcheckin.audit.Auditable;

import org.springframework.transaction.annotation.Isolation;

@Service
@SuppressWarnings("null")
public class CheckinService {

    private final CheckinRepository checkInRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CheckinService(CheckinRepository checkInRepository, ApplicationEventPublisher eventPublisher) {
        this.checkInRepository = checkInRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    @Auditable(action = "CHECKIN_SUCCESS", details = "User checked in/out atomically")
    public Checkin executeTransactionalCheckin(User user, String signature, CheckinType explicitType) {
        CheckinType typeToApply = explicitType;
        if (typeToApply == null) {
            Optional<Checkin> lastCheckin = checkInRepository.findFirstByUserIdOrderByCheckInDateDesc(user.getId());
            if (lastCheckin.isPresent()) {
                typeToApply = lastCheckin.get().getCheckInType() == CheckinType.ENTRADA
                        ? CheckinType.SALIDA
                        : CheckinType.ENTRADA;
            } else {
                typeToApply = Boolean.TRUE.equals(user.getIsWorking())
                        ? CheckinType.SALIDA
                        : CheckinType.ENTRADA;
            }
        }

        Checkin checkIn = Checkin.builder()
                .checkInDate(LocalDateTime.now(ZoneId.systemDefault()))
                .checkInType(typeToApply)
                .user(user)
                .signature(signature)
                .build();

        Checkin savedCheckin = checkInRepository.save(checkIn);
        user.setIsWorking(typeToApply == CheckinType.ENTRADA);
        eventPublisher.publishEvent(new CheckinEvent(this));
        return savedCheckin;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    @Auditable(action = "OFFLINE_CHECKIN_REGISTERED", details = "Offline sealed checkin registered")
    public Checkin recordOfflineCheckin(User user, OfflineCheckinRequest request) {
        LocalDateTime timestamp = request.getOfflineTimestamp() != null
                ? request.getOfflineTimestamp()
                : LocalDateTime.now(ZoneId.systemDefault());

        CheckinType type = request.getCheckInType();
        if (type == null) {
            Optional<Checkin> lastCheckin = checkInRepository.findFirstByUserIdOrderByCheckInDateDesc(user.getId());
            type = lastCheckin.map(c -> c.getCheckInType() == CheckinType.ENTRADA ? CheckinType.SALIDA : CheckinType.ENTRADA)
                    .orElse(Boolean.TRUE.equals(user.getIsWorking()) ? CheckinType.SALIDA : CheckinType.ENTRADA);
        }

        Checkin checkin = Checkin.builder()
                .checkInDate(LocalDateTime.now(ZoneId.systemDefault()))
                .checkInType(type)
                .user(user)
                .signature(request.getSignature())
                .isOffline(true)
                .offlineTimestamp(timestamp)
                .offlineQrHash(request.getQrHash())
                .build();

        Checkin saved = checkInRepository.save(checkin);
        user.setIsWorking(type == CheckinType.ENTRADA);
        eventPublisher.publishEvent(new CheckinEvent(this));
        return saved;
    }

    @Transactional
    @Auditable(action = "CHECKIN_SUCCESS", details = "User checked in/out")
    public Checkin performCheckIn(User user, CheckinType checkInType) {
        Checkin checkIn = Checkin.builder()
            .checkInDate(LocalDateTime.now(ZoneId.systemDefault()))
            .checkInType(checkInType)
            .user(user)
            .build();
        
        Checkin savedCheckin = checkInRepository.save(checkIn);
        
        eventPublisher.publishEvent(new CheckinEvent(this));
        
        return savedCheckin;
    }

    @Transactional
    public Checkin save(Checkin checkIn) {
        return checkInRepository.save(checkIn);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findByUserId(Integer userId) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public Page<Checkin> findPagedByUserId(Integer userId, Pageable pageable) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Checkin> findById(Integer id) {
        return checkInRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findPendingAutoCheckoutRectifications(Integer userId) {
        return checkInRepository.findPendingAutoCheckoutRectificationsByUserId(userId);
    }

    @Transactional
    public void deleteAllCheckins(User user) {
        List<Checkin> userCheckins = checkInRepository.findByUserId(user.getId());
        checkInRepository.deleteAll(userCheckins);
    }
}
