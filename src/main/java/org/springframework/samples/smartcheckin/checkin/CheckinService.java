package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;
import org.springframework.samples.smartcheckin.audit.Auditable;

import org.jpatterns.gof.SingletonPattern;
import org.jpatterns.gof.ObserverPattern;

@Service
@SingletonPattern.Singleton
@ObserverPattern.Subject
@SuppressWarnings("null")
public class CheckinService {

    private final CheckinRepository checkInRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CheckinService(CheckinRepository checkInRepository, ApplicationEventPublisher eventPublisher) {
        this.checkInRepository = checkInRepository;
        this.eventPublisher = eventPublisher;
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
    public org.springframework.data.domain.Page<Checkin> findPagedByUserId(Integer userId, org.springframework.data.domain.Pageable pageable) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId, pageable);
    }

    @Transactional
    public void deleteAllCheckins(User user) {
        List<Checkin> userCheckins = checkInRepository.findByUserId(user.getId());
        checkInRepository.deleteAll(userCheckins);
    }
}
