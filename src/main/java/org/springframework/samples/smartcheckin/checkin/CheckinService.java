package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.samples.smartcheckin.audit.Auditable;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class CheckinService {

    private final CheckinRepository checkInRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final SignatureStorageService signatureStorageService;

    // Constructor for tests / convenience
    public CheckinService(CheckinRepository checkInRepository, ApplicationEventPublisher eventPublisher) {
        this(checkInRepository, eventPublisher, null, null);
    }

    @Autowired
    public CheckinService(CheckinRepository checkInRepository,
                          ApplicationEventPublisher eventPublisher,
                          UserRepository userRepository,
                          SignatureStorageService signatureStorageService) {
        this.checkInRepository = checkInRepository;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
        this.signatureStorageService = signatureStorageService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    @Auditable(action = "CHECKIN_SUCCESS", details = "User checked in/out atomically")
    public Checkin executeTransactionalCheckin(User user, String signature, CheckinType explicitType) {
        User lockedUser = (userRepository != null && user != null && user.getId() != null)
                ? userRepository.findByIdWithLock(user.getId()).orElse(user)
                : user;

        CheckinType typeToApply = explicitType;
        if (typeToApply == null) {
            Optional<Checkin> lastCheckin = checkInRepository.findFirstByUserIdOrderByCheckInDateDesc(lockedUser.getId());
            if (lastCheckin.isPresent()) {
                typeToApply = lastCheckin.get().getCheckInType() == CheckinType.ENTRADA
                        ? CheckinType.SALIDA
                        : CheckinType.ENTRADA;
            } else {
                typeToApply = Boolean.TRUE.equals(lockedUser.getIsWorking())
                        ? CheckinType.SALIDA
                        : CheckinType.ENTRADA;
            }
        }

        Checkin checkIn = Checkin.builder()
                .checkInDate(LocalDateTime.now(ZoneId.systemDefault()))
                .checkInType(typeToApply)
                .user(lockedUser)
                .signature(signature)
                .build();

        Checkin savedCheckin = checkInRepository.save(checkIn);
        lockedUser.setIsWorking(typeToApply == CheckinType.ENTRADA);
        if (userRepository != null) {
            userRepository.save(lockedUser);
        }
        eventPublisher.publishEvent(new CheckinEvent(this));
        return savedCheckin;
    }

    @Transactional(rollbackFor = Exception.class)
    @Auditable(action = "OFFLINE_BATCH_REGISTERED", details = "Atomic offline checkins batch registered")
    public List<CheckinResponseDTO> processOfflineBatch(User user, List<OfflineCheckinRequest> requests) {
        validateOfflineBatchInput(user, requests);

        // P0 Concurrencia: Bloqueo pesimista del usuario para evitar condición de carrera
        User lockedUser = (userRepository != null && user.getId() != null)
                ? userRepository.findByIdWithLock(user.getId()).orElse(user)
                : user;
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        List<CheckinResponseDTO> processedDtos = new ArrayList<>();

        boolean currentWorking = Boolean.TRUE.equals(lockedUser.getIsWorking());

        for (OfflineCheckinRequest req : requests) {
            validateOfflineCheckinRequest(req, now, lockedUser.getId());

            if (isOfflineEventAlreadyProcessed(req)) {
                continue;
            }

            // P0 Antifraude: NUNCA confiar en checkInType del cliente; derivar de forma estricta
            CheckinType derivedType = currentWorking ? CheckinType.SALIDA : CheckinType.ENTRADA;
            String signatureFile = saveOfflineSignature(req.getSignature());

            Checkin checkin = Checkin.builder()
                    .checkInDate(now)
                    .checkInType(derivedType)
                    .user(lockedUser)
                    .signature(signatureFile)
                    .isOffline(true)
                    .offlineTimestamp(req.getOfflineTimestamp())
                    .offlineQrHash(req.getQrHash())
                    .offlineEventId(req.getOfflineEventId())
                    .build();

            Checkin saved = checkInRepository.save(checkin);
            currentWorking = (derivedType == CheckinType.ENTRADA);
            lockedUser.setIsWorking(currentWorking);
            processedDtos.add(CheckinResponseDTO.fromEntity(saved));
        }

        if (userRepository != null) {
            userRepository.save(lockedUser);
        }
        eventPublisher.publishEvent(new CheckinEvent(this));
        return processedDtos;
    }

    private void validateOfflineBatchInput(User user, List<OfflineCheckinRequest> requests) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Usuario no autenticado o inválido.");
        }
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("La lista de fichajes offline no puede estar vacía.");
        }
    }

    private void validateOfflineCheckinRequest(OfflineCheckinRequest req, LocalDateTime now, Integer userId) {
        if (req.getOfflineTimestamp() == null) {
            throw new IllegalArgumentException("El timestamp del fichaje offline es obligatorio.");
        }
        validateOfflineTimestampRange(req.getOfflineTimestamp(), now);
        validateOfflineQrHash(req.getQrHash(), userId);
    }

    private void validateOfflineTimestampRange(LocalDateTime timestamp, LocalDateTime now) {
        if (timestamp.isAfter(now.plusMinutes(2))) {
            throw new IllegalArgumentException("La fecha del fichaje offline no puede ser futura.");
        }
        if (timestamp.isBefore(now.minusHours(72))) {
            throw new IllegalArgumentException("La antigüedad del fichaje offline no puede superar 72 horas.");
        }
    }

    private void validateOfflineQrHash(String qrHash, Integer userId) {
        if (qrHash == null || qrHash.trim().isEmpty() || qrHash.trim().length() < 16) {
            throw new IllegalArgumentException("El hash del código QR offline no es válido o está ausente.");
        }
        if (checkInRepository.existsByOfflineQrHashAndUserId(qrHash, userId)) {
            throw new IllegalArgumentException("El código QR offline ya ha sido utilizado para este usuario.");
        }
    }

    private boolean isOfflineEventAlreadyProcessed(OfflineCheckinRequest req) {
        return req.getOfflineEventId() != null
                && !req.getOfflineEventId().isBlank()
                && checkInRepository.existsByOfflineEventId(req.getOfflineEventId());
    }

    private String saveOfflineSignature(String signature) {
        if (signatureStorageService != null && signature != null && !signature.isBlank()) {
            return signatureStorageService.saveSignature(signature, "checkins");
        }
        return null;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    @Auditable(action = "OFFLINE_CHECKIN_REGISTERED", details = "Offline sealed checkin registered")
    public Checkin recordOfflineCheckin(User user, OfflineCheckinRequest request) {
        User lockedUser = (userRepository != null && user != null && user.getId() != null)
                ? userRepository.findByIdWithLock(user.getId()).orElse(user)
                : user;

        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        LocalDateTime timestamp = request.getOfflineTimestamp() != null
                ? request.getOfflineTimestamp()
                : now;

        validateOfflineTimestampRange(timestamp, now);
        validateOfflineQrHash(request.getQrHash(), lockedUser.getId());

        // Derivar tipo del estado actual
        boolean currentWorking = Boolean.TRUE.equals(lockedUser.getIsWorking());
        CheckinType derivedType = currentWorking ? CheckinType.SALIDA : CheckinType.ENTRADA;

        Checkin checkin = Checkin.builder()
                .checkInDate(now)
                .checkInType(derivedType)
                .user(lockedUser)
                .signature(request.getSignature())
                .isOffline(true)
                .offlineTimestamp(timestamp)
                .offlineQrHash(request.getQrHash())
                .offlineEventId(request.getOfflineEventId())
                .build();

        Checkin saved = checkInRepository.save(checkin);
        lockedUser.setIsWorking(derivedType == CheckinType.ENTRADA);
        if (userRepository != null) {
            userRepository.save(lockedUser);
        }
        eventPublisher.publishEvent(new CheckinEvent(this));
        return saved;
    }

    @Transactional
    @Auditable(action = "CHECKIN_SUCCESS", details = "User checked in/out")
    public Checkin performCheckIn(User user, CheckinType checkInType) {
        Checkin checkIn = Checkin.builder()
            .checkInDate(LocalDateTime.now(ZoneId.systemDefault()))
            .checkInType(checkInType)
            .user(user)
            .build();
        
        Checkin savedCheckin = checkInRepository.save(checkIn);
        
        eventPublisher.publishEvent(new CheckinEvent(this));
        
        return savedCheckin;
    }

    @Transactional
    public Checkin save(Checkin checkIn) {
        return checkInRepository.save(checkIn);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findByUserId(Integer userId) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public Page<Checkin> findPagedByUserId(Integer userId, Pageable pageable) {
        return checkInRepository.findByUserIdOrderByCheckInDateDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Checkin> findById(Integer id) {
        return checkInRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Checkin> findPendingAutoCheckoutRectifications(Integer userId) {
        return checkInRepository.findPendingAutoCheckoutRectificationsByUserId(userId);
    }

    @Transactional
    public void deleteAllCheckins(User user) {
        List<Checkin> userCheckins = checkInRepository.findByUserId(user.getId());
        checkInRepository.deleteAll(userCheckins);
    }
}
