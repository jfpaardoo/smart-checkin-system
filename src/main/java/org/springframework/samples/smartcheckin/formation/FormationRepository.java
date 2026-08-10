package org.springframework.samples.smartcheckin.formation;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FormationRepository extends CrudRepository<Formation, Integer> {

    List<Formation> findByFormationDateAfterOrderByFormationDateAsc(LocalDateTime date);

    Long countByFormationDateAfter(LocalDateTime date);
    Long countByFormationDateBefore(LocalDateTime date);
}
