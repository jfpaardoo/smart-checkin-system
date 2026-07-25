package org.springframework.samples.petclinic.checkin;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class CheckinService {

    private final CheckinRepository checkInRepository;

    public CheckinService(CheckinRepository checkInRepository) {
        this.checkInRepository = checkInRepository;
    }

    @Transactional
    public Checkin save(Checkin checkIn) {
        return checkInRepository.save(checkIn);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findByUserId(Integer userId) {
        return checkInRepository.findByUserIdOrderByCheckinDateDesc(userId);
    }
}
