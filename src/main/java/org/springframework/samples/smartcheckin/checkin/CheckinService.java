package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.samples.smartcheckin.user.User;

@Service
@SuppressWarnings("null")
public class CheckinService {

    private final CheckinRepository checkInRepository;

    public CheckinService(CheckinRepository checkInRepository) {
        this.checkInRepository = checkInRepository;
    }

    @Transactional
    public Checkin performCheckIn(User user, CheckinType checkInType) {
        Checkin checkIn = new Checkin();
        checkIn.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        checkIn.setCheckInType(checkInType);
        checkIn.setUser(user);
        
        return checkInRepository.save(checkIn);
    }

    @Transactional
    public Checkin save(Checkin checkIn) {
        return checkInRepository.save(checkIn);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findByUserId(Integer userId) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId);
    }
}
