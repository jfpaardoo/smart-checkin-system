package org.springframework.samples.smartcheckin.checkin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

/**
 * Tarea programada para gestionar el ciclo de vida de fichajes olvidados (Auto Check-out).
 * Identifica fichajes de entrada con más de 12 horas sin cierre, marca una salida provisional
 * por caducidad de jornada (stale checkout), actualiza isWorking = false y emite una notificación
 * transaccional al empleado para su posterior rectificación o firma.
 */
@Service
@Transactional
public class AutoCheckoutScheduledService {

    private static final Logger logger = LoggerFactory.getLogger(AutoCheckoutScheduledService.class);

    private final CheckinRepository checkinRepository;
    private final UserRepository userRepository;
    private final NotificationContext notificationContext;

    @Value("${smartcheckin.autocheckout.stale-hours:12}")
    private int staleHours;

    @Value("${smartcheckin.autocheckout.default-shift-hours:8}")
    private int defaultShiftHours;

    @Autowired
    public AutoCheckoutScheduledService(CheckinRepository checkinRepository,
                                        UserRepository userRepository,
                                        NotificationContext notificationContext) {
        this.checkinRepository = checkinRepository;
        this.userRepository = userRepository;
        this.notificationContext = notificationContext;
    }

    /**
     * Se ejecuta periódicamente para procesar fichajes olvidados.
     * Por defecto se ejecuta cada hora en punto.
     */
    @Scheduled(cron = "${smartcheckin.autocheckout.cron:0 0 * * * *}")
    public void runAutoCheckoutTask() {
        processAutoCheckouts();
    }

    /**
     * Procesa los fichajes abiertos cuya antigüedad supera el umbral configurado.
     * @return Número de fichajes provisionales generados.
     */
    public int processAutoCheckouts() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneId.systemDefault()).minusHours(staleHours);
        List<Checkin> staleCheckins = checkinRepository.findStaleOpenCheckins(cutoff);

        if (staleCheckins.isEmpty()) {
            return 0;
        }

        logger.info("Detectados {} fichajes abiertos con más de {} horas sin salida. Procesando auto check-out...",
                staleCheckins.size(), staleHours);

        int processed = 0;
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        for (Checkin entryCheckin : staleCheckins) {
            User user = entryCheckin.getUser();
            if (user == null || !Boolean.TRUE.equals(user.getIsWorking())) {
                continue;
            }

            // Calcular salida estimada: hora de entrada + jornada estándar (ej. 8h)
            LocalDateTime estimatedCheckout = entryCheckin.getCheckInDate().plusHours(defaultShiftHours);
            if (estimatedCheckout.isAfter(now)) {
                estimatedCheckout = now;
            }

            Checkin autoCheckout = Checkin.builder()
                    .checkInDate(estimatedCheckout)
                    .checkInType(CheckinType.SALIDA)
                    .user(user)
                    .isAutoCheckout(true)
                    .isRectified(false)
                    .rectificationNotes("Salida provisional automática por jornada caducada (> " + staleHours + "h). Pendiente de confirmación o rectificación.")
                    .build();

            checkinRepository.save(Objects.requireNonNull(autoCheckout));

            // Actualizar estado del usuario a no trabajando
            user.setIsWorking(false);
            userRepository.save(user);

            // Emitir notificación transaccional al empleado
            try {
                String title = "Salida provisional automática registrada";
                String message = "Se ha registrado una salida provisional para tu jornada del " +
                        entryCheckin.getCheckInDate().toLocalDate() +
                        ". Por favor, confirma o rectifica tus horas reales de salida mediante firma digital.";
                notificationContext.sendNotification(user, title, message);
            } catch (Exception e) {
                logger.warn("No se pudo enviar la notificación de auto check-out al usuario {}: {}",
                        user.getUsername(), e.getMessage());
            }

            processed++;
        }

        logger.info("Auto check-out completado. Se generaron {} salidas provisionales.", processed);
        return processed;
    }
}
