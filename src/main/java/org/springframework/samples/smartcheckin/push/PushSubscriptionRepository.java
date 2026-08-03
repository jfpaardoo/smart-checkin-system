package org.springframework.samples.smartcheckin.push;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.samples.smartcheckin.user.User;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntity, Integer> {
    List<PushSubscriptionEntity> findByUser(User user);
    Optional<PushSubscriptionEntity> findByEndpoint(String endpoint);
    void deleteByEndpoint(String endpoint);
}
