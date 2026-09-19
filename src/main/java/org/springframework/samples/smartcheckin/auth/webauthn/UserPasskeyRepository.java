package org.springframework.samples.smartcheckin.auth.webauthn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPasskeyRepository extends JpaRepository<UserPasskey, Integer> {

    Optional<UserPasskey> findByCredentialId(String credentialId);

    List<UserPasskey> findByUserId(Integer userId);

    Optional<UserPasskey> findByIdAndUserId(Integer id, Integer userId);

    boolean existsByUserId(Integer userId);

    void deleteByIdAndUserId(Integer id, Integer userId);
}
