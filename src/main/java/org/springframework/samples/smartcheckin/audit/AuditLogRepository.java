package org.springframework.samples.smartcheckin.audit;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends CrudRepository<AuditLog, Integer> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query(value = "SELECT a FROM AuditLog a WHERE (:action IS NULL OR a.action = :action) AND (:username IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :username, '%')))",
           countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE (:action IS NULL OR a.action = :action) AND (:username IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :username, '%')))")
    Page<AuditLog> searchAuditLogsPaged(@Param("action") String action, @Param("username") String username, Pageable pageable);

    List<AuditLog> findTop10000ByOrderByTimestampDesc();

    List<AuditLog> findAllByOrderByIdAsc();

    Optional<AuditLog> findTopByOrderByIdDesc();

    List<AuditLog> findByUsername(String username);

    List<AuditLog> findByDetailsContaining(String keyword);

    void deleteByTimestampBefore(LocalDateTime cutoffDate);
}
