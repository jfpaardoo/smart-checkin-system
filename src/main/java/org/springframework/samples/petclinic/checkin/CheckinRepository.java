package org.springframework.samples.petclinic.checkin;

import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CheckinRepository extends CrudRepository<Checkin, Integer> {

    List<Checkin> findByUserId(Integer userId);

    List<Checkin> findByUserIdOrderByCheckInDateDesc(Integer userId);
}
