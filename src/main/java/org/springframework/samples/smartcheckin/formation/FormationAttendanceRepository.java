package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.samples.smartcheckin.user.User;

@Repository
public interface FormationAttendanceRepository extends CrudRepository<FormationAttendance, Integer> {
    Optional<FormationAttendance> findByFormationAndUser(Formation formation, User user);
    Optional<FormationAttendance> findFirstByFormationAndUserOrderByCheckInDateDesc(Formation formation, User user);
    List<FormationAttendance> findAllByFormationAndUser(Formation formation, User user);
    List<FormationAttendance> findByUser(User user);
    List<FormationAttendance> findByUserId(Integer userId);
    Long countByCheckInDateBetween(LocalDateTime start, LocalDateTime end);
    void deleteByCheckInDateBefore(LocalDateTime cutoffDate);
}
