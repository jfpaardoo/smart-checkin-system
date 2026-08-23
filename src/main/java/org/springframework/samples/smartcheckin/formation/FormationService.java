package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.statistics.events.FormationAttendanceEvent;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.samples.smartcheckin.totp.TotpService;
import org.jpatterns.gof.SingletonPattern;
@Service
@SingletonPattern.Singleton
@SuppressWarnings("null")
public class FormationService {

    private final FormationRepository formationRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final UserService userService;
    private final CloudStorageAdapter cloudStorageAdapter;
    private final NotificationContext notificationContext;
    private final SignatureStorageService signatureStorageService;
    private final ApplicationEventPublisher eventPublisher;
    private final TotpService totpService;

    @Autowired
    public FormationService(FormationRepository formationRepository, 
                            FormationAttendanceRepository attendanceRepository, 
                            UserService userService,
                            CloudStorageAdapter cloudStorageAdapter,
                            NotificationContext notificationContext,
                            SignatureStorageService signatureStorageService,
                            ApplicationEventPublisher eventPublisher,
                            TotpService totpService) {
        this.formationRepository = formationRepository;
        this.attendanceRepository = attendanceRepository;
        this.userService = userService;
        this.cloudStorageAdapter = cloudStorageAdapter;
        this.notificationContext = notificationContext;
        this.signatureStorageService = signatureStorageService;
        this.eventPublisher = eventPublisher;
        this.totpService = totpService;
    }

    private static final String FORMATION_NOT_FOUND_MSG = "Formation not found";

    @Transactional
    public Formation saveFormation(Formation formation) {
        return formationRepository.save(formation);
    }

