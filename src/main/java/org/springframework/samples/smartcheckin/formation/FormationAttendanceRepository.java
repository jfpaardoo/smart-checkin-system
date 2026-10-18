package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.samples.smartcheckin.user.User;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface FormationAttendanceRepository extends CrudRepository<FormationAttendance, Integer> {
    Optional<FormationAttendance> findByFormationAndUser(Formation formation, User user);
    Optional<FormationAttendance> findFirstByFormationAndUserOrderByCheckInDateDesc(Formation formation, User user);
    List<FormationAttendance> findAllByFormationAndUser(Formation formation, User user);
    List<FormationAttendance> findByUser(User user);
    List<FormationAttendance> findByUserId(Integer userId);
    List<FormationAttendance> findByUserIdIn(List<Integer> userIds);
    Long countByCheckInDateBetween(LocalDateTime start, LocalDateTime end);
    long countByCheckInDateIsNotNull();
    void deleteByCheckInDateBefore(LocalDateTime cutoffDate);

    boolean existsBySignatureAndUserId(String signature, Integer userId);

    @Query("SELECT COUNT(fa) > 0 FROM FormationAttendance fa WHERE fa.signature = :signature AND (fa.formation.trainer = :username OR fa.formation.trainer = :fullName)")
    boolean isTrainerOfAttendance(@Param("signature") String signature, @Param("username") String username, @Param("fullName") String fullName);
}
