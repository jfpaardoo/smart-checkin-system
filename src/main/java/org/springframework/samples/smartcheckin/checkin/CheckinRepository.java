package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CheckinRepository extends CrudRepository<Checkin, Integer> {

    List<Checkin> findByUserId(Integer userId);

    List<Checkin> findByUserIdOrderByCheckInDateDesc(Integer userId);

    Long countByCheckInDateBetween(LocalDateTime start, LocalDateTime end);
}
