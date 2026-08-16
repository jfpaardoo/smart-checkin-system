package org.springframework.samples.smartcheckin.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TwoFactorBackupCodeServiceTests {

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserService userService;

    @InjectMocks
    private TwoFactorBackupCodeService backupCodeService;

    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setTwoFactorBackupCodes(new HashSet<>());
    }

    @Test
    void testGenerateBackupCodesCreates8CodesAndHashesThem() {
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "hash_" + invocation.getArgument(0));

        List<String> codes = backupCodeService.generateBackupCodes(testUser);

        assertNotNull(codes);
        assertEquals(8, codes.size());
        assertEquals(8, testUser.getTwoFactorBackupCodes().size());

        for (String code : codes) {
            assertTrue(code.matches("^[A-Z0-9]{4}-[A-Z0-9]{4}$"));
        }

        verify(userService).saveUser(testUser);
    }

    @Test
    void testVerifyAndConsumeValidBackupCodeSuccess() {
        String rawCode = "ABCD-EFGH";
        String normalizedCode = "ABCDEFGH";
        String codeHash = "bcrypt_hash_1";

        testUser.getTwoFactorBackupCodes().add(codeHash);

        when(passwordEncoder.matches(eq(normalizedCode), eq(codeHash))).thenReturn(true);

        boolean result = backupCodeService.verifyAndConsumeBackupCode(testUser, rawCode);

        assertTrue(result);
        assertFalse(testUser.getTwoFactorBackupCodes().contains(codeHash));
        assertEquals(0, testUser.getTwoFactorBackupCodes().size());
        verify(userService).saveUser(testUser);
    }

    @Test
    void testVerifyAndConsumeInvalidBackupCodeFails() {
        String rawCode = "WXYZ-1234";
        String normalizedCode = "WXYZ1234";
        String codeHash = "bcrypt_hash_1";

        testUser.getTwoFactorBackupCodes().add(codeHash);

        when(passwordEncoder.matches(eq(normalizedCode), eq(codeHash))).thenReturn(false);

        boolean result = backupCodeService.verifyAndConsumeBackupCode(testUser, rawCode);

        assertFalse(result);
        assertTrue(testUser.getTwoFactorBackupCodes().contains(codeHash));
        assertEquals(1, testUser.getTwoFactorBackupCodes().size());
    }

    @Test
    void testVerifyWithNullOrBlankOrWrongLengthCodeFails() {
        assertFalse(backupCodeService.verifyAndConsumeBackupCode(testUser, null));
        assertFalse(backupCodeService.verifyAndConsumeBackupCode(testUser, ""));
        assertFalse(backupCodeService.verifyAndConsumeBackupCode(testUser, "SHORT"));
        assertFalse(backupCodeService.verifyAndConsumeBackupCode(null, "ABCD-EFGH"));
    }

    @Test
    void testGetRemainingBackupCodesCount() {
        assertEquals(0, backupCodeService.getRemainingBackupCodesCount(testUser));
        testUser.getTwoFactorBackupCodes().add("hash1");
        testUser.getTwoFactorBackupCodes().add("hash2");
        assertEquals(2, backupCodeService.getRemainingBackupCodesCount(testUser));
        assertEquals(0, backupCodeService.getRemainingBackupCodesCount(null));
    }
}
