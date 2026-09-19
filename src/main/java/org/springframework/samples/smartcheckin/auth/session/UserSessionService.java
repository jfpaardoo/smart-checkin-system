package org.springframework.samples.smartcheckin.auth.session;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;

    @Transactional
    public void registerOrUpdateSession(String username, String token, String ipAddress, String userAgent) {
        if (username == null || token == null) {
            return;
        }
        String tokenHash = hashToken(token);
        List<UserSession> existingList = userSessionRepository.findAllByTokenHash(tokenHash);
        if (!existingList.isEmpty()) {
            updateExistingSession(existingList, ipAddress);
        } else {
            createNewSession(username, tokenHash, ipAddress, userAgent);
        }
    }

    private void updateExistingSession(List<UserSession> existingList, String ipAddress) {
        UserSession session = existingList.get(0);
        session.setLastActivityAt(LocalDateTime.now(java.time.ZoneId.systemDefault()));
        session.setIpAddress(ipAddress);
        session.setActive(true);
        userSessionRepository.save(session);
        // Clean up any duplicate records if they were created concurrently
        if (existingList.size() > 1) {
            for (int i = 1; i < existingList.size(); i++) {
                userSessionRepository.delete(existingList.get(i));
            }
        }
    }

    private void createNewSession(String username, String tokenHash, String ipAddress, String userAgent) {
        String deviceInfo = parseDeviceInfo(userAgent);
        deactivateSameDeviceSessions(username, deviceInfo);

        UserSession newSession = UserSession.builder()
                .username(username)
                .tokenHash(tokenHash)
                .ipAddress(ipAddress)
                .userAgent(userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 500)) : "Desconocido")
                .deviceInfo(deviceInfo)
                .lastActivityAt(LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .active(true)
                .build();
        userSessionRepository.save(newSession);
    }

    private void deactivateSameDeviceSessions(String username, String deviceInfo) {
        try {
            List<UserSession> sameDeviceSessions = userSessionRepository.findAllByUsernameAndDeviceInfoAndActiveTrue(username, deviceInfo);
            if (sameDeviceSessions != null) {
                for (UserSession s : sameDeviceSessions) {
                    s.setActive(false);
                    userSessionRepository.save(s);
                }
            }
        } catch (Exception e) {
            log.debug("Could not cleanup same device sessions", e);
        }
    }

    @Transactional
    public List<UserSessionDTO> getActiveSessions(String username, String currentToken) {
        String currentTokenHash = currentToken != null ? hashToken(currentToken) : "";
        List<UserSession> sessions = userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc(username);
        LocalDateTime expirationCutoff = LocalDateTime.now(java.time.ZoneId.systemDefault()).minusHours(24);

        return sessions.stream()
                .filter(s -> {
                    if (s.getLastActivityAt() != null && s.getLastActivityAt().isBefore(expirationCutoff)) {
                        s.setActive(false);
                        userSessionRepository.save(s);
                        return false;
                    }
                    return true;
                })
                .map(s -> UserSessionDTO.builder()
                        .id(s.getId())
                        .ipAddress(s.getIpAddress())
                        .userAgent(s.getUserAgent())
                        .deviceInfo(s.getDeviceInfo())
                        .createdAt(s.getCreatedAt())
                        .lastActivityAt(s.getLastActivityAt())
                        .isCurrent(s.getTokenHash().equals(currentTokenHash))
                        .build()
                ).toList();
    }

    @Transactional
    public boolean revokeSession(String username, Integer sessionId) {
        Optional<UserSession> opt = userSessionRepository.findByIdAndUsername(sessionId, username);
        if (opt.isPresent()) {
            UserSession session = opt.get();
            session.setActive(false);
            userSessionRepository.save(session);
            return true;
        }
        return false;
    }

    @Transactional
    public void revokeSessionByToken(String token) {
        if (token == null) return;
        String tokenHash = hashToken(token);
        List<UserSession> sessions = userSessionRepository.findAllByTokenHash(tokenHash);
        for (UserSession s : sessions) {
            s.setActive(false);
            userSessionRepository.save(s);
        }
    }

    @Transactional
    public int revokeOtherSessions(String username, String currentToken) {
        String currentTokenHash = currentToken != null ? hashToken(currentToken) : "";
        List<UserSession> sessions = userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc(username);
        int revokedCount = 0;

        for (UserSession s : sessions) {
            if (!s.getTokenHash().equals(currentTokenHash)) {
                s.setActive(false);
                userSessionRepository.save(s);
                revokedCount++;
            }
        }
        return revokedCount;
    }

    @Transactional
    public void revokeAllUserSessions(String username) {
        if (username == null) return;
        List<UserSession> sessions = userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc(username);
        for (UserSession s : sessions) {
            s.setActive(false);
            userSessionRepository.save(s);
        }
    }

    @Transactional(readOnly = true)
    public boolean isSessionActive(String token) {
        if (token == null) return false;
        String tokenHash = hashToken(token);
        return userSessionRepository.findFirstByTokenHashOrderByLastActivityAtDesc(tokenHash)
                .map(UserSession::isActive)
                .orElse(true); // default true if session record not yet migrated
    }

    public static String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(token.hashCode());
        }
    }

    public static String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Dispositivo Desconocido";
        String ua = userAgent.toLowerCase();
        return String.format("%s en %s", detectBrowser(ua), detectOs(ua));
    }

    private static String detectBrowser(String ua) {
        if (ua.contains("edg/")) return "Microsoft Edge";
        if (ua.contains("chrome/")) return "Google Chrome";
        if (ua.contains("safari/")) return "Safari";
        if (ua.contains("firefox/")) return "Mozilla Firefox";
        return "Navegador";
    }

    private static String detectOs(String ua) {
        if (ua.contains("windows nt 10.0")) return "Windows 10/11";
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("iphone") || ua.contains("ipad")) return "iOS";
        if (ua.contains("android")) return "Android";
        if (ua.contains("macintosh") || ua.contains("mac os x")) return "macOS";
        if (ua.contains("linux")) return "Linux";
        return "SO";
    }
}
