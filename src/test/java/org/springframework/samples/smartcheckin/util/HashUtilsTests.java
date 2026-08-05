package org.springframework.samples.smartcheckin.util;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

class HashUtilsTests {

    @Test
    void testGenerateHashSuccess() {
        String input = "testData";
        String hash = HashUtils.generateHash(input);
        
        // SHA-256 siempre genera un hash de 64 caracteres hexadecimales (256 bits)
        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertNotEquals("HASH_GENERATION_FAILED", hash);
    }

    @Test
    void testGenerateHashNoSuchAlgorithmException() {
        // Interceptamos la llamada estática para forzar la excepción y entrar por el catch
        try (MockedStatic<MessageDigest> mockedDigest = Mockito.mockStatic(MessageDigest.class)) {
            mockedDigest.when(() -> MessageDigest.getInstance("SHA-256"))
                    .thenThrow(new NoSuchAlgorithmException("Algoritmo simulado no encontrado"));

            String result = HashUtils.generateHash("testData");
            
            assertEquals("HASH_GENERATION_FAILED", result);
        }
    }

    @Test
    void testPrivateConstructor() throws Exception {
        // Usamos reflexión para instanciar la clase de utilidad y cubrir el constructor privado
        Constructor<HashUtils> constructor = HashUtils.class.getDeclaredConstructor();
        
        // Verificamos que el constructor sea realmente privado
        assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        
        // Lo hacemos accesible y lo instanciamos
        constructor.setAccessible(true);
        HashUtils instance = constructor.newInstance();
        
        assertNotNull(instance);
    }
}