    @Transactional(rollbackFor = Exception.class)
    public Formation saveFormation(Formation formation, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            String fileUrl = cloudStorageAdapter.uploadFile(file, "formations");
            formation.getDocumentUrls().add(fileUrl);
        }
        return formationRepository.save(formation);
    }

    @Transactional(readOnly = true)
    public List<Formation> findAll() {
        return (List<Formation>) formationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Formation> findById(Integer id) {
        return formationRepository.findById(id);
    }

    private Optional<FormationAttendance> findAttendance(Formation formation, User user) {
        try {
            Optional<FormationAttendance> att = attendanceRepository.findByFormationAndUser(formation, user);
            if (att.isPresent()) {
                return att;
            }
        } catch (Exception e) {
            // Fallback if duplicate records exist in database (NonUniqueResultException)
        }
        return attendanceRepository.findFirstByFormationAndUserOrderByCheckInDateDesc(formation, user);
    }

    private Formation doRegisterAttendance(Integer formationId, User user) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        if (Boolean.TRUE.equals(formation.getIsClosed())) {
            throw new IllegalStateException("La formación ya está finalizada y cerrada. No se admiten nuevos fichajes ni registros.");
        }

        Optional<FormationAttendance> existing = findAttendance(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
            attendanceRepository.save(att);
            formation.getAttendances().add(att);
            try {
                notificationContext.sendNotification(user, 
                    "Asistencia registrada",
                    "Has registrado correctamente tu entrada a la formación: " + formation.getName());
            } catch (Exception e) {
                // Non-critical: do not block registration
            }
        } else {
            FormationAttendance att = existing.get();
            if (att.getCheckInDate() == null) {
                att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
                attendanceRepository.save(att);
                try {
                    notificationContext.sendNotification(user, 
                        "Asistencia registrada",
                        "Has registrado correctamente tu entrada a la formación: " + formation.getName());
                } catch (Exception e) {
                    // Non-critical
                }
            } else {
                throw new IllegalArgumentException("Ya estás registrado en esta formación.");
            }
        }
        user.setIsWorking(true);
        userService.saveUser(user);
        eventPublisher.publishEvent(new FormationAttendanceEvent(this));
        return formation;
    }

    @Transactional
    public Formation registerAttendance(Integer formationId, User user) {
        return doRegisterAttendance(formationId, user);
    }

    @Transactional
    public Formation registerAttendance(Integer formationId, String personalCode) {
        User user = userService.findByPersonalCode(personalCode);
        return doRegisterAttendance(formationId, user);
    }

    private Formation doCheckoutAttendance(Integer formationId, String personalCode, String signature, String token) {
        if (token != null && !token.isBlank() && !totpService.verifyToken(token, formationId)) {
            throw new IllegalArgumentException("Código inválido o expirado para esta formación.");
        }
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        
        if (Boolean.TRUE.equals(formation.getIsClosed())) {
            throw new IllegalStateException("La formación ya está finalizada y cerrada.");
        }
        
        User user = userService.findByPersonalCode(personalCode);

        FormationAttendance att = findAttendance(formation, user)
            .orElseThrow(() -> new IllegalArgumentException("El usuario no ha hecho check-in en esta formación"));

        att.setCheckOutDate(LocalDateTime.now(ZoneId.systemDefault()));
        if (signature != null && !signature.isEmpty()) {
            String fName = formation.getName() != null ? formation.getName() : "Unknown_Formation";
            String pathContext = "formations/" + fName.replaceAll("[^a-zA-Z0-9.-]", "_");
            String fileName = signatureStorageService.saveSignature(signature, pathContext);
            att.setSignature(fileName);
        }
        attendanceRepository.save(att);

        user.setIsWorking(false);
        userService.saveUser(user);

        try {
            notificationContext.sendNotification(user, 
                "Salida registrada",
                "Has registrado correctamente tu salida de la formación: " + formation.getName());
        } catch (Exception e) {
            // Non-critical
        }

        eventPublisher.publishEvent(new FormationAttendanceEvent(this));
        return formation;
    }

    @Transactional
    public Formation checkoutAttendance(Integer formationId, String personalCode, String signature, String token) {
        return doCheckoutAttendance(formationId, personalCode, signature, token);
    }

    @Transactional
    public Formation checkoutAttendance(Integer formationId, String personalCode, String signature) {
        return doCheckoutAttendance(formationId, personalCode, signature, null);
    }

    @Transactional
    public Formation updateFormation(Formation formation, Integer id) {
        Formation toUpdate = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        if (Boolean.TRUE.equals(toUpdate.getIsClosed())) {
            throw new IllegalStateException("La formación está finalizada y cerrada, no se puede modificar.");
        }
        toUpdate.setName(formation.getName());
        toUpdate.setDescription(formation.getDescription());
        toUpdate.setFormationDate(formation.getFormationDate());
        if (formation.getLocation() != null && !formation.getLocation().isBlank()) {
            toUpdate.setLocation(formation.getLocation());
        }
        if (formation.getTrainer() != null && !formation.getTrainer().isBlank()) {
            toUpdate.setTrainer(formation.getTrainer());
        }
        
        if (formation.getDocumentUrls() != null && toUpdate.getDocumentUrls() != formation.getDocumentUrls()) {
            toUpdate.getDocumentUrls().clear();
            toUpdate.getDocumentUrls().addAll(formation.getDocumentUrls());
        }

        return formationRepository.save(toUpdate);
    }

    @Transactional(rollbackFor = Exception.class)
    public Formation updateFormation(Formation formationDetails, Integer id, MultipartFile file) throws IOException {
        Formation toUpdate = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        if (Boolean.TRUE.equals(toUpdate.getIsClosed())) {
            throw new IllegalStateException("La formación está finalizada y cerrada, no se puede modificar.");
        }

        toUpdate.setName(formationDetails.getName());
        toUpdate.setDescription(formationDetails.getDescription());
        toUpdate.setFormationDate(formationDetails.getFormationDate());
        if (formationDetails.getLocation() != null && !formationDetails.getLocation().isBlank()) {
            toUpdate.setLocation(formationDetails.getLocation());
        }
        if (formationDetails.getTrainer() != null && !formationDetails.getTrainer().isBlank()) {
            toUpdate.setTrainer(formationDetails.getTrainer());
        }

        if (file != null && !file.isEmpty()) {
            if (toUpdate.getDocumentUrls() == null) {
                toUpdate.setDocumentUrls(new java.util.ArrayList<>());
            }

            for (String oldUrl : new java.util.ArrayList<>(toUpdate.getDocumentUrls())) {
                try {
                    cloudStorageAdapter.deleteFile(oldUrl);
                } catch (Exception e) {
                    // Ignorar errores al borrar en OneDrive
                }
            }

            toUpdate.getDocumentUrls().clear();

            String newFileUrl = cloudStorageAdapter.uploadFile(file, "formations");
            toUpdate.getDocumentUrls().add(newFileUrl);
        }

        return formationRepository.save(toUpdate);
    }

    @Transactional
    public void addAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        if (Boolean.TRUE.equals(formation.getIsClosed())) {
            throw new IllegalStateException("La formación está finalizada y cerrada, no se pueden añadir más asistentes.");
        }
        User user = userService.findUser(userId);
        
        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            attendanceRepository.save(att);

            // Send notification to the assigned user
            try {
                notificationContext.sendNotification(user, 
                    "Nueva formación asignada",
                    "Se te ha asignado la formación: " + formation.getName());
            } catch (Exception e) {
                // Non-critical: don't let push failure block the assignment
            }
        }
    }

    @Transactional
    public void removeAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        if (Boolean.TRUE.equals(formation.getIsClosed())) {
            throw new IllegalStateException("La formación está finalizada y cerrada, no se pueden eliminar asistentes.");
        }
        User user = userService.findUser(userId);
        
        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        
        if (existing.isPresent()) {
            FormationAttendance att = existing.get();
            if (formation.getAttendances() != null) {
                formation.getAttendances().remove(att);
            }
            attendanceRepository.delete(att);
        }
    }

    @Transactional
    public Formation closeFormation(Integer formationId, String signatureBase64, String observations, String trainerName, String location) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        if (Boolean.TRUE.equals(formation.getIsClosed())) {
            throw new IllegalStateException("La formación ya ha sido finalizada y cerrada.");
        }

        List<FormationAttendance> attendances = formation.getAttendances();
        if (attendances == null || attendances.isEmpty()) {
            throw new IllegalStateException("No se puede finalizar una formación sin asistentes.");
        }

        boolean allCompleted = attendances.stream().allMatch(
            att -> att.getCheckOutDate() != null && att.getSignature() != null && !att.getSignature().isBlank()
        );
        if (!allCompleted) {
            throw new IllegalStateException("Todos los asistentes deben haber realizado el checkout y firmado para poder finalizar la formación.");
        }

        if (signatureBase64 != null && !signatureBase64.isBlank()) {
            String safeCourseName = formation.getName() != null ? formation.getName().replaceAll("[^a-zA-Z0-9.-]", "_") : "Course";
            String sigRef = signatureStorageService.saveSignature(signatureBase64, "formations/" + safeCourseName + "/trainer");
            formation.setTrainerSignature(sigRef);
        }

        formation.setIsClosed(true);
        formation.setObservations(observations);
        if (trainerName != null && !trainerName.isBlank()) {
            formation.setTrainer(trainerName);
        }
        if (location != null && !location.isBlank()) {
            formation.setLocation(location);
        }
        formation.setClosedDate(LocalDateTime.now(ZoneId.systemDefault()));

        return formationRepository.save(formation);
    }

    @Transactional
    public void deleteFormation(Integer id) {
        Formation formation = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        if (formation.getAttendances() != null && !formation.getAttendances().isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar la formación porque contiene usuarios inscritos. Elimine primero a los asistentes.");
        }

        // Sincronización en cascada: Eliminar todos los documentos adjuntos de OneDrive asociados
        if (formation.getDocumentUrls() != null) {
            for (String docUrl : formation.getDocumentUrls()) {
                try {
                    cloudStorageAdapter.deleteFile(docUrl);
                } catch (Exception e) {
                    // Registro defensivo para no bloquear el borrado local de base de datos
                }
            }
        }

        formationRepository.delete(formation);
    }
}
