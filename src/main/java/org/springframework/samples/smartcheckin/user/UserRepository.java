package org.springframework.samples.smartcheckin.user;

import java.util.List;
import java.util.Optional;
import org.springframework.lang.NonNull;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

public interface UserRepository extends  CrudRepository<User, Integer>{
    
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByPersonalCode(String personalCode);

    Optional<User> findByPersonalCode(String personalCode);

    @NonNull
    Optional<User> findById(@NonNull Integer id);

    @Query("SELECT u FROM User u WHERE u.authority.authority = :auth")
    Iterable<User> findAllByAuthority(String auth);

    @Query("SELECT u FROM User u WHERE u.isApproved = false AND u.username NOT LIKE 'GDPR_DEL_%'")
    List<User> findAllPendingUsers();

    @Query("SELECT u FROM User u WHERE u.isApproved = true AND u.username NOT LIKE 'GDPR_DEL_%'")
    List<User> findAllApprovedUsers();

    @Query("SELECT u FROM User u WHERE u.isApproved = true AND u.authority.authority = :auth AND u.username NOT LIKE 'GDPR_DEL_%'")
    List<User> findAllApprovedUsersByAuthority(String auth);

    List<User> findByCompanyId(Integer companyId);
}