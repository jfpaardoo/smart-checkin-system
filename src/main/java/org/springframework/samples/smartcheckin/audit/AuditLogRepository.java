package org.springframework.samples.smartcheckin.audit;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.repository.CrudRepository;

public interface AuditLogRepository extends CrudRepository<AuditLog, Integer> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByUsername(String username);

    void deleteByTimestampBefore(LocalDateTime cutoffDate);
}
