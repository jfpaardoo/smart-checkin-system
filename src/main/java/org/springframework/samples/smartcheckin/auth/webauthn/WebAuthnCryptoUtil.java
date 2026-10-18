package org.springframework.samples.smartcheckin.auth.webauthn;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;

import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;

/**
 * Utilidades criptográficas para la verificación rigurosa de aserciones y credenciales WebAuthn / Passkeys (W3C Spec).
 */
public final class WebAuthnCryptoUtil {

    private static final Logger log = LoggerFactory.getLogger(WebAuthnCryptoUtil.class);

    private static final int MIN_AUTH_DATA_LENGTH = 37;
    private static final int FLAG_UP = 0x01; // User Present
    private static final int FLAG_UV = 0x04; // User Verified

    private WebAuthnCryptoUtil() {
        // Utility class
    }

    /**
     * Valida authenticatorData: tamaño, RP ID hash y flags de presencia de usuario.
     */
    public static AuthDataResult parseAndVerifyAuthData(byte[] authData, String expectedRpId, boolean requireUserVerification) {
        if (authData == null || authData.length < MIN_AUTH_DATA_LENGTH) {
            throw new BadCredentialsException("authenticatorData WebAuthn inválido o demasiado corto.");
        }

        // 1. Verificar RP ID Hash (primeros 32 bytes)
        byte[] authDataRpIdHash = Arrays.copyOfRange(authData, 0, 32);
        byte[] expectedRpIdHash = sha256(expectedRpId.getBytes(StandardCharsets.UTF_8));

        if (!MessageDigest.isEqual(authDataRpIdHash, expectedRpIdHash)) {
            // Si el expectedRpId era "localhost", comprobar también si coincide con 127.0.0.1
            if ("localhost".equalsIgnoreCase(expectedRpId)) {
                byte[] localhostAlternativeHash = sha256("127.0.0.1".getBytes(StandardCharsets.UTF_8));
                if (!MessageDigest.isEqual(authDataRpIdHash, localhostAlternativeHash)) {
                    throw new BadCredentialsException("El RP ID hash en authenticatorData no coincide con el dominio autorizado.");
                }
            } else {
                throw new BadCredentialsException("El RP ID hash en authenticatorData no coincide con el dominio autorizado.");
            }
        }

        // 2. Verificar Flags (byte 32)
        int flags = authData[32] & 0xFF;
        if ((flags & FLAG_UP) == 0) {
            throw new BadCredentialsException("Flag User Present (UP) ausente en la aserción WebAuthn.");
        }

        if (requireUserVerification && (flags & FLAG_UV) == 0) {
            throw new BadCredentialsException("Flag User Verified (UV) ausente cuando la verificación de usuario es obligatoria.");
        }

        // 3. Extraer signCount (bytes 33 a 36, big-endian unsigned 32-bit int)
        long signCount = Integer.toUnsignedLong(ByteBuffer.wrap(authData, 33, 4).getInt());

        return new AuthDataResult(flags, signCount);
    }

    /**
     * Verifica la firma criptográfica sobre la concatenación (authenticatorData || SHA-256(clientDataJSON)).
     */
    public static void verifyAssertionSignature(PublicKey publicKey, byte[] authData, byte[] clientDataJsonBytes, byte[] signatureBytes) {
        if (publicKey == null) {
            throw new BadCredentialsException("Clave pública de credencial Passkey no disponible.");
        }
        if (authData == null || clientDataJsonBytes == null || signatureBytes == null) {
            throw new BadCredentialsException("Parámetros de aserción WebAuthn incompletos para verificación criptográfica.");
        }

        byte[] clientDataHash = sha256(clientDataJsonBytes);
        byte[] signedData = new byte[authData.length + clientDataHash.length];
        System.arraycopy(authData, 0, signedData, 0, authData.length);
        System.arraycopy(clientDataHash, 0, signedData, authData.length, clientDataHash.length);

        boolean signatureValid = false;
        String algorithm = publicKey.getAlgorithm();

        try {
            if ("EC".equalsIgnoreCase(algorithm)) {
                // Intento 1: Formato ASN.1 DER estándar de WebAuthn ECDSA
                Signature sig = Signature.getInstance("SHA256withECDSA");
                sig.initVerify(publicKey);
                sig.update(signedData);
                signatureValid = sig.verify(signatureBytes);

                // Si falló y la firma tiene exactamente 64 bytes, podría estar en formato IEEE P1363 (r, s sin DER)
                if (!signatureValid && signatureBytes.length == 64) {
                    signatureValid = verifyP1363Format(publicKey, signedData, signatureBytes);
                }
            } else if ("RSA".equalsIgnoreCase(algorithm)) {
                Signature sig = Signature.getInstance("SHA256withRSA");
                sig.initVerify(publicKey);
                sig.update(signedData);
                signatureValid = sig.verify(signatureBytes);
            } else {
                throw new BadCredentialsException("Algoritmo de clave pública WebAuthn no soportado: " + algorithm);
            }
        } catch (GeneralSecurityException e) {
            log.error("Fallo durante la verificación criptográfica de la firma WebAuthn: {}", e.getMessage());
            throw new BadCredentialsException("Error al procesar la firma criptográfica de la aserción.");
        }

        if (!signatureValid) {
            log.warn("Rechazada aserción WebAuthn: la firma criptográfica no coincide con la clave pública registrada.");
            throw new BadCredentialsException("Firma criptográfica WebAuthn inválida.");
        }
    }

