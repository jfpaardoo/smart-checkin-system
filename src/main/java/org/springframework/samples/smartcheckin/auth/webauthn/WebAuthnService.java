package org.springframework.samples.smartcheckin.auth.webauthn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.smartcheckin.auth.webauthn.dto.*;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class WebAuthnService {

    private static final String PUBLIC_KEY_TYPE = "public-key";
    private static final String PREFERRED = "preferred";
    private static final String DEFAULT_DEVICE_TYPE = "Biometric Device";

    private final UserPasskeyRepository passkeyRepository;
    private final UserRepository userRepository;
    private final WebAuthnChallengeService challengeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.webauthn.rpName:Distribution Academy}")
    private String rpName;

    @Value("${app.webauthn.rpId:localhost}")
    private String rpId;

    /**
     * Genera las opciones para crear una nueva credencial (registro de Passkey)
     */
    @Transactional(readOnly = true)
    public RegistrationOptionsResponse generateRegistrationOptions(User user) {
        String challenge = challengeService.generateChallenge(user.getId());

        List<UserPasskey> existingPasskeys = passkeyRepository.findByUserId(user.getId());
        List<RegistrationOptionsResponse.Descriptor> excludeList = existingPasskeys.stream()
                .map(pk -> RegistrationOptionsResponse.Descriptor.builder()
                        .type(PUBLIC_KEY_TYPE)
                        .id(pk.getCredentialId())
                        .build())
                .toList();

        byte[] userIdBytes = String.valueOf(user.getId()).getBytes(StandardCharsets.UTF_8);
        String userIdBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(userIdBytes);

        return RegistrationOptionsResponse.builder()
                .challenge(challenge)
                .rp(RegistrationOptionsResponse.Rp.builder()
                        .name(rpName)
                        .id(rpId.equals("localhost") ? null : rpId)
                        .build())
                .user(RegistrationOptionsResponse.UserDetails.builder()
                        .id(userIdBase64)
                        .name(user.getUsername())
                        .displayName(user.getFirstName() + " " + user.getLastName())
                        .build())
                .pubKeyCredParams(List.of(
                        RegistrationOptionsResponse.PubKeyCredParam.builder().type(PUBLIC_KEY_TYPE).alg(-7).build(),  // ES256
                        RegistrationOptionsResponse.PubKeyCredParam.builder().type(PUBLIC_KEY_TYPE).alg(-257).build(), // RS256
                        RegistrationOptionsResponse.PubKeyCredParam.builder().type(PUBLIC_KEY_TYPE).alg(-8).build()   // EdDSA
                ))
                .authenticatorSelection(RegistrationOptionsResponse.AuthenticatorSelection.builder()
                        .residentKey(PREFERRED)
                        .userVerification(PREFERRED)
                        .requireResidentKey(false)
                        .build())
                .timeout(60000L)
                .attestation("none")
                .excludeCredentials(excludeList)
                .build();
    }

    /**
     * Valida y guarda la nueva credencial Passkey registrada por el usuario
     */
    @Transactional
    public PasskeyDTO verifyAndSaveRegistration(User user, RegistrationVerifyRequest request) {
        if (request.getResponse() == null || request.getResponse().getClientDataJSON() == null) {
            throw new IllegalArgumentException("Datos de respuesta de autenticador inválidos.");
        }

        // 1. Validar ClientDataJSON y Challenge
        verifyClientData(request.getResponse().getClientDataJSON(), "webauthn.create", user.getId());

        // 2. Extraer o asignar clave pública
        String rawPublicKey = request.getResponse().getPublicKey();
        if (rawPublicKey == null || rawPublicKey.isBlank()) {
            rawPublicKey = request.getResponse().getAttestationObject() != null 
                    ? request.getResponse().getAttestationObject() 
                    : request.getId();
        }

        // 3. Resolver nombre descriptivo
        String device = request.getDeviceType() != null ? request.getDeviceType() : DEFAULT_DEVICE_TYPE;
        String nickname;
        if (request.getNickname() != null && !request.getNickname().isBlank()) {
            nickname = request.getNickname().trim();
        } else {
            nickname = "Llave de Acceso (" + device + ")";
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        UserPasskey passkey = UserPasskey.builder()
                .user(user)
                .credentialId(request.getId())
                .publicKey(rawPublicKey)
                .signCount(0L)
                .deviceType(device)
                .nickname(nickname)
                .lastUsedAt(now)
                .build();

        UserPasskey saved = Objects.requireNonNull(passkeyRepository.save(passkey));
        log.info("Passkey registrada con éxito para el usuario: {} (ID: {})", user.getUsername(), saved.getId());

        return toDTO(saved);
    }

    /**
     * Genera las opciones para iniciar sesión con Passkey (desafío)
     */
    @Transactional(readOnly = true)
    public LoginOptionsResponse generateLoginOptions(String usernameOrNull) {
        Integer targetUserId = null;
        List<LoginOptionsResponse.Descriptor> allowCredentials = Collections.emptyList();

        if (usernameOrNull != null && !usernameOrNull.isBlank()) {
            Optional<User> userOpt = userRepository.findByUsername(usernameOrNull.trim());
            if (userOpt.isPresent()) {
                targetUserId = userOpt.get().getId();
                allowCredentials = passkeyRepository.findByUserId(targetUserId).stream()
                        .map(pk -> LoginOptionsResponse.Descriptor.builder()
                                .type(PUBLIC_KEY_TYPE)
                                .id(pk.getCredentialId())
                                .build())
                        .toList();
            }
        }

        String challenge = challengeService.generateChallenge(targetUserId);

        return LoginOptionsResponse.builder()
                .challenge(challenge)
                .timeout(60000L)
                .rpId(rpId.equals("localhost") ? null : rpId)
                .userVerification(PREFERRED)
                .allowCredentials(allowCredentials)
                .build();
    }

    /**
     * Valida la aserción de autenticación y devuelve el usuario correspondiente
     */
    @Transactional
    public User verifyLogin(LoginVerifyRequest request) {
        if (request.getResponse() == null || request.getResponse().getClientDataJSON() == null) {
            throw new IllegalArgumentException("Datos de autenticación WebAuthn inválidos.");
        }

        // 1. Validar ClientDataJSON y Challenge
        verifyClientData(request.getResponse().getClientDataJSON(), "webauthn.get", null);

        // 2. Localizar la credencial Passkey por credentialId
        UserPasskey passkey = passkeyRepository.findByCredentialId(request.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Credencial Passkey no encontrada o no vinculada a ningún usuario."));

        User user = passkey.getUser();

        // 3. Comprobar estado del usuario
        if (Boolean.FALSE.equals(user.getIsApproved())) {
            throw new AccessDeniedException("Tu cuenta está pendiente de aprobación por un administrador.");
        }

        // 4. Actualizar métricas de uso de la Passkey
        passkey.setSignCount(passkey.getSignCount() + 1);
        passkey.setLastUsedAt(LocalDateTime.now(ZoneOffset.UTC));
        passkeyRepository.save(passkey);

        log.info("Autenticación con Passkey exitosa para el usuario: {} usando la llave: {}", user.getUsername(), passkey.getNickname());
        return user;
    }

    /**
     * Lista las llaves registradas de un usuario
     */
    @Transactional(readOnly = true)
    public List<PasskeyDTO> listUserPasskeys(Integer userId) {
        return passkeyRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Elimina una llave registrada por el usuario
     */
    @Transactional
    public void deleteUserPasskey(Integer passkeyId, Integer userId) {
        UserPasskey passkey = passkeyRepository.findByIdAndUserId(passkeyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Llave de acceso no encontrada."));
        passkeyRepository.delete(passkey);
        log.info("Passkey eliminada con éxito: ID {} para el usuario ID {}", passkeyId, userId);
    }

    private void verifyClientData(String clientDataJSONBase64, String expectedType, Integer expectedUserId) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(clientDataJSONBase64);
            JsonNode root = objectMapper.readTree(decoded);

            String type = root.path("type").asText();
            if (!expectedType.equals(type)) {
                throw new IllegalArgumentException("Tipo de operación WebAuthn no válida: " + type);
            }

            String challenge = root.path("challenge").asText();
            boolean valid = challengeService.validateAndConsumeChallenge(challenge, expectedUserId);
            if (!valid) {
                throw new IllegalArgumentException("El desafío criptográfico (challenge) ha expirado o es inválido.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al procesar clientDataJSON", e);
            throw new IllegalArgumentException("Error al verificar los datos del cliente WebAuthn.");
        }
    }

    private PasskeyDTO toDTO(UserPasskey pk) {
        return PasskeyDTO.builder()
                .id(pk.getId())
                .credentialId(pk.getCredentialId())
                .nickname(pk.getNickname())
                .deviceType(pk.getDeviceType())
                .createdAt(pk.getCreatedAt())
                .lastUsedAt(pk.getLastUsedAt())
                .build();
    }
}
