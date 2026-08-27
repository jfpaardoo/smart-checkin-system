package org.springframework.samples.smartcheckin.formation;

import org.jpatterns.gof.FacadePattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.notifications.SystemUpdateNotification;
import org.springframework.samples.smartcheckin.notifications.Notification;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.samples.smartcheckin.audit.Auditable;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@FacadePattern
@Slf4j
public class FormationCheckinFacade {

    private final FormationService formationService;
    private final UserService userService;
    private final CloudStorageAdapter cloudStorageAdapter;
    private final PushNotificationSender pushNotificationSender;
    private final NotificationContext notificationContext;

    @Autowired
    public FormationCheckinFacade(FormationService formationService,
                                  UserService userService,
                                  CloudStorageAdapter cloudStorageAdapter,
                                  PushNotificationSender pushNotificationSender,
                                  NotificationContext notificationContext) {
        this.formationService = formationService;
        this.userService = userService;
        this.cloudStorageAdapter = cloudStorageAdapter;
        this.pushNotificationSender = pushNotificationSender;
        this.notificationContext = notificationContext;
    }

    public void notifyFormationsUpdate(Integer formationId) {
        try {
            Notification updateNotif = new SystemUpdateNotification(pushNotificationSender, "UPDATED");
            updateNotif.notify("/topic/formations");
            if (formationId != null) {
                updateNotif.notify("/topic/formations/" + formationId);
            }
        } catch (Exception e) {
            // Ignore
        }
    }

    private List<User> resolveTargetUsers(List<Integer> targetUserIds) {
        List<User> list = new ArrayList<>();
        for (Integer uid : targetUserIds) {
            try {
                User u = userService.findUser(uid);
                if (u != null && Boolean.TRUE.equals(u.getIsApproved())) {
                    list.add(u);
                }
            } catch (Exception e) {
                // Ignore user lookup error
            }
        }
        return list;
    }

    private List<User> resolveAllActiveEmployees() {
        List<User> list = new ArrayList<>();
        for (User u : userService.findAll()) {
            boolean isApproved = Boolean.TRUE.equals(u.getIsApproved());
            boolean isNotAdmin = !u.hasAuthority("ADMIN");
            if (isApproved && isNotAdmin) {
                list.add(u);
            }
        }
        return list;
    }

    private List<User> resolveRecipients(List<Integer> targetUserIds, boolean notifyAll) {
        if (!notifyAll && targetUserIds != null && !targetUserIds.isEmpty()) {
            return resolveTargetUsers(targetUserIds);
        }
        return resolveAllActiveEmployees();
    }

    private void dispatchPublicationNotifications(Formation formation, List<Integer> targetUserIds, boolean notifyAll) {
        if (notificationContext == null || formation == null) {
            return;
        }

        String title = "Nueva Formación Publicada: " + formation.getName();
        String dateStr = formation.getFormationDate() != null ? formation.getFormationDate().toString().replace("T", " ") : "Próximamente";
        String message = String.format(
            "Se ha publicado la formación '%s' programada para el %s en %s (Formador: %s). Accede a la plataforma para ver el evento.",
            formation.getName(), dateStr, formation.getLocation(), formation.getTrainer()
        );

        List<User> recipients = resolveRecipients(targetUserIds, notifyAll);
        for (User recipient : recipients) {
            try {
                notificationContext.sendNotification(recipient, title, message);
            } catch (Exception e) {
                log.warn("Error sending publication notification to user {}: {}", recipient.getUsername(), e.getMessage());
            }
        }
    }

    @Auditable(action = "FORMATION_SAVE", details = "Admin created a formation")
    @Transactional(rollbackFor = Exception.class)
    public Formation createFormation(FormationRequest request, List<MultipartFile> files) {
        Formation formation = new Formation();
        mapBasicFields(formation, request);

        if (request.getStatus() != null) {
            formation.setStatus(request.getStatus());
        } else if (Boolean.TRUE.equals(request.getPublishImmediately())) {
            formation.setStatus(FormationStatus.PUBLISHED);
        } else {
            formation.setStatus(FormationStatus.DRAFT);
        }

        uploadFiles(files, request.getName(), formation.getDocumentUrls());

        Formation saved = formationService.saveFormation(formation);
        notifyFormationsUpdate(saved.getId());

        if (FormationStatus.PUBLISHED.equals(saved.getStatus())) {
            boolean notifyAll = request.getTargetUserIds() == null || request.getTargetUserIds().isEmpty();
            dispatchPublicationNotifications(saved, request.getTargetUserIds(), notifyAll);
        }

        return saved;
    }

