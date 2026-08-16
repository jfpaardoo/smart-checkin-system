package org.springframework.samples.smartcheckin.auth.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Integer> {

    List<UserSession> findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc(String username);

    Optional<UserSession> findByTokenHash(String tokenHash);

    Optional<UserSession> findByIdAndUsername(Integer id, String username);
}
