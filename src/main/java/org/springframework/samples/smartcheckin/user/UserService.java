package org.springframework.samples.smartcheckin.user;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.samples.smartcheckin.audit.Auditable;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import java.util.UUID;
import java.util.List;

import org.jpatterns.gof.SingletonPattern;

@Service
@SingletonPattern.Singleton
@SuppressWarnings("null")
public class UserService {
    
    private final UserRepository userRepository;
    private final SignatureStorageService signatureStorageService;
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public UserService(UserRepository userRepository, SignatureStorageService signatureStorageService, AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.signatureStorageService = signatureStorageService;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public User saveUser(User user) throws DataAccessException {
        userRepository.save(user);
        return user;
    }

    @Transactional(readOnly = true)
    public User findUser(String username) {
        return userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username or email", username));
    }

    @Transactional(readOnly = true)
    public User findUser(Integer id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional(readOnly = true)
    public User findByPersonalCode(String personalCode) {
        return userRepository.findByPersonalCode(personalCode)
                .orElseThrow(() -> new ResourceNotFoundException("User", "personalCode", personalCode));
    }

    @Transactional(readOnly = true)
    public User findCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            throw new ResourceNotFoundException("Nobody authenticated!");
        else
            return userRepository.findByUsernameOrEmail(auth.getName(), auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "username or email", auth.getName()));
    }

    public Boolean existsUser(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public Iterable<User> findAll() {
        return userRepository.findAll();
    }

    public Iterable<User> findAllByAuthority(String auth) {
        return userRepository.findAllApprovedUsersByAuthority(auth);
    }

    @Transactional(readOnly = true)
    public Iterable<User> findPendingUsers() {
        return userRepository.findAllPendingUsers();
    }

    @Transactional(readOnly = true)
    public Iterable<User> findApprovedUsers() {
        return userRepository.findAllApprovedUsers();
    }

    @Transactional
    public User updateUser(@Valid User user, Integer idToUpdate) {
        User toUpdate = userRepository.findById(idToUpdate).orElseThrow(() -> new ResourceNotFoundException("User", "id", idToUpdate));
        
        toUpdate.setUsername(user.getUsername());
        toUpdate.setFirstName(user.getFirstName());
        toUpdate.setLastName(user.getLastName());
        toUpdate.setPersonalCode(user.getPersonalCode());
        toUpdate.setIsWorking(user.getIsWorking());
        toUpdate.setAuthority(user.getAuthority());
        toUpdate.setEmail(user.getEmail());
        toUpdate.setTwoFactorType(user.getTwoFactorType());
        toUpdate.setEmailNotificationsEnabled(user.getEmailNotificationsEnabled());
        toUpdate.setPushNotificationsEnabled(user.getPushNotificationsEnabled());
        
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            toUpdate.setPassword(user.getPassword());
        }
        
        userRepository.save(toUpdate);
        return toUpdate;
    }

    @Transactional
    @Auditable(action = "USER_ANONYMIZED", details = "User GDPR right to be forgotten applied")
    public void deleteUser(Integer id) {
        User toAnonymize = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        String oldUsername = toAnonymize.getUsername();
        
        // 1. Borrado físico de las firmas digitales (OneDrive/Disco)
        if (toAnonymize.getCheckins() != null) {
            toAnonymize.getCheckins().forEach(checkin -> {
                if (checkin.getSignature() != null) {
                    signatureStorageService.deleteSignature(checkin.getSignature());
                    checkin.setSignature(null);
                }
            });
        }

        if (toAnonymize.getFormationAttendances() != null) {
            toAnonymize.getFormationAttendances().forEach(attendance -> {
                if (attendance.getSignature() != null) {
                    signatureStorageService.deleteSignature(attendance.getSignature());
                    attendance.setSignature(null);
                }
            });
        }

        // 2. Generamos strings aleatorios para evitar colisiones de constraints UNIQUE
        String randomUUID = UUID.randomUUID().toString().replace("-", "");
        String randomSuffix = randomUUID.substring(0, 8);
        String randomCode = randomUUID.substring(8, 12);
        String anonymizedUsername = "GDPR_DEL_" + randomSuffix;

        // 3. Anonimizar logs de auditoría antiguos (en username y en el JSON details)
        List<AuditLog> userLogs = auditLogRepository.findByUsername(oldUsername);
        if (userLogs != null && !userLogs.isEmpty()) {
            userLogs.forEach(log -> {
                log.setUsername(anonymizedUsername);
                if (log.getDetails() != null && log.getDetails().contains(oldUsername)) {
                    log.setDetails(log.getDetails().replace(oldUsername, anonymizedUsername));
                }
            });
            auditLogRepository.saveAll(userLogs);
        }

        List<AuditLog> logsWithDetails = auditLogRepository.findByDetailsContaining(oldUsername);
        if (logsWithDetails != null && !logsWithDetails.isEmpty()) {
            logsWithDetails.forEach(log -> {
                if (log.getDetails() != null) {
                    log.setDetails(log.getDetails().replace(oldUsername, anonymizedUsername));
                }
            });
            auditLogRepository.saveAll(logsWithDetails);
        }
        
        // 4. Anonimización física de los PII (Identificadores Personales)
        toAnonymize.setUsername(anonymizedUsername);
        toAnonymize.setEmail("deleted_" + randomSuffix + "@anonymized.local");
        toAnonymize.setFirstName("Anonymized");
        toAnonymize.setLastName("User");
        toAnonymize.setPersonalCode(randomCode); 
        toAnonymize.setPassword("DELETED_GDPR_INVALID_PASSWORD_HASH");
        toAnonymize.setTwoFactorSecret(null);
        toAnonymize.setTwoFactorType(null);
        
        // 5. Revocar permisos y desactivar notificaciones
        toAnonymize.setIsWorking(false);
        toAnonymize.setIsApproved(false);
        toAnonymize.setEmailNotificationsEnabled(false);
        toAnonymize.setPushNotificationsEnabled(false);
        
        // Guardamos los cambios sin destruir las Foreign Keys de la base de datos
        userRepository.save(toAnonymize);
    }
}