    @Auditable(action = "FORMATION_PUBLISH", details = "Admin published a formation")
    @Transactional(rollbackFor = Exception.class)
    public Formation publishFormation(Integer id, FormationPublishRequest publishRequest) {
        List<Integer> targetIds = publishRequest != null ? publishRequest.getTargetUserIds() : null;
        boolean notifyAll = publishRequest == null || !Boolean.FALSE.equals(publishRequest.getNotifyAll());

        Formation published = formationService.publishFormation(id, targetIds);
        notifyFormationsUpdate(published.getId());
        dispatchPublicationNotifications(published, targetIds, notifyAll);
        return published;
    }

    @Auditable(action = "FORMATION_UPDATE", details = "Admin updated a formation")
    @Transactional(rollbackFor = Exception.class)
    public Formation updateFormation(Integer id, FormationRequest request, List<MultipartFile> files) {
        Formation existing = formationService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Formation not found"));
            
        mapBasicFields(existing, request);
        cleanupRemovedDocuments(existing, request.getExistingDocumentUrls());
        uploadFiles(files, request.getName(), existing.getDocumentUrls());
        
        Formation saved = formationService.updateFormation(existing, id);
        notifyFormationsUpdate(saved.getId());
        return saved;
    }

    private void mapBasicFields(Formation formation, FormationRequest request) {
        formation.setName(request.getName());
        formation.setDescription(request.getDescription());
        formation.setFormationDate(request.getFormationDate());
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            formation.setLocation(request.getLocation());
        }
        if (request.getTrainer() != null && !request.getTrainer().isBlank()) {
            formation.setTrainer(request.getTrainer());
        }
    }

    private void uploadFiles(List<MultipartFile> files, String formationName, List<String> targetUrls) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                try {
                    String link = cloudStorageAdapter.uploadFile(file, formationName);
                    targetUrls.add(link);
                } catch (Exception e) {
                    throw new IllegalStateException("Error al subir el archivo '" + file.getOriginalFilename() + "' a OneDrive: " + e.getMessage(), e);
                }
            }
        }
    }

    private void cleanupRemovedDocuments(Formation existing, List<String> existingDocumentUrls) {
        List<String> toKeep = existingDocumentUrls != null ? existingDocumentUrls : List.of();
        List<String> removedDocs = new ArrayList<>(existing.getDocumentUrls());
        removedDocs.removeAll(toKeep);
        
        for (String removedDoc : removedDocs) {
            try {
                cloudStorageAdapter.deleteFile(removedDoc);
            } catch (Exception e) {
                log.warn("Error deleting removed document from OneDrive: {}", e.getMessage());
            }
        }

        existing.getDocumentUrls().retainAll(toKeep);
    }

    @Auditable(action = "CHECKIN_FORMATION", details = "User checked into formation")
    public Formation registerAttendance(Integer id, String personalCode, Boolean withinWorkingHours) {
        String code = personalCode;
        if (code == null || code.isBlank()) {
            code = userService.findCurrentUser().getPersonalCode();
        }
        Formation formation = formationService.registerAttendance(id, code, withinWorkingHours);
        notifyFormationsUpdate(id);
        return formation;
    }

    @Auditable(action = "CHECKIN_FORMATION", details = "User checked into formation")
    public Formation registerAttendance(Integer id, String personalCode) {
        return registerAttendance(id, personalCode, true);
    }

    @Auditable(action = "CHECKOUT_FORMATION", details = "User checked out of formation")
    public Formation checkoutAttendance(Integer id, String signature, String token) {
        User currentUser = userService.findCurrentUser();
        Formation formation = formationService.checkoutAttendance(id, currentUser.getPersonalCode(), signature, token);
        notifyFormationsUpdate(id);
        return formation;
    }

    @Auditable(action = "CHECKOUT_FORMATION", details = "User checked out of formation")
    public Formation checkoutAttendance(Integer id, String signature) {
        return checkoutAttendance(id, signature, null);
    }

    @Auditable(action = "FORMATION_ADD_ATTENDEE", details = "Admin added attendee to formation")
    public void addAttendee(Integer formationId, Integer userId) {
        formationService.addAttendee(formationId, userId);
        notifyFormationsUpdate(formationId);
    }

    @Auditable(action = "FORMATION_REMOVE_ATTENDEE", details = "Admin removed attendee from formation")
    public void removeAttendee(Integer formationId, Integer userId) {
        formationService.removeAttendee(formationId, userId);
        notifyFormationsUpdate(formationId);
    }

    @Auditable(action = "FORMATION_DELETE", details = "Admin deleted a formation")
    public void deleteFormation(Integer id) {
        formationService.deleteFormation(id);
        notifyFormationsUpdate(id);
    }
}