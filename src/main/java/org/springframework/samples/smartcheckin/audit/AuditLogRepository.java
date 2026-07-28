package org.springframework.samples.smartcheckin.audit;

import java.util.List;
import org.springframework.data.repository.CrudRepository;

public interface AuditLogRepository extends CrudRepository<AuditLog, Integer> {
    List<AuditLog> findAllByOrderByTimestampDesc();
}