    /**
     * Parsea una clave pública desde Base64 o Base64URL (formato X.509 SPKI DER o COSE).
     */
    public static PublicKey parsePublicKey(String storedPublicKey) {
        if (storedPublicKey == null || storedPublicKey.isBlank()) {
            throw new IllegalArgumentException("La clave pública no puede ser nula o vacía.");
        }

        byte[] keyBytes = decodeBase64OrUrl(storedPublicKey.trim());

        // 1. Intentar decodificar como X.509 Encoded Key Spec (DER SPKI estándar devuelto por getPublicKey())
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
        try {
            KeyFactory ecFactory = KeyFactory.getInstance("EC");
            return ecFactory.generatePublic(keySpec);
        } catch (Exception ecEx) {
            try {
                KeyFactory rsaFactory = KeyFactory.getInstance("RSA");
                return rsaFactory.generatePublic(keySpec);
            } catch (Exception rsaEx) {
                // 2. Si falla como X.509 SPKI, intentar decodificar como COSE Key cruda (CBOR)
                try {
                    return parseCoseKey(keyBytes);
                } catch (Exception coseEx) {
                    log.error("No se pudo interpretar la clave pública guardada como X.509 ni como COSE: {}", storedPublicKey);
                    throw new IllegalArgumentException("Formato de clave pública WebAuthn desconocido o corrupto.", coseEx);
                }
            }
        }
    }

    /**
     * Extrae y normaliza la clave pública a formato X.509 DER codificado en Base64 estándar.
     */
    public static String normalizePublicKey(String rawPublicKeyOrAttestation) {
        PublicKey key = parsePublicKey(rawPublicKeyOrAttestation);
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /**
     * Decodificador tolerante para Base64 estándar y Base64URL (con o sin padding).
     */
    public static byte[] decodeBase64OrUrl(String input) {
        if (input == null) {
            return new byte[0];
        }
        String clean = input.replaceAll("\\s+", "");
        try {
            return Base64.getUrlDecoder().decode(clean);
        } catch (IllegalArgumentException e) {
            return Base64.getDecoder().decode(clean);
        }
    }

    /**
     * Parser ligero de COSE Key para curva EC P-256 (alg -7 / ES256).
     * En CBOR, un mapa COSE de curva P-256 contiene las coordenadas x e y (cada una de 32 bytes).
     */
    private static PublicKey parseCoseKey(byte[] coseBytes) throws GeneralSecurityException {
        // Buscamos patrones de coordenadas X e Y en el buffer COSE
        // Clave -2 (X) en CBOR suele codificarse como 0x21 seguido de byte string de 32 bytes (0x58 0x20 ...)
        // Clave -3 (Y) en CBOR suele codificarse como 0x22 seguido de byte string de 32 bytes (0x58 0x20 ...)
        byte[] x = findCborByteString(coseBytes, (byte) 0x21);
        byte[] y = findCborByteString(coseBytes, (byte) 0x22);

        if (x.length == 32 && y.length == 32) {
            AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
            params.init(new ECGenParameterSpec("secp256r1"));
            ECParameterSpec ecParams = params.getParameterSpec(ECParameterSpec.class);

            ECPoint point = new ECPoint(new BigInteger(1, x), new BigInteger(1, y));
            ECPublicKeySpec spec = new ECPublicKeySpec(point, ecParams);
            return KeyFactory.getInstance("EC").generatePublic(spec);
        }

        throw new IllegalArgumentException("No se encontraron coordenadas P-256 válidas en la clave COSE.");
    }

    private static boolean verifyP1363Format(PublicKey publicKey, byte[] signedData, byte[] signatureBytes) {
        try {
            Signature p1363Sig = Signature.getInstance("SHA256withECDSAinP1363Format");
            p1363Sig.initVerify(publicKey);
            p1363Sig.update(signedData);
            return p1363Sig.verify(signatureBytes);
        } catch (GeneralSecurityException ignored) {
            return false;
        }
    }

    private static byte[] findCborByteString(byte[] data, byte label) {
        for (int i = 0; i < data.length - 34; i++) {
            if (data[i] == label && data[i + 1] == 0x58 && data[i + 2] == 0x20) {
                return Arrays.copyOfRange(data, i + 3, i + 35);
            }
        }
        return new byte[0];
    }

    public static byte[] sha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(data);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible en la JVM.", e);
        }
    }

    public record AuthDataResult(int flags, long signCount) {}
}
