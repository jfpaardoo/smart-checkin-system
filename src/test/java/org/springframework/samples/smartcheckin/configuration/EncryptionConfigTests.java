package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EncryptionConfigTests {

    @Test
    void testSetAndGetSecret() {
        EncryptionConfig config = new EncryptionConfig();
        config.setSecret("MiSecretoDePrueba123!");
        
        // Verifica que el getter estático devuelve correctamente la variable inyectada
        assertEquals("MiSecretoDePrueba123!", EncryptionConfig.getSecret());
    }
}