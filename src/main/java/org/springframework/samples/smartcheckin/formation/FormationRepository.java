package org.springframework.samples.smartcheckin.formation;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FormationRepository extends CrudRepository<Formation, Integer> {

    List<Formation> findByFormationDateAfterOrderByFormationDateAsc(LocalDateTime date);

    List<Formation> findByStatusIn(List<FormationStatus> statuses);

    List<Formation> findByStatus(FormationStatus status);

    @Query("SELECT f FROM Formation f WHERE (:search IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Formation> searchAll(@Param("search") String search);

    @Query("SELECT f FROM Formation f WHERE f.status IN :statuses AND (:search IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Formation> findByStatusInAndSearch(@Param("statuses") List<FormationStatus> statuses, @Param("search") String search);

    Long countByFormationDateAfter(LocalDateTime date);
    Long countByFormationDateBefore(LocalDateTime date);
}
