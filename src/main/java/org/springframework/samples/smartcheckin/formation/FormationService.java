package org.springframework.samples.smartcheckin.formation;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.push.PushNotificationService;
import org.springframework.samples.smartcheckin.settings.OneDriveService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.storage.LocalFileSystemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@SuppressWarnings("null")
public class FormationService {

    private final FormationRepository formationRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final UserService userService;
    private final OneDriveService oneDriveService;
    private final PushNotificationService pushNotificationService;
    private final LocalFileSystemService localFileSystemService;

    @Autowired
    public FormationService(FormationRepository formationRepository, 
                            FormationAttendanceRepository attendanceRepository, 
                            UserService userService,
                            OneDriveService oneDriveService,
                            PushNotificationService pushNotificationService,
                            LocalFileSystemService localFileSystemService) {
        this.formationRepository = formationRepository;
        this.attendanceRepository = attendanceRepository;
        this.userService = userService;
        this.oneDriveService = oneDriveService;
        this.pushNotificationService = pushNotificationService;
        this.localFileSystemService = localFileSystemService;
    }

    private static final String FORMATION_NOT_FOUND_MSG = "Formation not found";

    @Transactional
    public Formation saveFormation(Formation formation) {
        return formationRepository.save(formation);
    }

    @Transactional(rollbackFor = Exception.class)
    public Formation saveFormation(Formation formation, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            String fileUrl = oneDriveService.uploadFile(file, "formations");
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

    private Formation doRegisterAttendance(Integer formationId, User user) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
            attendanceRepository.save(att);
            formation.getAttendances().add(att);
        } else {
            FormationAttendance att = existing.get();
            if (att.getCheckInDate() == null) {
                att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
                attendanceRepository.save(att);
            }
        }
        user.setIsWorking(true);
        userService.saveUser(user);
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

    @Transactional
    public Formation checkoutAttendance(Integer formationId, String personalCode, String signature) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        
        User user = userService.findByPersonalCode(personalCode);

        FormationAttendance att = attendanceRepository.findByFormationAndUser(formation, user)
            .orElseThrow(() -> new IllegalArgumentException("El usuario no ha hecho check-in en esta formación"));

        att.setCheckOutDate(LocalDateTime.now(ZoneId.systemDefault()));
        if (signature != null && !signature.isEmpty()) {
            String fileName = localFileSystemService.saveSignature(signature);
            att.setSignature(fileName);
        }
        attendanceRepository.save(att);

        user.setIsWorking(false);
        userService.saveUser(user);

        return formation;
    }

    @Transactional
    public Formation updateFormation(Formation formation, Integer id) {
        Formation toUpdate = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        toUpdate.setName(formation.getName());
        toUpdate.setDescription(formation.getDescription());
        toUpdate.setFormationDate(formation.getFormationDate());
        
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
        
        toUpdate.setName(formationDetails.getName());
        toUpdate.setDescription(formationDetails.getDescription());
        toUpdate.setFormationDate(formationDetails.getFormationDate());

        if (file != null && !file.isEmpty()) {
            // Sincronización en cascada: Limpiamos los ficheros anteriores de la nube si procede
            if (toUpdate.getDocumentUrls() != null) {
                for (String oldUrl : toUpdate.getDocumentUrls()) {
                    try {
                        oneDriveService.deleteFile(oldUrl);
                    } catch (Exception e) {
                        // Continuamos de forma defensiva
                    }
                }
                toUpdate.getDocumentUrls().clear();
            }
            
            // Subir nuevo fichero a OneDrive y añadirlo a la colección
            String newFileUrl = oneDriveService.uploadFile(file, "formations");
            toUpdate.getDocumentUrls().add(newFileUrl);
        }

        return formationRepository.save(toUpdate);
    }

    @Transactional
    public void addAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        User user = userService.findUser(userId);
        
        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            attendanceRepository.save(att);

            // Send push notification to the assigned user
            try {
                pushNotificationService.sendToUser(user, 
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
                    oneDriveService.deleteFile(docUrl);
                } catch (Exception e) {
                    // Registro defensivo para no bloquear el borrado local de base de datos
                }
            }
        }

        formationRepository.delete(formation);
    }
}