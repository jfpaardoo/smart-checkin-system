package org.springframework.samples.smartcheckin.auth.service;

import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service for generating, storing and consuming single-use 2FA backup recovery codes.
 */
@Service
public class TwoFactorBackupCodeService {

    private static final int BACKUP_CODES_COUNT = 8;
    private static final int CODE_LENGTH = 8;
    private static final String ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars 0, O, 1, I
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public TwoFactorBackupCodeService(PasswordEncoder passwordEncoder, UserService userService) {
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    /**
     * Generates a new set of single-use backup codes, invalidating any previous backup codes.
     *
     * @param user The user for whom to generate codes.
     * @return List of 8 plaintext formatted codes (e.g. "ABCD-EFGH") to present once to the user.
     */
    @Transactional
    public List<String> generateBackupCodes(User user) {
        List<String> plainTextCodes = new ArrayList<>();
        Set<String> hashedCodes = new HashSet<>();

        for (int i = 0; i < BACKUP_CODES_COUNT; i++) {
            String rawCode = generateRandomCodeString();
            String formattedCode = formatCode(rawCode);
            plainTextCodes.add(formattedCode);

            String normalizedCode = normalizeCode(rawCode);
            String hashedCode = passwordEncoder.encode(normalizedCode);
            hashedCodes.add(hashedCode);
        }

        user.setTwoFactorBackupCodes(hashedCodes);
        userService.saveUser(user);

        return plainTextCodes;
    }

    /**
     * Verifies if a provided code matches one of the user's available backup codes.
     * If valid, the code is consumed (deleted) immediately.
     *
     * @param user The user attempting authentication.
     * @param providedCode The plaintext backup code provided by the user.
     * @return true if valid and consumed, false otherwise.
     */
    @Transactional
    public boolean verifyAndConsumeBackupCode(User user, String providedCode) {
        if (user == null || user.getTwoFactorBackupCodes() == null || providedCode == null || providedCode.isBlank()) {
            return false;
        }

        String normalizedProvided = normalizeCode(providedCode);
        if (normalizedProvided.length() != CODE_LENGTH) {
            return false;
        }

        String matchedHash = null;
        for (String hashedCode : user.getTwoFactorBackupCodes()) {
            if (passwordEncoder.matches(normalizedProvided, hashedCode)) {
                matchedHash = hashedCode;
                break;
            }
        }

        if (matchedHash != null) {
            user.getTwoFactorBackupCodes().remove(matchedHash);
            userService.saveUser(user);
            return true;
        }

        return false;
    }

    /**
     * Returns the count of remaining unused backup codes for a user.
     */
    public int getRemainingBackupCodesCount(User user) {
        if (user == null || user.getTwoFactorBackupCodes() == null) {
            return 0;
        }
        return user.getTwoFactorBackupCodes().size();
    }

    private String generateRandomCodeString() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = SECURE_RANDOM.nextInt(ALLOWED_CHARS.length());
            sb.append(ALLOWED_CHARS.charAt(index));
        }
        return sb.toString();
    }

    private String formatCode(String rawCode) {
        if (rawCode.length() == 8) {
            return rawCode.substring(0, 4) + "-" + rawCode.substring(4);
        }
        return rawCode;
    }

    private String normalizeCode(String code) {
        return code.replace("-", "").replace(" ", "").trim().toUpperCase();
    }
}
