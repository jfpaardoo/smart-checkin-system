package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CheckinRepository extends CrudRepository<Checkin, Integer> {

    List<Checkin> findByUserId(Integer userId);

    List<Checkin> findByUserIdOrderByCheckInDateDesc(Integer userId);

    Optional<Checkin> findFirstByUserIdOrderByCheckInDateDesc(Integer userId);

    Page<Checkin> findByUserIdOrderByCheckInDateDesc(Integer userId, Pageable pageable);

    Long countByCheckInDateBetween(LocalDateTime start, LocalDateTime end);

    void deleteByCheckInDateBefore(LocalDateTime cutoffDate);

    @Query("SELECT c FROM Checkin c JOIN FETCH c.user u WHERE c.checkInType = CheckinType.ENTRADA AND u.isWorking = true AND c.checkInDate < :cutoff")
    List<Checkin> findStaleOpenCheckins(LocalDateTime cutoff);

    @Query("SELECT c FROM Checkin c WHERE c.user.id = :userId AND c.isAutoCheckout = true AND (c.isRectified IS NULL OR c.isRectified = false) ORDER BY c.checkInDate DESC")
    List<Checkin> findPendingAutoCheckoutRectificationsByUserId(Integer userId);

    @Query("SELECT c FROM Checkin c JOIN FETCH c.user u WHERE u.id IN :userIds ORDER BY c.checkInDate DESC")
    List<Checkin> findAllByUserIdIn(List<Integer> userIds);

    List<Checkin> findByIsOfflineTrueOrderByOfflineTimestampDesc();

    boolean existsByOfflineEventId(String offlineEventId);

    boolean existsByOfflineQrHashAndUserId(String offlineQrHash, Integer userId);
}
