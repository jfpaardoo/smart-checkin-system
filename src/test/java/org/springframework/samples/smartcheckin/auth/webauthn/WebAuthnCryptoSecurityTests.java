package org.springframework.samples.smartcheckin.auth.webauthn;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.auth.webauthn.dto.LoginVerifyRequest;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class WebAuthnCryptoSecurityTests {

    private static final String RP_ID = "localhost";
    private static final String CREDENTIAL_ID = "cred-real-ecdsa-123";

    @Mock
    private UserPasskeyRepository passkeyRepository;

    @Mock
    private WebAuthnChallengeService challengeService;

    @InjectMocks
    private WebAuthnService webAuthnService;

    private KeyPair keyPair;
    private UserPasskey passkey;

    @BeforeEach
    void setUp() throws NoSuchAlgorithmException, InvalidAlgorithmParameterException {
        ReflectionTestUtils.setField(webAuthnService, "rpName", "Distribution Academy");
        ReflectionTestUtils.setField(webAuthnService, "rpId", RP_ID);

        // Generar par de claves EC P-256 estándar
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(new ECGenParameterSpec("secp256r1"));
        keyPair = kpg.generateKeyPair();

        User testUser = new User();
        testUser.setId(1);
        testUser.setUsername("alice");
        testUser.setIsApproved(true);

        String pubKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());

        passkey = UserPasskey.builder()
                .user(testUser)
                .credentialId(CREDENTIAL_ID)
                .publicKey(pubKeyBase64)
                .signCount(5L)
                .nickname("YubiKey 5 NFC")
                .lastUsedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        passkey.setId(10);
    }

    private byte[] createAuthData(String rpId, int flags, long signCount) throws NoSuchAlgorithmException {
        byte[] rpIdHash = MessageDigest.getInstance("SHA-256").digest(rpId.getBytes(StandardCharsets.UTF_8));
        byte[] authData = new byte[37];
        System.arraycopy(rpIdHash, 0, authData, 0, 32);
        authData[32] = (byte) flags;
        authData[33] = (byte) ((signCount >> 24) & 0xFF);
        authData[34] = (byte) ((signCount >> 16) & 0xFF);
        authData[35] = (byte) ((signCount >> 8) & 0xFF);
        authData[36] = (byte) (signCount & 0xFF);
        return authData;
    }

    private byte[] sign(byte[] authData, byte[] clientDataJson)
            throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
        byte[] clientHash = MessageDigest.getInstance("SHA-256").digest(clientDataJson);
        byte[] toSign = new byte[authData.length + 32];
        System.arraycopy(authData, 0, toSign, 0, authData.length);
        System.arraycopy(clientHash, 0, toSign, authData.length, 32);

        Signature sig = Signature.getInstance("SHA256withECDSA");
        sig.initSign(keyPair.getPrivate());
        sig.update(toSign);
        return sig.sign();
    }

    @Test
    void testVerifyLoginWithValidCryptographicSignature() throws Exception {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"secure-chal\",\"origin\":\"http://localhost:3000\"}";
        byte[] clientJsonBytes = clientJson.getBytes(StandardCharsets.UTF_8);
        byte[] authData = createAuthData(RP_ID, 0x01, 6L); // UP flag, signCount=6 > 5
        byte[] signature = sign(authData, clientJsonBytes);

        LoginVerifyRequest req = LoginVerifyRequest.builder()
                .id(CREDENTIAL_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(Base64.getUrlEncoder().withoutPadding().encodeToString(clientJsonBytes))
                        .authenticatorData(Base64.getUrlEncoder().withoutPadding().encodeToString(authData))
                        .signature(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
                        .build())
                .build();

        when(passkeyRepository.findByCredentialId(CREDENTIAL_ID)).thenReturn(Optional.of(passkey));
        when(challengeService.validateAndConsumeChallenge("secure-chal", 1)).thenReturn(true);

        User authenticated = webAuthnService.verifyLogin(req);

        assertNotNull(authenticated);
        assertEquals("alice", authenticated.getUsername());
        assertEquals(6L, passkey.getSignCount());
        verify(passkeyRepository).save(passkey);
    }

    @Test
    void testVerifyLoginFailsWhenSignatureIsTampered() throws Exception {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"secure-chal\",\"origin\":\"http://localhost:3000\"}";
        byte[] clientJsonBytes = clientJson.getBytes(StandardCharsets.UTF_8);
        byte[] authData = createAuthData(RP_ID, 0x01, 6L);
        byte[] signature = sign(authData, clientJsonBytes);

        // Alterar un byte de la firma
        signature[signature.length - 1] ^= 0xFF;

        LoginVerifyRequest req = LoginVerifyRequest.builder()
                .id(CREDENTIAL_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(Base64.getUrlEncoder().withoutPadding().encodeToString(clientJsonBytes))
                        .authenticatorData(Base64.getUrlEncoder().withoutPadding().encodeToString(authData))
                        .signature(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
                        .build())
                .build();

        when(passkeyRepository.findByCredentialId(CREDENTIAL_ID)).thenReturn(Optional.of(passkey));
        when(challengeService.validateAndConsumeChallenge("secure-chal", 1)).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> webAuthnService.verifyLogin(req));
        verify(passkeyRepository, never()).save(any());
    }

    @Test
    void testVerifyLoginFailsWhenUserPresentFlagIsMissing() throws Exception {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"secure-chal\",\"origin\":\"http://localhost:3000\"}";
        byte[] clientJsonBytes = clientJson.getBytes(StandardCharsets.UTF_8);
        byte[] authData = createAuthData(RP_ID, 0x00, 6L); // UP flag = 0
        byte[] signature = sign(authData, clientJsonBytes);

        LoginVerifyRequest req = LoginVerifyRequest.builder()
                .id(CREDENTIAL_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(Base64.getUrlEncoder().withoutPadding().encodeToString(clientJsonBytes))
                        .authenticatorData(Base64.getUrlEncoder().withoutPadding().encodeToString(authData))
                        .signature(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
                        .build())
                .build();

        when(passkeyRepository.findByCredentialId(CREDENTIAL_ID)).thenReturn(Optional.of(passkey));
        when(challengeService.validateAndConsumeChallenge("secure-chal", 1)).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> webAuthnService.verifyLogin(req));
    }

    @Test
    void testVerifyLoginFailsWhenRpIdHashDoesNotMatch() throws Exception {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"secure-chal\",\"origin\":\"http://localhost:3000\"}";
        byte[] clientJsonBytes = clientJson.getBytes(StandardCharsets.UTF_8);
        byte[] authData = createAuthData("attacker-domain.com", 0x01, 6L);
        byte[] signature = sign(authData, clientJsonBytes);

        LoginVerifyRequest req = LoginVerifyRequest.builder()
                .id(CREDENTIAL_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(Base64.getUrlEncoder().withoutPadding().encodeToString(clientJsonBytes))
                        .authenticatorData(Base64.getUrlEncoder().withoutPadding().encodeToString(authData))
                        .signature(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
                        .build())
                .build();

        when(passkeyRepository.findByCredentialId(CREDENTIAL_ID)).thenReturn(Optional.of(passkey));
        when(challengeService.validateAndConsumeChallenge("secure-chal", 1)).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> webAuthnService.verifyLogin(req));
    }

    @Test
    void testVerifyLoginFailsWhenSignCountIsClonedOrReplayed() throws Exception {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"secure-chal\",\"origin\":\"http://localhost:3000\"}";
        byte[] clientJsonBytes = clientJson.getBytes(StandardCharsets.UTF_8);
        byte[] authData = createAuthData(RP_ID, 0x01, 5L); // 5 <= 5 (No incrementa, posible clonación)
        byte[] signature = sign(authData, clientJsonBytes);

        LoginVerifyRequest req = LoginVerifyRequest.builder()
                .id(CREDENTIAL_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(Base64.getUrlEncoder().withoutPadding().encodeToString(clientJsonBytes))
                        .authenticatorData(Base64.getUrlEncoder().withoutPadding().encodeToString(authData))
                        .signature(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
                        .build())
                .build();

        when(passkeyRepository.findByCredentialId(CREDENTIAL_ID)).thenReturn(Optional.of(passkey));
        when(challengeService.validateAndConsumeChallenge("secure-chal", 1)).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> webAuthnService.verifyLogin(req));
    }
}
