package org.springframework.samples.smartcheckin.formation;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.samples.smartcheckin.user.User;

@Repository
public interface FormationAttendanceRepository extends CrudRepository<FormationAttendance, Integer> {
    Optional<FormationAttendance> findByFormationAndUser(Formation formation, User user);
}
